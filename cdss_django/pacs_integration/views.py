# cdss_django/pacs_integration/views.py

import logging
import shutil
import tempfile
import zipfile
import os
import pydicom
from django.http import HttpResponse
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from rest_framework import filters

# 관련된 모든 모델, 시리얼라이저, 태스크, 유틸리티를 임포트합니다.
from patients.models import PatientProfile
from diagnosis.models import DiagnosisRequest
from omics.models import TumorSegmentationResult
from diagnosis.serializers import DiagnosisRequestDetailSerializer, DiagnosisRequestListSerializer
from .models import OpenEMRPatientOrthancLink, OrthancStudyLog
from .serializers import OpenEMRPatientOrthancLinkSerializer, OrthancStudyLogSerializer
# [수정] tasks.py의 최종 함수들을 임포트합니다.
from .tasks import run_base_analysis_pipeline, run_liver_tumor_segmentation, run_kidney_tumor_segmentation, run_breast_segmentation
from .services import extract_study_uid_from_dicom_files
from .orthanc_client import OrthancClient
from .clients import OpenEMRClient
from .utils import format_dicom_date, format_dicom_time

logger = logging.getLogger(__name__)
orthanc_cli = OrthancClient()
openemr_cli = OpenEMRClient()



# 기존 OrthancUploadView를 최신 로직으로 업데이트 (디버깅 로그 포함)
class OrthancUploadView(APIView):
    """
    DICOM 시리즈(폴더 또는 ZIP)를 업로드 받고, Orthanc에 전송하며,
    DiagnosisRequest를 생성하고, Celery AI 분석을 시작하는 통합 API
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        patient_identifier = request.data.get('patient') or request.data.get('patient_emr_id')
        uploaded_files = request.FILES.getlist('dicom_files')

        if not patient_identifier or not uploaded_files:
            return Response(
                {'error': 'Patient ID and DICOM files (folder or ZIP) are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            patient = PatientProfile.objects.filter(id=patient_identifier).first() or \
                      PatientProfile.objects.filter(openemr_id=patient_identifier).first()
            if not patient:
                return Response({'error': f'Patient with ID {patient_identifier} not found.'}, status=status.HTTP_404_NOT_FOUND)
        except PatientProfile.DoesNotExist:
            return Response(
                {'error': f'Patient with ID {patient_identifier} not found.'}, status=status.HTTP_404_NOT_FOUND
            )

        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                # [디버깅 로그 1] 임시 디렉토리 경로 확인
                logger.info(f"Created temporary directory for upload: {temp_dir}")

                if len(uploaded_files) == 1 and uploaded_files[0].name.lower().endswith('.zip'):
                    logger.info(f"Processing ZIP file: {uploaded_files[0].name}")
                    with zipfile.ZipFile(uploaded_files[0], 'r') as zf:
                        zf.extractall(temp_dir)
                else:
                    logger.info(f"Processing {len(uploaded_files)} individual files.")
                    for f in uploaded_files:
                        file_path = os.path.join(temp_dir, os.path.basename(f.name))
                        with open(file_path, 'wb+') as destination:
                            for chunk in f.chunks():
                                destination.write(chunk)
                
                # [디버깅 로그 2] 압축 해제 후 임시 폴더 안의 파일 목록을 전부 출력합니다.
                dir_contents = []
                for root, dirs, files in os.walk(temp_dir):
                    for name in files:
                        dir_contents.append(os.path.join(root, name))
                logger.info(f"Contents of temporary directory after extraction: {dir_contents}")

                # 이제 UID를 추출합니다.
                study_uid = extract_study_uid_from_dicom_files(temp_dir)
                if not study_uid:
                    raise ValueError("Could not find StudyInstanceUID in the uploaded files.")
                
                diagnosis_request, created = DiagnosisRequest.objects.get_or_create(
                    study_uid=study_uid,
                    defaults={'patient': patient, 'requester': request.user, 'status': 'RECEIVED'}
                )
                if not created:
                    diagnosis_request.status = 'RECEIVED'
                    if hasattr(diagnosis_request, 'result') and diagnosis_request.result is not None:
                        diagnosis_request.result.delete()
                    diagnosis_request.save()

                persistent_dir = os.path.join(settings.MEDIA_ROOT, 'dicom_uploads', str(diagnosis_request.id))
                if os.path.exists(persistent_dir):
                    shutil.rmtree(persistent_dir)
                shutil.copytree(temp_dir, persistent_dir)

                for root, _, files in os.walk(persistent_dir):
                    for filename in files:
                        # 숨김 파일 등은 건너뜁니다.
                        if filename.startswith('.'):
                            continue
                        
                        file_path = os.path.join(root, filename)
                        try:
                            with open(file_path, 'rb') as f_dicom:
                                orthanc_cli.upload_dicom_instance(f_dicom.read())
                        except Exception as e:
                            logger.warning(f"Failed to upload a file '{filename}' to Orthanc: {e}")
                
                task = run_total_segmentation.delay(persistent_dir, study_uid)
                diagnosis_request.celery_task_id = task.id
                diagnosis_request.save()
                
                serializer = DiagnosisRequestDetailSerializer(diagnosis_request)
                return Response(serializer.data, status=status.HTTP_202_ACCEPTED)

            except Exception as e:
                error_message = f"An error occurred during file processing: {str(e)}"
                logger.error(error_message, exc_info=True)
                return Response({'error': error_message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# (RetrieveOpenEMRPatientView, OrthancPatientStudiesView, DICOMInstanceDownloadView)

class RetrieveOpenEMRPatientView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, openemr_patient_id, format=None):
        try:
            patient_emr_response = openemr_cli.get_patient_details_by_id(str(openemr_patient_id))
            if not patient_emr_response or 'data' not in patient_emr_response or not patient_emr_response['data']:
                return Response({"error": f"Patient with PUUID '{openemr_patient_id}' not found in OpenEMR."}, status=status.HTTP_404_NOT_FOUND)
            
            patient_info = patient_emr_response['data'][0]
            first_name = patient_info.get('fname', '')
            last_name = patient_info.get('lname', '')
            patient_name_emr = f"{first_name} {last_name}".strip() or f"Patient {openemr_patient_id}"
            
            dob_from_emr = patient_info.get('DOB')
            formatted_dob_emr = format_dicom_date(dob_from_emr)

            link, created = OpenEMRPatientOrthancLink.objects.update_or_create(
                openemr_patient_id=str(openemr_patient_id),
                defaults={
                    'openemr_patient_name': patient_name_emr,
                    'openemr_patient_dob': formatted_dob_emr
                }
            )
            serializer = OpenEMRPatientOrthancLinkSerializer(link)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"Error in RetrieveOpenEMRPatientView for ID {openemr_patient_id}: {e}", exc_info=True)
            return Response({"error": f"Failed to retrieve OpenEMR patient {openemr_patient_id}: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OrthancPatientStudiesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, openemr_patient_id, format=None):
        try:
            link = OpenEMRPatientOrthancLink.objects.filter(openemr_patient_id=str(openemr_patient_id)).first()
            studies_in_orthanc = orthanc_cli.find_studies_by_dicom_patient_id(str(openemr_patient_id))

            if not studies_in_orthanc:
                return Response([], status=status.HTTP_200_OK)

            if link:
                study_log_data = []
                for study_data in studies_in_orthanc:
                    main_tags = study_data.get('MainDicomTags', {})
                    study_uid = main_tags.get('StudyInstanceUID')
                    if not study_uid: continue
                    
                    log_entry, _ = OrthancStudyLog.objects.update_or_create(
                        orthanc_study_instance_uid=study_uid,
                        defaults={
                            'patient_link': link,
                            'study_description': main_tags.get('StudyDescription'),
                            'study_date': format_dicom_date(main_tags.get('StudyDate')),
                            'study_time': format_dicom_time(main_tags.get('StudyTime')),
                            'accession_number': main_tags.get('AccessionNumber'),
                            'modality': main_tags.get('Modality'),
                            'orthanc_study_internal_id': study_data.get('ID')
                        }
                    )
                    study_log_data.append(OrthancStudyLogSerializer(log_entry).data)
                return Response(study_log_data)
            else:
                logger.warning(f"OpenEMRPatientOrthancLink not found for EMR ID {openemr_patient_id}. Returning raw Orthanc study data.")
                return Response(studies_in_orthanc)
        except Exception as e:
            logger.error(f"Error in OrthancPatientStudiesView for ID {openemr_patient_id}: {e}", exc_info=True)
            return Response({"error": f"Error retrieving studies from Orthanc for patient {openemr_patient_id}: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DICOMInstanceDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, instance_uid, format=None):
        try:
            dicom_data_binary = orthanc_cli.download_dicom_instance(instance_uid)
            if dicom_data_binary:
                response = HttpResponse(dicom_data_binary, content_type='application/dicom')
                response['Content-Disposition'] = f'attachment; filename="{instance_uid}.dcm"'
                return response
            return Response({"error": "Instance not found or no content from Orthanc"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in DICOMInstanceDownloadView: {e}", exc_info=True)
            return Response({"error": f"Download failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DicomUploadView(APIView):
    """
    DICOM 업로드 및 1차 분석(TotalSegmentator) 시작을 처리하는 View
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        patient_id = request.data.get('patient')
        uploaded_files = request.FILES.getlist('dicom_files')
        if not patient_id or not uploaded_files:
            return Response({'error': 'Patient ID and DICOM files are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            patient = PatientProfile.objects.get(id=patient_id)
        except PatientProfile.DoesNotExist:
            return Response({'error': f'Patient with ID {patient_id} not found.'}, status=status.HTTP_404_NOT_FOUND)

        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                if len(uploaded_files) == 1 and uploaded_files[0].name.lower().endswith('.zip'):
                    with zipfile.ZipFile(uploaded_files[0], 'r') as zf:
                        zf.extractall(temp_dir)
                else:
                    for f in uploaded_files:
                        file_path = os.path.join(temp_dir, os.path.basename(f.name))
                        with open(file_path, 'wb+') as destination:
                            for chunk in f.chunks():
                                destination.write(chunk)
                
                study_uid = extract_study_uid_from_dicom_files(temp_dir)
                if not study_uid:
                    raise ValueError("Could not find StudyInstanceUID in the uploaded files.")
                
                diagnosis_request, created = DiagnosisRequest.objects.update_or_create(
                    study_uid=study_uid,
                    defaults={'patient': patient, 'requester': request.user, 'status': 'RECEIVED'}
                )
                if not created and hasattr(diagnosis_request, 'result'):
                    diagnosis_request.result.delete()
                diagnosis_request.status = 'RECEIVED'; diagnosis_request.save()

                persistent_dir = os.path.join(settings.MEDIA_ROOT, 'dicom_uploads', str(diagnosis_request.id))
                if os.path.exists(persistent_dir):
                    shutil.rmtree(persistent_dir)
                shutil.copytree(temp_dir, persistent_dir)

                # [최종 수정] DB commit이 완료된 후, 올바른 인자(id)로 Celery Task를 실행합니다.
                transaction.on_commit(lambda: 
                    run_base_analysis_pipeline.delay(diagnosis_request.id)
                )
                
                serializer = DiagnosisRequestDetailSerializer(diagnosis_request)
                return Response(serializer.data, status=status.HTTP_202_ACCEPTED)

            except Exception as e:
                logger.error(f"An error occurred during file processing: {str(e)}", exc_info=True)
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class StartAnalysisView(APIView):
    """
    [신규] 특정 2차 분석(간/신장/유방 등)을 시작하는 API
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        request_id = request.data.get('diagnosis_request_id')
        analysis_type = request.data.get('analysis_type')
        
        if not request_id or not analysis_type:
            return Response({'error': 'diagnosis_request_id and analysis_type are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            task_map = {
                'liver': run_liver_tumor_segmentation,
                'kidney': run_kidney_tumor_segmentation,
                'breast': run_breast_segmentation,
            }
            target_task = task_map.get(analysis_type)
            if not target_task:
                return Response({'error': f'Invalid analysis_type: {analysis_type}'}, status=status.HTTP_400_BAD_REQUEST)
            
            seg_result = TumorSegmentationResult.objects.create(
                request_id=request_id,
                analysis_name=f"{analysis_type.capitalize()} Analysis",
                status='QUEUED'
            )
            target_task.delay(seg_result.id)
            return Response({'message': f'{analysis_type} analysis has been started.'}, status=status.HTTP_202_ACCEPTED)
        
        except Exception as e:
            logger.error(f"Error starting analysis for request {request_id}: {e}", exc_info=True)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        
class DiagnosisRequestViewSet(viewsets.ModelViewSet):
    """환자 ID로 필터링된 목록 조회를 담당하는 ViewSet"""
    queryset = DiagnosisRequest.objects.select_related('patient', 'result').all().order_by('-request_timestamp')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['patient']
    ordering_fields = ['request_timestamp', 'status']

    def get_serializer_class(self):
        if self.action == 'list':
            return DiagnosisRequestListSerializer
        return DiagnosisRequestDetailSerializer


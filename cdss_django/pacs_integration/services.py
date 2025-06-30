import os
import logging
import shutil
import subprocess
import pydicom
import tempfile
import requests
from django.db import transaction
from django.core.files import File
from django.conf import settings
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.contrib.auth import get_user_model

# pacs_integration 앱 내의 다른 모듈들
from .openemr_client import OpenEMRClient
from .orthanc_client import OrthancClient
from .models import OpenEMRPatientOrthancLink, OrthancStudyLog
from .utils import format_dicom_date, format_dicom_time
# [수정] 이제 services.py는 AI 관련 기능을 직접 호출하지 않으므로, ai_service 임포트가 필요 없습니다.
# pacs_integration 앱의 유틸리티 함수만 가져옵니다.
from .utils_3d import generate_interactive_3d_preview_fast, create_integrated_plotly_view

# 다른 앱의 모듈들
from patients.models import PatientProfile
from diagnosis.models import DiagnosisRequest, DiagnosisResult, DiagnosisRequestStatus

logger = logging.getLogger(__name__)
openemr_cli = OpenEMRClient()
User = get_user_model()


class DicomService:
    def convert_dicom_to_nifti(self, dicom_dir, output_filename_base):
        logger.info(f"'{dicom_dir}'에서 NIfTI 파일 변환 시작...")
        output_dir = os.path.join(settings.MEDIA_ROOT, 'temp_nifti')
        os.makedirs(output_dir, exist_ok=True)
        cmd = ['dcm2niix', '-o', output_dir, '-f', output_filename_base, '-z', 'y', dicom_dir]
        try:
            process = subprocess.run(cmd, check=True, capture_output=True, text=True)
            logger.info(f"dcm2niix stdout: {process.stdout}")
            expected_filepath = os.path.join(output_dir, f"{output_filename_base}.nii.gz")
            if os.path.exists(expected_filepath):
                return expected_filepath
            for filename in os.listdir(output_dir):
                if filename.startswith(output_filename_base) and filename.endswith(".nii.gz"):
                    logger.warning(f"예상과 다른 파일명으로 생성됨: '{filename}'. 이 파일을 사용합니다.")
                    return os.path.join(output_dir, filename)
            raise FileNotFoundError("dcm2niix 실행 후 NIfTI 파일을 찾을 수 없습니다.")
        except FileNotFoundError:
            raise RuntimeError("dcm2niix 명령어를 찾을 수 없습니다. 시스템에 설치되어 있는지 확인해주세요.")
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"dcm2niix 변환 중 오류 발생: {e.stderr}") from e


class DiagnosisService:
    def __init__(self):
        self.dicom_service = DicomService()

    @transaction.atomic
    def perform_diagnosis_pipeline(self, request_id):
        req = DiagnosisRequest.objects.get(id=request_id)
        result, _ = DiagnosisResult.objects.get_or_create(request=req)
        req.status = DiagnosisRequestStatus.PROCESSING; req.save()

        work_dir = os.path.join(settings.MEDIA_ROOT, 'temp_work', str(req.id))
        if os.path.exists(work_dir): shutil.rmtree(work_dir)
        os.makedirs(work_dir)
        
        try:
            # 1. NIfTI 변환
            temp_dicom_dir = os.path.join(work_dir, "dicom")
            os.makedirs(temp_dicom_dir, exist_ok=True)
            logger.info(f"[{req.id}] DICOM 파일 준비 단계. 대상 폴더: {temp_dicom_dir}")
            
            nifti_path = self.dicom_service.convert_dicom_to_nifti(temp_dicom_dir, f"{req.id}_original")
            with open(nifti_path, 'rb') as f:
                result.original_ct_nifti.save(os.path.basename(nifti_path), File(f))
        except Exception as e:
            logger.error(f"[{req.id}] NIfTI 변환 실패: {e}", exc_info=True)
            req.status = DiagnosisRequestStatus.NIFTI_CONVERSION_FAILED; req.save()
            result.error_message = f"NIfTI 변환 중 오류 발생: {e}"; result.save()
            if os.path.exists(work_dir): shutil.rmtree(work_dir)
            return

        try:
            # 2. TotalSegmentator 실행 및 3D 뷰 생성
            total_seg_output_dir = os.path.join(work_dir, "total_segmentation_raw")
            total_seg_dir, total_seg_merged_path = run_total_segmentation(result.original_ct_nifti.path, total_seg_output_dir)
            output_html_path = os.path.join(work_dir, 'total_segmentation_3d.html')
            generate_interactive_3d_preview_fast(total_seg_dir, output_html_path)
            result.visualization_3d_html_path = os.path.join(settings.MEDIA_URL, os.path.relpath(output_html_path, settings.MEDIA_ROOT))
        except Exception as e:
            logger.error(f"[{req.id}] TotalSegmentator 실패: {e}", exc_info=True)

            
        try:
             # 3. nnU-Net으로 특정 종양 분할
            NNUNET_DATASET_ID = "101" 
            nnunet_output_dir = os.path.join(work_dir, "nnunet_segmentation")
            nnunet_seg_path = run_nnunet_segmentation(result.original_ct_nifti.path, nnunet_output_dir, NNUNET_DATASET_ID)
            with open(nnunet_seg_path, 'rb') as f:
                result.segmentation_nifti_file.save(os.path.basename(nnunet_seg_path), File(f))
        except Exception as e:
            logger.error(f"[{req.id}] nnU-Net 세그멘테이션 실패: {e}", exc_info=True)
            req.status = DiagnosisRequestStatus.SEGMENTATION_FAILED; req.save()
            result.error_message = f"nnU-Net 분석 중 오류 발생: {e}"; result.save()
            if os.path.exists(work_dir): shutil.rmtree(work_dir)
            return

        try:
            # 4. 통합 뷰어 생성
            if result.original_ct_nifti and total_seg_merged_path and result.segmentation_nifti_file:
                output_integ_html_path = os.path.join(work_dir, 'integrated_viewer_3d.html')
                # [수정] Plotly 통합 뷰어 생성 함수 호출
                create_integrated_plotly_view(
                    result.original_ct_nifti.path,
                    total_seg_merged_path,
                    result.segmentation_nifti_file.path,
                    output_integ_html_path
                )
                result.integrated_viewer_html_path = os.path.join(settings.MEDIA_URL, os.path.relpath(output_integ_html_path, settings.MEDIA_ROOT))
            else:
                raise ValueError("통합 뷰어 생성에 필요한 파일이 없습니다 (CT, 전체 장기, 또는 종양).")
        except Exception as e:
            logger.error(f"[{req.id}] 3D 뷰어 생성 실패: {e}", exc_info=True)
            req.status = DiagnosisRequestStatus.VIEWER_GENERATION_FAILED; req.save()
            result.error_message = f"3D 뷰어 생성 중 오류 발생: {e}"; result.save()
            if os.path.exists(work_dir): shutil.rmtree(work_dir)
            return

        req.status = DiagnosisRequestStatus.COMPLETED
        req.save()
        result.result_summary = "분석 완료"; result.save()
        logger.info(f"[{req.id}] 모든 분석 파이프라인 성공적으로 완료.")
        if os.path.exists(work_dir):
            shutil.rmtree(work_dir)


# --- 기존 유틸리티 함수들 (들여쓰기 수정됨) ---

@transaction.atomic
def link_emr_pacs_and_create_log(dicom_file: InMemoryUploadedFile, patient_profile: PatientProfile, requesting_user: User = None):
    """
    DICOM 파일을 받아 Orthanc에 업로드하고, EMR/PACS 정보를 동기화하며,
    관련 로그를 생성하는 통합 서비스 함수.
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=".dcm") as temp_f:
        for chunk in dicom_file.chunks():
            temp_f.write(chunk)
        temp_file_path = temp_f.name
    
    logger.info(f"DICOM for patient {patient_profile.id} temp stored at {temp_file_path}")

    try:
        ds = pydicom.dcmread(temp_file_path)
        dicom_patient_id = ds.get("PatientID")
        study_instance_uid = ds.get("StudyInstanceUID")
        sop_instance_uid = ds.get("SOPInstanceUID")

        if not all([dicom_patient_id, study_instance_uid, sop_instance_uid]):
            raise ValueError("Essential DICOM tags (PatientID, StudyInstanceUID, SOPInstanceUID) are missing.")
        
        emr_patient_id = getattr(patient_profile, 'openemr_id', str(patient_profile.id))
        if emr_patient_id != dicom_patient_id:
            logger.warning(f"EMR ID ({emr_patient_id}) and DICOM PatientID ({dicom_patient_id}) mismatch!")

        try:
            emr_patients_found = openemr_cli.get_patient_by_pubpid_fhir(emr_patient_id)
            if not emr_patients_found:
                logger.warning(f"Patient {emr_patient_id} not found in OpenEMR. Attempting to create.")
                patient_name_str = str(ds.get('PatientName', ''))
                name_parts = patient_name_str.split('^')
                lname = name_parts[0].strip() if len(name_parts) > 0 else patient_profile.last_name
                fname = name_parts[1].strip() if len(name_parts) > 1 else patient_profile.first_name

                new_patient_payload = {
                    "fname": fname or "Unknown", "lname": lname or emr_patient_id,
                    "DOB": patient_profile.date_of_birth.strftime('%Y-%m-%d') if patient_profile.date_of_birth else "1900-01-01",
                    "sex": patient_profile.get_gender_display() if hasattr(patient_profile, 'get_gender_display') else 'Unknown',
                    "pubpid": emr_patient_id
                }
                openemr_cli.create_patient(new_patient_payload)
            else:
                logger.info(f"Patient {emr_patient_id} confirmed to exist in OpenEMR.")
        except requests.exceptions.HTTPError as e:
            if e.response and e.response.status_code == 400 and "uuid" in e.response.text:
                logger.error(f"OpenEMR API reported invalid UUID format for patient ID {emr_patient_id}.")
            raise

        orthanc_cli = OrthancClient()
        upload_response = orthanc_cli.upload_dicom_instance(temp_file_path)
        logger.info(f"Orthanc upload successful: {upload_response}")

        orthanc_patient_id = upload_response.get('ParentPatient')
        orthanc_study_id = upload_response.get('ParentStudy')

        link, _ = OpenEMRPatientOrthancLink.objects.update_or_create(
            openemr_patient_id=emr_patient_id,
            defaults={
                'openemr_patient_name': patient_profile.name,
                'openemr_patient_dob': patient_profile.date_of_birth,
                'orthanc_patient_id': orthanc_patient_id,
                'last_known_study_uid': orthanc_study_id,
            }
        )
        log, _ = OrthancStudyLog.objects.update_or_create(
            orthanc_study_instance_uid=study_instance_uid,
            defaults={
                'patient_link': link, 'study_description': ds.get("StudyDescription"),
                'study_date': format_dicom_date(ds.get("StudyDate")),
                'study_time': format_dicom_time(ds.get("StudyTime")),
                'accession_number': ds.get("AccessionNumber"), 'modality': ds.get("Modality"),
                'orthanc_study_internal_id': orthanc_study_id, 'uploaded_by': requesting_user,
            }
        )
        return {"sop_instance_uid": sop_instance_uid, "link": link, "log": log}
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


def get_study_uid_from_orthanc_response(orthanc_upload_response: dict) -> str | None:
    if not orthanc_upload_response or 'ParentStudy' not in orthanc_upload_response:
        return None
    orthanc_study_id = orthanc_upload_response.get('ParentStudy')
    try:
        orthanc_cli = OrthancClient()
        study_details = orthanc_cli.get_study_details(orthanc_study_id)
        if study_details and 'MainDicomTags' in study_details:
            return study_details.get('MainDicomTags', {}).get('StudyInstanceUID')
    except Exception as e:
        logger.error(f"Failed to get study details for {orthanc_study_id}: {e}")
    return None

# [수정] 함수 정의 안에 모든 로직이 포함되도록 수정
def extract_study_uid_from_dicom_files(directory: str) -> str | None:
    """디렉토리에서 DICOM 파일을 스캔하여 StudyInstanceUID를 추출합니다."""
    for root, _, files in os.walk(directory):
        for filename in files:
            if filename.startswith('.'):
                continue
            file_path = os.path.join(root, filename)
            try:
                ds = pydicom.dcmread(file_path, stop_before_pixels=True)
                if 'StudyInstanceUID' in ds:
                    logger.info(f"Found StudyInstanceUID {ds.StudyInstanceUID} in {filename}")
                    return str(ds.StudyInstanceUID)
            except pydicom.errors.InvalidDicomError:
                continue
            except Exception as e:
                logger.warning(f"Could not read {filename}: {e}")
                continue
    logger.warning(f"No DICOM files with StudyInstanceUID found in {directory}")
    return None
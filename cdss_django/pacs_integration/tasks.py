import os
import shutil
import tempfile
import logging
import subprocess
import glob
import gzip
import nibabel as nib
from celery import shared_task
from django.conf import settings
from django.core.files import File
from diagnosis.models import DiagnosisRequest, DiagnosisResult
from omics.models import TumorSegmentationResult
from .utils_3d import generate_3d_preview, create_integrated_viewer_html, visualize_analysis_result_3d
from .ai_service import run_total_segmentation, run_nnunet_segmentation
import dicom2nifti
from dicom2nifti.common import ConversionError

logger = logging.getLogger(__name__)

@shared_task(bind=True)
def run_base_analysis_pipeline(self, diagnosis_request_id):
    """
    [최종 완성본] Colab에서 증명된 TotalSegmentator의 실제 출력 경로를 찾아 처리합니다.
    """
    task_id = self.request.id
    logger.info(f"Celery task {task_id} [Base Pipeline] started for request ID: {diagnosis_request_id}")
    work_dir = tempfile.mkdtemp()
    diagnosis_request = None
    try:
        diagnosis_request = DiagnosisRequest.objects.get(id=diagnosis_request_id)
        diagnosis_request.status = 'PROCESSING'; diagnosis_request.save()
        result, _ = DiagnosisResult.objects.get_or_create(request=diagnosis_request)
        result.error_message = None; result.save()

        dicom_input_path = os.path.join(settings.MEDIA_ROOT, 'dicom_uploads', str(diagnosis_request.id))
        if not os.path.isdir(dicom_input_path):
            raise FileNotFoundError(f"DICOM input directory not found: {dicom_input_path}")

        # 1. DICOM to NIfTI 변환
        nifti_output_dir = os.path.join(work_dir, 'nifti_conversion')
        os.makedirs(nifti_output_dir, exist_ok=True)
        dicom2nifti.convert_directory(dicom_input_path, nifti_output_dir, compression=True, reorient=True)
        
        nifti_files = glob.glob(os.path.join(nifti_output_dir, '*.nii.gz'))
        if not nifti_files:
            raise FileNotFoundError("NIfTI conversion failed.")
        
        with open(nifti_files[0], 'rb') as f:
            result.original_ct_nifti.save(f'original_ct_{diagnosis_request.id}.nii.gz', File(f))
        original_ct_nifti_path = result.original_ct_nifti.path

        # 2. TotalSegmentator 실행 (Colab에서 검증된 방식)
        # [최종 수정] 출력 경로 '이름의 기본(base)'을 지정합니다. (폴더 X)
        segmentation_output_base = os.path.join(work_dir, 'total_segmentation')
        
        # [최종 수정] --ml 옵션을 사용하여 단일 다중 라벨 파일을 생성하도록 합니다.
        command = f'TotalSegmentator -i "{original_ct_nifti_path}" -o "{segmentation_output_base}" --fast --ml'
        logger.info(f"Executing TotalSegmentator command: {command}")
        subprocess.run(command, shell=True, check=True)

        # [최종 수정] Colab에서 확인된 실제 출력 파일 경로를 찾습니다. (.nii 또는 .nii.gz)
        segmentation_output_path = f"{segmentation_output_base}.nii"
        if not os.path.exists(segmentation_output_path):
             segmentation_output_path_gz = f"{segmentation_output_base}.nii.gz"
             if not os.path.exists(segmentation_output_path_gz):
                raise FileNotFoundError(f"TotalSegmentator result file not found at expected paths.")
             segmentation_output_path = segmentation_output_path_gz
        logger.info(f"Found TotalSegmentator result file: {segmentation_output_path}")

        # 3. "전체 장기 분할" 3D 뷰어 생성
        preview_dir = os.path.join(settings.MEDIA_ROOT, 'results', str(diagnosis_request.id))
        os.makedirs(preview_dir, exist_ok=True)
        preview_html_path = os.path.join(preview_dir, 'visualization_3d.html')
        generate_3d_preview(segmentation_output_path, preview_html_path, tumor_seg_path=None)
        result.visualization_3d_html_path = os.path.join(settings.MEDIA_URL, os.path.relpath(preview_html_path, settings.MEDIA_ROOT).replace(os.path.sep, '/'))

        # 4. 생성된 다중 라벨 파일을 DB에 저장 (필요시 압축)
        file_to_save_path = segmentation_output_path
        if not file_to_save_path.endswith('.gz'):
            gzipped_path = file_to_save_path + ".gz"
            with open(file_to_save_path, 'rb') as f_in, gzip.open(gzipped_path, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
            file_to_save_path = gzipped_path
        
        with open(file_to_save_path, 'rb') as f:
            result.segmentation_nifti_file.save(f'total_segmentation_{diagnosis_request.id}.nii.gz', File(f))

        # 5. 종양이 없는 '통합 뷰어' 미리 생성
        integrated_html_path = create_integrated_viewer_html(
            ct_path=result.original_ct_nifti.path,
            organ_seg_path=result.segmentation_nifti_file.path,
            result_id=str(diagnosis_request.id),
            tumor_seg_path=None
        )
        result.integrated_viewer_html_path = os.path.join(settings.MEDIA_URL, os.path.relpath(integrated_html_path, settings.MEDIA_ROOT).replace(os.path.sep, '/'))
        
        # 6. 최종 상태 업데이트
        result.result_summary = "기본 장기 분할 완료. 종양 분석 대기 중."
        result.status = 'COMPLETED'; result.save()
        diagnosis_request.status = 'COMPLETED'; diagnosis_request.save()
        
    except Exception as e:
        logger.error(f"Error in base analysis pipeline: {e}", exc_info=True)
        if diagnosis_request:
            diagnosis_request.status = 'FAILED'; diagnosis_request.save()
            result, _ = DiagnosisResult.objects.get_or_create(request=diagnosis_request)
            result.error_message = f"Task failed: {e}"; result.status = 'FAILED'; result.save()
    finally:
        if os.path.exists(work_dir):
            shutil.rmtree(work_dir, ignore_errors=True)
        logger.info(f"Celery task {task_id} [Base Pipeline] finished.")
        
def _run_specific_nnunet_task(seg_result_id, dataset_id, analysis_name, model_config='3d_fullres'):
    """[최종] 2차 분석 완료 시, 두 종류의 뷰어를 '종양 포함' 버전으로 다시 생성하여 덮어씁니다."""
    logger.info(f"Starting nnU-Net segmentation for {analysis_name} (Dataset: {dataset_id}, Config: {model_config})")
    seg_result = TumorSegmentationResult.objects.get(id=seg_result_id)
    diagnosis_request = seg_result.request
    diagnosis_result = diagnosis_request.result
    work_dir = tempfile.mkdtemp()
    try:
        original_ct_path = diagnosis_result.original_ct_nifti.path
        organ_seg_path = diagnosis_result.segmentation_nifti_file.path
        
        nnunet_output_dir = os.path.join(work_dir, "nnunet_segmentation")
        # model_config 값을 run_nnunet_segmentation 함수로 전달합니다.
        nnunet_seg_path = run_nnunet_segmentation(original_ct_path, nnunet_output_dir, dataset_id, model_config)
        
        with open(nnunet_seg_path, 'rb') as f:
            seg_result.tumor_nifti_file.save(f'{analysis_name}_{diagnosis_request.id}.nii.gz', File(f))
            
        # 1. 종양 포함된 NiiVue 통합 뷰어(2D)를 다시 생성하여 덮어쓰기
        updated_integ_html_path = create_integrated_viewer_html(
            ct_path=original_ct_path,
            organ_seg_path=organ_seg_path,
            result_id=str(diagnosis_request.id),
            tumor_seg_path=seg_result.tumor_nifti_file.path
        )
        diagnosis_result.integrated_viewer_html_path = os.path.join(settings.MEDIA_URL, os.path.relpath(updated_integ_html_path, settings.MEDIA_ROOT).replace(os.path.sep, '/'))
        
        # 2. 종양 포함된 Plotly 전체 장기 뷰어(3D)를 다시 생성하여 덮어쓰기
        preview_dir = os.path.join(settings.MEDIA_ROOT, 'results', str(diagnosis_request.id))
        preview_html_path = os.path.join(preview_dir, 'visualization_3d.html')
        generate_3d_preview(
            multi_label_nifti_path=organ_seg_path,
            output_html_path=preview_html_path,
            tumor_seg_path=seg_result.tumor_nifti_file.path
        )
        
        seg_result.status = 'COMPLETED'
        diagnosis_result.save()
    except Exception as e:
        logger.error(f"Error in nnU-Net pipeline for {analysis_name}: {e}", exc_info=True)
        seg_result.status = 'FAILED'; seg_result.error_message = str(e)
    finally:
        seg_result.save()
        if os.path.exists(work_dir):
            shutil.rmtree(work_dir)


@shared_task
def run_liver_tumor_segmentation(seg_result_id):
    _run_specific_nnunet_task(seg_result_id, dataset_id="6", analysis_name="liver_tumor")

@shared_task
def run_kidney_tumor_segmentation(seg_result_id):
    _run_specific_nnunet_task(seg_result_id, dataset_id="48", analysis_name="kidney_tumor", model_config="3d_cascade_fullres")

@shared_task
def run_breast_segmentation(seg_result_id):
    logger.info(f"Starting Breast segmentation for seg_result {seg_result_id}")
    seg_result = TumorSegmentationResult.objects.get(id=seg_result_id)
    diagnosis_request = seg_result.request
    work_dir = tempfile.mkdtemp()
    output_nii_path = os.path.join(work_dir, 'breasts.nii.gz')
    try:
        original_ct_path = diagnosis_request.result.original_ct_nifti.path
        command = f'TotalSegmentator -i "{original_ct_path}" -o "{output_nii_path}" --task breasts'
        logger.info(f"Executing command: {command}")
        subprocess.run(command, shell=True, check=True)
        
        with open(output_nii_path, 'rb') as f:
            seg_result.tumor_nifti_file.save(f'breast_{diagnosis_request.id}.nii.gz', File(f))
        
        html_path = os.path.join(work_dir, 'breast_3d_view.html')
        visualize_analysis_result_3d(nib.load(output_nii_path).get_fdata(), np.zeros(1), html_path, main_obj_name="Breast Tissue")
        relative_path = os.path.relpath(html_path, settings.MEDIA_ROOT)
        seg_result.visualization_3d_html_path = os.path.join(settings.MEDIA_URL, relative_path.replace(os.path.sep, '/'))
        seg_result.status = 'COMPLETED'
    except Exception as e:
        logger.error(f"Error in breast segmentation pipeline: {e}", exc_info=True)
        seg_result.status = 'FAILED'; seg_result.error_message = str(e)
    finally:
        seg_result.save()
        if os.path.exists(work_dir):
            shutil.rmtree(work_dir)
import os
import logging
import subprocess
import shutil
from totalsegmentator.python_api import totalsegmentator 

logger = logging.getLogger(__name__)

def run_total_segmentation(input_nifti_path: str, output_path: str) -> str:
    """
    [최종] TotalSegmentator Python API를 호출하여 단일 결과 파일을 생성합니다.
    """
    logger.info(f"Executing TotalSegmentator Python API for input: {input_nifti_path}")
    
    # fast=True, ml=True 옵션으로 단일 다중 라벨 파일을 생성합니다.
    totalsegmentator(
        input=input_nifti_path, 
        output=output_path, 
        fast=True, 
        ml=True
    )
    
    logger.info(f"TotalSegmentator API execution finished. Result at: {output_path}")

    # TotalSegmentator는 .nii.gz 확장자를 보장하지 않을 수 있으므로, 실제 생성된 파일을 확인합니다.
    if os.path.exists(output_path):
        return output_path
    elif os.path.exists(output_path.replace('.nii.gz', '.nii')):
        return output_path.replace('.nii.gz', '.nii')
    else:
        raise FileNotFoundError(f"TotalSegmentator가 예상 경로에 결과 파일을 생성하지 않았습니다: {output_path}")

def run_command(command):
    """
    주어진 명령어를 실행하고 stdout/stderr를 로깅하는 헬퍼 함수
    """
    logger.info(f"실행 명령어: {' '.join(command)}")
    try:
        process = subprocess.run(command, check=True, capture_output=True, text=True)
        logger.info(f"명령어 stdout: {process.stdout}")
        if process.stderr:
            logger.warning(f"명령어 stderr: {process.stderr}")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"명령어 실행 실패. Return code: {e.returncode}")
        logger.error(f"명령어 stderr: {e.stderr}")
        raise RuntimeError(f"AI 모델 실행 중 오류 발생: {e.stderr}") from e

def run_nnunet_segmentation(input_nifti_path: str, output_dir: str, dataset_id: str, model_config:str = '3d_fullres') -> str:
    """
    nnU-Net을 사용하여 특정 타겟의 정밀 분할을 수행합니다.
    """
    input_dir = os.path.join(os.path.dirname(output_dir), "nnunet_input")
    if os.path.exists(input_dir): shutil.rmtree(input_dir)
    os.makedirs(input_dir)
    
    # nnU-Net 형식에 맞는 파일명으로 복사 (_0000 접미사 필요)
    nnunet_input_filepath = os.path.join(input_dir, os.path.basename(input_nifti_path).replace(".nii.gz", "_0000.nii.gz"))
    shutil.copy(input_nifti_path, nnunet_input_filepath)
    
    if os.path.exists(output_dir): shutil.rmtree(output_dir)
    os.makedirs(output_dir)

    command = [
        "nnUNetv2_predict", "-i", input_dir, "-o", output_dir,
        "-d", dataset_id, "-c", model_config, 
        "-f", "0", "1", "2", "3", "4",
        "--disable_tta",
        "--verbose",
    ]
    
    run_command(command)
    
    output_files = [f for f in os.listdir(output_dir) if f.endswith('.nii.gz')]
    if not output_files:
        raise FileNotFoundError(f"nnU-Net 실행 후 결과 파일을 찾을 수 없습니다: {output_dir}")
        
    return os.path.join(output_dir, output_files[0])
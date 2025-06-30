# check_nifti.py
import nibabel as nib
import numpy as np
import os

# ❗️❗️ 아래 파일 경로는 반드시 새로 실행된 로그에 나온 임시 폴더 경로로 바꿔주세요.
file_to_check = '/tmp/tmp3qb5ldz1/total_segmentation.nii.gz' 

if not os.path.exists(file_to_check):
    print(f"오류: 파일이 존재하지 않습니다. 경로를 다시 확인하세요: {file_to_check}")
else:
    try:
        nii_img = nib.load(file_to_check)
        data = nii_img.get_fdata()
        unique_labels = np.unique(data)

        print(f"--- 파일 분석 결과 ---")
        print(f"파일: {file_to_check}")
        print(f"이미지 Shape: {data.shape}")
        print(f"데이터 타입: {data.dtype}")
        print(f"발견된 고유 레이블 값: {unique_labels}")

        if len(unique_labels) <= 1 and 0 in unique_labels:
            print("\n[진단] 파일에 배경(0) 외에는 아무것도 분할되지 않았습니다. (빈 파일)")
        else:
            print("\n[진단] 파일에 분할된 데이터가 존재합니다. utils_3d.py의 ORGAN_COLOR_MAP에 해당 레이블이 있는지 확인해야 합니다.")

    except Exception as e:
        print(f"파일을 읽거나 분석하는 중 오류 발생: {e}")
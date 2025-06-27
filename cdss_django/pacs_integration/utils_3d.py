import os
import glob
import nibabel as nib
import numpy as np
from skimage import measure
import plotly.graph_objects as go
import logging
from django.conf import settings
logger = logging.getLogger(__name__)

# TotalSegmentator --fast 모드의 결과 파일 이름과 시각화 색상을 매핑합니다.
ORGAN_FILENAME_MAP = {
    # 소화기계 (갈색/붉은색 계열로 통일성 및 구별성 부여)
    "liver": ("Liver (간)", "rgba(180, 80, 40, 0.8)"),        # 기존보다 깊은 적갈색으로 변경
    "spleen": ("Spleen (비장)", "rgba(139, 0, 0, 0.8)"),          # 더 진하고 어두운 붉은색으로 변경
    "stomach": ("Stomach (위)", "rgba(230, 100, 50, 0.8)"),      # 노란색에서 살구색/오렌지-레드 계열로 변경
    "pancreas": ("Pancreas (췌장)", "rgba(200, 90, 150, 0.8)"),  # 연보라에서 더 뚜렷한 분홍/자주색 계열로 변경
    "gallbladder": ("Gallbladder (담낭)", "rgba(0, 100, 0, 0.8)"), # 쓸개즙을 고려한 진한 녹색으로 변경
    #"colon": ("Colon (대장)", "rgba(210, 140, 70, 0.8)"),      # 기존보다 채도를 높인 갈색 계열로 변경

    # 비뇨기계 및 순환기계
    "kidney": ("Kidneys (신장)", "rgba(140, 60, 60, 0.8)"),       # 주황색에서 신장의 실제 색과 유사한 적갈색으로 변경
    "heart": ("Heart (심장)", "rgba(204, 0, 0, 0.8)"),          # 선명하고 강렬한 클래식 레드로 변경

    # 기타 주요 장기
    "lung": ("Lungs (폐)", "rgba(70, 130, 180, 0.8)"),        # 기존보다 진한 강철 파란색(Steel Blue)으로 변경하여 선명도 향상
    "adrenal_gland": ("Adrenal Gland (부신)", "rgba(255, 215, 0, 0.8)"), # 밝은 노란색에서 깊이 있는 금색으로 변경
    
    # aorta는 heart와 겹치므로 약간 다른 빨간색으로 설정
    #"aorta": ("Aorta (대동맥)", "rgba(255, 69, 0, 0.8)"),
}

ORGAN_VIS_MAP = {
    # 소화기계 (갈색/붉은색 계열로 통일성 및 구별성 부여)
    "liver": ("Liver (간)", "rgba(180, 80, 40, 0.8)"),        # 기존보다 깊은 적갈색으로 변경
    "spleen": ("Spleen (비장)", "rgba(139, 0, 0, 0.8)"),          # 더 진하고 어두운 붉은색으로 변경
    "stomach": ("Stomach (위)", "rgba(230, 100, 50, 0.8)"),      # 노란색에서 살구색/오렌지-레드 계열로 변경
    "pancreas": ("Pancreas (췌장)", "rgba(200, 90, 150, 0.8)"),  # 연보라에서 더 뚜렷한 분홍/자주색 계열로 변경
    "gallbladder": ("Gallbladder (담낭)", "rgba(0, 100, 0, 0.8)"), # 쓸개즙을 고려한 진한 녹색으로 변경
    #"colon": ("Colon (대장)", "rgba(210, 140, 70, 0.8)"),      # 기존보다 채도를 높인 갈색 계열로 변경

    # 비뇨기계 및 순환기계
    "kidney": ("Kidneys (신장)", "rgba(140, 60, 60, 0.8)"),       # 주황색에서 신장의 실제 색과 유사한 적갈색으로 변경
    "heart": ("Heart (심장)", "rgba(204, 0, 0, 0.8)"),          # 선명하고 강렬한 클래식 레드로 변경

    # 기타 주요 장기
    "lung": ("Lungs (폐)", "rgba(70, 130, 180, 0.8)"),        # 기존보다 진한 강철 파란색(Steel Blue)으로 변경하여 선명도 향상
    "adrenal_gland": ("Adrenal Gland (부신)", "rgba(255, 215, 0, 0.8)"), # 밝은 노란색에서 깊이 있는 금색으로 변경
    
    # aorta는 heart와 겹치므로 약간 다른 빨간색으로 설정
    #"aorta": ("Aorta (대동맥)", "rgba(255, 69, 0, 0.8)"),
}

# TotalSegmentator 전체 라벨 맵
LABEL_MAP = {
    "spleen": 1, "kidney_right": 2, "kidney_left": 3, "gallbladder": 4, "liver": 5, 
    "stomach": 6, "pancreas": 7, "adrenal_gland_right": 8, "adrenal_gland_left": 9, 
    "lung_upper_lobe_left": 10, "lung_lower_lobe_left": 11, "lung_upper_lobe_right": 12, 
    "lung_middle_lobe_right": 13, "lung_lower_lobe_right": 14, "esophagus": 15, "trachea": 16,
    "thyroid_gland": 17, "small_bowel": 18, "duodenum": 19, "colon": 20, "urinary_bladder": 21,
    "prostate": 22, "kidney_cyst_left": 23, "kidney_cyst_right": 24, "sacrum": 25,
    "vertebrae_S1": 26, "vertebrae_L5": 27, "vertebrae_L4": 28, "vertebrae_L3": 29,
    "vertebrae_L2": 30, "vertebrae_L1": 31, "vertebrae_T12": 32, "vertebrae_T11": 33,
    "vertebrae_T10": 34, "vertebrae_T9": 35, "vertebrae_T8": 36, "vertebrae_T7": 37,
    "vertebrae_T6": 38, "vertebrae_T5": 39, "vertebrae_T4": 40, "vertebrae_T3": 41,
    "vertebrae_T2": 42, "vertebrae_T1": 43, "vertebrae_C7": 44, "vertebrae_C6": 45,
    "vertebrae_C5": 46, "vertebrae_C4": 47, "vertebrae_C3": 48, "vertebrae_C2": 49,
    "vertebrae_C1": 50, "heart": 51, "aorta": 52, "pulmonary_vein": 53,
    "brachiocephalic_trunk": 54, "subclavian_artery_right": 55, "subclavian_artery_left": 56,
    "common_carotid_artery_right": 57, "common_carotid_artery_left": 58,
    "brachiocephalic_vein_left": 59, "brachiocephalic_vein_right": 60,
    "atrial_appendage_left": 61, "superior_vena_cava": 62, "inferior_vena_cava": 63,
    "portal_vein_and_splenic_vein": 64, "iliac_artery_left": 65, "iliac_artery_right": 66,
    "iliac_vena_left": 67, "iliac_vena_right": 68, "humerus_left": 69, "humerus_right": 70,
    "scapula_left": 71, "scapula_right": 72, "clavicula_left": 73, "clavicula_right": 74,
    "femur_left": 75, "femur_right": 76, "hip_left": 77, "hip_right": 78, "spinal_cord": 79,
    "gluteus_maximus_left": 80, "gluteus_maximus_right": 81, "gluteus_medius_left": 82,
    "gluteus_medius_right": 83, "gluteus_minimus_left": 84, "gluteus_minimus_right": 85,
    "autochthon_left": 86, "autochthon_right": 87, "iliopsoas_left": 88, "iliopsoas_right": 89,
    "brain": 90, "skull": 91, "rib_left_1": 92, "rib_left_2": 93, "rib_left_3": 94,
    "rib_left_4": 95, "rib_left_5": 96, "rib_left_6": 97, "rib_left_7": 98,
    "rib_left_8": 99, "rib_left_9": 100, "rib_left_10": 101, "rib_left_11": 102,
    "rib_left_12": 103, "rib_right_1": 104, "rib_right_2": 105, "rib_right_3": 106,
    "rib_right_4": 107, "rib_right_5": 108, "rib_right_6": 109, "rib_right_7": 110,
    "rib_right_8": 111, "rib_right_9": 112, "rib_right_10": 113, "rib_right_11": 114,
    "rib_right_12": 115, "sternum": 116, "costal_cartilages": 117
}

def generate_3d_preview(multi_label_nifti_path, output_html_path, tumor_seg_path=None):
    """
    [수정] 다중 라벨 파일과 '선택적인' 종양 파일을 받아 Plotly 3D 뷰어를 생성합니다.
           NIfTI 헤더의 복셀 크기를 읽어와 정확한 비율의 3D 모델을 생성합니다.
    """
    logger.info(f"Generating 3D preview with Organs: {multi_label_nifti_path}, Tumor: {tumor_seg_path}")
    fig = go.Figure()
    try:
        # 1. 장기 분할 로드 및 3D 메쉬 생성
        nifti_img = nib.load(multi_label_nifti_path)
        data = nifti_img.get_fdata()

        # --- [핵심 수정 1] 헤더에서 복셀(Voxel) 크기(spacing) 정보 가져오기 ---
        voxel_spacing = nifti_img.header.get_zooms()
        sx, sy, sz = voxel_spacing
        logger.info(f"적용될 Voxel Spacing (x, y, z): ({sx}, {sy}, {sz})")
        # --- [수정 끝] ---

        unique_labels = np.unique(data)
        reversed_label_map = {v: k for k, v in LABEL_MAP.items()}
        processed_base_organs = set()

        for label_val in unique_labels:
            if label_val == 0: continue
            organ_name = reversed_label_map.get(label_val, f"Organ {int(label_val)}")
            base_organ_name = organ_name.split('_')[0]
            
            if base_organ_name in ORGAN_VIS_MAP and base_organ_name not in processed_base_organs:
                display_name, color = ORGAN_VIS_MAP[base_organ_name]
                combined_organ_mask = np.zeros_like(data, dtype=np.uint8)
                for l_val, o_name in reversed_label_map.items():
                    if o_name.startswith(base_organ_name):
                        combined_organ_mask[data == l_val] = 1
                
                if np.any(combined_organ_mask):
                    verts, faces, _, _ = measure.marching_cubes(combined_organ_mask, level=0.5)
                    fig.add_trace(go.Mesh3d(x=verts[:, 0], y=verts[:, 1], z=verts[:, 2], i=faces[:, 0], j=faces[:, 1], k=faces[:, 2], color=color, opacity=0.4, name=display_name))
                    processed_base_organs.add(base_organ_name)

        # 2. 종양 파일 처리 (기존과 동일)
        if tumor_seg_path and os.path.exists(tumor_seg_path):
            tumor_nii = nib.load(tumor_seg_path)
            tumor_data = tumor_nii.get_fdata()
            if np.any(tumor_data):
                verts, faces, _, _ = measure.marching_cubes(tumor_data, level=0.5)
                fig.add_trace(go.Mesh3d(x=verts[:, 0], y=verts[:, 1], z=verts[:, 2], i=faces[:, 0], j=faces[:, 1], k=faces[:, 2], color="red", opacity=1.0, name="Tumor"))
                logger.info("Tumor mesh added to the main 3D preview.")

        if not fig.data:
            raise ValueError("No organ meshes were created.")

        # --- [핵심 수정 2] ---
        # scene의 aspectmode를 'manual'로 변경하고,
        # 위에서 얻은 voxel_spacing 값을 aspectratio에 직접 할당합니다.
        fig.update_layout(
            title_text='3D Segmentation Preview (Corrected Aspect Ratio)',
            scene=dict(
                xaxis_title='X Axis',
                yaxis_title='Y Axis',
                zaxis_title='Z Axis (Slice)',
                aspectratio={'x': sx, 'y': sy, 'z': sz},
                aspectmode='manual'
            ),
            margin=dict(l=0, r=0, b=0, t=40)
        )
        # --- [수정 끝] ---
        
        fig.write_html(output_html_path)
        return output_html_path
    except Exception as e:
        logger.error(f"Failed to generate interactive 3D preview: {e}", exc_info=True)
        raise

def generate_interactive_3d_preview_fast(segmentation_dir_path, output_html_path):
    """[pacs_integration을 위한 함수] --fast 옵션으로 생성된 여러 NIfTI를 받아 Plotly 3D HTML로 저장합니다."""
    logger.info(f"Generating --fast 3D preview from directory: {segmentation_dir_path}")
    try:
        nifti_files = glob.glob(os.path.join(segmentation_dir_path, '*.nii.gz'))
        fig = go.Figure()
        logger.info(f"Found {len(nifti_files)} files. Creating 3D meshes...")
        for file_path in nifti_files:
            filename = os.path.basename(file_path)
            if filename in ORGAN_FILENAME_MAP:
                name, color = ORGAN_FILENAME_MAP[filename]
                try:
                    nifti_img = nib.load(file_path)
                    organ_data = nifti_img.get_fdata()
                    if np.sum(organ_data) == 0: continue
                    verts, faces, _, _ = measure.marching_cubes(organ_data, level=0.5)
                    fig.add_trace(go.Mesh3d(x=verts[:, 0], y=verts[:, 1], z=verts[:, 2], i=faces[:, 0], j=faces[:, 1], k=faces[:, 2], color=color, opacity=0.5, name=name))
                except Exception as mesh_e:
                    logger.warning(f"Could not create mesh from file '{filename}'. Reason: {mesh_e}")
        if not fig.data:
            raise ValueError("No organ meshes were created from the segmentation files.")
        fig.update_layout(title_text='3D Segmentation Preview (Fast Mode)', scene=dict(aspectmode='data'), margin=dict(l=0, r=0, b=0, t=40))
        fig.write_html(output_html_path)
        logger.info(f"Interactive 3D preview HTML saved to {output_html_path}")
        return output_html_path
    except Exception as e:
        logger.error(f"Failed to generate --fast interactive 3D preview: {e}", exc_info=True)
        raise

def visualize_analysis_result_3d(main_mask_data, tumor_mask_data, output_html_path, main_obj_name="Organ", tumor_obj_name="Tumor", main_color='red', tumor_color='yellow'):
    """[omics 앱을 위한 함수] 주요 마스크(장기, 조직 등)와 종양 마스크를 받아 3D HTML 파일로 저장합니다."""
    fig = go.Figure()
    logger.info(f"Generating 3D view for {main_obj_name} and {tumor_obj_name}")
    if np.any(main_mask_data):
        try:
            verts, faces, _, _ = measure.marching_cubes(main_mask_data, level=0.5)
            fig.add_trace(go.Mesh3d(x=verts[:, 0], y=verts[:, 1], z=verts[:, 2], i=faces[:, 0], j=faces[:, 1], k=faces[:, 2], color=main_color, opacity=0.3, name=main_obj_name))
        except Exception as e:
            logger.error(f"Error creating main object mesh: {e}")
    if np.any(tumor_mask_data):
        try:
            verts, faces, _, _ = measure.marching_cubes(tumor_mask_data, level=0.5)
            fig.add_trace(go.Mesh3d(x=verts[:, 0], y=verts[:, 1], z=verts[:, 2], i=faces[:, 0], j=faces[:, 1], k=faces[:, 2], color=tumor_color, opacity=1.0, name=tumor_obj_name))
        except Exception as e:
            logger.error(f"Error creating tumor mesh: {e}")
    fig.update_layout(title_text=f"3D Visualization: {main_obj_name} and {tumor_obj_name}", scene=dict(aspectmode='data'), margin=dict(l=0, r=0, b=0, t=40))
    fig.write_html(output_html_path)
    return output_html_path

def create_integrated_plotly_view(ct_path, organ_seg_path, tumor_seg_path, output_html_path):
    """CT, 장기분할, 종양분할 NIfTI 파일을 모두 합쳐 하나의 Plotly HTML 파일로 생성합니다."""
    logger.info(f"Creating integrated view with CT: {ct_path}, Organs: {organ_seg_path}, Tumor: {tumor_seg_path}")
    fig = go.Figure()
    
    # 1. 원본 CT 로드 및 3D 볼륨으로 시각화
    try:
        ct_nii = nib.load(ct_path)
        ct_data = ct_nii.get_fdata()
        x, y, z = np.mgrid[:ct_data.shape[0], :ct_data.shape[1], :ct_data.shape[2]]
        fig.add_trace(go.Volume(
            x=x.flatten(), y=y.flatten(), z=z.flatten(),
            value=ct_data.flatten(),
            isomin=-500, isomax=500, opacity=0.1, surface_count=10,
            colorscale='Greys', name='CT Scan', showscale=False,
        ))
        logger.info("CT volume added to the plot.")
    except Exception as e:
        logger.error(f"Failed to process CT scan for 3D view: {e}")

    # 2. 장기 분할 로드 및 3D 메쉬로 시각화
    try:
        organ_nii = nib.load(organ_seg_path)
        organ_data = organ_nii.get_fdata()
        reversed_label_map = {v: k for k, v in LABEL_MAP.items()}
        organ_colors = {
            "spleen": "rgba(139, 0, 0, 0.7)", "kidney_right": "rgba(140, 60, 60, 0.7)", 
            "kidney_left": "rgba(140, 60, 60, 0.7)", "liver": "rgba(180, 80, 40, 0.6)", 
            "pancreas": "rgba(200, 90, 150, 0.7)",
            "lung_upper_lobe_left": "rgba(70, 130, 180, 0.4)", "lung_lower_lobe_left": "rgba(70, 130, 180, 0.4)",
            "lung_upper_lobe_right": "rgba(70, 130, 180, 0.4)", "lung_middle_lobe_right": "rgba(70, 130, 180, 0.4)",
            "lung_lower_lobe_right": "rgba(70, 130, 180, 0.4)"
        }        
        
        unique_labels = np.unique(organ_data)
        for label in unique_labels:
            if label == 0: continue
            organ_name = reversed_label_map.get(label, f"Organ {int(label)}")
            color = organ_colors.get(organ_name.split('_')[0], "rgba(128, 128, 128, 0.7)")
            verts, faces, _, _ = measure.marching_cubes((organ_data == label).astype(np.uint8), level=0.5)
            fig.add_trace(go.Mesh3d(
                x=verts[:, 0], y=verts[:, 1], z=verts[:, 2],
                i=faces[:, 0], j=faces[:, 1], k=faces[:, 2],
                color=color, name=organ_name,
                opacity=float(color.split(',')[-1].strip(')'))
            ))
        logger.info("Organ meshes added to the plot.")
    except Exception as e:
        logger.error(f"Failed to process organ segmentation for 3D view: {e}")

    # 3. [수정] 종양 분할 로드 (종양 파일 경로가 있을 때만 실행)
    if tumor_seg_path and os.path.exists(tumor_seg_path):
        try:
            tumor_nii = nib.load(tumor_seg_path)
            tumor_data = tumor_nii.get_fdata()
            if np.any(tumor_data):
                verts, faces, _, _ = measure.marching_cubes(tumor_data, level=0.5)
                fig.add_trace(go.Mesh3d(
                    x=verts[:, 0], y=verts[:, 1], z=verts[:, 2],
                    i=faces[:, 0], j=faces[:, 1], k=faces[:, 2],
                    color='red', name='Tumor', opacity=0.9
                ))
                logger.info("Tumor mesh added to the plot.")
        except Exception as e:
            logger.error(f"Failed to process tumor segmentation for 3D view: {e}")

    # 레이아웃 설정 및 HTML 파일 저장 (이전과 동일)
    fig.update_layout(
        title_text="Integrated 3D View (CT + Organs + Tumor)",
        scene=dict(aspectmode='data'),
        margin=dict(l=0, r=0, b=0, t=40)
    )
    fig.write_html(output_html_path)
    logger.info(f"Integrated 3D view saved to {output_html_path}")
    return output_html_path

def combine_nifti_files(input_dir, output_file):
    """[ai_service를 위한 함수] 디렉토리 내의 여러 NIfTI 파일을 하나의 다중 라벨 NIfTI 파일로 결합합니다."""
    logger.info(f"Combining NIfTI files from {input_dir} into {output_file}")
    nifti_files = [f for f in os.listdir(input_dir) if f.endswith('.nii.gz')]
    if not nifti_files:
        logger.warning("No NIfTI files found to combine.")
        return None
    reference_nii = nib.load(os.path.join(input_dir, nifti_files[0]))
    combined_data = np.zeros(reference_nii.shape, dtype=np.uint8)
    for filename in nifti_files:
        organ_name = filename.replace('.nii.gz', '')
        label = LABEL_MAP.get(organ_name)
        if label is None:
            logger.warning(f"Label for organ '{organ_name}' not found in LABEL_MAP. Skipping.")
            continue
        try:
            nii_img = nib.load(os.path.join(input_dir, filename))
            organ_data = nii_img.get_fdata() > 0
            combined_data[organ_data] = label
        except Exception as e:
            logger.error(f"Failed to process file {filename}: {e}")
    combined_nii = nib.Nifti1Image(combined_data, reference_nii.affine, reference_nii.header)
    nib.save(combined_nii, output_file)
    logger.info(f"Successfully created combined NIfTI file at {output_file}")
    return output_file

# --- NiiVue 2D 뷰어용 함수들 (신규 추가) ---

def _create_niivue_html(template_name, context, result_id, output_filename):
    """NiiVue HTML 뷰어 생성을 위한 내부 헬퍼 함수"""
    try:
        template_path = os.path.join(os.path.dirname(__file__), 'templates', template_name)
        with open(template_path, 'r') as f:
            template_str = f.read()
        for key, value in context.items():
            template_str = template_str.replace(key, str(value))
        
        output_dir = os.path.join(settings.MEDIA_ROOT, 'viewers', str(result_id))
        os.makedirs(output_dir, exist_ok=True)
        output_html_path = os.path.join(output_dir, output_filename)

        with open(output_html_path, 'w') as f:
            f.write(template_str)
        return output_html_path
    except Exception as e:
        logger.error(f"NiiVue HTML 뷰어 생성 중 오류: {e}", exc_info=True)
        raise

def create_integrated_viewer_html(ct_path: str, organ_seg_path: str, result_id: str, tumor_seg_path: str = None) -> str:
    """'통합 뷰어'를 위한 NiiVue HTML을 생성합니다."""
    from django.conf import settings
    
    ct_url = os.path.join(settings.MEDIA_URL, os.path.relpath(ct_path, settings.MEDIA_ROOT))
    organ_url = os.path.join(settings.MEDIA_URL, os.path.relpath(organ_seg_path, settings.MEDIA_ROOT))
    tumor_url = "None"
    if tumor_seg_path and os.path.exists(tumor_seg_path):
        tumor_url = os.path.join(settings.MEDIA_URL, os.path.relpath(tumor_seg_path, settings.MEDIA_ROOT))

    context = {
        '__BACKGROUND_CT_URL__': ct_url,
        '__ORGAN_SEG_URL__': organ_url,
        '__TUMOR_SEG_URL__': tumor_url,
    }
    # NiiVue용 템플릿을 사용합니다.
    return _create_niivue_html('integrated_viewer_template.html', context, result_id, 'integrated_viewer.html')

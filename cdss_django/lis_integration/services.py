# /home/rsa-key-20250604/cdss_django/lis_integration/services.py

import logging
from django.utils import timezone

from .lis_client import LISAPIClient
from patients.models import PatientProfile
from omics.models import OmicsRequest
from .models import LabOrder

logger = logging.getLogger(__name__)

def get_or_create_patient_in_lis(patient_profile: PatientProfile, lis_client: LISAPIClient):
    """
    LIS 서버에 환자가 없으면 생성하고, 있으면 정보를 가져와 LIS의 숫자 PK를 반환합니다.
    """
    # LIS의 'patient_id' 필드에 cdss_django의 patient.id(UUID)를 저장하여 동기화 키로 사용합니다.
    search_id_str = str(patient_profile.id)
    
    # 1. LIS에 해당 patient_id를 가진 환자가 있는지 조회합니다.
    lis_patient_data = lis_client.get_patient_by_patient_id(search_id_str)

    if lis_patient_data:
        logger.info(f"Patient with patient_id={search_id_str} found in LIS. LIS PK: {lis_patient_data['id']}")
        return lis_patient_data['id'] # 환자를 찾았으면 LIS의 숫자 PK를 반환
    
    # 2. LIS에 환자가 없으면 새로 생성합니다.
    logger.info(f"Patient with patient_id={search_id_str} not found in LIS. Creating new patient...")
    
    # LIS가 사용하는 성별 코드로 변환하는 로직
    gender_map = {
        'FEMALE': 'F',
        'MALE': 'M',
        'OTHER': 'O',
    }
    # patient_profile.gender 값이 "FEMALE"이면 "F"로, 없으면 기본값 'O'를 사용합니다.
    lis_gender_code = gender_map.get(str(patient_profile.gender).upper(), 'O')

    new_patient_payload = {
        'patient_id': search_id_str, # 동기화 키
        'name': patient_profile.name,
        'birth_date': patient_profile.date_of_birth.isoformat() if patient_profile.date_of_birth else None,
        'gender': lis_gender_code # 변환된 성별 코드를 사용
    }
    
    created_patient = lis_client.create_patient(new_patient_payload)
    logger.info(f"Successfully created patient in LIS. New LIS PK: {created_patient['id']}")
    return created_patient['id'] # 새로 생성된 환자의 숫자 PK를 반환


def order_lis_test_for_omics_request(omics_request: OmicsRequest):
    """
    [오믹스 워크플로우용]
    OmicsRequest를 기반으로 LIS에 자동으로 검사를 오더합니다.
    """
    lis_client = LISAPIClient()
    
    try:
        # LIS에 검사 오더를 보내기 전에, 환자 정보부터 동기화합니다.
        lis_patient_pk = get_or_create_patient_in_lis(omics_request.patient, lis_client)
    except Exception as e:
        logger.error(f"Failed to get or create patient in LIS for patient {omics_request.patient.id}. Error: {e}", exc_info=True)
        raise ConnectionError(f"LIS 환자 정보 동기화 실패: {e}")

    # LIS가 요구하는 숫자 PK를 사용하여 order_data를 구성합니다.
    order_data = {
        'patient': lis_patient_pk,
        'test_id': f"OMICS-{omics_request.id}",
        'test_type': omics_request.cancer_type.replace('_', ' ').title(),
        'specimen_type': 'TISSUE',
        'ordering_physician': omics_request.requester.username,
        'order_date': timezone.now().isoformat()
    }
    
    try:
        logger.info(f"Sending order to LIS with data: {order_data}")
        lis_response = lis_client.create_lab_order(order_data)
        lis_order_id = lis_response.get('id')

        if not lis_order_id:
            raise ConnectionError("LIS에 오믹스 검사 오더 생성 후 ID를 받지 못했습니다.")

        omics_request.lis_test_id = lis_order_id
        omics_request.save(update_fields=['lis_test_id'])
        
        LabOrder.objects.create(
            patient=omics_request.patient,
            ordering_physician=omics_request.requester,
            test_name=f"Omics Analysis ({omics_request.cancer_type})",
            test_codes=[order_data['test_id']],
            status='ordered',
            lis_order_id=lis_order_id,
            omics_request=omics_request,
        )
        
        logger.info(f"Successfully ordered LIS test {lis_order_id} for OmicsRequest {omics_request.id}.")
        return {"status": "success", "lis_test": lis_response}

    except Exception as e:
        logger.error(f"Failed to order LIS test for OmicsRequest {omics_request.id}: {e}", exc_info=True)
        raise e


def create_lab_order_and_log(patient_id: str, test_codes: list, requesting_user):
    """
    [범용 API용]
    외부 시스템(OpenEMR, LIS)과 연동하여 범용 검사 오더를 생성하고,
    우리 시스템에 LabOrder 기록을 남기는 서비스.
    (참고: 이 함수도 LIS와 통신하려면 위와 같은 환자 동기화 로직이 필요합니다.)
    """
    patient_profile = PatientProfile.objects.filter(id=patient_id).first()
    if not patient_profile:
        raise ValueError(f"환자 {patient_id}가 우리 시스템의 PatientProfile에 존재하지 않습니다.")

    lis_client = LISAPIClient()
    
    try:
        lis_patient_pk = get_or_create_patient_in_lis(patient_profile, lis_client)
    except Exception as e:
        logger.error(f"Failed to get or create patient in LIS for patient {patient_profile.id}. Error: {e}", exc_info=True)
        raise ConnectionError(f"LIS 환자 정보 동기화 실패: {e}")
        
    order_data = {
        'patient': lis_patient_pk,
        'test_id': f"MANUAL-{timezone.now().timestamp()}",
        'test_type': ", ".join(test_codes),
        'specimen_type': 'UNKNOWN',
        'ordering_physician': requesting_user.username,
        'order_date': timezone.now().isoformat()
    }
    
    lis_response = lis_client.create_lab_order(order_data)
    order_id_from_lis = lis_response.get('id')

    if not order_id_from_lis:
        raise ConnectionError("LIS에 검사 오더 생성 후 ID를 받지 못했습니다.")
        
    new_order = LabOrder.objects.create(
        patient=patient_profile,
        ordering_physician=requesting_user,
        test_name=f"Manual Lab Order - {test_codes[0]}",
        test_codes=test_codes,
        lis_order_id=order_id_from_lis,
        status='ordered'
    )
    
    return {"order_id": new_order.id, "lis_order_id": order_id_from_lis, "message": "검사 오더가 성공적으로 생성 및 LIS에 등록되었습니다."}

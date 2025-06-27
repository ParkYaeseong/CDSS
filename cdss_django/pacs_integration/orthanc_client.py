# cdss_django/pacs_integration/orthanc_client.py

import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class OrthancClient:
    def __init__(self):
        # [수정] Orthanc 서버 주소를 localhost(127.0.0.1)에서 실제 IP 주소로 변경합니다.
        self.base_url = "http://35.188.47.40:8042"
        
        # Orthanc 서버의 인증 정보 (기본값 유지)
        # 스크린샷에서 "Insecure setup" 경고가 있었으므로, 기본 인증을 사용하거나 인증이 비활성화된 상태일 것입니다.
        self.auth = ('orthanc', 'orthanc')
        
        # 요청 타임아웃 설정 (연결 5초, 읽기 30초)
        self.timeout = (5, 30)

    def upload_dicom_instance(self, dicom_bytes):
        """DICOM 인스턴스 하나를 Orthanc에 업로드합니다."""
        url = f"{self.base_url}/instances"
        headers = {'Content-Type': 'application/dicom'}
        try:
            # auth 파라미터를 사용하여 Basic Authentication을 명시적으로 전달합니다.
            response = requests.post(url, data=dicom_bytes, headers=headers, auth=self.auth, timeout=self.timeout)
            
            # HTTP 에러(4xx, 5xx)가 발생하면 예외를 발생시킵니다.
            response.raise_for_status() 
            
            logger.info(f"Successfully uploaded instance to Orthanc. Response: {response.json()}")
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to upload DICOM instance to Orthanc at {url}: {e}", exc_info=True)
            # 클라이언트 측에서 발생한 에러를 더 명확한 메시지로 다시 발생시킵니다.
            raise ConnectionError(f"Orthanc 서버({self.base_url})에 연결할 수 없습니다. 서버가 실행 중인지, 방화벽 설정을 확인하세요. 원인: {e}")

    def get_study_details(self, study_id):
        """Orthanc에서 특정 Study의 상세 정보를 가져옵니다."""
        url = f"{self.base_url}/studies/{study_id}"
        try:
            response = requests.get(url, auth=self.auth, timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get study details from Orthanc for study ID {study_id}: {e}", exc_info=True)
            raise ConnectionError(f"Orthanc 서버에서 Study 정보를 가져오는 데 실패했습니다. 원인: {e}")

# 다른 Orthanc 관련 함수들을 필요에 따라 여기에 추가할 수 있습니다.


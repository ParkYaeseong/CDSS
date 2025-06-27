# lis_integration/clients.py
import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class LISClient:
    def __init__(self):
        self.base_url = settings.LIS_SERVER_URL
        self.api_key = settings.LIS_API_KEY
        self.timeout = settings.LIS_API_TIMEOUT

    def _get_headers(self):
        # LIS 인증 방식에 따라 헤더를 구성합니다. (API Key, Bearer Token 등)
        return {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

    def _request(self, method, endpoint, **kwargs):
        url = f"{self.base_url.rstrip('/')}{endpoint}"
        kwargs.setdefault('headers', self._get_headers())
        kwargs.setdefault('timeout', self.timeout)

        try:
            response = requests.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json() if response.content else None
        except requests.exceptions.RequestException as e:
            logger.error(f"LIS API Error: {e}", exc_info=True)
            # 필요에 따라 특정 예외를 발생시켜 서비스 계층에서 처리
            raise

    def create_lab_test(self, patient_id: str, test_code: str, requester_id: str):
        """LIS에 새로운 검사를 오더합니다."""
        endpoint = '/api/lab-tests/'
        payload = {
            'patient_id': patient_id, # LIS 시스템이 사용하는 환자 ID
            'test_code': test_code,   # 예: 'SEQ001' (유전체 시퀀싱)
            'requester_id': requester_id # 검사를 요청한 의사 ID
        }
        return self._request('POST', endpoint, json=payload)

    def upload_lab_result(self, lis_test_id: str, results: dict):
        """LIS 검사에 대한 결과를 업로드합니다."""
        endpoint = '/api/lab-results/'
        payload = {
            'lab_test_id': lis_test_id,
            'results_data': results # 예: {'gene': 'BRCA1', 'variant': 'c.123A>G'}
        }
        return self._request('POST', endpoint, json=payload)

    def get_patient_lab_results(self, patient_id: str):
        """특정 환자의 모든 검사 결과를 조회합니다."""
        endpoint = f'/api/lab-results/?patient={patient_id}' # LIS API가 지원하는 필터 방식에 따라 수정
        return self._request('GET', endpoint)
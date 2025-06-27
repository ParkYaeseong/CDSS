# /home/rsa-key-20250604/cdss_django/lis_integration/lis_client.py

import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class LISAPIClient:
    def __init__(self, access_token=None):
        self.base_url = settings.LIS_SERVER_URL
        self.timeout = getattr(settings, 'LIS_API_TIMEOUT', 30)
        self.auth_token = getattr(settings, 'LIS_API_AUTH_TOKEN', None)

    def _make_request(self, method, endpoint, **kwargs):
        """LIS API 요청 공통 함수"""
        url = f"{self.base_url.rstrip('/')}{endpoint}"
        kwargs.setdefault('timeout', self.timeout)

        headers = kwargs.pop('headers', {})
        if self.auth_token:
            headers['Authorization'] = f'Token {self.auth_token}'
        kwargs['headers'] = headers

        try:
            response = requests.request(method, url, **kwargs)
            response.raise_for_status()
            if response.status_code == 204: # No Content 응답 처리
                return None
            if response.content:
                return response.json()
            return None
        except requests.exceptions.HTTPError as e:
            logger.error(f"LIS API Error: {e.response.status_code} {e.response.reason} for url: {url}")
            logger.error(f"Response body: {e.response.text}")
            raise Exception(f"LIS 연결 실패: {str(e)}")
        except requests.exceptions.RequestException as e:
            logger.error(f"LIS API Error: {e} (URL: {url})")
            raise Exception(f"LIS 연결 실패: {str(e)}")

    def test_connection(self):
        # ... 기존 함수 내용은 그대로 ...
        pass

    def get_patient_results(self, openemr_patient_id):
        # ... 기존 함수 내용은 그대로 ...
        pass

    def sync_patient_from_emr(self, openemr_patient_id, patient_data):
        # ... 기존 함수 내용은 그대로 ...
        pass

    def create_lab_order(self, order_data):
        """검사 오더 생성"""
        endpoint = '/api/lab-tests/'
        return self._make_request('POST', endpoint, json=order_data)

    def get_lab_order_status(self, order_id):
        # ... 기존 함수 내용은 그대로 ...
        pass

    # ====================================================================
    # [추가] 아래 두 함수를 LISAPIClient 클래스 안에 추가합니다.
    # ====================================================================

    def get_patient_by_patient_id(self, patient_id_str: str):
        """
        LIS의 'patient_id' 필드를 기준으로 환자를 검색합니다.
        """
        # API 문서에 따라, patient_id로 필터링하는 기능을 사용합니다.
        endpoint = f"/api/patients/?patient_id={patient_id_str}"
        try:
            patients = self._make_request('GET', endpoint)
            # 검색 결과가 리스트 형태로 오므로, 첫 번째 결과를 반환합니다.
            if patients and len(patients) > 0:
                return patients[0]
            return None
        except Exception:
            # 404 Not Found 등 에러 발생 시, 환자가 없는 것으로 간주합니다.
            return None

    def create_patient(self, patient_data):
        """LIS에 새로운 환자를 생성합니다."""
        endpoint = "/api/patients/"
        return self._make_request('POST', endpoint, json=patient_data)


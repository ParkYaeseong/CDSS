# pacs_integration/openemr_client.py
import requests
from django.conf import settings
import time

class OpenEMRClient:
    def __init__(self):
        self.base_url = settings.OPENEMR_API_BASE_URL
        self.token_url = settings.OPENEMR_TOKEN_URL
        self.client_id = settings.OPENEMR_CLIENT_ID
        # self.client_secret = settings.OPENEMR_CLIENT_SECRET # Password Grant에서는 보통 사용 안 함

        # Password Grant를 위한 사용자 정보
        self.username = settings.OPENEMR_API_USERNAME
        self.password = settings.OPENEMR_API_PASSWORD
        self.scope = settings.OPENEMR_API_SCOPE

        self.access_token = getattr(settings, 'OPENEMR_INITIAL_ACCESS_TOKEN', None)
        initial_expires_in = getattr(settings, 'OPENEMR_INITIAL_TOKEN_EXPIRES_IN', 0)

        if self.access_token and initial_expires_in > 0:
            self.token_expires_at = time.time() + initial_expires_in
            print(f"Initialized OpenEMRClient with pre-set token, expires at: {time.ctime(self.token_expires_at)}")
        else:
            self.access_token = None
            self.token_expires_at = 0

        self.refresh_token = None # Password Grant 응답에서 refresh_token을 받을 수 있음

    def _is_token_expired(self):
        if not self.access_token:
            return True
        return time.time() >= self.token_expires_at - 60

    def _get_access_token(self):
        if self.access_token and not self._is_token_expired():
            print("Using existing valid OpenEMR access token.")
            return self.access_token

        # Refresh token 로직 (선택 사항이지만 Password Grant와 함께 사용 가능)
        if self.refresh_token:
            print("Attempting to refresh OpenEMR token using refresh_token...")
            payload = {
                'grant_type': 'refresh_token',
                'refresh_token': self.refresh_token,
                'client_id': self.client_id,
                # 'client_secret': self.client_secret, # 필요시
            }
            print(f"OpenEMR Refresh Token Request Payload: {payload}")
            try:
                response = requests.post(self.token_url, data=payload)
                response.raise_for_status()
                token_data = response.json()
                self.access_token = token_data['access_token']
                self.refresh_token = token_data.get('refresh_token', self.refresh_token) # 새 refresh token으로 업데이트
                expires_in = token_data.get('expires_in', 3600)
                self.token_expires_at = time.time() + expires_in
                print(f"OpenEMR token refreshed successfully. Expires at: {time.ctime(self.token_expires_at)}")
                return self.access_token
            except requests.exceptions.RequestException as e:
                print(f"Failed to refresh OpenEMR token: {e}. Requesting new token via Password Grant.")
                self.access_token = None # 기존 토큰 무효화
                self.refresh_token = None # 기존 리프레시 토큰 무효화


        # 새 토큰 요청 (Password Grant)
        print("Requesting new OpenEMR token using Password Grant...")
        payload = {
            'grant_type': 'password',
            'client_id': self.client_id,
            'username': self.username,
            'password': self.password,
            'scope': self.scope,
            'user_role': 'users' # OpenEMR API_README.md의 Password Grant 예시 참조
        }
        print(f"OpenEMR Token Request Payload (Password Grant): {payload}")
        try:
            response = requests.post(self.token_url, data=payload)
            response.raise_for_status()
            token_data = response.json()
            self.access_token = token_data['access_token']
            self.refresh_token = token_data.get('refresh_token') # offline_access 스코프 사용 시 반환될 수 있음
            expires_in = token_data.get('expires_in', 3600)
            self.token_expires_at = time.time() + expires_in
            print(f"New OpenEMR token obtained successfully via Password Grant. Expires at: {time.ctime(self.token_expires_at)}")
            return self.access_token
        except requests.exceptions.RequestException as e:
            error_message = f"Failed to obtain OpenEMR token via Password Grant: {e}"
            if e.response is not None:
                error_message += f"\nResponse status: {e.response.status_code}"
                error_message += f"\nResponse content: {e.response.text}"
            print(error_message)
            raise Exception(f"OpenEMR Authentication Failed (Password Grant): {e}")

    def _make_api_request(self, method, endpoint, **kwargs):
        token = self._get_access_token()
        headers = kwargs.pop('headers', {})
        headers['Authorization'] = f'Bearer {token}'
        url = f"{self.base_url.rstrip('/')}{endpoint}"
        print(f"Making OpenEMR API request: {method} {url}")
        try:
            response = requests.request(method, url, headers=headers, **kwargs)
            response.raise_for_status()
            if response.status_code == 204: return None
            if response.content:
                content_type = response.headers.get('Content-Type', '')
                if 'application/json' in content_type or 'application/fhir+json' in content_type:
                    return response.json()
                return response.content
            return None
        except requests.exceptions.RequestException as e:
            error_message = f"OpenEMR API Error: {e} (URL: {url})"
            if e.response is not None:
                error_message += f"\nResponse status: {e.response.status_code}"
                error_message += f"\nResponse content: {e.response.text}"
            print(error_message)
            raise

    def get_patient_details_by_id(self, openemr_patient_puuid):
        """OpenEMR 표준 API를 사용하여 특정 환자 정보를 가져옵니다."""
        endpoint = f'/api/patient/{openemr_patient_puuid}'
        return self._make_api_request('GET', endpoint)
    
    # --- 새로운 환자 생성 메소드 ---
    def create_patient(self, patient_payload):
        """
        OpenEMR에 새로운 환자를 생성합니다.
        patient_payload는 API가 요구하는 형식의 딕셔너리여야 합니다.
        """
        # OpenEMR API 문서 기준: POST /api/patient
        endpoint = '/api/patient'
        print(f"Attempting to create a new patient in OpenEMR with payload: {patient_payload}")
        # _make_api_request 메소드를 사용하여 POST 요청 전송 (JSON 형식의 본문)
        return self._make_api_request('POST', endpoint, json=patient_payload)
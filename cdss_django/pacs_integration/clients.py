
import requests
from django.conf import settings
import time
from requests.auth import HTTPBasicAuth
import logging

logger = logging.getLogger(__name__)

class OpenEMRClient:
    def __init__(self):
        self.base_url = settings.OPENEMR_API_BASE_URL
        self.fhir_base_url = f"{self.base_url}/fhir" # FHIR API를 위한 새로운 기본 URL 추가
        self.token_url = settings.OPENEMR_TOKEN_URL
        self.client_id = settings.OPENEMR_CLIENT_ID
        self.username = settings.OPENEMR_API_USERNAME
        self.password = settings.OPENEMR_API_PASSWORD
        self.scope = settings.OPENEMR_API_SCOPE
        self.access_token = None
        self.token_expires_at = 0
        self.refresh_token = None

    def _is_token_expired(self):
        return time.time() >= self.token_expires_at - 60

    def _get_access_token(self):
        if self.access_token and not self._is_token_expired():
            return self.access_token

        logger.info("Requesting new OpenEMR token using Password Grant...")
        payload = {
            'grant_type': 'password',
            'client_id': self.client_id,
            'username': self.username,
            'password': self.password,
            'scope': self.scope,
            'user_role': 'users'
        }
        try:
            response = requests.post(self.token_url, data=payload)
            response.raise_for_status()
            token_data = response.json()
            self.access_token = token_data['access_token']
            self.refresh_token = token_data.get('refresh_token')
            expires_in = token_data.get('expires_in', 3600)
            self.token_expires_at = time.time() + expires_in
            logger.info("New OpenEMR token obtained successfully.")
            return self.access_token
        except requests.exceptions.RequestException as e:
            error_message = f"Failed to obtain OpenEMR token: {e}"
            if e.response is not None:
                error_message += f"\nResponse: {e.response.status_code} {e.response.text}"
            logger.error(error_message)
            raise Exception("OpenEMR Authentication Failed.")

    def _make_api_request(self, method, endpoint, **kwargs):
        token = self._get_access_token()
        headers = kwargs.pop('headers', {})
        headers['Authorization'] = f'Bearer {token}'
        
        is_fhir = kwargs.pop('is_fhir', False) # 새로운 매개변수: FHIR 요청인지 여부
        base_url = self.fhir_base_url if is_fhir else self.base_url # FHIR 요청이면 FHIR 기본 URL 사용
        
        url = f"{base_url.rstrip('/')}{endpoint}"
        
        # FHIR 요청에 대한 헤더 조정
        if is_fhir:
            headers['Accept'] = 'application/fhir+json'
            if method.upper() == 'POST' or method.upper() == 'PUT':
                headers['Content-Type'] = 'application/fhir+json'
        else: # 표준 API 요청에 대한 헤더 (기본값)
            headers['Accept'] = 'application/json'
            if method.upper() == 'POST' or method.upper() == 'PUT':
                headers['Content-Type'] = 'application/json'

        try:
            response = requests.request(method, url, headers=headers, **kwargs)
            response.raise_for_status()
            if response.status_code == 204 or not response.content:
                return None
            return response.json()
        except requests.exceptions.RequestException as e:
            error_message = f"OpenEMR API Error: {method} {url} - {e}"
            if e.response is not None:
                error_message += f"\nResponse: {e.response.status_code} {e.response.text}"
            logger.error(error_message)
            raise

    def get_patient_details_by_id(self, openemr_patient_uuid):
        """OpenEMR 표준 API를 사용하여 특정 환자 정보를 가져옵니다. 이 함수는 OpenEMR의 내부 UUID를 기대합니다."""
        endpoint = f'/api/patient/{openemr_patient_uuid}'
        return self._make_api_request('GET', endpoint, is_fhir=False) # FHIR 아님

    def get_patient_by_pubpid_fhir(self, pubpid):
        """OpenEMR FHIR API를 사용하여 Public Patient ID (pubpid)로 환자를 검색합니다."""
        endpoint = '/Patient' # FHIR Patient 엔드포인트
        params = {'identifier': pubpid} # FHIR identifier로 검색
        
        fhir_bundle = self._make_api_request('GET', endpoint, params=params, is_fhir=True) # is_fhir=True로 호출
        
        patients = []
        if fhir_bundle and fhir_bundle.get("entry"):
            for entry in fhir_bundle["entry"]:
                resource = entry.get("resource")
                if resource and resource.get("resourceType") == "Patient":
                    patients.append(resource)
        return patients # FHIR Patient 리소스 목록 반환

    def create_patient(self, patient_payload):
        """OpenEMR에 새로운 환자를 생성합니다."""
        endpoint = '/api/patient'
        logger.info(f"Creating new patient in OpenEMR with payload: {patient_payload}")
        return self._make_api_request('POST', endpoint, json=patient_payload, is_fhir=False) # FHIR 아님


class OrthancClient:
    def __init__(self):
        self.base_url = settings.ORTHANC_SERVER_URL
        self.auth = HTTPBasicAuth(settings.ORTHANC_USERNAME, settings.ORTHANC_PASSWORD) if settings.ORTHANC_USERNAME else None

    def _request(self, method, endpoint, **kwargs):
        url = f"{self.base_url.rstrip('/')}{endpoint}"
        kwargs.setdefault('auth', self.auth)
        try:
            response = requests.request(method, url, **kwargs)
            response.raise_for_status()
            if not response.content:
                return None
            if 'application/json' in response.headers.get('Content-Type', ''):
                return response.json()
            return response.content
        except requests.exceptions.RequestException as e:
            logger.error(f"Orthanc API Error: {e}")
            raise

    def upload_dicom_instance(self, dicom_file_path):
        """DICOM 인스턴스 파일을 Orthanc에 업로드합니다."""
        with open(dicom_file_path, 'rb') as f:
            headers = {'Content-Type': 'application/dicom'}
            return self._request('POST', '/instances', data=f, headers=headers)

    def find_studies_by_dicom_patient_id(self, dicom_patient_id):
        """DICOM PatientID 태그 값으로 Study들을 검색합니다."""
        query = {"Level": "Study", "Query": {"PatientID": dicom_patient_id}, "Expand": True}
        return self._request('POST', '/tools/find', json=query)

    def download_dicom_instance(self, instance_uid):
        """Instance UID로 DICOM 파일을 다운로드합니다."""
        return self._request('GET', f'/instances/{instance_uid}/file')

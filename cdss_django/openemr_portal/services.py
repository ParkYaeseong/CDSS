# openemr_portal/services.py
import requests
from django.conf import settings
from django.core.cache import caches
import logging

logger = logging.getLogger(__name__)

class OpenEMRPortalService:
    """OpenEMR 환자 포털 API 전용 서비스"""
    
    def __init__(self):
        self.base_url = settings.OPENEMR_BASE_URL
        self.portal_api_url = settings.OPENEMR_PORTAL_API_BASE_URL
        self.client_id = settings.OPENEMR_CLIENT_ID
        self.client_secret = settings.OPENEMR_CLIENT_SECRET
        self.portal_scopes = settings.OPENEMR_PORTAL_SCOPES
        self.cache = caches['openemr_portal']
    
    def authenticate_patient(self, username, password, email):
        """환자 포털 인증"""
        cache_key = f"portal_token_{username}"
        cached_token = self.cache.get(cache_key)
        
        if cached_token:
            return cached_token
        
        token_url = f"{self.base_url}/oauth2/default/token"
        
        payload = {
            'grant_type': 'password',
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'user_role': 'patient',
            'username': username,
            'password': password,
            'email': email,
            'scope': self.portal_scopes
        }
        
        try:
            response = requests.post(token_url, data=payload)
            if response.status_code == 200:
                token_data = response.json()
                self.cache.set(cache_key, token_data, timeout=3000)
                return token_data
            else:
                logger.error(f"OpenEMR 포털 인증 실패: {response.text}")
                return None
        except Exception as e:
            logger.error(f"OpenEMR 포털 인증 오류: {e}")
            return None
    
    def get_patient_data(self, patient_id, access_token):
        """환자 정보 조회"""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        url = f"{self.portal_api_url}/patient/{patient_id}"
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"환자 정보 조회 실패: {response.text}")
                return None
        except Exception as e:
            logger.error(f"환자 정보 조회 오류: {e}")
            return None
    
    def get_patient_encounters(self, patient_id, access_token):
        """환자 진료 기록 조회"""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        url = f"{self.portal_api_url}/patient/{patient_id}/encounter"
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"진료 기록 조회 실패: {response.text}")
                return None
        except Exception as e:
            logger.error(f"진료 기록 조회 오류: {e}")
            return None
    
    def get_patient_appointments(self, patient_id, access_token):
        """환자 예약 정보 조회"""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        url = f"{self.portal_api_url}/patient/{patient_id}/appointment"
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"예약 정보 조회 실패: {response.text}")
                return None
        except Exception as e:
            logger.error(f"예약 정보 조회 오류: {e}")
            return None

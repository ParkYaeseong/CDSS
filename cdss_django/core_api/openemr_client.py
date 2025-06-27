# core_api/openemr_client.py
import requests
import time
from django.conf import settings # Django 설정에서 값 가져오기

# settings.py 에 다음 값들이 정의되어 있다고 가정합니다.
# OPENEMR_TOKEN_URL = "https://<your_openemr_url>/oauth2/default/token"
# OPENEMR_CLIENT_ID = "your_client_id_from_openemr_registration"
# OPENEMR_CLIENT_SECRET = "your_client_secret_from_openemr_registration"
# OPENEMR_SCOPES = "openid api:oemr user/patient.read user/patient.write api:fhir patient/Patient.read patient/Observation.read" # 필요한 스코프들

_access_token_cache = {
    "token": None,
    "expires_at": 0
}

def get_openemr_access_token():
    """
    OpenEMR API 접근을 위한 OAuth 2.0 Client Credentials Grant 액세스 토큰을 가져옵니다.
    토큰을 캐싱하고 만료 시 새로 발급받습니다.
    """
    global _access_token_cache

    # 현재 시간과 토큰 만료 시간 비교 (만료 60초 전 갱신)
    if _access_token_cache["token"] and _access_token_cache["expires_at"] > time.time() + 60:
        return _access_token_cache["token"]

    payload = {
        'grant_type': 'client_credentials',
        'client_id': settings.OPENEMR_CLIENT_ID,
        'client_secret': settings.OPENEMR_CLIENT_SECRET,
        'scope': settings.OPENEMR_SCOPES
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    try:
        print(f"Requesting OpenEMR token from: {settings.OPENEMR_TOKEN_URL}") # 디버깅용
        response = requests.post(settings.OPENEMR_TOKEN_URL, data=payload, headers=headers, timeout=10,verify=False)
        response.raise_for_status() # 오류가 있으면 예외 발생
        token_data = response.json()
        
        _access_token_cache["token"] = token_data.get("access_token")
        # expires_in은 초 단위
        _access_token_cache["expires_at"] = time.time() + token_data.get("expires_in", 3600) 
        
        print("OpenEMR Access Token 발급/갱신 성공") # 디버깅용
        return _access_token_cache["token"]
    except requests.exceptions.RequestException as e:
        print(f"OpenEMR Access Token 발급 오류: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"응답 코드: {e.response.status_code}, 내용: {e.response.text}")
        _access_token_cache["token"] = None # 실패 시 캐시 초기화
        _access_token_cache["expires_at"] = 0
        return None
    except Exception as e:
        print(f"OpenEMR Access Token 처리 중 알 수 없는 오류: {e}")
        _access_token_cache["token"] = None
        _access_token_cache["expires_at"] = 0
        return None

def _make_openemr_api_request(method, endpoint_path, params=None, json_data=None, use_fhir_endpoint=False):
    """
    OpenEMR API에 실제 요청을 보내는 내부 헬퍼 함수
    """
    access_token = get_openemr_access_token()
    if not access_token:
        raise Exception("OpenEMR API 접근 토큰을 얻을 수 없습니다.")

    base_url = settings.OPENEMR_FHIR_API_ENDPOINT if use_fhir_endpoint else settings.OPENEMR_STANDARD_API_ENDPOINT
    url = f"{base_url}{endpoint_path}"
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json' # FHIR의 경우 application/fhir+json
    }
    if use_fhir_endpoint:
        headers['Accept'] = 'application/fhir+json'
    
    if method.upper() == 'POST' or method.upper() == 'PUT':
        headers['Content-Type'] = 'application/json' # FHIR의 경우 application/fhir+json
        if use_fhir_endpoint:
            headers['Content-Type'] = 'application/fhir+json'


    print(f"OpenEMR API 요청: {method.upper()} {url}") # 디버깅
    if params: print(f"Params: {params}")
    if json_data: print(f"JSON Data: {json_data}")

    try:
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers, params=params, timeout=15, verify=False)
        elif method.upper() == 'POST':
            response = requests.post(url, headers=headers, json=json_data, timeout=15, verify=False)
        # TODO: PUT, DELETE 등 다른 메소드 추가
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        response.raise_for_status() # HTTP 오류 발생 시 예외 처리
        
        if response.status_code == 204: # No Content
            return None 
        return response.json()
    except requests.exceptions.HTTPError as http_err:
        print(f"OpenEMR API HTTP 오류 발생: {http_err}")
        print(f"응답 코드: {http_err.response.status_code}, 내용: {http_err.response.text}")
        raise # 오류를 view에서 처리하도록 다시 발생
    except requests.exceptions.RequestException as e:
        print(f"OpenEMR API 요청 중 오류 발생: {e}")
        raise
    except ValueError: # JSON 디코딩 실패 등
        print(f"OpenEMR API 응답 처리 중 오류 발생. 응답 내용: {response.text if 'response' in locals() else 'N/A'}")
        raise

# core_api/openemr_client.py 에 이어서...

def get_patients(params=None):
    """
    OpenEMR에서 환자 목록을 가져옵니다. (FHIR Patient 리소스 검색 활용)
    params: 검색 필터 (예: {'family': '홍', 'given': '길동'})
            OpenEMR FHIR API가 지원하는 검색 파라미터 사용.
    """
    # FHIR Patient 검색 엔드포인트. OpenEMR 문서에서 정확한 경로 확인 필요.
    # 예시: /Patient?family=Doe&given=John
    endpoint_path = "/Patient" 
    
    # view에서 받은 params를 FHIR 검색 파라미터로 변환 (필요시)
    # 예를 들어, view에서 'fname', 'lname'으로 받았다면 FHIR의 'given', 'family'로 매핑
    fhir_params = {}
    if params:
        if 'fname' in params:
            fhir_params['given'] = params['fname']
        if 'lname' in params:
            fhir_params['family'] = params['lname']
        # 다른 필요한 파라미터들도 동일하게 매핑
        # 예: fhir_params['_id'] = params.get('id')

    try:
        fhir_bundle = _make_openemr_api_request('GET', endpoint_path, params=fhir_params, use_fhir_endpoint=True)
        
        patients = []
        if fhir_bundle and fhir_bundle.get("entry"):
            for entry in fhir_bundle["entry"]:
                resource = entry.get("resource")
                if resource and resource.get("resourceType") == "Patient":
                    # 필요한 정보만 추출하여 간결한 형태로 가공
                    name_data = resource.get("name", [{}])[0] # 첫 번째 이름 사용
                    patient_info = {
                        "id": resource.get("id"),
                        "lastName": name_data.get("family"),
                        "firstName": " ".join(name_data.get("given", [])),
                        "gender": resource.get("gender"),
                        "birthDate": resource.get("birthDate")
                    }
                    patients.append(patient_info)
        return patients
    except Exception as e:
        # 오류는 _make_openemr_api_request 에서 이미 로깅되었을 것이므로,
        # 여기서는 view로 예외를 전달하거나 특정 처리를 할 수 있습니다.
        print(f"get_patients 함수에서 오류: {e}")
        return {"error": f"OpenEMR 환자 정보 조회 실패: {e}"}


def create_patient(patient_data_from_view):
    """
    OpenEMR에 새 환자를 생성합니다. (FHIR Patient 리소스 생성 활용)
    patient_data_from_view: view에서 받은 환자 생성 정보 딕셔너리
    """
    # view에서 받은 데이터를 FHIR Patient 리소스 형식으로 변환
    # 이 부분은 OpenEMR이 요구하는 최소/필수 Patient 필드에 맞춰야 합니다.
    fhir_patient_resource = {
        "resourceType": "Patient",
        "name": [{
            "use": "official",
            "family": patient_data_from_view.get("lastName"), # view에서 'lastName'으로 전달한다고 가정
            "given": [patient_data_from_view.get("firstName")] # view에서 'firstName'으로 전달한다고 가정
        }],
        "gender": patient_data_from_view.get("gender", "unknown").lower(), # 예: Male -> male
        "birthDate": patient_data_from_view.get("dob") # view에서 'dob'로 전달한다고 가정
        # TODO: OpenEMR에 환자 생성 시 필요한 식별자(identifier) 등 추가 필드 구성
    }

    try:
        # FHIR Patient 생성 엔드포인트
        created_resource = _make_openemr_api_request('POST', '/Patient', json_data=fhir_patient_resource, use_fhir_endpoint=True)
        
        if created_resource and created_resource.get("id"):
            return {"id": created_resource.get("id"), "status": "created", "message": "환자 생성 성공"}
        else:
            # 성공했으나 응답 형식이 예상과 다를 경우
            return {"status": "success_unknown_response", "response": created_resource}
            
    except Exception as e:
        print(f"create_patient 함수에서 오류: {e}")
        # HTTP 오류의 경우 _make_openemr_api_request에서 이미 로깅 및 예외 발생 시킴.
        # view에서 이 예외를 잡아서 적절한 HTTP 응답을 반환해야 함.
        # 여기서는 오류 정보를 포함한 딕셔너리를 반환하거나, 예외를 그대로 전달할 수 있음.
        # view의 try-except 블록에서 이 오류를 처리하게 됩니다.
        # 예를 들어, response.text 에 상세 오류가 담겨있을 수 있습니다.
        error_detail = str(e)
        if hasattr(e, 'response') and e.response is not None and hasattr(e.response, 'text'):
            error_detail = e.response.text
        return {"error": f"OpenEMR 환자 생성 실패: {error_detail}"}

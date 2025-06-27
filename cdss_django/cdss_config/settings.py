# cdss_config/settings.py
from pathlib import Path
import os
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '6vjwa-o&g-sk-zn57v*z9(m8__fsf9#v(bt)yag=pt(f428fjx'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['35.188.47.40', 'localhost', '127.0.0.1', 'testserver']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'core_api',
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'drf_yasg',
    'accounts',
    'pacs_integration',
    'paper_search.apps.PaperSearchConfig',
    'ai_chatbot.apps.AiChatbotConfig',
    'patients',
    'omics.apps.OmicsConfig',
    'diagnosis',
    'lis_integration',
    'django_filters',
    'drug_checker',
    'clinical_prediction',
    # flutter apps
    'hospital_search',
    'emergency_service',
    'pharmacy_service',
    'flutter_api',
    'appointment_service',      # 새로 추가
    'message_service',         # 새로 추가
    'medical_records_service', # 새로 추가
    'simple_auth',
#    'rest_framework_simplejwt.token_blacklist',
]

# OpenEMR 관련 앱들을 조건부로 추가 (새로 추가)
OPENEMR_INTEGRATION_ENABLED = True  # 기본값: 활성화
if OPENEMR_INTEGRATION_ENABLED:
    INSTALLED_APPS.append('openemr_portal')

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'core_api.middleware.RequestLoggingMiddleware',  # ✅ 추가
]

ROOT_URLCONF = 'cdss_config.urls'

# 공공 API 키 설정
HOSPITAL_API_KEY = "1h0IjZOCo24vruj0pTxWN8RXhCM5oS3UmA5amqqNKVe7PSw+T/d5tiTPglyfLoK52AWWm8bRqG+MXZswNkuExQ=="
EMERGENCY_API_KEY = "1h0IjZOCo24vruj0pTxWN8RXhCM5oS3UmA5amqqNKVe7PSw+T/d5tiTPglyfLoK52AWWm8bRqG+MXZswNkuExQ==" 
PHARMACY_API_KEY = "1h0IjZOCo24vruj0pTxWN8RXhCM5oS3UmA5amqqNKVe7PSw+T/d5tiTPglyfLoK52AWWm8bRqG+MXZswNkuExQ=="

# CORS 설정
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000", # React 기본 개발 서버 주소
    "http://127.0.0.1:3000",
    "http://35.188.47.40",
    # Flutter 앱을 위한 추가 설정
    "http://localhost:9080",
    "http://127.0.0.1:9080",
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'cdss_config.wsgi.application'

# DDI 설정
DUR_API_BASE_URL = "https://apis.data.go.kr/1471000/DURIrdntInfoService03"
DUR_SERVICE_KEY = "k1pF1tIySoo/8IWT7az+1tqRWu2ZYcCB6TyU+0DtgW114Tp5Zh+tPBQYYsT8aY818YXZTnUNUFe1ntjEJQWcsQ=="

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'cdss_django_db',
        'USER': 'cdss_django_user',
        'PASSWORD': 'your_actual_mysql_password',
        'HOST': 'localhost',
        'PORT': '3306',
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
        },
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'ko-kr'
TIME_ZONE = 'Asia/Seoul'
USE_I18N = True
USE_TZ = False

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    )
}

# Simple JWT 설정
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# OpenEMR 설정들을 조건부로 로드 (새로 추가)
if OPENEMR_INTEGRATION_ENABLED:
    OPENEMR_BASE_URL = "https://cdssb1a4.duckdns.org"
    OPENEMR_SITE_ID = "default"
    OPENEMR_CLIENT_ID = "5SFEMC_EaZPF4u1paAgtNK79ywwT97gxrSNs75pJSKU"
    OPENEMR_CLIENT_SECRET = "Itnx7D9NBvo-xDc5DS3oEt8aKzzJJ2ytzyfKQTKvv1KefDtZMRCqs1UClUCKbCmHT4_qsscAsC5a__Kl6fSxLg"
    OPENEMR_TOKEN_URL = f"{OPENEMR_BASE_URL}/oauth2/{OPENEMR_SITE_ID}/token"
    OPENEMR_API_BASE_URL = f"{OPENEMR_BASE_URL}/apis/{OPENEMR_SITE_ID}"
    OPENEMR_API_USERNAME = 'parkparkpark'
    OPENEMR_API_PASSWORD = 'parkparkbeayanji0526'
    OPENEMR_API_SCOPE = 'openid offline_access api:oemr user/patient.read user/patient.write user/encounter.read user/practitioner.read'
    OPENEMR_PORTAL_API_BASE_URL = f"{OPENEMR_BASE_URL}/apis/{OPENEMR_SITE_ID}/portal"
    OPENEMR_PORTAL_CLIENT_ID = "xKw5dUpXMi-6TG0atSNREdtWYRgJTeGpzoyc9JFfcRw"
    OPENEMR_PORTAL_SECRET = "Q5UAdNIpsPQBbZ_KykT9BM72uaYQ_e7ybSbLo01gxzNbru7Mk3VXtBKK2ctrvVDTlIaxKgtMa38alqjFlY0t2g"
    OPENEMR_PORTAL_SCOPES = "api:port patient/patient.read patient/encounter.read patient/appointment.read"
else:
    # OpenEMR 비활성화 시 기본값들
    OPENEMR_BASE_URL = None
    OPENEMR_CLIENT_ID = None
    OPENEMR_CLIENT_SECRET = None

# ORTHANC 설정
ORTHANC_SERVER_URL = 'http://127.0.0.1:8042'
ORTHANC_USERNAME = 'orthanc'
ORTHANC_PASSWORD = 'orthanc'

# LIS 서버 설정
LIS_SERVER_URL = "http://localhost:8115"
LIS_API_TIMEOUT = 30
LIS_API_AUTH_TOKEN = '4dfb4f6cec86338c5f1793b0bf82d8f44836ff10'

# AI 서비스 API 키 설정
GEMINI_API_KEY = "AIzaSyAdDn-mSKbjmVZJ-FHhabvWk9XdgU1jONI"

# CELERY SETTINGS
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# 캐시 설정 (OpenEMR 포털 전용 캐시 추가)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://localhost:6379/0',
    },
    'openemr_portal': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://localhost:6379/1',
        'KEY_PREFIX': 'openemr_portal_',
    }
}

# ML 모델이 저장된 디렉토리 경로
ML_MODELS_DIR = BASE_DIR / 'ml_models'

# 오믹스 AI 모델별 필수 파일 요구사항 정의
OMICS_MODEL_REQUIREMENTS = {
    'ovarian_cancer': {
        'display_name': '난소암',
        'required_files': [
            {'type': 'CNV', 'keyword': 'cnv', 'description': '유전자 복제수 변이 데이터'},
            {'type': 'Mutation', 'keyword': 'mutation', 'description': '유전자 변이 데이터'},
        ]
    },
    'breast_cancer': {
        'display_name': '유방암',
        'required_files': [
            {'type': 'RNA-seq', 'keyword': 'rna', 'description': '유전자 발현 데이터'},
            {'type': 'Methylation', 'keyword': 'methylation', 'description': '메틸레이션 데이터'},
            {'type': 'Mutation', 'keyword': 'mutation', 'description': '유전자 변이 데이터'},
            {'type': 'CNV', 'keyword': 'cnv', 'description': '유전자 복제수 변이 데이터'},
            {'type': 'miRNA', 'keyword': 'mirna', 'description': 'miRNA 데이터'},
        ]
    },
    'stomach_cancer': {
        'display_name': '위암',
        'required_files': [
            {'type': 'CNV', 'keyword': 'cnv', 'description': '유전자 복제수 변이 데이터'},
            {'type': 'Mutation', 'keyword': 'mutation', 'description': '유전자 변이 데이터'},
        ]
    },
    'kidney_cancer': {
        'display_name': '콩팥암',
        'required_files': [
            {'type': 'RNA-seq', 'keyword': 'rna', 'description': '유전자 발현 데이터'},
            {'type': 'Methylation', 'keyword': 'methylation', 'description': '메틸레이션 데이터'},
            {'type': 'Mutation', 'keyword': 'mutation', 'description': '유전자 변이 데이터'},
            {'type': 'CNV', 'keyword': 'cnv', 'description': '유전자 복제수 변이 데이터'},
            {'type': 'miRNA', 'keyword': 'mirna', 'description': 'miRNA 데이터'},
        ]
    },
    'lung_cancer': {
        'display_name': '폐암',
        'required_files': [
            {'type': 'RNA-seq', 'keyword': 'rna', 'description': '유전자 발현 데이터'},
            {'type': 'Mutation', 'keyword': 'mutation', 'description': '유전자 변이 데이터'},
            {'type': 'CNV', 'keyword': 'cnv', 'description': '유전자 복제수 변이 데이터'},
            {'type': 'miRNA', 'keyword': 'mirna', 'description': 'miRNA 데이터'},
        ]
    },
    'liver_cancer': {
        'display_name': '간암',
        'required_files': [
            {'type': 'RNA-seq', 'keyword': 'rna', 'description': '유전자 발현 데이터'},
            {'type': 'Methylation', 'keyword': 'methylation', 'description': '메틸레이션 데이터'},
            {'type': 'Mutation', 'keyword': 'mutation', 'description': '유전자 변이 데이터'},
            {'type': 'CNV', 'keyword': 'cnv', 'description': '유전자 복제수 변이 데이터'},
            {'type': 'miRNA', 'keyword': 'mirna', 'description': 'miRNA 데이터'},
        ]
    },

    'pancreatic_cancer': {
        'display_name': '췌장암',
        'required_files': [
            {'type': 'Clinic', 'keyword': 'clinic', 'description': '임상 정보 파일'},
            {'type': 'CNV', 'keyword': 'cnv', 'description': '유전자 복제수 변이 데이터'},
            {'type': 'RNA-seq', 'keyword': 'rna', 'description': '유전자 발현 데이터'},
        ]
    },
}

# CORS 설정
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

AUTH_USER_MODEL = 'accounts.User'

# 미디어 파일 설정
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DATA_UPLOAD_MAX_NUMBER_FILES = 5000

# ===================================================================
# 로깅 설정 (이 부분을 추가합니다)
# ===================================================================
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': { # 콘솔 로깅
            'level': 'INFO', # INFO 레벨 이상의 로그를 콘솔로 출력
            'class': 'logging.StreamHandler',
            'formatter': 'simple', # 간단한 형식으로 출력
        },
        'file': { # 파일 로깅
            'level': 'INFO', # INFO 레벨 이상의 로그를 파일로 저장
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'django_debug.log', # <--- 로그 파일 경로
            'maxBytes': 1024*1024*5, # 5 MB
            'backupCount': 5,
            'formatter': 'verbose', # 자세한 형식으로 저장
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'], # Django 자체 로그를 콘솔과 파일 모두에
            'level': 'INFO', # Django 로그 레벨
            'propagate': False,
        },
        'omics': { # omics 앱에서 발생하는 로그를 별도로 관리
            'handlers': ['console', 'file'], # omics 앱 로그를 콘솔과 파일 모두에
            'level': 'INFO', # omics 앱의 로그 레벨
            'propagate': False,
        },
        '': { # 루트 로거 (다른 모든 로거들이 기본적으로 따름)
            'handlers': ['console', 'file'], # 모든 로그를 콘솔과 파일 모두에
            'level': 'INFO',
        },
    }
}
# ===================================================================

# Redis Broker 연결 유지를 위한 설정
# 주기적으로 연결 상태를 확인하여 유휴 시간으로 연결이 끊기는 것을 방지
broker_transport_options = {
    'health_check_interval': 120,  # 120초(2분)마다 연결 상태 체크
}
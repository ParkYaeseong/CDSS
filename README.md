````markdown
# 🏥 MEORING CDSS (Clinical Decision Support System)

## ✨ 프로젝트 소개

**MEORING CDSS**는 의료 데이터 속에 숨겨진 '의미(Meaning)'를 찾아내어 암 조기 진단 및 정밀 의료 분야에 혁신을 가져오는 AI 기반 임상 의사 결정 지원 시스템입니다. 저희는 환자의 임상 정보, 고해상도 CT 영상, 유전체/단백체 등 다중 오믹스 데이터를 유기적으로 통합 분석하여 의료진에게 가장 정확한 진단과 최적의 치료 기회를 제공하는 것을 목표로 합니다.

**MEORING (Medical Enhanced Omics Real-time Integrated Navigation Guidance)**
* **M**edical: 의료 현장과 환자 중심의 가치를 담은
* **E**nhanced: 최신 AI 기술로 고도화된 분석 능력
* **O**mics: 오믹스 데이터를 포함한 다차원 데이터
* **R**eal-time: 신속하고 실시간에 가까운 정보 제공
* **I**ntegrated: 분절된 데이터를 통합하여 종합적인 인사이트 제공
* **N**avigation: 의료진의 복잡한 의사결정을 위한 명확한 길잡이 역할
* **G**uidance: 정확한 진단과 치료를 위한 지능형 지원

## 🚀 주요 기능

* **다중 모달 데이터 통합 분석**: 오믹스(유전체, 단백질, 돌연변이, 복제수 변이, DNA 메틸화), CT 영상, 임상 데이터를 통합하여 포괄적인 환자 분석.
* **AI 기반 정밀 진단 및 예측**: 암 위험도 분류, 생존율 예측, 치료 효과 예측, 암종 분류 (유방암, 간암, 위암, 신장암, 난소암 등).
* **설명 가능한 AI (XAI)**: SHAP 분석 및 특성 중요도(Feature Importance)를 통해 AI 예측의 근거를 시각적으로 제시하여 의료진의 신뢰도 향상.
* **CT 영상 자동 분할 및 3D 시각화**: CT 영상 내 종양 및 장기 자동 분할, 3D 모델 시각화 및 부피 측정.
* **스마트 의료 워크플로우**: 환자 접수 및 예약 관리, AI 간호일지 자동 생성, 약물 상호작용(DDI) 검사, 최신 논문 검색 및 요약.
* **의료진-환자 협업 및 소통**: 의료진 간 1:1 메시징, 환자용 모바일 앱 (예약, 메시지, 병원 검색).
* **외부 시스템 연동**: OpenEMR, PACS(Orthanc), LIS 등 기존 병원 시스템과의 유기적인 데이터 연동.

## 🧠 기능 알고리즘 및 메커니즘 상세

MEORING CDSS는 Django 기반의 강력한 백엔드와 React/Flutter 기반의 유연한 프론트엔드로 구성되며, 각 모듈은 유기적으로 연결되어 정밀 의료 워크플로우를 지원합니다.

### 1. **전체 시스템 아키텍처 (메커니즘 개요)**

CDSS는 다계층 아키텍처로 설계되어 프론트엔드(React/Flutter), 백엔드 API(Django), AI/ML 서비스(Celery), 데이터베이스(MySQL), 외부 시스템 통합의 주요 구성 요소로 나뉩니다.

* **Frontend (React/Flutter)**: 사용자 인터페이스를 제공하며, 백엔드 API와 비동기적으로 통신합니다. 사용자 역할(의사, 간호사, 영상의학과, 원무과, 환자)에 따라 맞춤형 대시보드와 기능을 제공합니다.
* **Backend API (Django REST Framework)**: 모든 데이터 처리, 비즈니스 로직, AI 모델 연동 및 외부 시스템과의 통신을 담당하는 중앙 허브입니다. JWT 기반 인증 및 권한 관리를 수행합니다.
* **AI/ML Services (Celery & Redis)**: AI 모델 추론, 오믹스 데이터 파이프라인, CT 영상 분할 등 시간이 오래 걸리는 복잡한 분석 작업을 비동기적으로 처리합니다. Celery는 작업을 스케줄링하고 Redis는 메시지 브로커 역할을 합니다.
* **Database (MySQL)**: 모든 사용자 정보, 환자 데이터, 진료 기록, 분석 요청/결과, 메시지 등 핵심 데이터를 저장합니다.
* **External Integrations**: OpenEMR (EMR), Orthanc (PACS), LIS (검사 결과), 공공 데이터 포털 (DUR, 병원 검색), Google Gemini API (챗봇) 등 다양한 외부 시스템과 연동하여 데이터 확장 및 서비스 연계를 가능하게 합니다.

### 2. **핵심 모듈별 기능 알고리즘 및 메커니즘**

#### 2.1. **사용자 및 환자 관리**

* **목적**: 다양한 사용자 역할(환자, 의사, 간호사, 원무과, 관리자 등)의 인증, 프로필 관리 및 환자 정보 연동.
* **백엔드 (Django `accounts` 앱)**:
    * `User` 모델: 일반 사용자 정보 및 `user_type` (환자, 의사 등) 관리. `AbstractUser`를 상속하여 Django의 기본 인증 시스템 활용.
    * `Patient` 모델: 병원 시스템 내 환자 프로필.
    * `FlutterPatient` 모델: 모바일 앱(Flutter) 사용자 프로필. `linked_patient` 필드를 통해 기존 `Patient`와 연결.
    * `MedicalStaff` 모델: 의료진(의사, 간호사, 원무과 등) 프로필.
    * **메커니즘**:
        * **회원가입**: `accounts/views.py`의 `UserRegistrationSerializer`, `FlutterPatientRegistrationSerializer`, `MedicalStaffRegistrationSerializer`를 통해 각 역할에 맞는 계정 생성.
        * **모바일 앱 연동**: 원무과 직원이 `Patient`에게 `mobile_verification_code`를 발급하고, Flutter 앱 사용자는 이 코드로 기존 환자 프로필과 자신의 앱 계정을 연결합니다.
        * **권한 부여**: 로그인 시 `User.user_type`에 따라 프론트엔드(`AuthContext.jsx`)에서 접근 가능한 페이지와 기능이 결정됩니다.

#### 2.2. **임상 예측 분석**

* **목적**: 환자의 임상 데이터를 기반으로 암 위험도, 생존율, 치료 효과를 AI로 예측하고 설명 가능한 근거 제시.
* **백엔드 (Django `clinical_prediction` 앱)**:
    * `prediction_service.py`:
        * **알고리즘**: 간암(LIHC), 신장암(KIRC), 위암(STAD)에 대해 GBSA, XGBoost, LightGBM, Random Survival Forest, Random Forest 등 다양한 머신러닝 모델 사용.
        * **데이터 전처리**: 결측치 처리, 정규화, 스케일링 등 임상 데이터에 특화된 전처리 수행.
        * **XAI (설명 가능한 AI)**: 예측 결과에 대한 SHAP 값 및 특성 중요도 계산 및 제공.
    * **메커니즘**:
        * 프론트엔드(`ClinicalPredictionPage.jsx`)에서 환자 선택 및 예측 유형(위험도, 생존율, 치료 효과) 선택 후 분석 요청.
        * `PredictionAPI.js`를 통해 백엔드의 `clinical_prediction/views.py`로 데이터 전송.
        * `prediction_service.py`에서 저장된 모델을 로드하여 예측을 수행하고 XAI 결과를 생성.
        * 결과는 `PredictionResults.jsx`에서 게이지 바, 테이블 등으로 시각화.

#### 2.3. **CT 영상 진단 및 분석**

* **목적**: CT 영상에서 종양 및 장기 자동 분할, 3D 시각화 및 정밀 분석 지원.
* **백엔드 (Django `diagnosis` 앱, `pacs_integration` 모듈)**:
    * `DiagnosisRequest`, `DiagnosisResult` 모델: CT 분석 요청 및 결과(NIfTI 파일 경로, 3D HTML 뷰어 경로 등) 관리.
    * **알고리즘**: 3D U-Net 등 딥러닝 기반 영상 분할 모델 활용.
    * **메커니즘**:
        * 영상의학과 전문의(`RadiologistPanel.jsx`)가 DICOM 파일 업로드.
        * `DiagnosisService.js`를 통해 백엔드 `diagnosis/views.py`로 전송.
        * 백엔드에서 DICOM → NIfTI 변환, AI 모델을 통한 종양 분할, 분할된 결과를 바탕으로 3D HTML 뷰어 생성.
        * 생성된 3D 뷰어는 `IntegratedViewer.jsx`를 통해 대시보드(`DashboardPage.jsx`)에 표시.
        * PACS(Orthanc) 연동을 통해 원본 CT 영상도 확인 가능.

#### 2.4. **오믹스 분석 파이프라인**

* **목적**: 다양한 오믹스 데이터(miRNA, Gene, Methylation 등)를 통합 분석하여 암/정상 판별 및 암종 분류.
* **백엔드 (Django `omics` 앱)**:
    * `OmicsRequest` 모델: 오믹스 분석 요청 관리.
    * **알고리즘**: 3단계 자동화 파이프라인.
        * **1단계 (병렬 스크리닝)**: 5가지 오믹스 데이터를 개별 분석하여 암 탐지 성능 확인 (miRNA, Methylation 등).
        * **2단계 (중앙 통제 및 판정)**: '암/정상' 판별 및 5가지 주요 암종(유방암, 간암, 위암 등) 분류.
        * **3단계 (특화 분석 및 XAI)**: SHAP 분석을 통해 모델 예측 근거 제시.
    * **메커니즘**:
        * 간호사(`NursePanel.jsx`)가 `OmicsAnalysis.js`를 통해 오믹스 파일 업로드 및 분석 요청.
        * `OmicsService.js`를 통해 백엔드 `omics/views.py`로 데이터 전송 및 Celery 태스크를 통한 비동기 분석 실행.
        * 분석 결과는 `OmicsResultPage.jsx` 및 의사 대시보드(`DashboardPage.jsx`)에 표시.

#### 2.5. **약물 상호작용 (DDI) 검사**

* **목적**: 처방될 약물 간의 상호작용 및 병용 금기 확인.
* **백엔드 (Django `drug_checker` 앱)**:
    * `drug_checker/clients.py`의 `DURClient`: 공공 API(DUR) 연동.
    * `Prescription` 모델: 환자 처방 내역 관리.
    * **메커니즘**:
        * 의사(`DrugInteractionComponent.js`)가 약물명 입력 후 `cdss.service.js`를 통해 DDI 검색 요청.
        * 백엔드 `drug_checker/views.py`가 `DURClient`를 통해 외부 DUR API에 질의.
        * 상호작용 정보 및 경고 메시지를 프론트엔드(`DrugInteractionCard.jsx`)로 반환.

#### 2.6. **의료진-환자 메시징 및 AI 챗봇**

* **목적**: 시스템 내에서 의료진 및 환자 간의 실시간 소통 지원.
* **백엔드 (Django `message_service`, `ai_chatbot` 앱)**:
    * `Message` 모델: 사용자 간 메시지 저장.
    * `ai_chatbot/bot_service.py`: Google Gemini API 연동.
    * **메커니즘**:
        * `FloatingMessageButton.jsx` 및 `MessageWindow.jsx`를 통해 `message.service.js`를 호출하여 메시지 송수신.
        * `FloatingChatbot.jsx` 및 `ChatWindow.jsx`를 통해 `chatbot.service.js`를 호출, 백엔드가 Google Gemini API와 연동하여 답변 생성.

#### 2.7. **간호 기록 및 관리**

* **목적**: 간호 기록 작성, 조회, AI 자동 생성 지원.
* **백엔드 (Django `nursing` 앱)**:
    * `NursingLog` 모델: 간호 기록 저장.
    * **메커니즘**:
        * `NursingLogForm.jsx`에서 간호 기록 입력. `nursingApi.js`를 통해 백엔드 `nursing/views.py`로 전송.
        * AI 간호일지 자동 생성 기능 활용 (AI 모델 연동).
        * `NursingRecordViewer.jsx`에서 간호 기록 조회.

#### 2.8. **기타 연동 및 기능**

* **논문 검색**: `PaperSearchCard.jsx`와 `paper.service.js`를 통해 외부 논문 검색 API 연동 및 요약.
* **병원/응급실/약국 검색**: `hospital_search`, `emergency_service`, `pharmacy_service` 앱을 통해 공공데이터 포털 API 연동.
* **OpenEMR/LIS 연동**: `core_api/openemr_client.py`, `lis_integration/lis_client.py`를 통해 환자 정보, 검사 결과 등 외부 EMR/LIS 데이터 연동.

## 🛠 기술 스택

### 백엔드 (Django Framework)
* **웹 프레임워크**: Django, Django REST Framework (DRF)
* **데이터베이스**: MySQL
* **비동기 처리**: Celery, Redis (Broker/Backend)
* **AI/ML 프레임워크**: PyTorch, TensorFlow
* **AI/ML 라이브러리**: scikit-learn, XGBoost, LightGBM, SHAP (설명 가능한 AI), MONAI, 3D U-Net (의료 영상 분석)
* **DICOM/NIfTI 처리**: DCMTK, SimpleITK
* **외부 API 연동**: 공공 데이터 포털 (병원/응급실/약국 검색, DUR), Google Gemini API (챗봇), OpenEMR, OpenELIS/LIS
* **API 문서화**: drf-spectacular (Swagger/ReDoc)
* **인증**: Django Simple JWT

### 프론트엔드 (React.js / Flutter Framework)
* **웹 UI 라이브러리**: React.js, Material-UI (MUI), Tailwind CSS
* **모바일 UI 프레임워크**: Flutter
* **차트/시각화**: Recharts (데이터 시각화), Niivue (의료 영상 뷰어), Plotly.js
* **상태 관리**: React Context API
* **라우팅**: React Router DOM
* **API 통신**: Axios

## ⚙️ 설치 및 실행 방법

### 사전 준비

* Python 3.9+
* Node.js 18+ & npm/yarn
* Flutter SDK (모바일 앱 개발용)
* Docker (권장: OpenEMR, Orthanc, Redis 등 외부 서비스 구축용)
* MySQL Server

### 1. 백엔드 (Django) 설정

```bash
# 1. 저장소 클론
git clone [Your_Repository_URL]
cd cdss_django

# 2. 가상 환경 생성 및 활성화
python -m venv venv
source venv/bin/activate # Linux/macOS
# venv\Scripts\activate # Windows

# 3. 필요한 패키지 설치
pip install -r requirements.txt

# 4. 데이터베이스 및 환경 변수 설정
# cdss_config/settings.py 파일에서 DATABASES 섹션의 MySQL 연결 정보 수정.
# .env 파일을 생성하여 SECRET_KEY, API 키 등 민감 정보를 관리 (예: DJANGO_API_BASE_URL, GEMINI_API_KEY, OPENEMR_CLIENT_ID 등)

# 5. 마이그레이션 실행
python manage.py makemigrations # 필요 시
python manage.py migrate accounts # accounts 앱의 Patient/MedicalStaff 모델 변경사항 반영
python manage.py migrate

# 6. 슈퍼유저 생성 (관리자 페이지 접근용)
python manage.py createsuperuser

# 7. Celery 워커 실행 (백그라운드에서 AI 분석 등 비동기 작업 처리)
# 별도의 터미널에서 실행:
celery -A cdss_config worker -l info

# 8. Django 개발 서버 실행
python manage.py runserver 0.0.0.0:8000
````

### 2\. 프론트엔드 (React) 설정

```bash
# 1. 프론트엔드 디렉토리로 이동
cd ../final_react

# 2. 패키지 설치
npm install # 또는 yarn install

# 3. 환경 변수 설정 (.env 파일 생성)
# .env 파일에 다음 내용을 추가하고 Django 백엔드 주소에 맞게 수정합니다.
REACT_APP_API_BASE_URL=http://localhost:8000 

# 4. 개발 서버 실행
npm start # 또는 yarn start
```

### 3\. Flutter 앱 설정 (선택 사항)

Flutter 앱 개발 환경 설정 및 백엔드 연동은 Flutter 공식 문서를 참조하세요.

### 4\. 외부 시스템 연동 (선택 사항)

CDSS는 OpenEMR, Orthanc PACS 등과 연동될 수 있습니다. 필요에 따라 Docker 등을 활용하여 해당 시스템들을 구축하고 Django `settings.py` 및 관련 앱 (`core_api`, `diagnosis`, `lis_integration` 등)의 설정을 업데이트해야 합니다.

  * **OpenEMR**: EMR 시스템. `core_api/openemr_client.py` 참조.
  * **Orthanc**: PACS 서버. CT 영상 데이터 처리 및 저장을 위해 연동.
  * **LIS (Laboratory Information System)**: 검사 결과 데이터 연동.

-----

```
```

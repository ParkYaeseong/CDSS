SET FOREIGN_KEY_CHECKS = 0; -- 외래 키 검사를 일시적으로 비활성화

-- Django 기본 앱 테이블들
DROP TABLE IF EXISTS django_migrations;
DROP TABLE IF EXISTS django_admin_log;
DROP TABLE IF EXISTS django_content_type;
DROP TABLE IF EXISTS django_session;
DROP TABLE IF EXISTS auth_group;
DROP TABLE IF EXISTS auth_group_permissions;
DROP TABLE IF EXISTS auth_permission;
DROP TABLE IF EXISTS auth_user;
DROP TABLE IF EXISTS auth_user_groups;
DROP TABLE IF EXISTS auth_user_user_permissions;

-- 커스텀 앱 테이블들
DROP TABLE IF EXISTS ai_chatbot_chatmessage;
DROP TABLE IF EXISTS core_api_profile;
DROP TABLE IF EXISTS diagnosis_diagnosisrequest;
DROP TABLE IF EXISTS diagnosis_diagnosisresult;
DROP TABLE IF EXISTS lis_integration_laborder; -- <<-- 이 부분을 이렇게 수정해야 합니다!
DROP TABLE IF EXISTS lis_integration_lispatientlink; -- <<-- 이 부분도 추가 (이전 show tables에 있었습니다)
DROP TABLE IF EXISTS omics_omicsdatafile;
DROP TABLE IF EXISTS omics_omicsrequest;
DROP TABLE IF EXISTS omics_omicsresult;
DROP TABLE IF EXISTS pacs_integration_openemrpatientorthanclink;
DROP TABLE IF EXISTS pacs_integration_orthancstudylog;
DROP TABLE IF EXISTS patients_patientprofile;
DROP TABLE IF EXISTS accounts_patient;
DROP TABLE IF EXISTS accounts_user;
DROP TABLE IF EXISTS accounts_user_groups;
DROP TABLE IF EXISTS accounts_user_user_permissions;
DROP TABLE IF EXISTS authtoken_token;
DROP TABLE IF EXISTS emergency_service_emergencysearchlog;
DROP TABLE IF EXISTS flutter_api_favorite;
DROP TABLE IF EXISTS flutter_api_notificationsetting;
DROP TABLE IF EXISTS hospital_search_searchlog;
DROP TABLE IF EXISTS pharmacy_service_pharmacysearchlog;
DROP TABLE IF EXISTS token_blacklist_blacklistedtoken;
DROP TABLE IF EXISTS token_blacklist_outstandingtoken;

SET FOREIGN_KEY_CHECKS = 1; -- 외래 키 검사를 다시 활성화

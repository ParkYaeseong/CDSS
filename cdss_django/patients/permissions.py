# patients/permissions.py
from rest_framework import permissions

class IsClinicalStaffUser(permissions.BasePermission):
    """
    요청을 보낸 사용자가 '의사', '간호사', '영상의학과', '원무과', '관리자' 역할 중 하나인지 확인하는 커스텀 권한
    """
    def has_permission(self, request, view):
        # 인증되지 않은 사용자는 일단 거부
        if not request.user or not request.user.is_authenticated:
            return False
        
        # ✅ 모든 의료진 및 스태프 역할 포함 (radio와 radiologist 모두 지원)
        allowed_roles = ['doctor', 'nurse', 'radio', 'radiologist', 'staff', 'admin']
        
        # 사용자의 user_type이 허용된 역할 목록에 포함되어 있으면 True를 반환
        return request.user.user_type in allowed_roles

class IsPatientUser(permissions.BasePermission):
    """
    요청을 보낸 사용자가 환자인지 확인하는 커스텀 권한
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.user_type == 'patient'

class IsDoctorUser(permissions.BasePermission):
    """
    요청을 보낸 사용자가 의사인지 확인하는 커스텀 권한
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.user_type == 'doctor'

class IsAdminUser(permissions.BasePermission):
    """
    요청을 보낸 사용자가 관리자인지 확인하는 커스텀 권한
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.user_type == 'admin' or request.user.is_staff

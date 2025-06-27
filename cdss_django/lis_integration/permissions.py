from rest_framework.permissions import BasePermission

class IsAuthenticatedViaOpenEMR(BasePermission):
    def has_permission(self, request, view):
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            # 실제 검증은 생략하고 허용
            return True
        return False

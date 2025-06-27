from django.contrib import admin
#from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
#from accounts.models import User
#from .models import Profile

# 1. Profile 모델을 User 관리 페이지에 함께 표시하기 위한 '인라인' 클래스 정의
#class ProfileInline(admin.StackedInline):
#    model = Profile
#    can_delete = False
#    verbose_name_plural = '프로필'
#    fk_name = 'user'

# 2. 기본 UserAdmin을 확장하여 ProfileInline을 포함하는 커스텀 UserAdmin 정의
#class CustomUserAdmin(BaseUserAdmin):
#    inlines = (ProfileInline,)
#    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff')

#    def get_inline_instances(self, request, obj=None):
#        if not obj:
#            return list()
#        return super(CustomUserAdmin, self).get_inline_instances(request, obj)

# 3. Profile 모델 자체도 관리자 페이지에서 별도로 볼 수 있도록 등록
#admin.site.register(Profile)

# 4. Django의 기본 User 관리자를 해제하고, 우리가 만든 커스텀 UserAdmin으로 교체
#if admin.site.is_registered(User):
#    admin.site.unregister(User)
#admin.site.register(User, CustomUserAdmin)
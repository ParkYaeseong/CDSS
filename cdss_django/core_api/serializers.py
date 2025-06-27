# core_api/serializers.py
from accounts.models import User
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'role']
    
    def get_role(self, obj):
        try:
            return obj.profile.role if hasattr(obj, 'profile') else 'unknown'
        except:
            return 'unknown'

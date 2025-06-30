# simple_auth/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import random

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_verification_code(request):
    """간단한 인증 코드 생성"""
    patient_id = request.data.get('patient_id', 'unknown')
    verification_code = ''.join(random.choices('0123456789', k=6))
    
    return Response({
        'success': True,
        'patient_id': patient_id,
        'verification_code': verification_code,
        'message': '인증 코드가 생성되었습니다.'
    })

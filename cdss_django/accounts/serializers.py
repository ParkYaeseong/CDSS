# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Patient, FlutterPatient, MedicalStaff

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 
                 'phone_number', 'birth_date', 'address', 'emergency_contact', 'user_type']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("비밀번호가 일치하지 않습니다.")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class FlutterPatientRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    # User 필드들
    username = serializers.CharField()
    email = serializers.EmailField()
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    
    # 병원 환자 인증 필드 추가
    hospital_patient_id = serializers.CharField(required=True, help_text="병원에서 발급받은 환자 ID")
    verification_code = serializers.CharField(required=True, max_length=6, help_text="의료진에게 받은 6자리 인증 코드")
    
    # 선택적 필드들에 allow_null=True 추가
    phone_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    birth_date = serializers.DateField(required=False, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    emergency_contact = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    blood_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    allergies = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    medical_history = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    insurance_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = FlutterPatient
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name',
                 'hospital_patient_id', 'verification_code',
                 'phone_number', 'birth_date', 'address', 'emergency_contact', 'blood_type', 
                 'allergies', 'medical_history', 'insurance_number']
    
    def to_internal_value(self, data):
        """유효성 검사 전에 빈 문자열을 None으로 변환하여 birth_date 오류 해결"""
        if 'birth_date' in data and data['birth_date'] == '':
            data = data.copy()  # 원본 데이터 변경 방지
            data['birth_date'] = None
        return super().to_internal_value(data)
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("비밀번호가 일치하지 않습니다.")
        
        # 병원 환자 검증
        hospital_patient_id = attrs.get('hospital_patient_id')
        verification_code = attrs.get('verification_code')
        
        try:
            existing_patient = Patient.objects.get(patient_id=hospital_patient_id)
        except Patient.DoesNotExist:
            raise serializers.ValidationError({
                'hospital_patient_id': '병원에 등록되지 않은 환자 ID입니다. 먼저 병원에 방문하여 환자 등록을 완료해주세요.'
            })
        
        # 인증 코드 검증
        if not existing_patient.is_verification_code_valid(verification_code):
            raise serializers.ValidationError({
                'verification_code': '인증 코드가 올바르지 않거나 만료되었습니다. 의료진에게 새로운 코드를 요청해주세요.'
            })
        
        # 이미 Flutter 계정이 연결된 환자인지 확인
        if FlutterPatient.objects.filter(linked_patient=existing_patient).exists():
            raise serializers.ValidationError({
                'hospital_patient_id': '이미 모바일 계정이 연결된 환자입니다.'
            })
        
        # 사용자명 중복 검사
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({
                'username': '이미 존재하는 사용자명입니다.'
            })
        
        # 이메일 중복 검사
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({
                'email': '이미 존재하는 이메일입니다.'
            })
        
        # 검증된 환자 정보를 attrs에 저장
        attrs['_existing_patient'] = existing_patient
        
        return attrs
    
    def create(self, validated_data):
        # 검증된 환자 정보 가져오기
        existing_patient = validated_data.pop('_existing_patient')
        
        # User 생성 데이터 분리
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email'),
            'password': validated_data.pop('password'),
            'first_name': validated_data.pop('first_name', ''),
            'last_name': validated_data.pop('last_name', ''),
            'user_type': 'patient'
        }
        
        # 인증 관련 필드 제거
        validated_data.pop('password_confirm')
        validated_data.pop('hospital_patient_id')
        validated_data.pop('verification_code')
        
        # null 값들을 적절히 처리
        for field in ['phone_number', 'address', 'emergency_contact', 'blood_type', 
                     'allergies', 'medical_history', 'insurance_number']:
            if validated_data.get(field) is None or validated_data.get(field) == '':
                validated_data[field] = ''
        
        # birth_date는 None으로 유지 (이미 to_internal_value에서 처리됨)
        
        # User 생성
        user = User.objects.create_user(**user_data)
        
        # FlutterPatient 생성 및 기존 환자와 연결
        flutter_patient = FlutterPatient.objects.create(
            user=user,
            patient_id=f"FP{user.id:06d}",
            linked_patient=existing_patient,  # 기존 환자와 연결
            **validated_data
        )
        
        # 인증 코드 사용 완료 처리
        existing_patient.mobile_verification_code = None
        existing_patient.verification_code_created_at = None
        existing_patient.save()
        
        return flutter_patient

class MedicalStaffRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    # User 필드들
    username = serializers.CharField()
    email = serializers.EmailField()
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = MedicalStaff
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name',
                 'staff_type', 'department', 'license_number', 'specialization']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("비밀번호가 일치하지 않습니다.")
        return attrs
    
    def create(self, validated_data):
        # User 생성 데이터 분리
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email'),
            'password': validated_data.pop('password'),
            'first_name': validated_data.pop('first_name', ''),
            'last_name': validated_data.pop('last_name', ''),
            'user_type': validated_data.get('staff_type', 'doctor')
        }
        validated_data.pop('password_confirm')
        
        # User 생성
        user = User.objects.create_user(**user_data)
        
        # MedicalStaff 생성
        medical_staff = MedicalStaff.objects.create(
            user=user,
            staff_id=f"MS{user.id:06d}",
            **validated_data
        )
        
        return medical_staff

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'user_type', 
                 'phone_number', 'birth_date', 'address', 'emergency_contact']

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        serializer = UserSerializer(self.user)
        data['user'] = serializer.data
        return data

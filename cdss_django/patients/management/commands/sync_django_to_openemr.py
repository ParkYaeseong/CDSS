# patients/management/commands/sync_django_to_openemr.py

from django.core.management.base import BaseCommand
from pacs_integration.clients import OpenEMRClient
from patients.models import PatientProfile

class Command(BaseCommand):
    help = 'Django에서 새로 생성된 환자를 OpenEMR로 동기화 (중복 방지)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='실제 생성 없이 동기화할 환자만 확인',
        )
        parser.add_argument(
            '--patient-id',
            type=str,
            help='특정 환자만 동기화 (openemr_id)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        patient_id = options['patient_id']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('=== DRY RUN 모드: 실제 생성하지 않고 확인만 ==='))
        
        self.stdout.write("Django → OpenEMR 환자 동기화 시작...")
        client = OpenEMRClient()
        
        try:
            # 1. OpenEMR에서 기존 환자 목록 가져오기
            emr_patients_response = client._make_api_request('GET', '/api/patient')
            existing_emr_ids = set()
            existing_names = set()
            
            if emr_patients_response and 'data' in emr_patients_response:
                for patient in emr_patients_response['data']:
                    # pubpid와 pid 모두 체크
                    emr_id = patient.get('pubpid') or patient.get('pid')
                    if emr_id:
                        existing_emr_ids.add(str(emr_id))
                    
                    # 이름 + 생년월일 조합으로 중복 체크
                    fname = patient.get('fname', '').strip()
                    lname = patient.get('lname', '').strip()
                    dob = patient.get('DOB', '').strip()
                    if fname and lname:
                        existing_names.add(f"{fname}_{lname}_{dob}")

            self.stdout.write(f"OpenEMR 기존 환자: {len(existing_emr_ids)}명")

            # 2. Django에서 동기화할 환자 필터링
            if patient_id:
                django_patients = PatientProfile.objects.filter(openemr_id=patient_id)
            else:
                django_patients = PatientProfile.objects.all()
            
            new_patients = []
            skipped_patients = []
            
            for patient in django_patients:
                # openemr_id로 중복 체크
                if str(patient.openemr_id) in existing_emr_ids:
                    skipped_patients.append(f"{patient.openemr_id} (ID 중복)")
                    continue
                
                # 이름 조합으로도 중복 체크
                patient_name_key = f"{patient.first_name}_{patient.last_name}_{patient.date_of_birth}"
                if patient_name_key in existing_names:
                    skipped_patients.append(f"{patient.openemr_id} (이름 중복)")
                    continue
                
                new_patients.append(patient)

            # 3. 결과 요약
            self.stdout.write(f"\n=== 동기화 계획 ===")
            self.stdout.write(f"새로 생성할 환자: {len(new_patients)}명")
            self.stdout.write(f"중복으로 건너뛸 환자: {len(skipped_patients)}명")
            
            if skipped_patients:
                self.stdout.write(f"\n건너뛸 환자 목록:")
                for skipped in skipped_patients:
                    self.stdout.write(f"  - {skipped}")

            if not new_patients:
                self.stdout.write(self.style.SUCCESS("동기화할 새 환자가 없습니다."))
                return

            # 4. 새 환자 생성 (DRY-RUN 또는 실제 실행)
            success_count = 0
            error_count = 0
            
            for patient in new_patients:
                try:
                    patient_data = {
                        'fname': patient.first_name,
                        'lname': patient.last_name,
                        'DOB': patient.date_of_birth.strftime('%Y-%m-%d') if patient.date_of_birth else '',
                        'sex': self.convert_gender_to_openemr(patient.gender),
                        'phone_home': patient.phone_number or '',
                        'street': patient.address or '',
                        'pubpid': patient.openemr_id,
                    }
                    
                    if dry_run:
                        self.stdout.write(f'[DRY-RUN] 생성 예정: {patient.openemr_id} - {patient.first_name} {patient.last_name}')
                        success_count += 1
                    else:
                        response = client.create_patient(patient_data)
                        
                        if response:
                            success_count += 1
                            self.stdout.write(
                                self.style.SUCCESS(f'✓ OpenEMR 생성 완료: {patient.openemr_id} - {patient.first_name} {patient.last_name}')
                            )
                        else:
                            error_count += 1
                            self.stdout.write(
                                self.style.ERROR(f'✗ 생성 실패: {patient.openemr_id} - {patient.first_name} {patient.last_name}')
                            )
                        
                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(f'✗ 오류: {patient.openemr_id} - {str(e)}')
                    )

            # 5. 최종 결과
            if dry_run:
                self.stdout.write(self.style.SUCCESS(f"\n[DRY-RUN] 동기화 예정: {success_count}명"))
            else:
                self.stdout.write(self.style.SUCCESS(
                    f"\nDjango → OpenEMR 동기화 완료!\n성공: {success_count}명, 실패: {error_count}명"
                ))
            
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"동기화 중 오류 발생: {e}"))

    def convert_gender_to_openemr(self, django_gender):
        """Django 성별을 OpenEMR 형식으로 변환"""
        gender_map = {
            'MALE': 'Male',
            'FEMALE': 'Female',
            'OTHER': 'Other'
        }
        return gender_map.get(django_gender, 'Other')

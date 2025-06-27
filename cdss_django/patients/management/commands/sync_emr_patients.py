# patients/management/commands/sync_emr_patients.py

from django.core.management.base import BaseCommand
from pacs_integration.clients import OpenEMRClient
from patients.models import PatientProfile
from datetime import datetime

class Command(BaseCommand):
    help = 'Fetches patient data from OpenEMR and syncs it with the local PatientProfile model.'

    def handle(self, *args, **options):
        self.stdout.write("Starting patient synchronization with OpenEMR...")
        client = OpenEMRClient()
        
        try:
            # OpenEMR API에서 모든 환자 목록을 가져옵니다.
            # 참고: OpenEMR v7 표준 API는 모든 환자를 가져오는 직접적인 엔드포인트가
            # 명확하지 않을 수 있습니다. FHIR API(/apis/default/fhir/Patient)를 사용하거나
            # 아래 예시처럼 표준 API의 환자 검색 기능을 활용해야 할 수 있습니다.
            # 여기서는 /api/patient 가 리스트를 반환한다고 가정합니다.
            
            # 실제 API 엔드포인트가 다르다면 이 부분을 수정해야 합니다.
            emr_patients_response = client._make_api_request('GET', '/api/patient')
            
            if not emr_patients_response or 'data' not in emr_patients_response:
                self.stderr.write(self.style.ERROR("Failed to fetch patients from OpenEMR or empty response."))
                return

            emr_patients = emr_patients_response['data']
            synced_count = 0
            created_count = 0

            for patient_data in emr_patients:
                emr_id = patient_data.get('pubpid') or patient_data.get('pid') # pubpid 또는 pid 사용
                if not emr_id:
                    continue

                # 날짜 형식 변환
                dob_str = patient_data.get('DOB')
                try:
                    dob = datetime.strptime(dob_str, '%Y-%m-%d').date() if dob_str else datetime.now().date()
                except ValueError:
                    self.stdout.write(self.style.WARNING(f"Could not parse DOB '{dob_str}' for patient {emr_id}. Skipping."))
                    continue

                # 성별 변환
                gender_map = {'Male': PatientProfile.GenderChoices.MALE, 'Female': PatientProfile.GenderChoices.FEMALE}
                gender = gender_map.get(patient_data.get('sex'), PatientProfile.GenderChoices.OTHER)
                
                # update_or_create: EMR ID가 이미 존재하면 업데이트, 없으면 새로 생성
                obj, created = PatientProfile.objects.update_or_create(
                    openemr_id=emr_id,
                    defaults={
                        'first_name': patient_data.get('fname', ''),
                        'last_name': patient_data.get('lname', ''),
                        'date_of_birth': dob,
                        'gender': gender,
                    }
                )
                if created:
                    created_count += 1
                else:
                    synced_count += 1

            self.stdout.write(self.style.SUCCESS(
                f"Synchronization complete! {created_count} new patients created, {synced_count} patients updated."
            ))

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"An error occurred: {e}"))

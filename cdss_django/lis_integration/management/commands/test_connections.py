# cdss_django/lis_integration/management/commands/test_connections.py
from django.core.management.base import BaseCommand
from pacs_integration.openemr_client import OpenEMRClient
from lis_integration.lis_client import LISAPIClient

class Command(BaseCommand):
    help = 'OpenEMR과 LIS 연결 테스트'

    def handle(self, *args, **options):
        # OpenEMR 연결 테스트
        self.stdout.write("🔍 OpenEMR 연결 테스트...")
        try:
            openemr_client = OpenEMRClient()
            token = openemr_client._get_access_token()
            if token:
                self.stdout.write(self.style.SUCCESS('✅ OpenEMR 연결 성공!'))
                self.stdout.write(f'   토큰: {token[:30]}...')
                
                # API 호출 테스트
                facilities = openemr_client._make_api_request('GET', '/api/facility')
                if facilities:
                    self.stdout.write(f'   시설 정보: {len(facilities)} 개 조회됨')
            else:
                self.stdout.write(self.style.ERROR('❌ OpenEMR 토큰 획득 실패'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ OpenEMR 연결 실패: {e}'))
        
        # LIS 연결 테스트
        self.stdout.write("\n🔍 LIS 연결 테스트...")
        try:
            lis_client = LISAPIClient()
            if lis_client.test_connection():
                self.stdout.write(self.style.SUCCESS('✅ LIS 연결 성공!'))
            else:
                self.stdout.write(self.style.ERROR('❌ LIS 연결 실패'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ LIS 연결 실패: {e}'))

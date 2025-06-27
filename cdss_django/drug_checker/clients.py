# drug_checker/clients.py
import requests
import logging
import certifi
from django.conf import settings
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.ssl_ import create_urllib3_context

CIPHERS = ('DEFAULT@SECLEVEL=1')

class TlsAdapter(HTTPAdapter):
    def init_poolmanager(self, *args, **kwargs):
        context = create_urllib3_context(ciphers=CIPHERS)
        kwargs['ssl_context'] = context
        return super(TlsAdapter, self).init_poolmanager(*args, **kwargs)

logger = logging.getLogger(__name__)

class DURClient:
    def __init__(self):
        self.base_url = getattr(settings, 'DUR_API_BASE_URL')
        self.service_key = getattr(settings, 'DUR_SERVICE_KEY')
        self.session = requests.Session()
        adapter = TlsAdapter()
        self.session.mount(self.base_url, adapter)

    def get_contraindications(self, drug_name_kor: str):
        endpoint = "/getUsjntTabooInfoList02"
        params = {
            'serviceKey': self.service_key,
            'ingrKorName': drug_name_kor,
            'type': 'json',
            'numOfRows': 100
        }
        try:
            response = self.session.get(
                f"{self.base_url.rstrip('/')}{endpoint}",
                params=params,
                timeout=15,
                verify=certifi.where()
            )
            response.raise_for_status()
            data = response.json()
            if data.get('header', {}).get('resultCode') == '00' and data.get('body', {}).get('totalCount', 0) > 0:
                items = data['body']['items']
                if isinstance(items, list):
                    return items
                return [items]
        except requests.exceptions.RequestException as e:
            logger.error(f"DUR API request error for {drug_name_kor}: {e}")
        except ValueError:
            logger.error(f"DUR API JSON parsing error for {drug_name_kor}")
        return []

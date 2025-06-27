# drug_checker/services.py
import itertools
from .clients import DURClient

def check_interactions_for_list(drug_list: list):
    if len(drug_list) < 2:
        return {"interactions": [], "message": "검사를 위해 최소 2개의 약물이 필요합니다."}
    client = DURClient()
    found_interactions = []
    all_contra_lists = {drug: client.get_contraindications(drug) for drug in drug_list}
    for drug_a, drug_b in itertools.combinations(drug_list, 2):
        for item_wrapper in all_contra_lists.get(drug_a, []):
            item = item_wrapper.get('item', {})
            contra_ingredient = item.get('MIXTURE_INGR_KOR_NAME', '')
            if drug_b in contra_ingredient:
                found_interactions.append({"pair": [drug_a, drug_b], "reason": item.get('PROHBT_CONTENT', '상세 정보 없음')})
        for item_wrapper in all_contra_lists.get(drug_b, []):
            item = item_wrapper.get('item', {})
            contra_ingredient = item.get('MIXTURE_INGR_KOR_NAME', '')
            if drug_a in contra_ingredient:
                found_interactions.append({"pair": [drug_b, drug_a], "reason": item.get('PROHBT_CONTENT', '상세 정보 없음')})
    unique_interactions = []
    seen_pairs = set()
    for interaction in found_interactions:
        pair = tuple(sorted(interaction['pair']))
        if pair not in seen_pairs:
            unique_interactions.append(interaction)
            seen_pairs.add(pair)
    return {"interactions": unique_interactions}
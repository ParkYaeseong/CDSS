from datetime import datetime
import logging
import nibabel as nib
import numpy as np
import logging

logger = logging.getLogger(__name__)

def format_dicom_date(date_str: str | None) -> str | None:
    """
    DICOM 날짜 문자열(YYYYMMDD 또는 YYYY-MM-DD)을 'YYYY-MM-DD' 형식으로 변환합니다.
    유효하지 않은 값이 들어오면 None을 반환합니다.
    """
    if not date_str or not isinstance(date_str, str):
        return None
    
    date_str = date_str.strip()
    
    # YYYY-MM-DD 형식인지 먼저 확인
    if '-' in date_str:
        try:
            datetime.strptime(date_str, '%Y-%m-%d')
            return date_str # 이미 올바른 형식이면 그대로 반환
        except ValueError:
            # 형식이 다르지만 '-'가 포함된 경우 (예: '2023-1-1'), YYYYMMDD 변환 시도
            pass

    # YYYYMMDD 형식 변환 시도
    if len(date_str) == 8:
        try:
            return datetime.strptime(date_str, '%Y%m%d').strftime('%Y-%m-%d')
        except ValueError:
            logger.warning(f"Could not parse date string '{date_str}' with YYYYMMDD format.")
            return None
            
    logger.warning(f"Invalid date string provided for formatting: '{date_str}'")
    return None

def format_dicom_time(time_str: str | None) -> str | None:
    """
    DICOM 시간 문자열(HHMMSS 또는 HHMMSS.ffffff)을 'HH:MM:SS' 형식으로 변환합니다.
    유효하지 않은 값이 들어오면 None을 반환합니다.
    """
    if not time_str or not isinstance(time_str, str):
        return None

    time_str = time_str.strip()
    
    if '.' in time_str:
        time_str = time_str.split('.')[0]
    
    if len(time_str) >= 6: # HHMMSS
        try:
            # 실제 시간으로 변환 가능한지 확인
            datetime.strptime(time_str, '%H%M%S')
            return f"{time_str[0:2]}:{time_str[2:4]}:{time_str[4:6]}"
        except ValueError:
             logger.warning(f"Invalid time value in string '{time_str}'")
             return None
    elif len(time_str) == 4: # HHMM
        try:
            datetime.strptime(time_str, '%H%M')
            return f"{time_str[0:2]}:{time_str[2:4]}:00"
        except ValueError:
            logger.warning(f"Invalid time value in string '{time_str}'")
            return None

    logger.warning(f"Invalid time string provided for formatting: '{time_str}'")
    return None


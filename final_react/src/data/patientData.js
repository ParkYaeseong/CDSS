// 환자별 기본 정보 더미 데이터
export const patientBasicInfo = {
  1: { // 김 이박
    height: '175cm',
    weight: '72kg',
    blood_type: 'B+',
    allergies: '땅콩',
    smoking: '비흡연'
  },
  2: { // Jane Doe
    height: '165cm',
    weight: '58kg',
    blood_type: 'O+',
    allergies: '페니실린',
    smoking: '비흡연'
  },
  3: { // Park Yeaseng (신장암 환자)
    height: '170cm',
    weight: '68kg', // 체중 감소
    blood_type: 'A+',
    allergies: '조영제',
    smoking: '과거 흡연'
  },
  4: { // 강 경화
    height: '168cm',
    weight: '65kg',
    blood_type: 'AB+',
    allergies: '아스피린',
    smoking: '과거 흡연'
  },
  5: { // 팽 희
    height: '155cm',
    weight: '50kg',
    blood_type: 'A-',
    allergies: '새우',
    smoking: '비흡연'
  },
  6: { // 이 선아
    height: '162cm',
    weight: '52kg',
    blood_type: 'A-',
    allergies: '조개류',
    smoking: '비흡연'
  },
  7: { // 신 장훈
    height: '178cm',
    weight: '85kg',
    blood_type: 'B-',
    allergies: '없음',
    smoking: '현재 흡연'
  },
  8: { // 남 소영
    height: '158cm',
    weight: '48kg',
    blood_type: 'O-',
    allergies: '견과류',
    smoking: '비흡연'
  },
  9: { // 유 빈
    height: '173cm',
    weight: '68kg',
    blood_type: 'A+',
    allergies: '없음',
    smoking: '비흡연'
  },
  11: { // 김 사다함
    height: '180cm',
    weight: '90kg',
    blood_type: 'B+',
    allergies: '설파제',
    smoking: '과거 흡연'
  },
  12: { // 김 유리
    height: '160cm',
    weight: '45kg',
    blood_type: 'AB-',
    allergies: '갑각류',
    smoking: '비흡연'
  },
  17: { // 환 김
    height: '176cm',
    weight: '78kg',
    blood_type: 'O+',
    allergies: '요오드',
    smoking: '현재 흡연'
  }
};

export const patientMedicalRecords = {
  1: [ // 김 이박
    { 
      id: 1, 
      date: '2025-06-24', 
      time: '09:30', 
      chiefComplaint: '혈당 조절 상태 확인',
      presentIllness: '당뇨병으로 치료 중. 최근 혈당 수치가 안정적이며 식이요법을 잘 지키고 있음.',
      physicalExam: '혈압 125/80mmHg, 맥박 75회/분, 체온 36.5°C',
      assessment: '당뇨병 관리 양호',
      plan: '메트포르민 지속 복용, 3개월 후 재검진'
    },
    { 
      id: 2, 
      date: '2025-06-20', 
      time: '14:15', 
      chiefComplaint: '정기 검진',
      presentIllness: '혈당 수치 개선됨. 식이요법 잘 지키고 있음.',
      physicalExam: '전반적인 상태 양호',
      assessment: '당뇨병 경과 양호',
      plan: '생활습관 개선 지속, 운동량 증가 권장'
    },
    { 
      id: 3, 
      date: '2025-06-15', 
      time: '10:45', 
      chiefComplaint: '정기 검진',
      presentIllness: 'HbA1c 7.2%로 목표치에 근접',
      physicalExam: '특이사항 없음',
      assessment: '당뇨병 정기 검진',
      plan: '현재 치료 유지, 지속적인 관리 필요'
    }
  ],
  2: [ // Jane Doe
    { 
      id: 1, 
      date: '2025-06-24', 
      time: '11:20', 
      chiefComplaint: '피로감, 어지러움',
      presentIllness: '철분제 복용 후 헤모글로빈 수치 약간 상승했으나 여전히 빈혈 증상 지속',
      physicalExam: '결막 창백, 손톱 창백',
      assessment: '철결핍성 빈혈',
      plan: '철분제 지속 복용, 식이요법 병행, 2주 후 재검진'
    },
    { 
      id: 2, 
      date: '2025-06-18', 
      time: '15:30', 
      chiefComplaint: '피로감 호소',
      presentIllness: '지속적인 피로감과 어지러움',
      physicalExam: '결막 창백, 맥박 약간 빠름',
      assessment: '빈혈 진단',
      plan: '철분제 처방, 영양 상담'
    }
  ],
  3: [ // Park Yeaseng (신장암 환자)
    { 
      id: 1, 
      date: '2025-06-24', 
      time: '08:45', 
      chiefComplaint: '혈뇨, 옆구리 통증',
      presentIllness: '신장암 진단 후 항암치료 중. 최근 혈뇨와 우측 옆구리 통증 지속',
      physicalExam: '혈압 145/90mmHg, 우측 늑골척추각 압통, 하지 부종 경미',
      assessment: '신세포암 항암치료 중',
      plan: '수니티닙 지속, 신기능 모니터링, 통증 조절'
    },
    { 
      id: 2, 
      date: '2025-06-17', 
      time: '14:30', 
      chiefComplaint: '피로감, 식욕부진',
      presentIllness: '항암치료로 인한 피로감과 식욕부진 호소',
      physicalExam: '전반적인 컨디션 저하, 체중 2kg 감소',
      assessment: '항암치료 부작용',
      plan: '영양 상담, 증상 완화 치료'
    },
    { 
      id: 3, 
      date: '2025-06-10', 
      time: '10:15', 
      chiefComplaint: '신기능 검사 결과 확인',
      presentIllness: '크레아티닌 수치 상승, 신기능 악화 소견',
      physicalExam: '하지 부종 증가, 혈압 상승',
      assessment: '신기능 악화',
      plan: '항암제 용량 조정, 이뇨제 처방, 신장내과 협진'
    }
  ],
  4: [ // 강 경화 (간암 환자)
    { 
      id: 1, 
      date: '2025-06-24', 
      time: '13:15', 
      chiefComplaint: '항암치료 경과 확인',
      presentIllness: '항암치료 3차 완료. 부작용은 경미함',
      physicalExam: '복부 촉진상 종괴 크기 감소',
      assessment: '간세포암 항암치료 반응 양호',
      plan: '소라페닙 지속, 간기능 모니터링, 4주 후 CT 재검'
    },
    { 
      id: 2, 
      date: '2025-06-17', 
      time: '09:00', 
      chiefComplaint: 'CT 결과 확인',
      presentIllness: '종양 크기 약간 감소 확인됨',
      physicalExam: '복부 압통 감소',
      assessment: '간암 치료 반응 평가 - 양호',
      plan: '현재 항암치료 지속'
    },
    { 
      id: 3, 
      date: '2025-06-10', 
      time: '14:30', 
      chiefComplaint: '복부 불편감',
      presentIllness: '복부 불편감 호소, 간기능 수치 상승',
      physicalExam: '우상복부 압통',
      assessment: '간기능 악화',
      plan: '간보호제 추가, 항암제 용량 조정'
    }
  ],
  5: [ // 팽 희 (갑상선암 환자)
    { 
      id: 1, 
      date: '2025-06-24', 
      time: '10:30', 
      chiefComplaint: '수술 후 경과 확인',
      presentIllness: '갑상선 수술 후 6개월 경과',
      physicalExam: '수술 부위 회복 양호, 목 부위 특이사항 없음',
      assessment: '갑상선암 수술 후 관리 양호',
      plan: '레보티록신 지속 복용, 갑상선 기능 검사'
    },
    { 
      id: 2, 
      date: '2025-06-15', 
      time: '11:45', 
      chiefComplaint: '목 부위 부종',
      presentIllness: '목 부위 경미한 부종 발생',
      physicalExam: '수술 부위 경미한 부종, 발적 없음',
      assessment: '수술 후 경과 관찰',
      plan: '소염제 처방, 경과 관찰'
    }
  ],
  6: [ // 이 선아 (위암 환자)
    { 
      id: 1, 
      date: '2025-06-24', 
      time: '14:20', 
      chiefComplaint: '오심, 구토',
      presentIllness: '항암치료 2차 진행 중. 오심, 구토 부작용 있으나 견딜 만함',
      physicalExam: '전신 상태 양호, 탈수 소견 없음',
      assessment: '위암 항암치료 중 - 부작용 관리',
      plan: '구토방지제 추가, 영양 관리, 수액 공급'
    },
    { 
      id: 2, 
      date: '2025-06-18', 
      time: '09:15', 
      chiefComplaint: '식욕부진',
      presentIllness: '식욕부진 지속. 체중 2kg 감소',
      physicalExam: '체중 감소, 영양 상태 불량',
      assessment: '영양실조 위험',
      plan: '영양제 처방, 식이 상담, 영양 상태 모니터링'
    }
  ],
  7: [ // 신 장훈 (신장암 환자)
    { 
      id: 1, 
      date: '2025-06-24', 
      time: '15:45', 
      chiefComplaint: '호흡곤란, 부종',
      presentIllness: '신장 기능 악화 진행. 크레아티닌 1.8mg/dL',
      physicalExam: '하지 부종 증가, 폐음 청진상 수포음',
      assessment: '만성 신부전 진행',
      plan: '투석 준비, 식이 제한, 이뇨제 증량'
    },
    { 
      id: 2, 
      date: '2025-06-20', 
      time: '08:30', 
      chiefComplaint: '부종 증가',
      presentIllness: '부종 증가, 호흡곤란 호소',
      physicalExam: '하지 부종 심화',
      assessment: '신부전으로 인한 부종',
      plan: '푸로세미드 증량, 염분 제한'
    }
  ],
  8: [ // 남 소영
    { 
      id: 1, 
      date: '2025-06-24', 
      time: '12:00', 
      chiefComplaint: '위장 장애',
      presentIllness: '철분제 복용 후 위장 장애 호소',
      physicalExam: '복부 압통 경미',
      assessment: '철분제 부작용',
      plan: '철분제 종류 변경, 위장보호제 병용'
    },
    { 
      id: 2, 
      date: '2025-06-19', 
      time: '16:30', 
      chiefComplaint: '빈혈 증상 개선 확인',
      presentIllness: '빈혈 증상 개선됨',
      physicalExam: '결막 색깔 개선',
      assessment: '빈혈 치료 반응 양호',
      plan: '철분제 지속 복용'
    }
  ],
  9: [ // 유 빈
    { 
      id: 1, 
      date: '2025-06-24', 
      time: '11:15', 
      chiefComplaint: '정기 검진',
      presentIllness: '혈압 조절 양호. 운동 요법으로 체중 감량 성공',
      physicalExam: '혈압 115/75mmHg, 체중 감소 확인',
      assessment: '고혈압 관리 양호',
      plan: '현재 치료 유지, 생활습관 지속'
    },
    { 
      id: 2, 
      date: '2025-06-17', 
      time: '13:45', 
      chiefComplaint: '혈당 검사',
      presentIllness: '혈당 수치 경계선',
      physicalExam: '특이사항 없음',
      assessment: '당뇨 전단계',
      plan: '식이요법, 운동요법 강화'
    }
  ],
  11: [ // 김 사다함
    { 
      id: 1, 
      date: '2025-06-24', 
      time: '07:30', 
      chiefComplaint: '혈당 조절 불량',
      presentIllness: 'HbA1c 8.5%로 높음',
      physicalExam: '족부 검사상 감각 저하',
      assessment: '당뇨병 조절 불량',
      plan: '인슐린 용량 증량, 혈당 자가 측정 강화'
    },
    { 
      id: 2, 
      date: '2025-06-21', 
      time: '14:00', 
      chiefComplaint: '당뇨 합병증 검사',
      presentIllness: '망막병증 초기 소견 확인',
      physicalExam: '안저 검사상 미세혈관병증',
      assessment: '당뇨 망막병증 의심',
      plan: '안과 협진, 혈당 조절 강화'
    },
    { 
      id: 3, 
      date: '2025-06-14', 
      time: '10:20', 
      chiefComplaint: '발가락 상처',
      presentIllness: '발가락 상처 치유 지연',
      physicalExam: '좌측 발가락 궤양, 감염 징후 없음',
      assessment: '당뇨발 위험',
      plan: '상처 치료, 족부 관리 교육'
    }
  ],
  12: [ // 김 유리
    { 
      id: 1, 
      date: '2025-06-24', 
      time: '16:45', 
      chiefComplaint: '영양 상태 확인',
      presentIllness: '비타민D, B12 수치 정상화됨',
      physicalExam: '체중 증가, 전반적 상태 개선',
      assessment: '영양결핍 치료 완료',
      plan: '영양제 지속, 정기 검진'
    },
    { 
      id: 2, 
      date: '2025-06-12', 
      time: '09:30', 
      chiefComplaint: '체중 증가 확인',
      presentIllness: '식욕 개선됨',
      physicalExam: '체중 증가 확인',
      assessment: '영양 상태 개선',
      plan: '현재 치료 지속'
    }
  ],
  17: [ // 환 김
    { 
      id: 1, 
      date: '2025-06-24', 
      time: '08:00', 
      chiefComplaint: '전립선암 경과 확인',
      presentIllness: 'PSA 수치 감소 추세',
      physicalExam: '전립선 크기 감소',
      assessment: '전립선암 호르몬 치료 반응 양호',
      plan: '류프롤리드 지속 투여'
    },
    { 
      id: 2, 
      date: '2025-06-17', 
      time: '15:15', 
      chiefComplaint: '배뇨 장애 개선 확인',
      presentIllness: '야간뇨 횟수 감소',
      physicalExam: '전립선 크기 안정적',
      assessment: '배뇨 장애 개선',
      plan: '탐수로신 지속 복용'
    },
    { 
      id: 3, 
      date: '2025-06-10', 
      time: '11:30', 
      chiefComplaint: '골밀도 검사 결과',
      presentIllness: '골다공증 진행 확인',
      physicalExam: '척추 압박골절 없음',
      assessment: '골다공증',
      plan: '골다공증 치료제 추가, 칼슘 비타민D 보충'
    }
  ]
};

// 환자별 바이탈 사인 데이터 (실제 환자 ID 기반)
export const patientVitalData = {
  1: [ // 김 이박
    { date: '06-01', WBC: 5.0, RBC: 4.2, 혈압: 125, 맥박: 75, 체온: 36.6, 산소포화도: 98 },
    { date: '06-05', WBC: 5.1, RBC: 4.3, 혈압: 128, 맥박: 77, 체온: 36.8, 산소포화도: 97 },
    { date: '06-10', WBC: 4.9, RBC: 4.1, 혈압: 123, 맥박: 73, 체온: 36.5, 산소포화도: 98 },
    { date: '06-15', WBC: 5.2, RBC: 4.4, 혈압: 130, 맥박: 79, 체온: 36.9, 산소포화도: 97 },
    { date: '06-20', WBC: 5.0, RBC: 4.2, 혈압: 126, 맥박: 76, 체온: 36.7, 산소포화도: 98 }
  ],
  2: [ // Jane Doe
    { date: '06-01', WBC: 4.8, RBC: 4.1, 혈압: 110, 맥박: 68, 체온: 36.3, 산소포화도: 99 },
    { date: '06-05', WBC: 4.9, RBC: 4.2, 혈압: 112, 맥박: 70, 체온: 36.4, 산소포화도: 98 },
    { date: '06-10', WBC: 4.7, RBC: 4.0, 혈압: 108, 맥박: 66, 체온: 36.2, 산소포화도: 99 },
    { date: '06-15', WBC: 5.0, RBC: 4.3, 혈압: 115, 맥박: 72, 체온: 36.5, 산소포화도: 98 },
    { date: '06-20', WBC: 4.8, RBC: 4.1, 혈압: 111, 맥박: 69, 체온: 36.3, 산소포화도: 99 }
  ],
  3: [ // Park Yeaseng (신장암 환자)
    { date: '06-01', WBC: 6.2, RBC: 4.0, 혈압: 145, 맥박: 85, 체온: 37.2, 산소포화도: 94 },
    { date: '06-05', WBC: 6.5, RBC: 3.9, 혈압: 148, 맥박: 88, 체온: 37.3, 산소포화도: 93 },
    { date: '06-10', WBC: 6.1, RBC: 4.1, 혈압: 142, 맥박: 82, 체온: 37.0, 산소포화도: 95 },
    { date: '06-15', WBC: 6.4, RBC: 3.8, 혈압: 150, 맥박: 90, 체온: 37.4, 산소포화도: 92 },
    { date: '06-20', WBC: 6.3, RBC: 3.9, 혈압: 146, 맥박: 86, 체온: 37.1, 산소포화도: 94 }
  ],
  4: [ // 강 경화
    { date: '06-01', WBC: 6.1, RBC: 4.6, 혈압: 140, 맥박: 80, 체온: 36.8, 산소포화도: 96 },
    { date: '06-05', WBC: 6.3, RBC: 4.7, 혈압: 142, 맥박: 82, 체온: 36.9, 산소포화도: 95 },
    { date: '06-10', WBC: 6.0, RBC: 4.5, 혈압: 138, 맥박: 78, 체온: 36.7, 산소포화도: 97 },
    { date: '06-15', WBC: 6.2, RBC: 4.8, 혈압: 145, 맥박: 85, 체온: 37.0, 산소포화도: 94 },
    { date: '06-20', WBC: 6.1, RBC: 4.6, 혈압: 141, 맥박: 81, 체온: 36.8, 산소포화도: 96 }
  ],
  5: [ // 팽 희
    { date: '06-01', WBC: 4.3, RBC: 3.8, 혈압: 102, 맥박: 64, 체온: 36.2, 산소포화도: 99 },
    { date: '06-05', WBC: 4.4, RBC: 3.9, 혈압: 105, 맥박: 66, 체온: 36.3, 산소포화도: 98 },
    { date: '06-10', WBC: 4.2, RBC: 3.7, 혈압: 100, 맥박: 62, 체온: 36.1, 산소포화도: 99 },
    { date: '06-15', WBC: 4.5, RBC: 4.0, 혈압: 107, 맥박: 68, 체온: 36.4, 산소포화도: 98 },
    { date: '06-20', WBC: 4.3, RBC: 3.8, 혈압: 103, 맥박: 65, 체온: 36.2, 산소포화도: 99 }
  ],
  6: [ // 이 선아
    { date: '06-01', WBC: 4.5, RBC: 3.9, 혈압: 105, 맥박: 65, 체온: 36.2, 산소포화도: 100 },
    { date: '06-05', WBC: 4.6, RBC: 4.0, 혈압: 107, 맥박: 67, 체온: 36.3, 산소포화도: 99 },
    { date: '06-10', WBC: 4.4, RBC: 3.8, 혈압: 103, 맥박: 63, 체온: 36.1, 산소포화도: 100 },
    { date: '06-15', WBC: 4.7, RBC: 4.1, 혈압: 109, 맥박: 69, 체온: 36.4, 산소포화도: 99 },
    { date: '06-20', WBC: 4.5, RBC: 3.9, 혈압: 106, 맥박: 66, 체온: 36.2, 산소포화도: 100 }
  ],
  7: [ // 신 장훈
    { date: '06-01', WBC: 5.8, RBC: 4.4, 혈압: 150, 맥박: 88, 체온: 37.1, 산소포화도: 93 },
    { date: '06-05', WBC: 6.0, RBC: 4.5, 혈압: 152, 맥박: 90, 체온: 37.2, 산소포화도: 92 },
    { date: '06-10', WBC: 5.7, RBC: 4.3, 혈압: 148, 맥박: 86, 체온: 37.0, 산소포화도: 94 },
    { date: '06-15', WBC: 6.1, RBC: 4.6, 혈압: 155, 맥박: 92, 체온: 37.3, 산소포화도: 91 },
    { date: '06-20', WBC: 5.9, RBC: 4.4, 혈압: 151, 맥박: 89, 체온: 37.1, 산소포화도: 93 }
  ],
  8: [ // 남 소영
    { date: '06-01', WBC: 4.2, RBC: 3.8, 혈압: 100, 맥박: 62, 체온: 36.1, 산소포화도: 100 },
    { date: '06-05', WBC: 4.3, RBC: 3.9, 혈압: 102, 맥박: 64, 체온: 36.2, 산소포화도: 99 },
    { date: '06-10', WBC: 4.1, RBC: 3.7, 혈압: 98, 맥박: 60, 체온: 36.0, 산소포화도: 100 },
    { date: '06-15', WBC: 4.4, RBC: 4.0, 혈압: 104, 맥박: 66, 체온: 36.3, 산소포화도: 99 },
    { date: '06-20', WBC: 4.2, RBC: 3.8, 혈압: 101, 맥박: 63, 체온: 36.1, 산소포화도: 100 }
  ],
  9: [ // 유 빈
    { date: '06-01', WBC: 5.5, RBC: 4.2, 혈압: 115, 맥박: 74, 체온: 36.6, 산소포화도: 98 },
    { date: '06-05', WBC: 5.6, RBC: 4.3, 혈압: 117, 맥박: 76, 체온: 36.7, 산소포화도: 97 },
    { date: '06-10', WBC: 5.4, RBC: 4.1, 혈압: 113, 맥박: 72, 체온: 36.5, 산소포화도: 98 },
    { date: '06-15', WBC: 5.7, RBC: 4.4, 혈압: 119, 맥박: 78, 체온: 36.8, 산소포화도: 97 },
    { date: '06-20', WBC: 5.5, RBC: 4.2, 혈압: 116, 맥박: 75, 체온: 36.6, 산소포화도: 98 }
  ],
  11: [ // 김 사다함
    { date: '06-01', WBC: 7.2, RBC: 5.1, 혈압: 160, 맥박: 95, 체온: 37.4, 산소포화도: 90 },
    { date: '06-05', WBC: 7.4, RBC: 5.2, 혈압: 162, 맥박: 97, 체온: 37.5, 산소포화도: 89 },
    { date: '06-10', WBC: 7.1, RBC: 5.0, 혈압: 158, 맥박: 93, 체온: 37.3, 산소포화도: 91 },
    { date: '06-15', WBC: 7.5, RBC: 5.3, 혈압: 165, 맥박: 99, 체온: 37.6, 산소포화도: 88 },
    { date: '06-20', WBC: 7.3, RBC: 5.1, 혈압: 161, 맥박: 96, 체온: 37.4, 산소포화도: 90 }
  ],
  12: [ // 김 유리
    { date: '06-01', WBC: 4.0, RBC: 3.6, 혈압: 95, 맥박: 58, 체온: 35.9, 산소포화도: 100 },
    { date: '06-05', WBC: 4.1, RBC: 3.7, 혈압: 97, 맥박: 60, 체온: 36.0, 산소포화도: 99 },
    { date: '06-10', WBC: 3.9, RBC: 3.5, 혈압: 93, 맥박: 56, 체온: 35.8, 산소포화도: 100 },
    { date: '06-15', WBC: 4.2, RBC: 3.8, 혈압: 99, 맥박: 62, 체온: 36.1, 산소포화도: 99 },
    { date: '06-20', WBC: 4.0, RBC: 3.6, 혈압: 96, 맥박: 59, 체온: 35.9, 산소포화도: 100 }
  ],
  17: [ // 환 김
    { date: '06-01', WBC: 5.8, RBC: 4.5, 혈압: 135, 맥박: 82, 체온: 36.9, 산소포화도: 96 },
    { date: '06-05', WBC: 6.0, RBC: 4.6, 혈압: 138, 맥박: 84, 체온: 37.0, 산소포화도: 95 },
    { date: '06-10', WBC: 5.7, RBC: 4.4, 혈압: 132, 맥박: 80, 체온: 36.8, 산소포화도: 97 },
    { date: '06-15', WBC: 6.1, RBC: 4.7, 혈압: 140, 맥박: 86, 체온: 37.1, 산소포화도: 94 },
    { date: '06-20', WBC: 5.9, RBC: 4.5, 혈압: 136, 맥박: 83, 체온: 36.9, 산소포화도: 96 }
  ]
};

// 환자별 오믹스 분석 결과 (실제 환자 ID 기반)
export const patientOmicsData = {
  1: [ // 김 이박
    { name: 'EGFR', expression: 2.5, pValue: 0.002, status: '상향조절' },
    { name: 'KRAS', expression: 1.8, pValue: 0.008, status: '상향조절' },
    { name: 'TP53', expression: 0.7, pValue: 0.012, status: '하향조절' },
    { name: 'PIK3CA', expression: 2.2, pValue: 0.004, status: '상향조절' }
  ],
  2: [ // Jane Doe
    { name: 'BRCA2', expression: 1.9, pValue: 0.003, status: '상향조절' },
    { name: 'PIK3CA', expression: 2.1, pValue: 0.007, status: '상향조절' },
    { name: 'APC', expression: 0.6, pValue: 0.015, status: '하향조절' },
    { name: 'MYC', expression: 2.8, pValue: 0.0005, status: '상향조절' }
  ],
  3: [ // Park Yeaseng (신장암 환자)
    { name: 'VHL', expression: 0.3, pValue: 0.001, status: '하향조절' },
    { name: 'PBRM1', expression: 0.5, pValue: 0.003, status: '하향조절' },
    { name: 'SETD2', expression: 0.7, pValue: 0.008, status: '하향조절' },
    { name: 'BAP1', expression: 0.4, pValue: 0.005, status: '하향조절' }
  ],
  4: [ // 강 경화 (간암 환자)
    { name: 'AFP', expression: 4.2, pValue: 0.0001, status: '상향조절' },
    { name: 'TERT', expression: 3.5, pValue: 0.0002, status: '상향조절' },
    { name: 'CTNNB1', expression: 2.8, pValue: 0.001, status: '상향조절' },
    { name: 'ARID1A', expression: 0.4, pValue: 0.008, status: '하향조절' }
  ],
  5: [ // 팽 희 (갑상선암 환자)
    { name: 'RET', expression: 3.2, pValue: 0.0002, status: '상향조절' },
    { name: 'BRAF', expression: 2.8, pValue: 0.0005, status: '상향조절' },
    { name: 'RAS', expression: 2.1, pValue: 0.003, status: '상향조절' },
    { name: 'TP53', expression: 0.6, pValue: 0.015, status: '하향조절' }
  ],
  6: [ // 이 선아 (위암 환자)
    { name: 'CDH1', expression: 0.3, pValue: 0.002, status: '하향조절' },
    { name: 'TP53', expression: 2.9, pValue: 0.0003, status: '상향조절' },
    { name: 'PIK3CA', expression: 2.4, pValue: 0.001, status: '상향조절' },
    { name: 'ARID1A', expression: 0.5, pValue: 0.012, status: '하향조절' }
  ],
  7: [ // 신 장훈 (신장암 환자)
    { name: 'VHL', expression: 0.2, pValue: 0.001, status: '하향조절' },
    { name: 'PBRM1', expression: 0.4, pValue: 0.005, status: '하향조절' },
    { name: 'SETD2', expression: 0.6, pValue: 0.008, status: '하향조절' },
    { name: 'KDM5C', expression: 0.7, pValue: 0.015, status: '하향조절' }
  ],
  8: [ // 남 소영
    { name: 'HER2', expression: 1.5, pValue: 0.008, status: '상향조절' },
    { name: 'ESR1', expression: 2.0, pValue: 0.006, status: '상향조절' },
    { name: 'CDKN2A', expression: 0.5, pValue: 0.018, status: '하향조절' },
    { name: 'CCND1', expression: 2.3, pValue: 0.003, status: '상향조절' }
  ],
  9: [ // 유 빈
    { name: 'RAS', expression: 3.2, pValue: 0.0002, status: '상향조절' },
    { name: 'P16', expression: 0.4, pValue: 0.01, status: '하향조절' },
    { name: 'VEGF', expression: 2.5, pValue: 0.004, status: '상향조절' },
    { name: 'PTEN', expression: 0.8, pValue: 0.025, status: '하향조절' }
  ],
  11: [ // 김 사다함
    { name: 'MDM2', expression: 2.7, pValue: 0.001, status: '상향조절' },
    { name: 'RB1', expression: 0.3, pValue: 0.005, status: '하향조절' },
    { name: 'CDKN1A', expression: 1.2, pValue: 0.012, status: '상향조절' },
    { name: 'BCL2', expression: 2.9, pValue: 0.0008, status: '상향조절' }
  ],
  12: [ // 김 유리
    { name: 'BRCA1', expression: 1.2, pValue: 0.01, status: '상향조절' },
    { name: 'ATM', expression: 0.8, pValue: 0.02, status: '하향조절' },
    { name: 'CHEK2', expression: 1.5, pValue: 0.008, status: '상향조절' },
    { name: 'PALB2', expression: 0.9, pValue: 0.025, status: '하향조절' }
  ],
  17: [ // 환 김
    { name: 'BRAF', expression: 3.0, pValue: 0.0003, status: '상향조절' },
    { name: 'NRAS', expression: 2.4, pValue: 0.002, status: '상향조절' },
    { name: 'CDKN2A', expression: 0.3, pValue: 0.006, status: '하향조절' },
    { name: 'MLH1', expression: 0.5, pValue: 0.01, status: '하향조절' }
  ]
};

// 환자별 처방약 목록 (실제 환자 ID 기반)
export const patientMedications = {
  1: [ // 김 이박
    { name: '메트포르민', dosage: '500mg', frequency: '1일 2회', duration: '30일', category: '당뇨' },
    { name: '리시노프릴', dosage: '10mg', frequency: '1일 1회', duration: '30일', category: '혈압' },
    { name: '심바스타틴', dosage: '20mg', frequency: '1일 1회', duration: '30일', category: '콜레스테롤' },
    { name: '아스피린', dosage: '100mg', frequency: '1일 1회', duration: '30일', category: '심혈관' }
  ],
  2: [ // Jane Doe
    { name: '철분제', dosage: '325mg', frequency: '1일 1회', duration: '60일', category: '빈혈' },
    { name: '엽산', dosage: '5mg', frequency: '1일 1회', duration: '60일', category: '빈혈' },
    { name: '비타민D', dosage: '1000IU', frequency: '1일 1회', duration: '90일', category: '영양제' }
  ],
  3: [ // Park Yeaseng (신장암 환자)
    { name: '수니티닙', dosage: '50mg', frequency: '1일 1회', duration: '28일', category: '항암제' },
    { name: '발사르탄', dosage: '80mg', frequency: '1일 1회', duration: '30일', category: '혈압' },
    { name: '에포에틴 알파', dosage: '4000IU', frequency: '주 3회', duration: '30일', category: '빈혈' },
    { name: '알로푸리놀', dosage: '300mg', frequency: '1일 1회', duration: '30일', category: '통풍' },
    { name: '푸로세미드', dosage: '40mg', frequency: '1일 1회', duration: '30일', category: '이뇨제' }
  ],
  4: [ // 강 경화 (간암 환자)
    { name: '소라페닙', dosage: '400mg', frequency: '1일 2회', duration: '30일', category: '항암제' },
    { name: '우르소데옥시콜산', dosage: '250mg', frequency: '1일 3회', duration: '30일', category: '간보호' },
    { name: '라니티딘', dosage: '150mg', frequency: '1일 2회', duration: '30일', category: '위장보호' },
    { name: '푸로세미드', dosage: '40mg', frequency: '1일 1회', duration: '30일', category: '이뇨제' }
  ],
  5: [ // 팽 희 (갑상선암 환자)
    { name: '레보티록신', dosage: '100mcg', frequency: '1일 1회', duration: '30일', category: '갑상선호르몬' },
    { name: '메티마졸', dosage: '10mg', frequency: '1일 2회', duration: '30일', category: '항갑상선제' },
    { name: '칼슘', dosage: '500mg', frequency: '1일 2회', duration: '30일', category: '영양제' },
    { name: '비타민D', dosage: '1000IU', frequency: '1일 1회', duration: '30일', category: '영양제' }
  ],
  6: [ // 이 선아 (위암 환자)
    { name: '카페시타빈', dosage: '1250mg', frequency: '1일 2회', duration: '14일', category: '항암제' },
    { name: '옥살리플라틴', dosage: '85mg/m²', frequency: '3주마다', duration: '1회', category: '항암제' },
    { name: '온단세트론', dosage: '8mg', frequency: '필요시', duration: '30일', category: '구토방지' },
    { name: '오메프라졸', dosage: '20mg', frequency: '1일 1회', duration: '30일', category: '위장보호' }
  ],
  7: [ // 신 장훈 (신장암 환자)
    { name: '수니티닙', dosage: '50mg', frequency: '1일 1회', duration: '28일', category: '항암제' },
    { name: '발사르탄', dosage: '80mg', frequency: '1일 1회', duration: '30일', category: '혈압' },
    { name: '알로푸리놀', dosage: '300mg', frequency: '1일 1회', duration: '30일', category: '통풍' },
    { name: '에포에틴 알파', dosage: '4000IU', frequency: '주 3회', duration: '30일', category: '빈혈' }
  ],
  8: [ // 남 소영
    { name: '철분제', dosage: '325mg', frequency: '1일 1회', duration: '60일', category: '빈혈' },
    { name: '비타민B12', dosage: '1000mcg', frequency: '1일 1회', duration: '30일', category: '영양제' },
    { name: '프로바이오틱스', dosage: '1캡슐', frequency: '1일 1회', duration: '30일', category: '장건강' }
  ],
  9: [ // 유 빈
    { name: '메트포르민', dosage: '850mg', frequency: '1일 2회', duration: '30일', category: '당뇨' },
    { name: '암로디핀', dosage: '5mg', frequency: '1일 1회', duration: '30일', category: '혈압' },
    { name: '아토르바스타틴', dosage: '20mg', frequency: '1일 1회', duration: '30일', category: '콜레스테롤' }
  ],
  11: [ // 김 사다함
    { name: '인슐린 글라진', dosage: '30units', frequency: '1일 1회', duration: '30일', category: '당뇨' },
    { name: '인슐린 휴마로그', dosage: '10units', frequency: '식전 3회', duration: '30일', category: '당뇨' },
    { name: '메트포르민', dosage: '1000mg', frequency: '1일 2회', duration: '30일', category: '당뇨' },
    { name: '텔미사르탄', dosage: '80mg', frequency: '1일 1회', duration: '30일', category: '혈압' },
    { name: '아스피린', dosage: '100mg', frequency: '1일 1회', duration: '30일', category: '심혈관' }
  ],
  12: [ // 김 유리
    { name: '철분제', dosage: '325mg', frequency: '1일 1회', duration: '60일', category: '빈혈' },
    { name: '비타민D3', dosage: '2000IU', frequency: '1일 1회', duration: '90일', category: '영양제' },
    { name: '비타민B12', dosage: '1000mcg', frequency: '1일 1회', duration: '30일', category: '영양제' },
    { name: '칼슘', dosage: '600mg', frequency: '1일 2회', duration: '90일', category: '영양제' }
  ],
  17: [ // 환 김
    { name: '비칼루타미드', dosage: '50mg', frequency: '1일 1회', duration: '30일', category: '항암제' },
    { name: '류프롤리드', dosage: '7.5mg', frequency: '월 1회', duration: '1회', category: '호르몬치료' },
    { name: '탐수로신', dosage: '0.4mg', frequency: '1일 1회', duration: '30일', category: '전립선' },
    { name: '피나스테리드', dosage: '5mg', frequency: '1일 1회', duration: '30일', category: '전립선' }
  ]
};

// 기본 정보 가져오기 함수
export const getPatientBasicInfo = (patientId) => {
  const numericId = parseInt(patientId);
  return patientBasicInfo[numericId] || {
    height: '정보 없음',
    weight: '정보 없음',
    blood_type: '정보 없음',
    allergies: '정보 없음',
    smoking: '정보 없음'
  };
};

// 데이터 가져오기 함수들 (openemr_id 기반으로 수정)
export const getPatientVitalData = (patientId) => {
  // openemr_id를 숫자로 변환하여 매핑
  const numericId = parseInt(patientId);
  return patientVitalData[numericId] || [];
};

export const getPatientOmicsData = (patientId) => {
  const numericId = parseInt(patientId);
  return patientOmicsData[numericId] || [];
};

export const getPatientMedications = (patientId) => {
  const numericId = parseInt(patientId);
  return patientMedications[numericId] || [];
};

// 환자별 진료기록 가져오기 함수
export const getPatientMedicalRecords = (patientId) => {
  const numericId = parseInt(patientId);
  return patientMedicalRecords[numericId] || [];
};

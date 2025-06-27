// 각 라벨 ID에 대한 RGBA 색상 값을 정의합니다. (0~1 범위)
export const organColorMap = {
    // Label 이름: [R, G, B, Opacity]
    "spleen": { color: [1, 0, 0, 0.5] },       // 1: 비장 (빨강)
    "kidney_right": { color: [0, 1, 0, 0.5] },  // 2: 우측 신장 (초록)
    "kidney_left": { color: [0, 0, 1, 0.5] },   // 3: 좌측 신장 (파랑)
    "liver": { color: [1, 0.5, 0, 0.5] },     // 5: 간 (주황)
    "stomach": { color: [1, 1, 0, 0.5] },     // 6: 위 (노랑)
    "pancreas": { color: [0.5, 0, 0.5, 0.5] }, // 10: 췌장 (보라)
    "colon": { color: [0, 0.5, 0.5, 0.5] },     // 48: 대장 (청록)
    "lung_upper_lobe_left": { color: [0.5, 0.8, 1, 0.5] },  // 13: 좌측 상엽 (하늘색)
    "lung_lower_lobe_left": { color: [0.5, 0.8, 1, 0.5] },  // 14: 좌측 하엽 (하늘색)
    "lung_upper_lobe_right": { color: [0.5, 1, 0.8, 0.5] }, // 15: 우측 상엽 (민트색)
    "lung_middle_lobe_right": { color: [0.5, 1, 0.8, 0.5] },// 16: 우측 중엽 (민트색)
    "lung_lower_lobe_right": { color: [0.5, 1, 0.8, 0.5] }, // 17: 우측 하엽 (민트색)

    // 필요한 다른 장기들도 여기에 추가...
};

// 백엔드의 LABEL_MAP (숫자 ID)에 맞춰 색상을 매핑하는 객체 생성
// { 1: {color: [1,0,0,0.5]}, 2: {color: [0,1,0,0.5]}, ... }
export const niiVueColorMap = {
    "spleen": 1, "kidney_right": 2, "kidney_left": 3, "liver": 5,
    "stomach": 6, "pancreas": 10, "colon": 48,
    "lung_upper_lobe_left": 13, "lung_lower_lobe_left": 14, "lung_upper_lobe_right": 15,
    "lung_middle_lobe_right": 16, "lung_lower_lobe_right": 17
};

// 최종 NiiVue에 전달할 colormapLabel 객체
export const colormapLabel = {
    colormaps: [{
        name: 'OrganMap',
        labels: Object.keys(organColorMap).map(name => ({
            name: name,
            color: organColorMap[name].color,
            label: niiVueColorMap[name]
        }))
    }]
};
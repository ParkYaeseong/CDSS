import React, { useEffect, useRef } from 'react';
import { Niivue } from '@niivue/niivue';
import { Box } from '@mui/material';
import { colormapLabel } from '../utils/colorMaps';

const IntegratedViewer = ({ baseCtUrl, organSegUrl, tumorSegUrl }) => {
  const canvasRef = useRef(null);
  const nv = useRef(null); // NiiVue 인스턴스를 저장하기 위한 ref

  useEffect(() => {
    // 캔버스가 준비되지 않았거나, 기본 CT 이미지가 없으면 아무것도 하지 않음
    if (!canvasRef.current || !baseCtUrl) return;

    // NiiVue 인스턴스가 아직 생성되지 않았을 때만 새로 생성
    if (!nv.current) {
      nv.current = new Niivue({
        dragAndDropEnabled: false,
        loadingText: '로딩 중...',
        isColorbar: false,
      });
      nv.current.attachTo(canvasRef.current);
    }

    // 표시할 볼륨 목록 구성
    const volumes = [
      {
        url: `${process.env.REACT_APP_API_BASE_URL || ''}${baseCtUrl}`,
        colormap: "gray",
        opacity: 1.0,
      }
    ];

    if (organSegUrl) {
      volumes.push({
        url: `${process.env.REACT_APP_API_BASE_URL || ''}${organSegUrl}`,
        colormap: "OrganMap",
        colormapLabel: colormapLabel,
        opacity: 0.5,
      });
    }

    if (tumorSegUrl) {
      volumes.push({
        url: `${process.env.REACT_APP_API_BASE_URL || ''}${tumorSegUrl}`,
        colormap: "red",
        opacity: 0.8,
      });
    }
    
    // NiiVue 인스턴스에 볼륨 로드
    (async () => {
      try {
        await nv.current.loadVolumes(volumes);
      } catch (error) {
        console.error("Failed to load NIfTI volumes:", error);
      }
    })();

    // 컴포넌트가 화면에서 사라질 때 실행될 정리 함수
    return () => {
      // nv.current가 존재하고, destroy 메서드가 있다면 실행하여 메모리 누수 방지
      if (nv.current && typeof nv.current.destroy === 'function') {
        nv.current.destroy();
        nv.current = null;
      }
    };
  }, [baseCtUrl, organSegUrl, tumorSegUrl]); // URL이 바뀔 때마다 이 effect가 다시 실행됨

  return (
    <Box sx={{ width: '100%', height: '600px', position: 'relative', backgroundColor: 'black' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </Box>
  );
};

export default IntegratedViewer;
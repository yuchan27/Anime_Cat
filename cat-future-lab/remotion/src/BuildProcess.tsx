import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

const steps = [
  {
    title: '01 城市訊號',
    text: '從城市天氣、時間與環境感建立可探索的互動入口。',
    image: staticFile('images/cat-hero-cartoon.png')
  },
  {
    title: '02 觀測視覺',
    text: '以動畫風角色作為輕量導覽，讓資料場景更容易被記住。',
    image: staticFile('images/cat-observer-cartoon-wide.png')
  },
  {
    title: '03 互動資料',
    text: '串接 3D 場域、城市資料面板與 AI 導覽，形成連續探索流程。',
    image: staticFile('images/cat-weather-cartoon.png')
  },
  {
    title: '04 體驗路線',
    text: '以導覽手冊、循環影像與可用性設計完成網站體驗。',
    image: staticFile('images/cat-hero-cartoon.png')
  }
];

export const BuildProcess: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const stepFrames = durationInFrames / steps.length;
  const index = Math.min(steps.length - 1, Math.floor(frame / stepFrames));
  const current = steps[index];
  const stepProgress = (frame % stepFrames) / stepFrames;

  const fadeIn = interpolate(stepProgress, [0, 0.15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const fadeOut = interpolate(stepProgress, [0.86, 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const panelOpacity = Math.min(fadeIn, fadeOut);
  const imageScale = interpolate(Math.sin((frame / fps) * 0.7), [-1, 1], [1.01, 1.08]);

  return (
    <AbsoluteFill
      style={{
        fontFamily: 'Noto Sans TC, PingFang TC, Microsoft JhengHei, sans-serif',
        background: '#11131f',
        color: '#f7f2e4'
      }}
    >
      <Img
        src={current.image}
        style={{
          position: 'absolute',
          inset: -40,
          width: 'calc(100% + 80px)',
          height: 'calc(100% + 80px)',
          objectFit: 'cover',
          transform: `scale(${imageScale})`,
          filter: 'brightness(0.58) saturate(1.12)'
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(120deg, rgba(17,19,31,0.84) 0%, rgba(17,19,31,0.62) 46%, rgba(17,19,31,0.9) 100%)'
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 84,
          right: 84,
          bottom: 84,
          border: '4px solid #f7f2e4',
          background: 'rgba(17,19,31,0.64)',
          boxShadow: '10px 10px 0 rgba(0,0,0,0.45)',
          padding: '26px 30px',
          opacity: panelOpacity
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '0.04em', color: '#dce86a' }}>
          城市訊號 / 互動導覽
        </div>
        <div style={{ marginTop: 16, fontSize: 62, fontWeight: 900, lineHeight: 1.05 }}>
          {current.title}
        </div>
        <div style={{ marginTop: 18, fontSize: 34, lineHeight: 1.5 }}>
          {current.text}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 48,
          right: 48,
          padding: '10px 16px',
          border: '3px solid #f7f2e4',
          background: 'rgba(81,214,208,0.22)',
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: '0.04em'
        }}
      >
        Cat Future Lab
      </div>
    </AbsoluteFill>
  );
};

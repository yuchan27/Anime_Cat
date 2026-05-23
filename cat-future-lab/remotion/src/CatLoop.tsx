import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';

type CatLoopProps = {
  title: string;
  subtitle: string;
};

type Shot = {
  src: string;
  tag: string;
  note: string;
};

const palette = {
  ink: '#11131f',
  paper: '#f7f2e4',
  cyan: '#51d6d0',
  coral: '#f36f52',
  moss: '#dce86a',
  navy: '#142e55'
};

const shots: Shot[] = [
  {
    src: staticFile('images/cat-hero-cartoon.png'),
    tag: 'LAB 主場景',
    note: '導覽貓進入實驗室並啟動 HUD 訊號'
  },
  {
    src: staticFile('images/cat-observer-cartoon-wide.png'),
    tag: '觀測段落',
    note: '城市光景延展故事層與情緒節奏'
  },
  {
    src: staticFile('images/cat-weather-cartoon.png'),
    tag: '天氣節點',
    note: '互動天氣控制台串接城市資料訊號'
  }
];

export const CatLoop: React.FC<CatLoopProps> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const cycle = frame % durationInFrames;
  const shotLength = durationInFrames / shots.length;
  const shotIndex = Math.floor(cycle / shotLength);
  const shotProgress = (cycle % shotLength) / shotLength;
  const nextShot = (shotIndex + 1) % shots.length;

  const shotFade = interpolate(shotProgress, [0.68, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0.95, 0.2, 1)
  });

  const panX = interpolate(Math.sin((frame / fps) * 0.52), [-1, 1], [-28, 28]);
  const panY = interpolate(Math.cos((frame / fps) * 0.66), [-1, 1], [-16, 16]);
  const zoom = interpolate(Math.sin((frame / fps) * 0.45), [-1, 1], [1.03, 1.11]);
  const scanX = interpolate(frame % Math.round(2.7 * fps), [0, 2.7 * fps], [0, 1620], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.linear
  });

  const orbit = interpolate((frame % Math.round(8 * fps)) / (8 * fps), [0, 1], [0, 360], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const mascotPulse = interpolate(Math.sin((frame / fps) * 2.8), [-1, 1], [0.95, 1.05]);
  const shoulder = interpolate(Math.sin((frame / fps) * 3.4), [-1, 1], [-15, 14]);
  const elbow = interpolate(Math.sin((frame / fps) * 3.4 + 1.1), [-1, 1], [24, -18]);
  const floatY = interpolate(Math.sin((frame / fps) * 1.6), [-1, 1], [-10, 10]);

  const currentShot = shots[shotIndex];
  const upcomingShot = shots[nextShot];

  return (
    <AbsoluteFill
      style={{
        fontFamily: 'Noto Sans TC, PingFang TC, Microsoft JhengHei, Arial, sans-serif',
        background: palette.paper,
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -40,
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`
        }}
      >
        <Img
          src={currentShot.src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'saturate(1.2) contrast(1.08)'
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          inset: -40,
          opacity: shotFade,
          transform: `translate(${-panX}px, ${-panY}px) scale(${zoom + 0.03})`
        }}
      >
        <Img
          src={upcomingShot.src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'saturate(1.23) contrast(1.06)'
          }}
        />
      </div>

      <svg width="1600" height="900" viewBox="0 0 1600 900" aria-label="貓咪循環影片圖層">
        <defs>
          <radialGradient id="vignette">
            <stop offset="34%" stopColor="rgba(17,19,31,0)" />
            <stop offset="100%" stopColor="rgba(17,19,31,0.52)" />
          </radialGradient>
          <linearGradient id="scanline" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(81,214,208,0.18)" />
            <stop offset="100%" stopColor="rgba(243,111,82,0.08)" />
          </linearGradient>
        </defs>

        <rect width="1600" height="900" fill="url(#vignette)" />
        <rect width="1600" height="900" fill="url(#scanline)" />

        <g opacity="0.14" stroke={palette.paper} strokeWidth="2">
          {Array.from({ length: 12 }).map((_, i) => (
            <path key={`h-${i}`} d={`M0 ${i * 80}H1600`} />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <path key={`v-${i}`} d={`M${i * 80} 0V900`} />
          ))}
        </g>

        <g transform={`translate(1240 640) scale(${mascotPulse})`}>
          <path d="M-212-176-286-332l168 134M204-176l74-156-172 134" fill="none" stroke={palette.navy} strokeWidth="18" />
          <rect x="-218" y="-174" width="438" height="146" rx="30" fill={palette.moss} stroke={palette.navy} strokeWidth="14" />
          <path d="M-108-98h84M24-98h84" stroke={palette.navy} strokeWidth="14" strokeLinecap="round" />
          <path d="M-82-62c42 30 88 30 130 0" fill="none" stroke={palette.navy} strokeWidth="11" strokeLinecap="round" />
          <g transform={`translate(-14 -74) rotate(${shoulder})`}>
            <rect x="-188" y="-14" width="120" height="28" rx="14" fill={palette.cyan} stroke={palette.navy} strokeWidth="8" />
            <g transform={`translate(-184 0) rotate(${elbow})`}>
              <rect x="-88" y="-12" width="94" height="24" rx="12" fill="#b8eff0" stroke={palette.navy} strokeWidth="8" />
              <circle cx="-96" cy="0" r="16" fill="#ffd9ec" stroke={palette.navy} strokeWidth="8" />
            </g>
          </g>
          <path
            d="M-302 12 C -210 -108, -104 -94, 6 -32 S 202 26, 332 -118"
            fill="none"
            stroke={palette.coral}
            strokeWidth="16"
            strokeLinecap="round"
          />
          <circle cx="334" cy="-120" r="18" fill={palette.paper} stroke={palette.navy} strokeWidth="8" />
        </g>

        <g transform={`translate(1220 642) rotate(${orbit})`}>
          <circle cx="0" cy="0" r="206" fill="none" stroke="rgba(81,214,208,0.56)" strokeWidth="10" strokeDasharray="18 14" />
          <circle cx="0" cy="0" r="246" fill="none" stroke="rgba(243,111,82,0.48)" strokeWidth="7" strokeDasharray="12 22" />
        </g>

        <rect x={scanX} y="0" width="12" height="900" fill={palette.cyan} opacity="0.34" />

        <rect x="62" y="56" width="700" height="216" fill="rgba(247,242,228,0.9)" stroke={palette.ink} strokeWidth="4" />
        <text x="94" y="132" fontSize="62" fontWeight="800" fill={palette.ink}>{title}</text>
        <text x="94" y="192" fontSize="30" fontWeight="700" fill={palette.ink}>{subtitle}</text>
        <text x="94" y="238" fontSize="28" fontWeight="700" fill={palette.navy}>{currentShot.tag}</text>
        <text x="356" y="238" fontSize="24" fontWeight="500" fill={palette.navy}>{currentShot.note}</text>

        <rect x="66" y="744" width="1468" height="108" fill="rgba(17,19,31,0.88)" />
        <text x="96" y="800" fontSize="34" fontWeight="700" fill={palette.paper}>
          貓咪互動循環片段 / 溫馨動畫節奏
        </text>
        <text x="96" y="836" fontSize="24" fontWeight="500" fill={palette.moss}>
          Anime.js 節奏語法 / Three.js HUD 視覺 / Remotion frame pipeline
        </text>
      </svg>

      <div
        style={{
          position: 'absolute',
          right: 72,
          top: 82,
          width: 292,
          border: `4px solid ${palette.ink}`,
          background: 'rgba(247, 242, 228, 0.9)',
          boxShadow: '10px 10px 0 rgba(17,19,31,0.82)',
          padding: '14px 16px 12px'
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, color: palette.navy, marginBottom: 8 }}>下一段畫面</div>
        <div style={{ fontSize: 34, fontWeight: 800, color: palette.ink, marginBottom: 6 }}>{upcomingShot.tag}</div>
        <div style={{ fontSize: 21, lineHeight: 1.3, color: palette.navy }}>{upcomingShot.note}</div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 64,
          top: 312 + floatY,
          width: 540,
          border: `4px solid ${palette.ink}`,
          background: 'rgba(247,242,228,0.82)',
          boxShadow: '10px 10px 0 rgba(17,19,31,0.72)',
          padding: '14px 18px',
          fontSize: 24,
          lineHeight: 1.45,
          color: palette.navy
        }}
      >
        Cat Future Lab 以貓咪元素作為互動導引：節奏提示、訊號標記與情緒推進。
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

type CatLoopProps = {
  title: string;
  subtitle: string;
};

const palette = {
  ink: '#10140f',
  paper: '#f4f0df',
  moss: '#dce86a',
  cyan: '#51d6d0',
  coral: '#f36f52'
};

export const CatLoop: React.FC<CatLoopProps> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const orbit = interpolate(frame % 150, [0, 150], [0, 360]);
  const blink = frame % 120 > 54 && frame % 120 < 62 ? 0.18 : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: palette.paper, overflow: 'hidden', fontFamily: 'Chivo, Arial, sans-serif' }}>
      <svg width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="Cat Future Lab animated title card">
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M80 0H0V80" fill="none" stroke={palette.ink} strokeOpacity="0.12" strokeWidth="4" />
          </pattern>
        </defs>
        <rect width="1600" height="900" fill="url(#grid)" />
        <g transform={`rotate(${orbit} 800 500)`}>
          <circle cx="800" cy="500" r="330" fill="none" stroke={palette.cyan} strokeWidth="18" strokeDasharray="40 28" />
          <circle cx="800" cy="500" r="410" fill="none" stroke={palette.coral} strokeWidth="14" strokeDasharray="18 42" />
        </g>
        <g transform={`translate(0 ${Math.sin(frame / 18) * 18}) scale(${0.96 + pulse * 0.04})`} style={{ transformOrigin: '800px 520px' }}>
          <path d="M360 620 315 260l245 195c138-62 342-62 480 0l245-195-45 360c102 160-34 290-440 290S258 780 360 620Z" fill={palette.moss} stroke={palette.ink} strokeWidth="18" strokeLinejoin="round" />
          <ellipse cx="655" cy="590" rx="42" ry={42 * blink} fill={palette.ink} />
          <ellipse cx="945" cy="590" rx="42" ry={42 * blink} fill={palette.ink} />
          <path d="M735 710c42 34 88 34 130 0" fill="none" stroke={palette.ink} strokeWidth="18" strokeLinecap="round" />
        </g>
        <text x="800" y="120" textAnchor="middle" fontSize="78" fontWeight="800" fill={palette.ink}>{title}</text>
        <text x="800" y="826" textAnchor="middle" fontSize="36" fontWeight="700" fill={palette.ink}>{subtitle}</text>
      </svg>
    </AbsoluteFill>
  );
};

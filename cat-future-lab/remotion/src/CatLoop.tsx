import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

type CatLoopProps = {
  title: string;
  subtitle: string;
};

const palette = {
  ink: '#11131f',
  paper: '#f7f2e4',
  moss: '#dce86a',
  cyan: '#51d6d0',
  coral: '#f36f52',
  violet: '#7766d8'
};

export const CatLoop: React.FC<CatLoopProps> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = interpolate(frame, [0, 1.4 * fps], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const orbit = interpolate(frame % (5 * fps), [0, 5 * fps], [0, 360]);
  const scan = interpolate(frame % (2.4 * fps), [0, 2.4 * fps], [120, 1480]);
  const blink = frame % 110 > 50 && frame % 110 < 58 ? 0.16 : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: palette.paper, overflow: 'hidden', fontFamily: 'Arial, sans-serif' }}>
      <svg width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="Cat Future Lab signal loop">
        <rect width="1600" height="900" fill={palette.paper} />
        <g opacity="0.18" stroke={palette.ink} strokeWidth="4">
          {Array.from({ length: 18 }).map((_, i) => <path key={`h-${i}`} d={`M0 ${i * 56}H1600`} />)}
          {Array.from({ length: 28 }).map((_, i) => <path key={`v-${i}`} d={`M${i * 64} 0V900`} />)}
        </g>
        <g transform={`translate(800 458) scale(${0.9 + enter * 0.1})`} opacity={enter}>
          <g transform={`rotate(${orbit})`}>
            <circle r="330" fill="none" stroke={palette.cyan} strokeWidth="18" strokeDasharray="42 26" />
            <circle r="430" fill="none" stroke={palette.coral} strokeWidth="12" strokeDasharray="18 42" />
            <path d="M-520 0C-300-190-160 168 0 0S310-210 520 0" fill="none" stroke={palette.violet} strokeWidth="22" strokeLinecap="round" />
          </g>
          <path d="M-260-72-340-262l208 142M260-72l80-190-208 142" fill="none" stroke={palette.ink} strokeWidth="22" strokeLinejoin="round" />
          <rect x="-250" y="-72" width="500" height="198" rx="30" fill={palette.moss} stroke={palette.ink} strokeWidth="18" />
          <g transform={`scale(1 ${blink})`}>
            <path d="M-160 30h118M42 30h118" stroke={palette.ink} strokeWidth="22" strokeLinecap="round" />
          </g>
          <path d="M-110 92C-46 126 46 126 110 92" fill="none" stroke={palette.ink} strokeWidth="18" strokeLinecap="round" />
        </g>
        <rect x={scan} y="0" width="12" height="900" fill={palette.cyan} opacity="0.55" />
        <text x="92" y="130" fontSize="78" fontWeight="800" fill={palette.ink}>{title}</text>
        <text x="96" y="812" fontSize="36" fontWeight="700" fill={palette.ink}>{subtitle}</text>
        <text x="1168" y="812" fontSize="28" fontWeight="700" fill={palette.ink}>REMOTION MATERIAL / OPTIONAL LOOP</text>
      </svg>
    </AbsoluteFill>
  );
};

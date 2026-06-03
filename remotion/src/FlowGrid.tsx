import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

const GRID = `repeating-linear-gradient(0deg, transparent 0 38px, rgba(255,255,255,0.05) 38px 40px), repeating-linear-gradient(90deg, transparent 0 38px, rgba(255,255,255,0.05) 38px 40px)`;

// 流动网格背景: 网格缓慢斜向平移 + 两团柔光斑游动 (像水面光流过)
export const FlowGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const gx = (frame * 0.5) % 40;
  const gy = (frame * 0.32) % 40;
  const b1x = 50 + 28 * Math.sin(t * 0.35);
  const b1y = 42 + 22 * Math.cos(t * 0.28);
  const b2x = 48 + 32 * Math.cos(t * 0.22);
  const b2y = 60 + 26 * Math.sin(t * 0.2);
  return (
    <>
      <AbsoluteFill style={{backgroundColor: '#141414'}} />
      <AbsoluteFill style={{backgroundImage: GRID, backgroundPosition: `${gx}px ${gy}px`}} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 48% at ${b1x}% ${b1y}%, rgba(106,155,204,0.13), transparent 70%), radial-gradient(55% 45% at ${b2x}% ${b2y}%, rgba(255,212,0,0.08), transparent 70%)`,
          mixBlendMode: 'screen',
        }}
      />
    </>
  );
};

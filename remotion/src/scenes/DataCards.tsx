import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, poppins, lora} from '../theme';

const CARDS = [
  {n: '5', label: 'ERC-8004 agents', sub: 'Scout · Guard · Claw · Sentinel · Ledger', accent: C.ink},
  {n: '92/100', label: 'Sentinel validation', sub: 'independent re-simulation', accent: C.green},
  {n: '0.01', label: 'WMNT wrapped', sub: 'real Mantle DeFi action', accent: C.orange},
  {n: 'x402', label: 'MNT validator fee', sub: 'paid on-chain per cycle', accent: C.blue},
];

export const DataCards: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const title = spring({frame, fps, config: {damping: 200}});

  return (
    <AbsoluteFill style={{backgroundColor: C.bg, justifyContent: 'center', padding: '0 150px'}}>
      <div style={{opacity: title, transform: `translateY(${interpolate(title, [0, 1], [22, 0])}px)`}}>
        <h2 style={{margin: 0, fontFamily: poppins, fontWeight: 700, fontSize: 66, color: C.ink, letterSpacing: -1.5}}>
          One full treasury cycle
        </h2>
        <div style={{fontFamily: lora, fontSize: 32, color: C.inkSoft, marginTop: 14}}>
          every step on Mantle Sepolia, independently verifiable.
        </div>
      </div>

      <div style={{display: 'flex', gap: 28, marginTop: 70}}>
        {CARDS.map((c, i) => {
          const s = spring({frame: frame - 18 - i * 8, fps, config: {damping: 200}});
          return (
            <div
              key={i}
              style={{
                flex: 1, opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [44, 0])}px)`,
                backgroundColor: '#ffffff', borderRadius: 22, padding: '44px 36px',
                border: `1px solid ${C.grayLight}`, boxShadow: '0 10px 34px rgba(20,20,19,0.05)',
              }}
            >
              <div style={{fontFamily: poppins, fontWeight: 700, fontSize: 70, color: c.accent, letterSpacing: -2, lineHeight: 1}}>
                {c.n}
              </div>
              <div style={{fontFamily: poppins, fontWeight: 600, fontSize: 27, color: C.ink, marginTop: 14}}>
                {c.label}
              </div>
              <div style={{fontFamily: lora, fontSize: 22, color: C.inkSoft, marginTop: 8, lineHeight: 1.45}}>
                {c.sub}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

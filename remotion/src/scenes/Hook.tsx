import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, poppins, lora} from '../theme';

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const rise = (delay: number) => {
    const s = spring({frame: frame - delay, fps, config: {damping: 200}});
    return {opacity: s, transform: `translateY(${interpolate(s, [0, 1], [26, 0])}px)`};
  };

  const tag = interpolate(frame, [4, 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: C.bg, justifyContent: 'center', padding: '0 180px'}}>
      <div
        style={{
          position: 'absolute', top: 96, right: 180,
          fontFamily: poppins, fontSize: 22, fontWeight: 600, letterSpacing: 3,
          color: C.gray, opacity: tag,
        }}
      >
        MANTLE TURING TEST HACKATHON · TRACK 6
      </div>

      <h1 style={{margin: 0, fontFamily: poppins, fontWeight: 700, fontSize: 108, lineHeight: 1.07, color: C.ink, letterSpacing: -2.5}}>
        <div style={rise(0)}>The first wallet that</div>
        <div style={rise(9)}>
          <span style={{color: C.orange}}>grades</span> its own employees.
        </div>
      </h1>

      <div style={{...rise(26), marginTop: 50, fontFamily: lora, fontSize: 36, color: C.inkSoft, lineHeight: 1.5}}>
        Five ERC-8004 agents · one Mantle treasury · every action on-chain.
      </div>
    </AbsoluteFill>
  );
};

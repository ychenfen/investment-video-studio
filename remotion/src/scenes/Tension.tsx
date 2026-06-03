import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, poppins, lora} from '../theme';

export const Tension: React.FC = () => {
  const frame = useCurrentFrame();

  // 第一句: 淡入 -> 保持 -> 淡出 (到 frame 60 淡完)
  const a = interpolate(frame, [0, 16, 46, 60], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic),
  });
  // 第二句: frame 54 开始淡入, 与第一句淡出重叠 (dissolve, 不留空窗)
  const b = interpolate(frame, [54, 72], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  });
  const bShift = interpolate(frame, [54, 72], [22, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', padding: '0 220px', textAlign: 'center'}}>
      <div style={{position: 'absolute', opacity: a, fontFamily: lora, fontSize: 42, color: C.inkSoft}}>
        Most agent wallet demos stop at
        <div style={{fontFamily: poppins, fontWeight: 700, fontSize: 76, color: C.ink, marginTop: 18, letterSpacing: -1}}>
          “an AI can click a button.”
        </div>
      </div>

      <div style={{position: 'absolute', opacity: b, transform: `translateY(${bShift}px)`, fontFamily: lora, fontSize: 42, color: C.inkSoft}}>
        We solve the harder part —
        <div style={{fontFamily: poppins, fontWeight: 700, fontSize: 62, color: C.ink, marginTop: 22, lineHeight: 1.3, letterSpacing: -0.5}}>
          <span style={{color: C.orange}}>authorize</span> · <span style={{color: C.blue}}>execute</span> · <span style={{color: C.green}}>verify</span> · earn reputation
        </div>
      </div>
    </AbsoluteFill>
  );
};

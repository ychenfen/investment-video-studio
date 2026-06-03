import React from 'react';
import {AbsoluteFill, OffthreadVideo, Audio, Sequence, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {WebGLGrid} from './WebGLGrid';

const CN = '"PingFang SC", "Hiragino Sans GB", sans-serif';
const GRID = `repeating-linear-gradient(0deg, transparent 0 38px, rgba(255,255,255,0.05) 38px 40px), repeating-linear-gradient(90deg, transparent 0 38px, rgba(255,255,255,0.05) 38px 40px)`;
const stroke = (px: number) => ({WebkitTextStrokeWidth: `${px}px`, WebkitTextStrokeColor: '#000', paintOrder: 'stroke fill' as const});

// 字幕按云扬配音每句时长精确对齐 (30fps): 4.49/3.48/4.22/4.82/4.58s + 句间0.4s
const SUBS: Array<{from: number; to: number; parts: Array<[string, number]>}> = [
  {from: 0, to: 147, parts: [['黄仁勋台北 GTC，最重要的一件事', 0]]},
  {from: 147, to: 263, parts: [['他给 ', 0], ['AI Agent', 1], [' 下了清晰的定义', 0]]},
  {from: 263, to: 402, parts: [['Agent', 1], [' = 大模型 + 工具框架(', 0], ['Harness', 1], [')', 0]]},
  {from: 402, to: 559, parts: [['四步循环：', 0], ['观察 → 推理 → 行动 → 记忆', 1]]},
  {from: 559, to: 720, parts: [['未来十年 ', 0], ['AI 竞争的主战场', 1]]},
];
const DINGS = [147, 263, 402, 559];

export const NewsStyle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const titleIn = spring({frame, fps, config: {damping: 200}});
  const sub = SUBS.find((s) => frame >= s.from && frame < s.to) ?? SUBS[SUBS.length - 1];
  const subIn = spring({frame: frame - sub.from, fps, config: {damping: 200}});

  // 讲架构时 (句2-3, 263-559) 显示高亮框 + 箭头
  const annoOn = frame >= 263 && frame < 559;
  const annoIn = interpolate(frame, [263, 283], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pulse = 0.5 + 0.5 * Math.sin((frame - 263) / 8);

  return (
    <AbsoluteFill style={{backgroundColor: '#141414'}}>
      <WebGLGrid />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.78) 0%, transparent 26%, transparent 63%, rgba(0,0,0,0.82) 100%)'}} />

      {/* 配音(主) + BGM(压低 ducking) + 卡点音效 */}
      <Audio src={staticFile('voiceover.mp3')} volume={1} />
      <Audio src={staticFile('bgm.wav')} volume={0.14} />
      {DINGS.map((f, i) => (
        <Sequence key={i} from={f} durationInFrames={16}>
          <Audio src={staticFile('ding.wav')} volume={0.28} />
        </Sequence>
      ))}

      {/* 顶部标题 */}
      <div style={{position: 'absolute', top: 110, left: 40, right: 40, textAlign: 'center', opacity: titleIn, transform: `translateY(${interpolate(titleIn, [0, 1], [-24, 0])}px)`}}>
        <div style={{fontFamily: CN, fontWeight: 900, fontSize: 66, color: '#ffd400', ...stroke(2), textShadow: '0 4px 0 #000'}}>黄仁勋台北 GTC 演讲</div>
        <div style={{fontFamily: CN, fontWeight: 800, fontSize: 54, color: '#fff', ...stroke(2), marginTop: 14, lineHeight: 1.26, textShadow: '0 3px 0 #000'}}>一句话讲透<br />什么是 AI Agent</div>
        <div style={{fontFamily: CN, fontWeight: 800, fontSize: 48, color: '#ffd400', ...stroke(2), marginTop: 16, textShadow: '0 3px 0 #000'}}>Agent = LLM + 工具框架</div>
      </div>

      {/* 中央黄仁勋视频 + 高亮框 */}
      <div style={{position: 'absolute', top: 640, left: 30, right: 30, height: 591, borderRadius: 18, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.18)', boxShadow: '0 24px 70px rgba(0,0,0,0.65)'}}>
        <OffthreadVideo src={staticFile('center-video.mp4')} style={{width: '100%', height: '100%', objectFit: 'cover'}} muted />
        {annoOn && (
          <div style={{position: 'absolute', top: 168, left: 400, width: 205, height: 200, borderRadius: 12, border: `4px solid rgba(255,212,0,${0.5 + 0.5 * pulse})`, opacity: annoIn, boxShadow: '0 0 20px rgba(255,212,0,0.4)'}} />
        )}
      </div>

      {/* 箭头指向架构图 */}
      {annoOn && (
        <div style={{position: 'absolute', top: 1245, left: 0, right: 0, textAlign: 'center', opacity: annoIn, transform: `translateY(${interpolate(annoIn, [0, 1], [18, 0])}px)`}}>
          <svg width="110" height="70" viewBox="0 0 110 70" style={{filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.7))'}}>
            <path d="M55 8 L55 60 M55 8 L38 28 M55 8 L72 28" stroke="#ffd400" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* 字幕 (跟配音, 关键词橙色高亮) */}
      <div key={sub.from} style={{position: 'absolute', top: 1320, left: 0, right: 0, textAlign: 'center', opacity: subIn, transform: `translateY(${interpolate(subIn, [0, 1], [16, 0])}px)`}}>
        <span style={{display: 'inline-block', fontFamily: CN, fontWeight: 900, fontSize: 54, ...stroke(2.5), backgroundColor: 'rgba(0,0,0,0.45)', padding: '10px 30px', borderRadius: 12, textShadow: '0 4px 0 #000', lineHeight: 1.3}}>
          {sub.parts.map(([t, hl], i) => (
            <span key={i} style={{color: hl ? '#ffd400' : '#fff'}}>{t}</span>
          ))}
        </span>
      </div>

      {/* 大日期 */}
      <div style={{position: 'absolute', top: 1500, left: 0, right: 0, textAlign: 'center', fontFamily: CN, fontWeight: 900, fontSize: 138, color: '#fff', ...stroke(3.5), textShadow: '0 7px 0 #000, 4px 4px 12px rgba(0,0,0,0.9)', letterSpacing: 3}}>2026.6.1</div>
    </AbsoluteFill>
  );
};

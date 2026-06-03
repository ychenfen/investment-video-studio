import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import data from './stockData.json';
import {WebGLGrid} from './WebGLGrid';

const CN = '"PingFang SC", "Hiragino Sans GB", sans-serif';
const GRID = `repeating-linear-gradient(0deg, transparent 0 38px, rgba(255,255,255,0.05) 38px 40px), repeating-linear-gradient(90deg, transparent 0 38px, rgba(255,255,255,0.05) 38px 40px)`;
const stroke = (px: number) => ({WebkitTextStrokeWidth: `${px}px`, WebkitTextStrokeColor: '#000', paintOrder: 'stroke fill' as const});
const RED = '#e8453c';
const GREEN = '#2eaa6a';
const nvda = data.nvda;

// 字幕对齐 nvda-vo 配音 (N0 3.67s / N1 5.71s / N2 5.90s, 句间0.3s)
const SUBS: Array<{from: number; to: number; t: Array<[string, number]>}> = [
  {from: 0, to: 119, t: [['谁最受益？首先看 ', 0], ['英伟达', 1]]},
  {from: 119, to: 299, t: [['冲高回调后，5-28 ', 0], ['缩量企稳', 1], ['，抛压减轻', 0]]},
  {from: 299, to: 480, t: [['6-01 ', 0], ['放量反弹', 1], ['，上涨要放量才靠谱', 0]]},
];
const DINGS = [119, 299];
// 放量缩量标注: idx10=5-28缩量, idx12=6-01放量
const SHRINK_IDX = 10;
const SURGE_IDX = 12;

export const StockAnalysis: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const titleIn = spring({frame, fps, config: {damping: 200}});
  const draw = interpolate(frame, [20, 130], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const nBars = Math.max(0, Math.round(nvda.length * draw));

  const hi = Math.max(...nvda.map((d) => d.h));
  const lo = Math.min(...nvda.map((d) => d.l));
  const maxV = Math.max(...nvda.map((d) => d.v));
  const W = 1000, PH = 430, VT = 510, VH = 180;
  const barW = W / nvda.length;
  const yP = (p: number) => ((hi - p) / (hi - lo)) * PH + 15;
  const yV = (v: number) => VT + (1 - v / maxV) * VH;
  const xAt = (i: number) => i * barW + barW / 2;

  const sub = SUBS.find((s) => frame >= s.from && frame < s.to) ?? SUBS[SUBS.length - 1];
  const subIn = spring({frame: frame - sub.from, fps, config: {damping: 200}});
  // 缩量标注 119+, 放量标注 299+
  const shrinkOn = frame >= 119 && nBars > SHRINK_IDX;
  const surgeOn = frame >= 299 && nBars > SURGE_IDX;

  return (
    <AbsoluteFill style={{backgroundColor: '#141414'}}>
      <WebGLGrid />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.78) 0%, transparent 22%, transparent 64%, rgba(0,0,0,0.85) 100%)'}} />

      <Audio src={staticFile('nvda-vo.mp3')} volume={1} />
      <Audio src={staticFile('bgm.wav')} volume={0.12} />
      {DINGS.map((f, i) => (
        <Sequence key={i} from={f} durationInFrames={16}><Audio src={staticFile('ding.wav')} volume={0.25} /></Sequence>
      ))}

      <div style={{position: 'absolute', top: 120, left: 40, right: 40, textAlign: 'center', opacity: titleIn, transform: `translateY(${interpolate(titleIn, [0, 1], [-22, 0])}px)`}}>
        <div style={{fontFamily: CN, fontWeight: 900, fontSize: 58, color: '#ffd400', ...stroke(2), textShadow: '0 4px 0 #000'}}>谁最受益？看图说话</div>
        <div style={{fontFamily: CN, fontWeight: 800, fontSize: 74, color: '#fff', ...stroke(2.5), marginTop: 12, textShadow: '0 4px 0 #000'}}>英伟达 <span style={{color: '#76b900'}}>NVDA</span></div>
      </div>

      <div style={{position: 'absolute', top: 380, left: 36, right: 36, height: 770, backgroundColor: 'rgba(14,15,18,0.96)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.16)', padding: '18px 14px'}}>
        <svg width="100%" height="100%" viewBox="0 0 1000 720" preserveAspectRatio="none">
          <line x1="0" x2="1000" y1={yP(hi)} y2={yP(hi)} stroke="rgba(255,255,255,0.08)" />
          <line x1="0" x2="1000" y1={yP(lo)} y2={yP(lo)} stroke="rgba(255,255,255,0.08)" />
          {nvda.slice(0, nBars).map((d, i) => {
            const x = xAt(i);
            const up = d.c >= d.o;
            const col = up ? RED : GREEN;
            const bt = yP(Math.max(d.o, d.c));
            const bh = Math.max(Math.abs(yP(d.o) - yP(d.c)), 3);
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={yP(d.h)} y2={yP(d.l)} stroke={col} strokeWidth="2" />
                <rect x={x - barW * 0.3} y={bt} width={barW * 0.6} height={bh} fill={col} />
                <rect x={x - barW * 0.3} y={yV(d.v)} width={barW * 0.6} height={VT + VH - yV(d.v)} fill={col} opacity="0.65" />
              </g>
            );
          })}
          {/* 缩量标注 */}
          {shrinkOn && (
            <g>
              <rect x={xAt(SHRINK_IDX) - barW * 0.42} y={yV(nvda[SHRINK_IDX].v) - 6} width={barW * 0.84} height={VT + VH - yV(nvda[SHRINK_IDX].v) + 6} fill="none" stroke="#ffd400" strokeWidth="3" rx="4" />
              <text x={xAt(SHRINK_IDX)} y={yV(nvda[SHRINK_IDX].v) - 16} fill="#ffd400" fontSize="26" fontWeight="bold" textAnchor="middle">缩量</text>
            </g>
          )}
          {/* 放量标注 */}
          {surgeOn && (
            <g>
              <rect x={xAt(SURGE_IDX) - barW * 0.42} y={yV(nvda[SURGE_IDX].v) - 6} width={barW * 0.84} height={VT + VH - yV(nvda[SURGE_IDX].v) + 6} fill="none" stroke={RED} strokeWidth="3" rx="4" />
              <text x={xAt(SURGE_IDX)} y={yV(nvda[SURGE_IDX].v) - 16} fill={RED} fontSize="26" fontWeight="bold" textAnchor="middle">放量</text>
            </g>
          )}
        </svg>
        <div style={{position: 'absolute', top: 24, left: 22, fontFamily: CN, fontSize: 26, color: '#888'}}>${hi} / ${lo}</div>
        <div style={{position: 'absolute', top: 540, left: 22, fontFamily: CN, fontSize: 22, color: '#888'}}>成交量</div>
      </div>

      <div key={sub.from} style={{position: 'absolute', top: 1270, left: 0, right: 0, textAlign: 'center', opacity: subIn, transform: `translateY(${interpolate(subIn, [0, 1], [16, 0])}px)`}}>
        <span style={{display: 'inline-block', fontFamily: CN, fontWeight: 900, fontSize: 50, ...stroke(2.5), backgroundColor: 'rgba(0,0,0,0.5)', padding: '12px 28px', borderRadius: 12, textShadow: '0 4px 0 #000', lineHeight: 1.3}}>
          {sub.t.map(([t, hl], i) => <span key={i} style={{color: hl ? '#ffd400' : '#fff'}}>{t}</span>)}
        </span>
      </div>
      <div style={{position: 'absolute', top: 1430, left: 0, right: 0, textAlign: 'center', fontFamily: CN, fontWeight: 900, fontSize: 110, color: '#fff', ...stroke(3), textShadow: '0 6px 0 #000'}}>NVDA</div>
      <div style={{position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center', fontFamily: CN, fontWeight: 600, fontSize: 28, color: 'rgba(255,255,255,0.55)'}}>个人观点 · 仅供参考 · 不构成投资建议</div>
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import data from './stockData.json';
import {WebGLGrid} from './WebGLGrid';

const CN = '"PingFang SC", "Hiragino Sans GB", sans-serif';
const GRID = `repeating-linear-gradient(0deg, transparent 0 38px, rgba(255,255,255,0.05) 38px 40px), repeating-linear-gradient(90deg, transparent 0 38px, rgba(255,255,255,0.05) 38px 40px)`;
const stroke = (px: number) => ({WebkitTextStrokeWidth: `${px}px`, WebkitTextStrokeColor: '#000', paintOrder: 'stroke fill' as const});
const RED = '#e8453c';
const GREEN = '#2eaa6a';
const cam = data.cam;

// 字幕对齐 cam-vo 配音 (C0 3.48 / C1 5.86 / C2 4.63 / C3 4.56s, 句间0.3s)
const SUBS: Array<{from: number; to: number; t: Array<[string, number]>}> = [
  {from: 0, to: 113, t: [['国内看 AI 芯片龙头 ', 0], ['寒武纪', 1]]},
  {from: 113, to: 298, t: [['放量大涨 9%', 1], [' → 缩量回调，', 0], ['洗盘非出货', 1]]},
  {from: 298, to: 446, t: [['6-03 再次', 0], ['放量突破', 1], ['，量价齐升', 0]]},
  {from: 446, to: 600, t: [['个人观点 · 仅供参考 · 不构成投资建议', 0]]},
];
const DINGS = [113, 298];
const SURGE1 = 4; // 05-25 放量+9.37%
const SHRINK = 9; // 06-01 缩量-5.5%
const SURGE2 = 11; // 06-03 放量+6.01%

export const StockCambricon: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const titleIn = spring({frame, fps, config: {damping: 200}});
  const draw = interpolate(frame, [20, 140], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const hi = Math.max(...cam.map((d) => d.c));
  const lo = Math.min(...cam.map((d) => d.c));
  const maxV = Math.max(...cam.map((d) => d.v));
  const W = 1000, PH = 410, VT = 500, VH = 190;
  const barW = W / cam.length;
  const yP = (p: number) => ((hi - p) / (hi - lo)) * PH + 20;
  const yV = (v: number) => VT + (1 - v / maxV) * VH;
  const xAt = (i: number) => i * barW + barW / 2;

  // 折线 path (按 draw 显示前 n 段)
  const nPts = Math.max(1, Math.round(cam.length * draw));
  const linePath = 'M' + cam.slice(0, nPts).map((d, i) => `${xAt(i)},${yP(d.c)}`).join(' L');

  const sub = SUBS.find((s) => frame >= s.from && frame < s.to) ?? SUBS[SUBS.length - 1];
  const subIn = spring({frame: frame - sub.from, fps, config: {damping: 200}});
  const annoSurge1 = frame >= 113 && draw > 0.4;
  const annoShrink = frame >= 113 && draw > 0.8;
  const annoSurge2 = frame >= 298 && draw > 0.95;

  return (
    <AbsoluteFill style={{backgroundColor: '#141414'}}>
      <WebGLGrid />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.78) 0%, transparent 22%, transparent 64%, rgba(0,0,0,0.85) 100%)'}} />

      <Audio src={staticFile('cam-vo.mp3')} volume={1} />
      <Audio src={staticFile('bgm.wav')} volume={0.12} />
      {DINGS.map((f, i) => (
        <Sequence key={i} from={f} durationInFrames={16}><Audio src={staticFile('ding.wav')} volume={0.25} /></Sequence>
      ))}

      <div style={{position: 'absolute', top: 120, left: 40, right: 40, textAlign: 'center', opacity: titleIn, transform: `translateY(${interpolate(titleIn, [0, 1], [-22, 0])}px)`}}>
        <div style={{fontFamily: CN, fontWeight: 900, fontSize: 56, color: '#ffd400', ...stroke(2), textShadow: '0 4px 0 #000'}}>国内 AI 算力龙头</div>
        <div style={{fontFamily: CN, fontWeight: 800, fontSize: 74, color: '#fff', ...stroke(2.5), marginTop: 12, textShadow: '0 4px 0 #000'}}>寒武纪 <span style={{color: RED}}>688256</span></div>
      </div>

      <div style={{position: 'absolute', top: 380, left: 36, right: 36, height: 770, backgroundColor: 'rgba(14,15,18,0.96)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.16)', padding: '18px 14px'}}>
        <svg width="100%" height="100%" viewBox="0 0 1000 720" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={RED} stopOpacity="0.4" /><stop offset="100%" stopColor={RED} stopOpacity="0" />
            </linearGradient>
          </defs>
          {nPts > 1 && <path d={`${linePath} L${xAt(nPts - 1)},${VT - 30} L${xAt(0)},${VT - 30} Z`} fill="url(#cg)" />}
          <path d={linePath} fill="none" stroke={RED} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          {/* 量柱 (红涨绿跌) */}
          {cam.slice(0, nPts).map((d, i) => (
            <rect key={i} x={xAt(i) - barW * 0.3} y={yV(d.v)} width={barW * 0.6} height={VT + VH - yV(d.v)} fill={d.pct >= 0 ? RED : GREEN} opacity="0.65" />
          ))}
          {/* 放量/缩量标注 */}
          {annoSurge1 && (<g><rect x={xAt(SURGE1) - barW * 0.42} y={yV(cam[SURGE1].v) - 6} width={barW * 0.84} height={VT + VH - yV(cam[SURGE1].v) + 6} fill="none" stroke="#ffd400" strokeWidth="3" rx="4" /><text x={xAt(SURGE1)} y={yV(cam[SURGE1].v) - 14} fill="#ffd400" fontSize="24" fontWeight="bold" textAnchor="middle">放量</text></g>)}
          {annoShrink && (<g><rect x={xAt(SHRINK) - barW * 0.42} y={yV(cam[SHRINK].v) - 6} width={barW * 0.84} height={VT + VH - yV(cam[SHRINK].v) + 6} fill="none" stroke="#6a9bcc" strokeWidth="3" rx="4" /><text x={xAt(SHRINK)} y={yV(cam[SHRINK].v) - 14} fill="#6a9bcc" fontSize="24" fontWeight="bold" textAnchor="middle">缩量</text></g>)}
          {annoSurge2 && (<g><rect x={xAt(SURGE2) - barW * 0.42} y={yV(cam[SURGE2].v) - 6} width={barW * 0.84} height={VT + VH - yV(cam[SURGE2].v) + 6} fill="none" stroke={RED} strokeWidth="3" rx="4" /><text x={xAt(SURGE2)} y={yV(cam[SURGE2].v) - 14} fill={RED} fontSize="24" fontWeight="bold" textAnchor="middle">突破</text></g>)}
        </svg>
        <div style={{position: 'absolute', top: 24, left: 22, fontFamily: CN, fontSize: 26, color: '#888'}}>¥{hi} / ¥{lo}</div>
        <div style={{position: 'absolute', top: 530, left: 22, fontFamily: CN, fontSize: 22, color: '#888'}}>成交量</div>
      </div>

      <div key={sub.from} style={{position: 'absolute', top: 1270, left: 0, right: 0, textAlign: 'center', opacity: subIn, transform: `translateY(${interpolate(subIn, [0, 1], [16, 0])}px)`}}>
        <span style={{display: 'inline-block', fontFamily: CN, fontWeight: 900, fontSize: 48, ...stroke(2.5), backgroundColor: 'rgba(0,0,0,0.5)', padding: '12px 28px', borderRadius: 12, textShadow: '0 4px 0 #000', lineHeight: 1.3}}>
          {sub.t.map(([t, hl], i) => <span key={i} style={{color: hl ? '#ffd400' : '#fff'}}>{t}</span>)}
        </span>
      </div>
      <div style={{position: 'absolute', top: 1430, left: 0, right: 0, textAlign: 'center', fontFamily: CN, fontWeight: 900, fontSize: 96, color: '#fff', ...stroke(3), textShadow: '0 6px 0 #000'}}>寒武纪</div>
    </AbsoluteFill>
  );
};

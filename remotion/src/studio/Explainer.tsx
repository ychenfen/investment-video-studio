import React, {useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Loop,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont} from '@remotion/fonts';
import type {ExplainerProps, Line, Media, Segment, Series, Visual} from './types';

/**
 * 通用讲解视频(竖屏 1080×1920) —— 给文案就能出片
 *
 * 输入全部来自 props(public/studio/<slug>/props.json, 由 scripts/studio/run.sh 生成):
 *   每段 = 背景素材(实拍视频/照片, 或代码背景) + 一个画面卡片(热点/数字/柱状/折线/对比/观点/标题) + 逐字字幕
 * 时间全部来自配音时间轴, 改文案重跑 run.sh 即可, 不用改这个文件。
 */

const C = {
  bg: '#070c19',
  card: 'rgba(10,16,32,0.84)',
  line: 'rgba(255,255,255,0.12)',
  text: '#F4F6FB',
  dim: 'rgba(244,246,251,0.62)',
  up: '#FF4D4F', // A 股习惯: 红涨
  down: '#1FC77E', // 绿跌
  news: '#E23D3D',
};
const PAL = ['#FFC83D', '#5B8CFF', '#FF7A45', '#36CFC9'];

const fontCache = new Set<string>();
const useFonts = (base: string) => {
  useState(() => {
    for (const w of [500, 700, 900]) {
      const url = staticFile(`${base}/hs-${w}.woff2`);
      if (fontCache.has(url)) continue;
      fontCache.add(url);
      loadFont({family: 'HS', url, weight: String(w)});
    }
    return null;
  });
};

const sp = (frame: number, fps: number, delay = 0, damping = 16) =>
  spring({frame: frame - delay, fps, config: {damping, mass: 0.7}});

// ---------------- 背景 ----------------
const CodeBackground: React.FC<{accent: string}> = ({accent}) => {
  const f = useCurrentFrame();
  const x = 50 + Math.sin(f / 70) * 18;
  const y = 30 + Math.cos(f / 90) * 12;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at ${x}% ${y}%, ${accent}22, transparent 45%),
          radial-gradient(circle at ${100 - x}% ${80 - y / 2}%, #5B8CFF26, transparent 50%), ${C.bg}`,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          backgroundPosition: `0 ${(f * 0.6) % 72}px`,
        }}
      />
    </AbsoluteFill>
  );
};

const MediaBackground: React.FC<{m: Media; len: number}> = ({m, len}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const zoom = interpolate(f, [0, len], [1.04, 1.16]);
  const pan = interpolate(f, [0, len], [-14, 14]);
  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: m.focus || 'center',
    transform: `scale(${zoom}) translateX(${m.kind === 'photo' ? pan : 0}px)`,
  };
  const loopLen = Math.max(1, Math.floor((m.dur || len / fps) * fps) - 1);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      {m.kind === 'video' ? (
        <Loop durationInFrames={loopLen}>
          <OffthreadVideo src={staticFile(m.file)} muted style={style} />
        </Loop>
      ) : (
        <Img src={staticFile(m.file)} style={style} />
      )}
      {/* 压暗: 上下渐变 + 整体, 保证卡片/字幕可读 */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(7,12,25,0.78) 0%, rgba(7,12,25,0.25) 22%, rgba(7,12,25,0.35) 55%, rgba(7,12,25,0.92) 76%, rgba(7,12,25,0.97) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------- 字幕: 逐字点亮 + 关键词高亮 ----------------
const Subtitle: React.FC<{lines: Line[]; t: number; accent: string; big: boolean}> = ({lines, t, accent, big}) => {
  const {fps} = useVideoConfig();
  const cur = lines.find((l, i) => t >= l.start - 0.05 && t < (lines[i + 1]?.start ?? l.end + 0.6));
  if (!cur) return null;
  const chars = Array.from(cur.text);
  const hlMask = new Array(chars.length).fill(false);
  for (const h of cur.hl) {
    let k = cur.text.indexOf(h);
    while (k >= 0) {
      const ci = Array.from(cur.text.slice(0, k)).length;
      for (let j = 0; j < Array.from(h).length; j++) hlMask[ci + j] = true;
      k = cur.text.indexOf(h, k + h.length);
    }
  }
  const prog = interpolate(t, [cur.start, cur.end], [0, chars.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const inF = (t - cur.start) * fps;
  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top: big ? 1250 : 1395,
        textAlign: 'center',
        fontSize: big ? 76 : 64,
        fontWeight: 900,
        lineHeight: 1.3,
        letterSpacing: 1,
        opacity: interpolate(inF, [0, 4], [0, 1], {extrapolateRight: 'clamp'}),
        transform: `translateY(${interpolate(inF, [0, 6], [14, 0], {extrapolateRight: 'clamp'})}px)`,
        textShadow: '0 4px 18px rgba(0,0,0,0.85)',
      }}
    >
      {chars.map((ch, i) => {
        const lit = i < prog;
        const hl = hlMask[i];
        const pop = hl && lit ? interpolate(prog - i, [0, 1.5, 4], [1.25, 1.12, 1], {extrapolateRight: 'clamp'}) : 1;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              color: hl ? (lit ? accent : `${accent}88`) : lit ? C.text : 'rgba(244,246,251,0.45)',
              transform: `scale(${pop})`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

// ---------------- 画面卡片 ----------------
const Card: React.FC<{children: React.ReactNode; top?: number; style?: React.CSSProperties}> = ({children, top = 330, style}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = sp(f, fps, 2);
  return (
    <div
      style={{
        position: 'absolute',
        left: 56,
        right: 56,
        top,
        background: C.card,
        border: `2px solid ${C.line}`,
        borderRadius: 36,
        padding: '44px 48px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
        backdropFilter: 'blur(6px)',
        opacity: s,
        transform: `translateY(${(1 - s) * 60}px) scale(${0.96 + s * 0.04})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const SourceLine: React.FC<{v: Visual}> = ({v}) =>
  v.sourceText || v.asof ? (
    <div style={{marginTop: 28, fontSize: 26, color: C.dim, fontWeight: 500}}>
      数据来源：{v.sourceText || '—'}
      {v.asof ? ` · 截至 ${v.asof}` : ''}
    </div>
  ) : null;

const CardTitle: React.FC<{children: React.ReactNode; accent: string}> = ({children, accent}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 16, fontSize: 44, fontWeight: 900, marginBottom: 30}}>
    <span style={{width: 12, height: 44, borderRadius: 6, background: accent}} />
    {children}
  </div>
);

const TitleCard: React.FC<{v: Visual; accent: string; brand: string}> = ({v, accent}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s1 = f === 0 ? 1 : sp(f, fps, 0, 14); // 第 0 帧就是完整封面
  const s2 = f === 0 ? 1 : sp(f, fps, 6, 14);
  return (
    <div style={{position: 'absolute', left: 64, right: 64, top: 360}}>
      {v.kicker ? (
        <div
          style={{
            display: 'inline-block',
            padding: '12px 26px',
            borderRadius: 14,
            background: accent,
            color: '#141414',
            fontSize: 40,
            fontWeight: 900,
            opacity: s1,
            transform: `translateX(${(1 - s1) * -40}px)`,
          }}
        >
          {v.kicker}
        </div>
      ) : null}
      <div
        style={{
          marginTop: 34,
          fontSize: 112,
          lineHeight: 1.16,
          whiteSpace: 'pre-line',
          fontWeight: 900,
          textShadow: '0 8px 30px rgba(0,0,0,0.7)',
          opacity: s2,
          transform: `translateY(${(1 - s2) * 40}px)`,
        }}
      >
        {v.headline}
      </div>
      {v.sub ? <div style={{marginTop: 30, fontSize: 46, fontWeight: 700, color: C.dim, opacity: s2}}>{v.sub}</div> : null}
    </div>
  );
};

const NewsCard: React.FC<{v: Visual}> = ({v}) => {
  const f = useCurrentFrame();
  const blink = Math.floor(f / 12) % 2 === 0 ? 1 : 0.35;
  return (
    <Card top={380}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28}}>
        <span style={{background: C.news, color: '#fff', padding: '8px 20px', borderRadius: 10, fontSize: 34, fontWeight: 900}}>
          <span style={{opacity: blink}}>●</span> 热点
        </span>
        <span style={{fontSize: 34, fontWeight: 700, color: C.dim}}>
          {v.outlet || v.sourceText}
          {v.date ? ` · ${v.date}` : ''}
        </span>
      </div>
      <div style={{fontSize: 62, lineHeight: 1.32, fontWeight: 900}}>{v.headline}</div>
      {v.sub ? <div style={{marginTop: 24, fontSize: 38, lineHeight: 1.45, color: C.dim, fontWeight: 500}}>{v.sub}</div> : null}
    </Card>
  );
};

const signColor = (d?: string) => (!d ? C.dim : d.trim().startsWith('-') ? C.down : C.up);

const NumbersCard: React.FC<{v: Visual; accent: string}> = ({v, accent}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const items = v.items || [];
  const cols = items.length === 1 ? 1 : 2;
  return (
    <Card top={340}>
      {v.title ? <CardTitle accent={accent}>{v.title}</CardTitle> : null}
      <div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 26}}>
        {items.map((it, i) => {
          const s = sp(f, fps, 6 + i * 5);
          const num = parseFloat(it.value.replace(/,/g, ''));
          const isNum = !Number.isNaN(num) && /^[-\d.,]+$/.test(it.value);
          const decimals = (it.value.split('.')[1] || '').length;
          const shown = isNum ? (num * Math.min(1, sp(f, fps, 6 + i * 5, 30))).toFixed(decimals) : it.value;
          return (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: `2px solid ${C.line}`,
                borderRadius: 26,
                padding: '30px 30px 26px',
                opacity: s,
                transform: `translateY(${(1 - s) * 30}px)`,
              }}
            >
              <div style={{fontSize: 34, color: C.dim, fontWeight: 700}}>{it.label}</div>
              <div style={{marginTop: 10, fontFamily: 'HS', fontSize: cols === 1 ? 150 : 96, fontWeight: 900, color: accent, lineHeight: 1.05}}>
                {shown}
                <span style={{fontSize: cols === 1 ? 52 : 38, marginLeft: 8, color: C.text}}>{it.unit}</span>
              </div>
              {it.delta ? (
                <div style={{marginTop: 8, fontSize: 38, fontWeight: 900, color: signColor(it.delta)}}>
                  {it.delta.trim().startsWith('-') ? '▼ ' : '▲ '}
                  {it.delta.replace(/^[+-]/, '')}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <SourceLine v={v} />
    </Card>
  );
};

const BarsCard: React.FC<{v: Visual; accent: string}> = ({v, accent}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const series: Series[] = v.series || [];
  const labels = series[0]?.data.map((d) => String(d[0])) || [];
  const all = series.flatMap((s) => s.data.map((d) => d[1]));
  const max = Math.max(...all.map(Math.abs), 1e-9);
  const hasNeg = all.some((x) => x < 0);
  const H = 560;
  const zeroY = hasNeg ? H * 0.62 : H;
  const scale = (hasNeg ? H * 0.58 : H * 0.86) / max;
  const groupW = 888 / Math.max(1, labels.length);
  const barW = Math.min(90, (groupW - 24) / series.length);
  return (
    <Card top={300}>
      <CardTitle accent={accent}>
        {v.title}
        {v.unit ? <span style={{fontSize: 30, color: C.dim, fontWeight: 700}}>（{v.unit}）</span> : null}
      </CardTitle>
      {series.length > 1 ? (
        <div style={{display: 'flex', gap: 28, fontSize: 30, fontWeight: 700, marginBottom: 12}}>
          {series.map((s, i) => (
            <span key={i} style={{display: 'flex', alignItems: 'center', gap: 10}}>
              <span style={{width: 24, height: 24, borderRadius: 6, background: PAL[i % PAL.length]}} />
              {s.name}
            </span>
          ))}
        </div>
      ) : null}
      <svg width={888} height={H + 70} style={{overflow: 'visible'}}>
        <line x1={0} x2={888} y1={zeroY} y2={zeroY} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
        {labels.map((lb, gi) => (
          <g key={gi}>
            {series.map((s, si) => {
              const val = s.data[gi]?.[1] ?? 0;
              const g = sp(f, fps, 6 + gi * 4 + si * 2, 20);
              const h = Math.abs(val) * scale * g;
              const x = gi * groupW + (groupW - barW * series.length) / 2 + si * barW;
              const y = val >= 0 ? zeroY - h : zeroY;
              const col = series.length === 1 ? (val >= 0 ? (gi === labels.length - 1 ? accent : '#5B8CFF') : C.down) : PAL[si % PAL.length];
              return (
                <g key={si}>
                  <rect x={x + 4} y={y} width={barW - 8} height={h} rx={10} fill={col} />
                  <text
                    x={x + barW / 2}
                    y={val >= 0 ? y - 14 : y + h + 40}
                    textAnchor="middle"
                    fontSize={series.length > 1 ? 26 : 34}
                    fontWeight={900}
                    fill={C.text}
                    opacity={g}
                  >
                    {String(val)}
                  </text>
                </g>
              );
            })}
            <text x={gi * groupW + groupW / 2} y={H + 56} textAnchor="middle" fontSize={32} fontWeight={700} fill={C.dim}>
              {lb}
            </text>
          </g>
        ))}
      </svg>
      {v.note ? <div style={{marginTop: 8, fontSize: 32, fontWeight: 700, color: accent}}>{v.note}</div> : null}
      <SourceLine v={v} />
    </Card>
  );
};

const LineCard: React.FC<{v: Visual; accent: string}> = ({v, accent}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const series: Series[] = v.series || [];
  const labels = series[0]?.data.map((d) => String(d[0])) || [];
  const all = series.flatMap((s) => s.data.map((d) => d[1]));
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const pad = (hi - lo || 1) * 0.15;
  const W = 888;
  const H = 520;
  const X = (i: number) => (labels.length <= 1 ? W / 2 : 20 + (i * (W - 40)) / (labels.length - 1));
  const Y = (val: number) => H - ((val - (lo - pad)) / (hi - lo + 2 * pad)) * H;
  const prog = interpolate(f, [4, 4 + fps * 1.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Card top={300}>
      <CardTitle accent={accent}>
        {v.title}
        {v.unit ? <span style={{fontSize: 30, color: C.dim, fontWeight: 700}}>（{v.unit}）</span> : null}
      </CardTitle>
      <svg width={W} height={H + 70} style={{overflow: 'visible'}}>
        {[0.25, 0.5, 0.75].map((k) => (
          <line key={k} x1={0} x2={W} y1={H * k} y2={H * k} stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
        ))}
        {series.map((s, si) => {
          const pts = s.data.map((d, i) => [X(i), Y(d[1])] as const);
          const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
          const len = pts.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
          const col = si === 0 ? accent : PAL[(si + 1) % PAL.length];
          return (
            <g key={si}>
              <path d={path} fill="none" stroke={col} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round"
                strokeDasharray={len} strokeDashoffset={len * (1 - prog)} />
              {pts.map((p, i) =>
                i / Math.max(1, pts.length - 1) <= prog + 1e-6 ? (
                  <g key={i}>
                    <circle cx={p[0]} cy={p[1]} r={11} fill={C.bg} stroke={col} strokeWidth={6} />
                    {pts.length <= 8 || i === pts.length - 1 ? (
                      <text x={p[0]} y={p[1] - 24} textAnchor="middle" fontSize={30} fontWeight={900} fill={C.text}>
                        {String(s.data[i][1])}
                      </text>
                    ) : null}
                  </g>
                ) : null,
              )}
            </g>
          );
        })}
        {labels.map((lb, i) =>
          labels.length <= 8 || i % Math.ceil(labels.length / 6) === 0 || i === labels.length - 1 ? (
            <text key={i} x={X(i)} y={H + 56} textAnchor="middle" fontSize={30} fontWeight={700} fill={C.dim}>
              {lb}
            </text>
          ) : null,
        )}
      </svg>
      {v.note ? <div style={{marginTop: 8, fontSize: 32, fontWeight: 700, color: accent}}>{v.note}</div> : null}
      <SourceLine v={v} />
    </Card>
  );
};

const CompareCard: React.FC<{v: Visual; accent: string}> = ({v, accent}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const col = (side: {title: string; points: string[]} | undefined, i: number, color: string) => {
    const s = sp(f, fps, 4 + i * 8);
    return side ? (
      <div
        style={{
          flex: 1,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 26,
          border: `2px solid ${color}66`,
          padding: 30,
          opacity: s,
          transform: `translateY(${(1 - s) * 40}px)`,
        }}
      >
        <div style={{fontSize: 44, fontWeight: 900, color, marginBottom: 20}}>{side.title}</div>
        {side.points.map((p, k) => (
          <div key={k} style={{fontSize: 36, fontWeight: 700, lineHeight: 1.4, marginBottom: 16}}>
            · {p}
          </div>
        ))}
      </div>
    ) : null;
  };
  return (
    <Card top={360}>
      {v.title ? <CardTitle accent={accent}>{v.title}</CardTitle> : null}
      <div style={{display: 'flex', gap: 24}}>
        {col(v.left, 0, '#5B8CFF')}
        {col(v.right, 1, accent)}
      </div>
    </Card>
  );
};

const PointCard: React.FC<{v: Visual; accent: string}> = ({v, accent}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = sp(f, fps, 2, 12);
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 480, textAlign: 'center', opacity: s, transform: `scale(${0.9 + 0.1 * s})`}}>
      <div style={{fontSize: 140, lineHeight: 0.6, color: accent, fontWeight: 900}}>“</div>
      <div style={{fontSize: 84, lineHeight: 1.3, fontWeight: 900, whiteSpace: 'pre-line', textShadow: '0 8px 30px rgba(0,0,0,0.7)'}}>{v.text}</div>
      {v.sub ? <div style={{marginTop: 30, fontSize: 40, fontWeight: 700, color: C.dim}}>{v.sub}</div> : null}
    </div>
  );
};

// 结尾选项式互动: 选项比"评论区聊聊"更容易让人留言 (见 docs/09 第4节第9条)
const PollCard: React.FC<{v: Visual; accent: string}> = ({v, accent}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opts = v.options || [];
  const typeStart = 10 + opts.length * 6 + fps * 0.6;
  const reply = Array.from(v.reply || '');
  const typed = reply.slice(0, Math.max(0, Math.floor((f - typeStart) / 3))).join('');
  const caret = Math.floor(f / 8) % 2 === 0 ? '|' : ' ';
  return (
    <Card top={320}>
      <CardTitle accent={accent}>{v.question}</CardTitle>
      {opts.map((o, i) => {
        const s = sp(f, fps, 8 + i * 6);
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              marginBottom: 18,
              padding: '22px 26px',
              borderRadius: 22,
              background: 'rgba(255,255,255,0.06)',
              border: `2px solid ${C.line}`,
              fontSize: 40,
              fontWeight: 700,
              opacity: s,
              transform: `translateX(${(1 - s) * 50}px)`,
            }}
          >
            <span
              style={{
                width: 60,
                height: 60,
                flex: '0 0 60px',
                borderRadius: 16,
                background: accent,
                color: '#141414',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {String.fromCharCode(65 + i)}
            </span>
            {o}
          </div>
        );
      })}
      {reply.length ? (
        <div
          style={{
            marginTop: 26,
            padding: '20px 26px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.92)',
            color: '#222',
            fontSize: 36,
            fontWeight: 700,
            opacity: f >= typeStart - 6 ? 1 : 0,
          }}
        >
          {typed || <span style={{color: '#999'}}>说点什么…</span>}
          {typed.length < reply.length ? caret : ''}
        </div>
      ) : null}
    </Card>
  );
};

const VisualLayer: React.FC<{v: Visual; accent: string; brand: string}> = ({v, accent, brand}) => {
  switch (v.type) {
    case 'title':
      return <TitleCard v={v} accent={accent} brand={brand} />;
    case 'news':
      return <NewsCard v={v} />;
    case 'numbers':
      return <NumbersCard v={v} accent={accent} />;
    case 'bars':
      return <BarsCard v={v} accent={accent} />;
    case 'line':
      return <LineCard v={v} accent={accent} />;
    case 'compare':
      return <CompareCard v={v} accent={accent} />;
    case 'point':
      return <PointCard v={v} accent={accent} />;
    case 'poll':
      return <PollCard v={v} accent={accent} />;
    default:
      return null;
  }
};

// ---------------- 单段 ----------------
const SegmentView: React.FC<{seg: Segment; p: ExplainerProps; len: number}> = ({seg, p, len}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = seg.start + f / fps;
  const fadeIn = seg.start === 0 ? 1 : interpolate(f, [0, 6], [0, 1], {extrapolateRight: 'clamp'});
  const m = seg.media;
  return (
    <AbsoluteFill style={{opacity: fadeIn}}>
      {m ? <MediaBackground m={m} len={len} /> : <CodeBackground accent={p.accent} />}
      {m ? (
        <div
          style={{
            position: 'absolute',
            right: 40,
            top: 190,
            padding: '8px 18px',
            borderRadius: 10,
            background: 'rgba(0,0,0,0.55)',
            border: '1.5px solid rgba(255,255,255,0.35)',
            fontSize: 26,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          {m.label}
        </div>
      ) : null}
      <VisualLayer v={seg.visual} accent={p.accent} brand={p.brand} />
      <Subtitle lines={seg.lines} t={t} accent={p.accent} big={seg.visual.type === 'media'} />
      {m ? (
        <div style={{position: 'absolute', left: 60, right: 60, bottom: 122, fontSize: 22, color: 'rgba(255,255,255,0.5)', fontWeight: 500}}>
          素材：{m.credit}
          {m.license ? ` · ${m.license}` : ''}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------- 顶栏 / 进度 / 免责 ----------------
const Chrome: React.FC<{p: ExplainerProps}> = ({p}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const idx = Math.max(0, p.segments.findIndex((s) => t >= s.start && t < s.end));
  return (
    <>
      <div style={{position: 'absolute', left: 56, right: 56, top: 70, display: 'flex', alignItems: 'center', gap: 18}}>
        <div style={{padding: '12px 26px', borderRadius: 999, background: 'rgba(255,255,255,0.92)', color: '#111', fontSize: 36, fontWeight: 900}}>
          <span style={{color: p.accent === '#FFC83D' ? '#D99A00' : p.accent}}>●</span> {p.brand}
        </div>
        {p.tag ? <div style={{fontSize: 34, fontWeight: 700, color: C.dim}}>{p.tag}</div> : null}
      </div>
      <div style={{position: 'absolute', left: 56, right: 56, top: 158, display: 'flex', gap: 8}}>
        {p.segments.map((s, i) => {
          const fill = i < idx ? 1 : i > idx ? 0 : (t - s.start) / Math.max(0.01, s.end - s.start);
          return (
            <div key={s.id} style={{flex: 1, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.18)', overflow: 'hidden'}}>
              <div style={{width: `${Math.min(1, fill) * 100}%`, height: '100%', background: p.accent}} />
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 40, right: 40, bottom: 62, textAlign: 'center', fontSize: 28, color: 'rgba(244,246,251,0.62)', fontWeight: 500}}>
        {p.disclaimer}
      </div>
    </>
  );
};

export const Explainer: React.FC<ExplainerProps> = (p) => {
  const {fps} = useVideoConfig();
  useFonts(p.fonts);
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, fontFamily: 'HS, sans-serif', color: C.text}}>
      {p.segments.map((s) => {
        const from = Math.round(s.start * fps);
        const len = Math.max(1, Math.round(s.end * fps) - from);
        return (
          <Sequence key={s.id} from={from} durationInFrames={len} layout="none">
            <SegmentView seg={s} p={p} len={len} />
          </Sequence>
        );
      })}
      <Chrome p={p} />
      {p.audio ? <Audio src={staticFile(p.audio)} /> : null}
    </AbsoluteFill>
  );
};

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  Video,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export type Metric = {label: string; value: string};
export type SceneAsset = {
  type: 'image' | 'video';
  src: string;
  truth_label: '真实资料' | '示意素材';
  credit: string;
};

export type CloudScene = {
  id: string;
  start: number;
  end: number;
  voice_start: number;
  voice_end: number;
  eyebrow: string;
  headline: string;
  narration: string;
  source_ids: string[];
  bullets: string[];
  metrics: Metric[];
  asset?: SceneAsset;
};

export type CloudProject = {
  schema_version: 1;
  slug: string;
  title: string;
  subtitle: string;
  mode: 'fundamental' | 'hybrid' | 'technical' | 'story';
  width: number;
  height: number;
  fps: number;
  duration: number;
  audio_src: string;
  disclaimer: string;
  scenes: CloudScene[];
};

export type CloudVideoProps = {project: CloudProject};

const colors = {
  ink: '#07101f',
  panel: '#101d36',
  panel2: '#17284a',
  text: '#f7f9ff',
  muted: '#aebbd4',
  cyan: '#54d8ff',
  gold: '#ffc53d',
  red: '#ff5f68',
  line: 'rgba(141, 164, 207, 0.22)',
};

const modeLabel: Record<CloudProject['mode'], string> = {
  fundamental: '基本面追踪',
  hybrid: '基本面 × 技术确认',
  technical: '技术面观察',
  story: '投资故事',
};

const Background: React.FC<{scene: CloudScene; durationInFrames: number}> = ({scene, durationInFrames}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, Math.max(1, durationInFrames)], [1.02, 1.1], {
    easing: Easing.inOut(Easing.ease),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const src = scene.asset ? staticFile(scene.asset.src) : null;

  return (
    <AbsoluteFill style={{overflow: 'hidden', background: colors.ink}}>
      {scene.asset?.type === 'image' && src ? (
        <Img
          src={src}
          style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})`}}
        />
      ) : null}
      {scene.asset?.type === 'video' && src ? (
        <Video
          src={src}
          muted
          loop
          style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})`}}
        />
      ) : null}
      {!scene.asset ? (
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(circle at 82% 18%, rgba(84,216,255,.22), transparent 28%), radial-gradient(circle at 14% 48%, rgba(109,91,255,.22), transparent 34%), linear-gradient(155deg,#081326,#101b35 52%,#070d19)',
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(5,10,20,.12) 0%, rgba(5,10,20,.35) 42%, rgba(5,10,20,.95) 68%, #07101f 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.2,
          backgroundImage:
            'linear-gradient(rgba(115,143,194,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(115,143,194,.18) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          transform: `translateY(${(frame * 0.25) % 72}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

const Caption: React.FC<{scene: CloudScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voiceStart = Math.max(0, (scene.voice_start - scene.start) * fps);
  const voiceEnd = Math.max(voiceStart + 1, (scene.voice_end - scene.start) * fps);
  const active = Math.floor(
    interpolate(frame, [voiceStart, voiceEnd], [0, scene.narration.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: 56,
        right: 56,
        bottom: 190,
        padding: '28px 30px',
        borderRadius: 26,
        background: 'rgba(8,17,34,.88)',
        border: `1px solid ${colors.line}`,
        boxShadow: '0 20px 55px rgba(0,0,0,.36)',
        fontSize: 43,
        lineHeight: 1.45,
        fontWeight: 800,
        textAlign: 'center',
      }}
    >
      {[...scene.narration].map((character, index) => (
        <span key={`${scene.id}-${index}`} style={{color: index < active ? colors.text : '#53627d'}}>
          {character}
        </span>
      ))}
    </div>
  );
};

const EvidencePanel: React.FC<{scene: CloudScene}> = ({scene}) => {
  const metrics = scene.metrics || [];
  const bullets = scene.bullets || [];
  if (!metrics.length && !bullets.length) return null;

  return (
    <div style={{display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 28}}>
      {metrics.map((metric) => (
        <div
          key={`${scene.id}-${metric.label}`}
          style={{
            flex: '1 1 220px',
            padding: '22px 24px',
            borderRadius: 20,
            background: 'rgba(17,31,58,.92)',
            border: `1px solid ${colors.line}`,
          }}
        >
          <div style={{fontSize: 25, color: colors.muted, marginBottom: 8}}>{metric.label}</div>
          <div style={{fontSize: 48, color: colors.gold, fontWeight: 900}}>{metric.value}</div>
        </div>
      ))}
      {bullets.map((bullet, index) => (
        <div
          key={`${scene.id}-bullet-${index}`}
          style={{
            flex: '1 1 250px',
            padding: '20px 22px',
            borderRadius: 18,
            background: 'rgba(17,31,58,.82)',
            border: `1px solid ${colors.line}`,
            fontSize: 29,
            fontWeight: 700,
            color: colors.text,
          }}
        >
          <span style={{color: colors.cyan, marginRight: 10}}>0{index + 1}</span>
          {bullet}
        </div>
      ))}
    </div>
  );
};

const Scene: React.FC<{
  project: CloudProject;
  scene: CloudScene;
  durationInFrames: number;
  index: number;
}> = ({project, scene, durationInFrames, index}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 16], [0, -4], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{fontFamily: '"Noto Sans CJK SC", "PingFang SC", sans-serif', color: colors.text}}>
      <Background scene={scene} durationInFrames={durationInFrames} />
      <div style={{position: 'absolute', top: 74, left: 58, right: 58, display: 'flex', justifyContent: 'space-between'}}>
        <div
          style={{
            padding: '12px 20px',
            borderRadius: 999,
            background: 'rgba(7,16,31,.75)',
            border: `1px solid ${colors.line}`,
            fontSize: 26,
            fontWeight: 800,
          }}
        >
          <span style={{color: colors.cyan}}>●</span> {modeLabel[project.mode]}
        </div>
        <div style={{fontSize: 24, color: colors.muted, paddingTop: 12}}>
          {String(index + 1).padStart(2, '0')} / {String(project.scenes.length).padStart(2, '0')}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: scene.asset ? 780 : 260,
          left: 58,
          right: 58,
          transform: `translateY(${enter}px)`,
        }}
      >
        <div style={{fontSize: 28, fontWeight: 900, color: colors.cyan, letterSpacing: 2, marginBottom: 18}}>
          {scene.eyebrow}
        </div>
        <div style={{fontSize: 70, lineHeight: 1.15, fontWeight: 950, letterSpacing: -2}}>{scene.headline}</div>
        <EvidencePanel scene={scene} />
      </div>

      {scene.asset ? (
        <>
          <div
            style={{
              position: 'absolute',
              top: 168,
              left: 58,
              padding: '10px 16px',
              borderRadius: 10,
              background: scene.asset.truth_label === '真实资料' ? 'rgba(7,16,31,.78)' : 'rgba(93,72,20,.82)',
              border: `1px solid ${scene.asset.truth_label === '真实资料' ? colors.cyan : colors.gold}`,
              fontSize: 23,
              fontWeight: 900,
            }}
          >
            {scene.asset.truth_label}
          </div>
          <div style={{position: 'absolute', top: 715, left: 58, right: 58, fontSize: 21, color: '#d1daec'}}>
            来源：{scene.asset.credit}
          </div>
        </>
      ) : null}

      <Caption scene={scene} />
      <div style={{position: 'absolute', left: 58, right: 58, bottom: 92, display: 'flex', justifyContent: 'space-between'}}>
        <div style={{fontSize: 20, color: '#8392ad'}}>证据：{scene.source_ids.join(' · ') || '观点/互动'}</div>
        <div style={{fontSize: 20, color: '#8392ad'}}>{project.disclaimer}</div>
      </div>
    </AbsoluteFill>
  );
};

export const CloudVideo: React.FC<CloudVideoProps> = ({project}) => {
  const fps = project.fps || 30;
  return (
    <AbsoluteFill style={{backgroundColor: colors.ink}}>
      {project.scenes.map((scene, index) => {
        const from = Math.max(0, Math.round(scene.start * fps));
        const durationInFrames = Math.max(1, Math.round((scene.end - scene.start) * fps));
        return (
          <Sequence key={scene.id} from={from} durationInFrames={durationInFrames} name={scene.id}>
            <Scene project={project} scene={scene} durationInFrames={durationInFrames} index={index} />
          </Sequence>
        );
      })}
      {project.audio_src ? <Audio src={staticFile(project.audio_src)} /> : null}
    </AbsoluteFill>
  );
};

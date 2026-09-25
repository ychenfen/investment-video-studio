import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/fonts';
import gsap from 'gsap';
import {markup} from './generated/markup';
import {styles} from './generated/styles';
import {buildTimeline} from './generated/timeline';

/**
 * 复盘故事视频(小于 & 阿本) —— 竖屏 1080×1920
 *
 * 画面 = scripts/fupan/build.mjs 生成的 DOM + 作用域 CSS + GSAP 时间线。
 * 这里只做两件事, 让它在 Remotion 里逐帧确定性渲染:
 *   1. 按 data-start / data-duration 控制每个场景/字幕的可见窗口
 *   2. 每帧把暂停的 GSAP 时间线 seek 到 frame / fps
 * 改文案: 改 scripts/fupan/script.json → ./scripts/fupan/run.sh, 不用碰这个文件。
 */

// 本地子集字体(思源黑体 3 字重 + Barlow Condensed 数字), @remotion/fonts 自动 delayRender
loadFont({family: 'HS', url: staticFile('fupan/fonts/hs-500.woff2'), weight: '500'});
loadFont({family: 'HS', url: staticFile('fupan/fonts/hs-700.woff2'), weight: '700'});
loadFont({family: 'HS', url: staticFile('fupan/fonts/hs-900.woff2'), weight: '900'});
loadFont({family: 'Num', url: staticFile('fupan/fonts/num-600.woff2'), weight: '600'});
loadFont({family: 'Num', url: staticFile('fupan/fonts/num-700.woff2'), weight: '700'});

type Clip = {el: HTMLElement; start: number; end: number};

export const FupanStory: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const host = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const clips = useRef<Clip[]>([]);

  // 挂载: 注入 DOM → 收集定时元素 → 构建暂停的时间线
  useLayoutEffect(() => {
    const root = host.current!;
    root.innerHTML = markup;
    clips.current = Array.from(root.querySelectorAll<HTMLElement>('[data-start]'))
      .filter((el) => el.id !== 'fp-root')
      .map((el) => {
        const start = parseFloat(el.dataset.start || '0');
        const dur = parseFloat(el.dataset.duration || '1e9');
        return {el, start, end: start + dur};
      });
    tl.current = buildTimeline(gsap);
    return () => {
      tl.current?.kill();
      tl.current = null;
      root.innerHTML = '';
    };
  }, []);

  // 每帧: 可见窗口 + seek
  useLayoutEffect(() => {
    const t = frame / fps;
    for (const c of clips.current) c.el.style.visibility = t >= c.start && t < c.end ? 'visible' : 'hidden';
    tl.current?.seek(t, false);
  }, [frame, fps]);

  return (
    <AbsoluteFill style={{backgroundColor: '#070d1c'}}>
      <style>{styles}</style>
      <div className="fp-scope" ref={host} />
      <Audio src={staticFile('fupan/mix.mp3')} />
    </AbsoluteFill>
  );
};

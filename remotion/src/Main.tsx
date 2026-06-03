import React from 'react';
import {AbsoluteFill} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {C} from './theme';
import {Hook} from './scenes/Hook';
import {Tension} from './scenes/Tension';
import {DataCards} from './scenes/DataCards';

// 场景间交叉淡入 (fade), 奶白背景兜底, 消除硬切空屏闪烁
export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={140}>
          <Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={linearTiming({durationInFrames: 22})} presentation={fade()} />
        <TransitionSeries.Sequence durationInFrames={125}>
          <Tension />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={linearTiming({durationInFrames: 22})} presentation={fade()} />
        <TransitionSeries.Sequence durationInFrames={140}>
          <DataCards />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

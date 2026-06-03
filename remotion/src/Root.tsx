import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {NewsStyle} from './NewsStyle';
import {StockAnalysis} from './StockAnalysis';
import {StockCambricon} from './StockCambricon';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Main" component={Main} durationInFrames={361} fps={30} width={1920} height={1080} />
      {/* 黄仁勋 Agent 段 (配音) */}
      <Composition id="NewsStyle" component={NewsStyle} durationInFrames={720} fps={30} width={1080} height={1920} />
      {/* NVDA K线段 (配音 + 放量缩量标注) */}
      <Composition id="StockAnalysis" component={StockAnalysis} durationInFrames={480} fps={30} width={1080} height={1920} />
      {/* 寒武纪折线段 (配音 + 放量缩量标注) */}
      <Composition id="StockCambricon" component={StockCambricon} durationInFrames={600} fps={30} width={1080} height={1920} />
    </>
  );
};

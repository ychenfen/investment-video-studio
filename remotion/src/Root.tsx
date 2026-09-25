import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {NewsStyle} from './NewsStyle';
import {StockAnalysis} from './StockAnalysis';
import {StockCambricon} from './StockCambricon';
import {FupanStory} from './fupan/FupanStory';
import {FUPAN_DURATION_SEC} from './fupan/generated/meta';
import {CloudVideo} from './cloud/CloudVideo';
import {defaultCloudProject} from './cloud/default-project';

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
      {/* 复盘故事: 小于 & 阿本 · 赚钱效应 (配音驱动, 源在 scripts/fupan) */}
      <Composition id="FupanStory" component={FupanStory} durationInFrames={Math.round(FUPAN_DURATION_SEC * 30)} fps={30} width={1080} height={1920} />
      {/* 云端通用投研片: 热点/基本面/真实资料画面均由 input props 驱动 */}
      <Composition
        id="CloudVideo"
        component={CloudVideo}
        defaultProps={{project: defaultCloudProject}}
        durationInFrames={Math.round(defaultCloudProject.duration * defaultCloudProject.fps)}
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={({props}) => ({
          durationInFrames: Math.max(1, Math.round(props.project.duration * props.project.fps)),
          fps: props.project.fps,
          width: props.project.width,
          height: props.project.height,
        })}
      />
    </>
  );
};

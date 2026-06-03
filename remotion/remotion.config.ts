import {Config} from '@remotion/cli/config';

// 系统 Chrome 多 tab 并发不稳 → 固定单并发, 避免 "got no response"
Config.setConcurrency(1);
// png 无损中间帧 (jpeg 会压糊画面)
Config.setVideoImageFormat('png');
Config.setChromiumOpenGlRenderer('angle');

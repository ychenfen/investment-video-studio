import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// 本地离线字体 (@remotion/fonts 处理环境检查 + delayRender, chrome 渲染零网络)
loadFont({family: 'Poppins', url: staticFile('fonts/poppins-400.woff2'), weight: '400'});
loadFont({family: 'Poppins', url: staticFile('fonts/poppins-600.woff2'), weight: '600'});
loadFont({family: 'Poppins', url: staticFile('fonts/poppins-700.woff2'), weight: '700'});
loadFont({family: 'Lora', url: staticFile('fonts/lora-400.woff2'), weight: '400'});
loadFont({family: 'Lora', url: staticFile('fonts/lora-500.woff2'), weight: '500'});

export const poppins = 'Poppins';
export const lora = 'Lora';

// Anthropic 品牌色 (brand-guidelines skill 明文 B 套)
export const C = {
  bg: '#faf9f5',
  ink: '#141413',
  inkSoft: '#5c5b57',
  orange: '#d97757',
  blue: '#6a9bcc',
  green: '#788c5d',
  gray: '#b0aea5',
  grayLight: '#e8e6dc',
};

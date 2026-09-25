// Explainer 的输入 = scripts/studio/props.py 生成的 public/studio/<slug>/props.json

export type Line = {text: string; hl: string[]; start: number; end: number};

export type Media = {
  file: string; // 相对 public/ 的路径
  kind: 'video' | 'photo';
  dur?: number; // 视频时长(秒), 用于循环
  credit: string;
  license: string;
  source: string;
  label: string; // 画面角标: 实拍 / 资料画面 / 示意
  focus?: string; // 照片裁切焦点, CSS object-position
};

export type Series = {name: string; data: [string | number, number][]};

export type Visual = {
  type: 'title' | 'news' | 'numbers' | 'bars' | 'line' | 'compare' | 'point' | 'media';
  // title
  kicker?: string;
  headline?: string;
  sub?: string;
  // news (热点卡片)
  outlet?: string;
  date?: string;
  // numbers
  items?: {label: string; value: string; unit?: string; delta?: string}[];
  // bars / line
  title?: string;
  unit?: string;
  series?: Series[];
  // compare
  left?: {title: string; points: string[]};
  right?: {title: string; points: string[]};
  // point
  text?: string;
  // 数据画面公共
  source?: string;
  sourceText?: string;
  asof?: string;
  note?: string;
};

export type Segment = {
  id: string;
  start: number;
  end: number;
  visual: Visual;
  media: Media | null;
  lines: Line[];
};

export type ExplainerProps = {
  slug: string;
  title: string;
  subtitle: string;
  brand: string;
  tag: string;
  disclaimer: string;
  accent: string;
  duration: number;
  voEngine: string;
  audio: string;
  fonts: string;
  segments: Segment[];
};

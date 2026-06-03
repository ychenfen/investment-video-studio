import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = `
precision highp float;
uniform float uTime;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  // 多层水波扭曲 UV (像水面起伏)
  float w = sin(uv.x * 12.0 + uTime * 2.0) * 0.018
          + cos(uv.y * 9.0 - uTime * 1.6) * 0.018
          + sin((uv.x + uv.y) * 7.0 + uTime * 1.2) * 0.012;
  vec2 d = uv + w;
  // 网格线 (扭曲后的坐标画格 -> 网格随波起伏)
  vec2 gr = abs(fract(d * 22.0) - 0.5);
  float line = 1.0 - smoothstep(0.0, 0.06, min(gr.x, gr.y));
  // 两团游动亮光斑
  vec2 c1 = vec2(0.5 + 0.34 * sin(uTime * 0.6), 0.45 + 0.30 * cos(uTime * 0.45));
  vec2 c2 = vec2(0.5 + 0.38 * cos(uTime * 0.4), 0.6 + 0.32 * sin(uTime * 0.34));
  float g1 = smoothstep(0.42, 0.0, distance(d, c1));
  float g2 = smoothstep(0.48, 0.0, distance(d, c2));
  vec3 col = vec3(0.078);
  col += line * 0.16;
  col += g1 * vec3(0.30, 0.52, 0.80) * 0.65;
  col += g2 * vec3(0.85, 0.70, 0.20) * 0.42;
  gl_FragColor = vec4(col, 1.0);
}`;

const WavePlane: React.FC<{time: number}> = ({time}) => {
  const {viewport} = useThree();
  const material = useMemo(
    () => new THREE.ShaderMaterial({vertexShader, fragmentShader, uniforms: {uTime: {value: 0}}}),
    []
  );
  material.uniforms.uTime.value = time;
  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

export const WebGLGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#141414'}}>
      <ThreeCanvas width={width} height={height}>
        <WavePlane time={frame / 30} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

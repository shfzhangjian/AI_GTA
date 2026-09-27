/**
 * Ocean.js — 球形海洋（§12）
 * 目标：蓝绿色、阳光反射、Fresnel、Specular、轻微波浪与噪声扰动、卡通化但有一点真实水体感。
 * 第一版不做复杂物理海洋，优先「稳定 + 流畅 + 漂亮」。
 */
import * as THREE from 'three';
import { PLANET } from '../config.js';

/** 经典 GLSL  simplex 3D 噪声（公有领域实现，Ashima / Ian McEwan） */
const SNOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

import { buildLatLonSphere } from './Land.js';

export function createOcean(radius = PLANET.RADIUS, opts = {}) {
  // 与陆地共用经纬网格 → 海岸线拓扑一致
  const geo = buildLatLonSphere(radius, opts.segments || 512, Math.round((opts.segments || 512) * 0.5));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(0x1456a8) },
      uShallow: { value: new THREE.Color(0x3fd0e8) },
      uFoam: { value: new THREE.Color(0xe8fbff) },
      uSunDir: { value: new THREE.Vector3(1, 0.35, 0.6).normalize() },
      uSunColor: { value: new THREE.Color(0xfff3d6) },
      uSkyColor: { value: new THREE.Color(0x9fd8ff) },
      uNightColor: { value: new THREE.Color(0x071a2e) },
      uWaveAmp: { value: 0.05 },
      uSpecPower: { value: 180.0 },
      uNight: { value: 0.0 },
    },
    vertexShader: /* glsl */`
      ${SNOISE}
      uniform float uTime;
      uniform float uWaveAmp;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      varying vec3 vLocalDir;
      varying float vWave;

      // 波高只用于「法线/颜色」波动，绝不位移顶点 → 顶点固定在不透明半径 R → 不再 z-fighting 闪动
      float waveVal(vec3 dir) {
        float w = snoise(dir * 5.5 + vec3(0.0, uTime * 0.12, 0.0)) * 0.72;
        w += snoise(dir * 13.0 - vec3(uTime * 0.09, 0.0, uTime * 0.05)) * 0.28;
        return w;
      }

      void main() {
        vec3 dir = normalize(position);
        vLocalDir = dir;
        float d = waveVal(dir);
        vWave = d;

        // 顶点固定在不透明半径 R（无任何几何位移）→ 消除与陆地重合处的 z-fighting 闪动
        vec3 p = dir * ${radius}.0;
        // 法线用邻域波高梯度轻微扰动：波光来自法线（高光闪），不是几何抖动
        vec3 upv = abs(dir.y) < 0.99 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0);
        vec3 t1 = normalize(cross(dir, upv));
        vec3 t2 = normalize(cross(dir, t1));
        float e = 0.02;
        float ga = waveVal(normalize(dir + t1 * e));
        float gb = waveVal(normalize(dir + t2 * e));
        vec3 n = normalize(dir - (t1 * (ga - d) + t2 * (gb - d)) * uWaveAmp * 8.0);

        vec4 wp = modelMatrix * vec4(p, 1.0);
        vPosW = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * n);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uFoam;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform vec3 uSkyColor;
      uniform vec3 uNightColor;
      uniform float uSpecPower;
      uniform float uNight;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      varying vec3 vLocalDir;
      varying float vWave;

      void main() {
        vec3 N = normalize(vNormalW);
        vec3 V = normalize(cameraPosition - vPosW);
        vec3 L = normalize(uSunDir);

        float ndv = clamp(dot(N, V), 0.0, 1.0);
        float fresnel = pow(1.0 - ndv, 3.2);           // Fresnel（§12）
        float lambert = clamp(dot(N, L), 0.0, 1.0);
        float day = clamp(lambert * 1.6 - 0.06, 0.0, 1.0);

        // 深度感：向阳 + 迎角处偏浅蓝绿
        float t = clamp(day * 0.6 + (0.5 - 0.5 * fresnel) * 0.5, 0.0, 1.0);
        vec3 base = mix(uDeep, uShallow, t);



        // 基色：不做天空 Fresnel 抬白（那是白雾来源），只保留轻微环境反光
        vec3 col = base * (0.30 + 0.90 * day);
        col += uSkyColor * fresnel * 0.10 * day;

        // 阳光反射：金色反射带（宽）+ 细碎高光（由细浪法线扰动闪烁）
        vec3 H = normalize(L + V);
        float ndh = max(dot(N, H), 0.0);
        float band = pow(ndh, 14.0) * day * 0.42;
        float glint = pow(ndh, 90.0) * day * 0.60;
        col += uSunColor * min(band + glint, 0.95);

        // 夜晚：偏暗 + 冷色 + 微弱月光（月光同样来自 L 方向的高光）
        vec3 night = mix(uNightColor, uSkyColor * 0.18, fresnel * 0.6);
        night += uSunColor * pow(max(dot(N, H), 0.0), 40.0) * 0.22;
        col = mix(col, night, uNight);

        col = pow(max(col, vec3(0.0)), vec3(1.0 / 2.2));   // gamma 输出
        gl_FragColor = vec4(col, 1.0);   // 海洋球不透明（海岸无缝由陆地高度>=海平面保证）
      }
    `,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'Ocean';
  mesh.receiveShadow = true;
  mesh.userData.material = mat;

  mesh.setSun = (dir) => mat.uniforms.uSunDir.value.copy(dir).normalize();
  mesh.setNight = (n) => { mat.uniforms.uNight.value = THREE.MathUtils.clamp(n, 0, 1); };
  mesh.update = (time) => { mat.uniforms.uTime.value = time; };
  return mesh;
}

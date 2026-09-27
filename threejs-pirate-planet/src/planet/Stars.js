/**
 * Stars.js — 星空（§33）
 * 要求：不过亮、不过密、不抢主体；地球始终是画面中心。
 * 挂在 scene 下，不随星球自转。
 */
import * as THREE from 'three';

export function createStarField(count = 1400, radius = 1800) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const tmp = new THREE.Vector3();
  const palette = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xcfe0ff),
    new THREE.Color(0xfff0d0),
    new THREE.Color(0xa8c4ff),
  ];

  for (let i = 0; i < count; i++) {
    // 均匀球面分布
    const u = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    tmp.set(s * Math.cos(t), u, s * Math.sin(t)).multiplyScalar(radius * (0.85 + Math.random() * 0.15));
    positions[i * 3] = tmp.x;
    positions[i * 3 + 1] = tmp.y;
    positions[i * 3 + 2] = tmp.z;

    const c = palette[(Math.random() * palette.length) | 0];
    const dim = 0.25 + Math.random() * 0.5; // 刻意压暗，避免抢主体
    colors[i * 3] = c.r * dim;
    colors[i * 3 + 1] = c.g * dim;
    colors[i * 3 + 2] = c.b * dim;

    sizes[i] = 1.0 + Math.random() * 2.6;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.9 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: /* glsl */`
      attribute float aSize;
      varying vec3 vColor;
      uniform float uTime;
      uniform float uPixelRatio;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        // 极轻微闪烁，避免死板
        float tw = 0.86 + 0.14 * sin(uTime * 0.7 + position.x * 0.01 + position.z * 0.013);
        gl_PointSize = aSize * uPixelRatio * tw;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3 vColor;
      uniform float uOpacity;
      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float a = smoothstep(0.5, 0.06, length(d));
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor, a * uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  const points = new THREE.Points(geo, mat);
  points.name = 'StarField';
  points.frustumCulled = false;
  points.update = (t) => { mat.uniforms.uTime.value = t; };
  return points;
}

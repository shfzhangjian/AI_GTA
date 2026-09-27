/**
 * Atmosphere.js — 大气层边缘辉光（§32）
 * BackSide + Fresnel + 加色混合 + depthTest：
 * 被不透明星球遮住的辉光片元不画 → 只在星球轮廓外看到一圈淡蓝光晕。
 */
import * as THREE from 'three';
import { PLANET } from '../config.js';

export function createAtmosphere(radius = PLANET.ATMOSPHERE_RADIUS) {
  const geo = new THREE.SphereGeometry(radius, 64, 48);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0x5aa9ff) },
      uPower: { value: 3.6 },
      uIntensity: { value: 1.25 },
      uSunDir: { value: new THREE.Vector3(1, 0.3, 0.6).normalize() },
    },
    vertexShader: /* glsl */`
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vPosW = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3 vNormalW;
      varying vec3 vPosW;
      uniform vec3 uColor;
      uniform float uPower;
      uniform float uIntensity;
      uniform vec3 uSunDir;
      void main() {
        vec3 V = normalize(cameraPosition - vPosW);
        float f = pow(1.0 - abs(dot(normalize(vNormalW), V)), uPower);
        float sun = 0.30 + 0.70 * max(dot(normalize(vNormalW), normalize(uSunDir)), 0.0);
        float a = f * sun * uIntensity;
        if (a < 0.02) discard;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'Atmosphere';
  mesh.renderOrder = 2;
  mesh.setSun = (dir) => mat.uniforms.uSunDir.value.copy(dir).normalize();
  return mesh;
}

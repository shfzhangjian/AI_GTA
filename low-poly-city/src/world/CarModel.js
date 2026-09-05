/**
 * CarModel —— 集成 simple-muscle-car（MIT, ASouthernCat）的 Blender 肌肉车模型。
 *
 * - loadMuscleCarTemplate()：GLTF + Draco 解码（解码器已本地化 libs/draco/），失败返回 null（自动回退盒装程序车）。
 * - normalizeCarClone()：把模板归一化为车流规格 —— 目标车长、原点落在四轮接地面中心、车头朝 +x，
 *   并按实例克隆材质以便逐车换"车漆"颜色 / 烧毁黑化互不影响。
 */
import * as THREE from 'three';

let templatePromise = null;

/** 异步加载肌肉车模板（仅浏览器环境；node 测试不会触发） */
export function loadMuscleCarTemplate(url = './libs/car/car_draco.glb', dracoPath = './libs/draco/') {
  if (!templatePromise) {
    templatePromise = (async () => {
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js');
      const draco = new DRACOLoader();
      draco.setDecoderPath(dracoPath);
      const loader = new GLTFLoader();
      loader.setDRACOLoader(draco);
      const gltf = await loader.loadAsync(url);
      gltf.scene.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      return gltf.scene;
    })().catch(() => null); // 加载失败 -> null，车流保持程序化占位模型
  }
  return templatePromise;
}

/**
 * 归一化模板克隆：统一尺度 / 接地 / 车头朝 +x / 逐实例材质。
 * @param {THREE.Object3D} template loadMuscleCarTemplate() 的结果
 * @param {number} targetLen 目标车长（米）
 * @param {string|number|null} paint "车漆"材质重上色
 * @returns {THREE.Group} 可直接摆进场景的包装组（userData.height 为整车高度）
 */
export function normalizeCarClone(template, targetLen = 4.3, paint = null) {
  const inner = template.clone(true);
  inner.traverse((o) => {
    if (!o.isMesh) return;
    o.material = o.material.clone(); // 实例独立材质：逐车换漆/黑化互不影响
    o.castShadow = true;
    if (paint && o.material.name === '车漆') o.material.color.set(paint);
  });

  const outer = new THREE.Group();
  outer.add(inner);

  // ① 等比缩放到目标车长（取水平最长边为车长）
  let box = new THREE.Box3().setFromObject(inner);
  let size = box.getSize(new THREE.Vector3());
  inner.scale.setScalar(targetLen / Math.max(size.x, size.z, 1e-4));
  inner.updateMatrixWorld(true);

  // ② 判向：车灯材质（发光/发光环）沿长轴的均值位置即"车头"方向
  box = new THREE.Box3().setFromObject(inner);
  size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const axis = size.x >= size.z ? 'x' : 'z';
  const v = new THREE.Vector3();
  let headSum = 0;
  let headN = 0;
  inner.traverse((o) => {
    if (o.isMesh && (o.material.name === '发光' || o.material.name === '发光环')) {
      o.getWorldPosition(v);
      headSum += axis === 'x' ? v.x : v.z;
      headN++;
    }
  });
  if (headN > 0) {
    const sign = Math.sign(headSum / headN - (axis === 'x' ? center.x : center.z)) || 1;
    // 映射到"车头 +x"：长轴为 z 时 ±90°，长轴为 x 时 0/180°
    inner.rotation.y = axis === 'z' ? sign * Math.PI / 2 : (sign > 0 ? 0 : Math.PI);
    inner.updateMatrixWorld(true);
  }

  // ③ 水平居中、底面（轮胎接地）贴 y=0
  box = new THREE.Box3().setFromObject(inner);
  const c2 = box.getCenter(new THREE.Vector3());
  inner.position.set(-c2.x, -box.min.y, -c2.z);

  outer.userData.height = box.max.y - box.min.y;
  return outer;
}

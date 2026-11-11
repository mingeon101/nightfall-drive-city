import * as T from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { acceleratedRaycast, MeshBVH } from 'three-mesh-bvh';
import { unzip } from 'fflate';

const basename = name => name.split(/[\\/]/).pop().toLowerCase();
const zip = (bytes, filter) => new Promise((resolve, reject) => {
  unzip(bytes, { filter }, (error, files) => error ? reject(error) : resolve(files));
});
const image = name => /\.(png|jpe?g|webp)$/i.test(name);
const nextPaint = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

export async function readCity(file, progress) {
  if (file.size > 110_000_000) throw new Error('110MB 이하의 맵 ZIP을 선택하세요.');
  const outer = await zip(new Uint8Array(await file.arrayBuffer()), entry =>
    entry.originalSize <= 135_000_000 && (image(entry.name) || /(?:gameobject\.zip|newcity\.fbx)$/i.test(entry.name)));
  const innerZip = Object.keys(outer).find(name => basename(name) === 'gameobject.zip');
  const inner = innerZip ? await zip(outer[innerZip], entry =>
    entry.originalSize <= 135_000_000 && (image(entry.name) || basename(entry.name) === 'newcity.fbx')) : {};
  const model = Object.entries({...outer, ...inner}).find(([name]) => basename(name) === 'newcity.fbx')?.[1];
  if (!model) throw new Error('ZIP에서 NewCity.fbx를 찾을 수 없습니다.');
  progress('도시 모델을 읽고 있습니다…');
  await nextPaint();
  const urls = new Map();
  for (const [name, bytes] of [...Object.entries(outer), ...Object.entries(inner)]) {
    if (!image(name) || urls.has(basename(name))) continue;
    const mime = /\.png$/i.test(name) ? 'image/png' : /\.webp$/i.test(name) ? 'image/webp' : 'image/jpeg';
    urls.set(basename(name), URL.createObjectURL(new Blob([bytes], { type: mime })));
  }
  const manager = new T.LoadingManager();
  manager.setURLModifier(url => {
    if (url.startsWith('blob:')) {
      urls.set(url, url);
      return url;
    }
    return urls.get(basename(url)) || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  });
  const texturesReady = new Promise(resolve => { manager.onLoad = resolve; });
  try {
    const buffer = model.byteOffset === 0 && model.byteLength === model.buffer.byteLength ? model.buffer : model.slice().buffer;
    // The exporter emitted unsupported mapping metadata on some decorative meshes.
    const warn = console.warn;
    let city;
    try {
      console.warn = (message, ...args) => {
        if (!String(message).includes('unknown attribute mapping type NoMappingInformation')) warn(message, ...args);
      };
      city = new FBXLoader(manager).parse(buffer, '');
    } finally {
      console.warn = warn;
    }
    await Promise.race([texturesReady, new Promise(resolve => setTimeout(resolve, 3000))]);
    return city;
  } finally {
    for (const url of urls.values()) URL.revokeObjectURL(url);
  }
}

export function prepareCity(city, { scale = 1, flipX = false, pitch = 0, x = 0, z = 0 } = {}) {
  city.rotation.x += pitch;
  city.scale.multiplyScalar(scale);
  if (flipX) city.scale.x *= -1;
  city.updateMatrixWorld(true);
  const limits = new T.Box3().setFromObject(city);
  const middle = limits.getCenter(new T.Vector3());
  city.position.x += x-middle.x;
  city.position.z += z-middle.z;
  city.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(city);
  const solids = [];
  city.traverse(mesh => {
    if (!mesh.isMesh || !mesh.geometry.attributes.position?.count) return;
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
    solids.push({mesh, box});
    mesh.raycast = acceleratedRaycast;
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      material.side = T.DoubleSide;
      material.needsUpdate = true;
    }
  });
  if (!solids.length || bounds.isEmpty()) throw new Error('맵에 사용할 수 있는 지형이 없습니다.');
  const cell = 48;
  const grid = new Map();
  const large = [];
  const cellOf = value => Math.floor(value / cell);
  for (const solid of solids) {
    const {min,max} = solid.box;
    const left = cellOf(min.x), right = cellOf(max.x), top = cellOf(min.z), bottom = cellOf(max.z);
    if ((right-left+1)*(bottom-top+1) > 24) {
      large.push(solid);
      continue;
    }
    for (let x=left;x<=right;x++) for (let z=top;z<=bottom;z++) {
      const key = x+','+z;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(solid);
    }
  }
  const ray = new T.Raycaster();
  ray.firstHitOnly = true;
  const hits = [];
  function trace(origin, direction, range) {
    ray.set(origin, direction);
    let nearest = null;
    ray.far = range;
    const endX = origin.x + direction.x * range, endZ = origin.z + direction.z * range;
    const candidates = new Set(large);
    for (let x=cellOf(Math.min(origin.x,endX));x<=cellOf(Math.max(origin.x,endX));x++) {
      for (let z=cellOf(Math.min(origin.z,endZ));z<=cellOf(Math.max(origin.z,endZ));z++) {
        for (const solid of grid.get(x+','+z) ?? []) candidates.add(solid);
      }
    }
    for (const {mesh, box} of candidates) {
      if (!box.containsPoint(origin)) {
        const entry = ray.ray.intersectBox(box, boxHit);
        if (!entry || entry.distanceToSquared(origin) > ray.far ** 2) continue;
      }
      mesh.geometry.boundsTree ??= new MeshBVH(mesh.geometry, {indirect:true});
      hits.length = 0;
      mesh.raycast(ray, hits);
      if (hits[0] && hits[0].distance < ray.far) {
        nearest = hits[0];
        ray.far = nearest.distance;
      }
    }
    return nearest;
  }
  return {bounds, trace, solids};
}

const boxHit = new T.Vector3();
export const DOWN = new T.Vector3(0, -1, 0);

export function findStreet(world, x, z, minY, maxY) {
  const origin = new T.Vector3(x, maxY, z);
  const normal = new T.Vector3();
  const matrix = new T.Matrix3();
  for (let layer = 0; layer < 10 && origin.y > minY; layer++) {
    const hit = world.trace(origin, DOWN, origin.y - minY);
    if (!hit) return null;
    matrix.getNormalMatrix(hit.object.matrixWorld);
    normal.copy(hit.face.normal).applyNormalMatrix(matrix);
    if (Math.abs(normal.y) > .78 && !/water|ocean/i.test(hit.object.name)) return hit.point;
    origin.y = hit.point.y - .04;
  }
  return null;
}


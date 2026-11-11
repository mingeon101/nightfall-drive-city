import * as T from 'three';
import { readCity, prepareCity, findStreet, DOWN } from './city.mjs';

const $ = id => document.getElementById(id);
const scene = new T.Scene();
scene.background = new T.Color('#8babb1');
scene.fog = new T.FogExp2('#8babb1', .0033);
scene.add(new T.HemisphereLight('#ecf8ff', '#7b725c', 2.1));
const sun = new T.DirectionalLight('#ffe2ab', 2.5);
sun.position.set(-90, 160, 90);
scene.add(sun);
const camera = new T.PerspectiveCamera(68, 1, .06, 490);
camera.rotation.order = 'YXZ';
scene.add(camera);
const renderer = new T.WebGLRenderer({antialias: !matchMedia('(pointer:coarse)').matches, powerPreference:'high-performance'});
renderer.toneMapping = T.ACESFilmicToneMapping;
$('game').prepend(renderer.domElement);
function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.35));
  renderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', resize);
resize();

function block(w, h, d, color) {
  return new T.Mesh(new T.BoxGeometry(w,h,d), new T.MeshStandardMaterial({color, roughness:.68}));
}
const weapon = new T.Group();
const receiver = block(.11,.135,.42,0x283638);
const barrel = block(.047,.05,.33,0x1b2021);
const sight = block(.075,.036,.08,0x10191c);
barrel.position.set(0,.019,-.34);
sight.position.set(0,.083,-.095);
weapon.add(receiver, barrel, sight);
const flash = new T.Mesh(new T.SphereGeometry(.055,7,5),new T.MeshBasicMaterial({color:0xffcd79}));
flash.position.set(0,.019,-.51);
flash.visible = false;
weapon.add(flash);
camera.add(weapon);

const context = $('map').getContext('2d');
const keys = new Set();
const feet = new T.Vector3();
const origin = new T.Vector3();
const direction = new T.Vector3();
const aim = new T.Vector3();
const motion = new T.Vector3();
const enemies = [];
const enemyRay = new T.Raycaster();
const droneGeometry = new T.SphereGeometry(.54,12,8);
const droneShell = new T.MeshStandardMaterial({color:0x414b4f,metalness:.7,roughness:.4});
const droneEye = new T.MeshBasicMaterial({color:0xff654b});
const ringGeometry = new T.TorusGeometry(.69,.034,5,18);
let world, spawn, city, spawnSites, streetMap, streetBounds, startYaw;
let active = false, loading = false, fire = false, jump = false, drag = null;
let yaw = 0, pitch = 0, vy = 0, grounded = false;
let health = 100, ammo = 24, remaining = 0, cooldown = 0, reload = 0, hitMarker = 0, last = 0, elapsed = 0, fps = 60, mapClock = 0;
const coarse = matchMedia('(pointer:coarse)').matches;
const setStatus = message => { $('status').textContent = message; };

$('file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file || loading || world) return;
  loading = true;
  event.target.disabled = true;
  setStatus('ZIP 압축을 풀고 있습니다…');
  try {
    city = await readCity(file, setStatus);
    setStatus('도로와 충돌을 준비하고 있습니다…');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const imported = prepareCity(city);
    const roads = imported.solids.filter(({mesh,box}) => /^(Street\d+|Pista)$/i.test(mesh.name) &&
      Math.hypot(box.max.x-box.min.x,box.max.z-box.min.z)>14);
    const startingRoad = roads.find(({mesh}) => mesh.name === 'Street071') || roads[0];
    if (!startingRoad) throw new Error('맵에서 도로를 찾을 수 없습니다.');
    const center = startingRoad.box.getCenter(new T.Vector3());
    spawn = findStreet(imported,center.x,center.z,center.y-2,center.y+3);
    if (!spawn) throw new Error('도로에서 시작 위치를 찾을 수 없습니다.');
    spawnSites = roads.map(({box}) => box.getCenter(new T.Vector3()))
      .filter(p => p.distanceTo(spawn) > 18)
      .sort((a,b) => a.distanceToSquared(spawn)-b.distanceToSquared(spawn))
      .map(p => findStreet(imported,p.x,p.z,p.y-2,p.y+3))
      .filter(Boolean)
      .filter((p,i,list) => list.findIndex(other => other.distanceToSquared(p)<400) === i)
      .slice(0,12);
    if (!spawnSites.length) throw new Error('드론을 배치할 도로를 찾을 수 없습니다.');
    const eye = spawn.clone().add(new T.Vector3(0,1.65,0));
    const streetHeading = startingRoad.box.getSize(new T.Vector3());
    const headings = streetHeading.x > streetHeading.z ? [-Math.PI/2,Math.PI/2] : [0,Math.PI];
    const clear = angle => imported.trace(eye,new T.Vector3(-Math.sin(angle),0,-Math.cos(angle)),145)?.distance ?? 145;
    startYaw = clear(headings[0]) >= clear(headings[1]) ? headings[0] : headings[1];
    buildStreetMap(roads);
    scene.add(city);
    world = imported;
    reset();
    $('picker').hidden = true;
    $('play').hidden = false;
    setStatus('맵 준비 완료');
  } catch (error) {
    console.error(error);
    city?.traverse(mesh => mesh.geometry?.dispose());
    city = null;
    setStatus('맵을 열 수 없습니다. ' + (error.message || 'ZIP 파일을 다시 확인하세요.'));
    event.target.value = '';
    event.target.disabled = false;
  } finally { loading = false; }
});

function reset() {
  for (const enemy of enemies) enemy.root.removeFromParent();
  enemies.length = 0;
  for (const [index, point] of spawnSites.entries()) {
    const root = new T.Group();
    const shell = new T.Mesh(droneGeometry,droneShell);
    const ring = new T.Mesh(ringGeometry,droneEye);
    ring.rotation.x = Math.PI/2;
    root.position.copy(point).add(new T.Vector3(0,1.85,0));
    root.add(shell,ring);
    scene.add(root);
    enemies.push({root,shell,base:point.y,phase:index*1.3,hp:2,wait:.7+index*.17});
  }
  remaining = enemies.length;
  feet.copy(spawn);
  yaw = startYaw; pitch = 0; vy = 0; health = 100; ammo = 24; cooldown = 0; reload = 0; hitMarker = 0; grounded = true;
  camera.position.copy(feet).y += 1.65;
  camera.rotation.set(0,0,0);
}

function setActive(value) {
  active = value;
  keys.clear();
  fire = false;
  jump = false;
  drag = null;
  $('menu').hidden = value;
  $('hud').hidden = !value;
  $('touch').hidden = !value || !coarse;
  if (!value && document.pointerLockElement) document.exitPointerLock();
}
$('play').addEventListener('click', () => {
  if (!world) return;
  if (health <= 0) reset();
  setActive(true);
  if (!coarse) {
    try { renderer.domElement.requestPointerLock()?.catch(() => {}); }
    catch { /* Drag-to-look remains available. */ }
  }
});
function pause() {
  if (!active) return;
  setActive(false);
  $('play').textContent = health <= 0 ? '다시 시작' : '계속하기';
  setStatus(health <= 0 ? '작전 실패 · 드론을 피해 엄폐하세요.' : '일시정지');
}
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && !coarse) pause(); });
addEventListener('blur', pause);
addEventListener('keydown', event => {
  if (!active) return;
  if (['Space','KeyW','KeyA','KeyS','KeyD','KeyM'].includes(event.code)) event.preventDefault();
  keys.add(event.code);
  if (event.repeat) return;
  if (event.code==='Escape') pause();
  if (event.code==='KeyR') beginReload();
  if (event.code==='KeyM') $('map').classList.toggle('open');
  if (event.code==='Space') jump = true;
});
addEventListener('keyup', event => keys.delete(event.code));
function look(dx,dy) {
  yaw -= dx*.0027;
  pitch = T.MathUtils.clamp(pitch-dy*.0027,-1.48,1.48);
}
document.addEventListener('mousemove', event => {
  if (active && document.pointerLockElement) look(event.movementX,event.movementY);
});
renderer.domElement.addEventListener('pointerdown', event => {
  if (!active || event.button!==0) return;
  if (!coarse) fire = true;
  if (!document.pointerLockElement) {
    drag = {id:event.pointerId,x:event.clientX,y:event.clientY};
    event.target.setPointerCapture(event.pointerId);
  }
});
renderer.domElement.addEventListener('pointermove', event => {
  if (drag?.id !== event.pointerId) return;
  look(event.clientX-drag.x,event.clientY-drag.y);
  drag.x=event.clientX; drag.y=event.clientY;
});
for (const type of ['pointerup','pointercancel']) addEventListener(type, event => {
  if (drag?.id===event.pointerId) drag=null;
});
function hold(button, down, up) {
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    down();
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(type,up);
}
for (const button of document.querySelectorAll('[data-key]')) {
  const key = button.dataset.key;
  hold(button,() => { keys.add(key); if (key==='Space') jump=true; },() => keys.delete(key));
}
hold($('fire'),() => {fire=true;},() => {fire=false;});
for (const type of ['pointerup','pointercancel']) renderer.domElement.addEventListener(type,() => {fire=false;});
addEventListener('mouseup',event => {if(event.button===0) fire=false;});
$('reload').onclick = beginReload;
$('show-map').onclick = () => $('map').classList.toggle('open');
$('pause').onclick = pause;

function beginReload() {
  if (active && !reload && ammo<24) reload = 1.13;
}
function shoot() {
  if (reload || cooldown>0) return;
  if (!ammo) { beginReload(); return; }
  ammo--;
  cooldown = .13;
  camera.getWorldDirection(aim);
  const wall = world.trace(camera.position,aim,150);
  enemyRay.set(camera.position,aim);
  enemyRay.far = wall?.distance ?? 150;
  const targets = enemies.filter(enemy => enemy.hp>0);
  const hit = enemyRay.intersectObjects(targets.map(enemy => enemy.shell),false)[0];
  if (!hit) return;
  const enemy = targets.find(candidate => candidate.shell===hit.object);
  hitMarker = .14;
  if (--enemy.hp === 0) {
    enemy.root.visible = false;
    remaining--;
  }
}
function stepAxis(axis, amount) {
  if (!amount) return;
  direction.set(0,0,0);
  direction[axis] = Math.sign(amount);
  for (const height of [.33,1.27]) {
    origin.copy(feet);
    origin.y += height;
    if (world.trace(origin,direction,Math.abs(amount)+.29)) return;
  }
  feet[axis] += amount;
}
function update(dt) {
  elapsed += dt;
  motion.set(Number(keys.has('KeyD'))-Number(keys.has('KeyA')),0,Number(keys.has('KeyS'))-Number(keys.has('KeyW')));
  if (motion.lengthSq()) {
    motion.normalize().applyAxisAngle(T.Object3D.DEFAULT_UP,yaw);
    motion.multiplyScalar(dt*(keys.has('ShiftLeft') || keys.has('ShiftRight') ? 13 : 7.4));
    stepAxis('x',motion.x);
    stepAxis('z',motion.z);
  }
  if (jump && grounded) { vy=6.2; grounded=false; }
  jump = false;
  if (vy>0) {
    origin.copy(feet);
    origin.y+=1.63;
    if (world.trace(origin,T.Object3D.DEFAULT_UP,vy*dt+.05)) vy=0;
  }
  vy -= 19*dt;
  const nextY=feet.y+vy*dt;
  const ground = findStreet(world,feet.x,feet.z,nextY-.3,feet.y+(grounded?.29:.06));
  if (vy<=0 && ground && ground.y>=nextY-.24) {
    feet.y=ground.y;
    grounded=true;
    vy=0;
  } else { feet.y=nextY; grounded=false; }
  if (feet.y<world.bounds.min.y-8) { feet.copy(spawn); vy=0; health=Math.max(1,health-20); }
  camera.position.copy(feet).y += 1.65;
  camera.rotation.set(pitch,yaw,0,'YXZ');
  camera.updateMatrixWorld(true);
  cooldown = Math.max(0,cooldown-dt);
  if (reload>0) {
    reload=Math.max(0,reload-dt);
    if (!reload) ammo=24;
  }
  if (fire) shoot();
  hitMarker=Math.max(0,hitMarker-dt);
  flash.visible=cooldown>.098;
  weapon.position.set(.26,-.2-(reload>0?.16:0),-.43+(flash.visible?.033:0));
  $('aim').classList.toggle('hit',hitMarker>0);
  for (const enemy of enemies) {
    if (!enemy.hp) continue;
    enemy.root.position.y = enemy.base+1.85+Math.sin(elapsed*2+enemy.phase)*.42;
    enemy.root.updateMatrixWorld(true);
    enemy.wait -= dt;
    direction.subVectors(camera.position,enemy.root.position);
    const distance=direction.length();
    if (enemy.wait<=0 && distance<28) {
      enemy.wait=1.4;
      direction.normalize();
      if (!world.trace(enemy.root.position,direction,distance)) health=Math.max(0,health-7);
    }
  }
  $('objective').textContent = remaining ? '순찰 드론 ' + (enemies.length-remaining) + ' / ' + enemies.length : '작전 완료 · 자유 탐색';
  $('stats').textContent = 'HP ' + health + '　 ' + (reload ? '재장전 중' : ammo+' / 24') + '　' + Math.round(fps) + ' FPS';
  if (!health) pause();
}

function buildStreetMap(roads) {
  streetBounds = new T.Box3();
  for (const {box} of roads) streetBounds.union(box);
  streetMap = document.createElement('canvas');
  const span = streetBounds.getSize(new T.Vector3());
  const density = 1536/Math.max(span.x,span.z);
  streetMap.width = Math.ceil(span.x*density);
  streetMap.height = Math.ceil(span.z*density);
  const roadsContext = streetMap.getContext('2d');
  const vertex = new T.Vector3();
  roadsContext.fillStyle = '#7f9996';
  for (const {mesh} of roads) {
    const {geometry,matrixWorld} = mesh;
    const positions = geometry.attributes.position;
    const index = geometry.index;
    const count = index?.count ?? positions.count;
    roadsContext.beginPath();
    for (let i=0;i<count;i+=3) {
      for (let corner=0;corner<3;corner++) {
        const id = index ? index.getX(i+corner) : i+corner;
        vertex.fromBufferAttribute(positions,id).applyMatrix4(matrixWorld);
        const x=(vertex.x-streetBounds.min.x)*density;
        const y=(vertex.z-streetBounds.min.z)*density;
        if (corner) roadsContext.lineTo(x,y);
        else roadsContext.moveTo(x,y);
      }
      roadsContext.closePath();
    }
    roadsContext.fill();
  }
}

function drawMap() {
  const size=$('map').width;
  const wide=$('map').classList.contains('open');
  const centerX=wide?(streetBounds.min.x+streetBounds.max.x)/2:feet.x;
  const centerZ=wide?(streetBounds.min.z+streetBounds.max.z)/2:feet.z;
  const width=streetBounds.max.x-streetBounds.min.x, depth=streetBounds.max.z-streetBounds.min.z;
  const scale=wide?size/(Math.max(width,depth)+100):size/360;
  const x=value=>size/2+(value-centerX)*scale;
  const z=value=>size/2+(value-centerZ)*scale;
  context.fillStyle='#17252c';
  context.fillRect(0,0,size,size);
  context.strokeStyle='#2f454c';
  for (let i=-2800;i<=2800;i+=100) {
    context.beginPath(); context.moveTo(x(i),0); context.lineTo(x(i),size); context.stroke();
    context.beginPath(); context.moveTo(0,z(i)); context.lineTo(size,z(i)); context.stroke();
  }
  context.drawImage(streetMap,x(streetBounds.min.x),z(streetBounds.min.z),width*scale,depth*scale);
  context.fillStyle='#ff805c';
  for (const enemy of enemies) {
    if (!enemy.hp) continue;
    context.beginPath();
    context.arc(x(enemy.root.position.x),z(enemy.root.position.z),5.5,0,Math.PI*2);
    context.fill();
  }
  context.save();
  context.translate(x(feet.x),z(feet.z));
  context.rotate(-yaw);
  context.fillStyle='#ddfb86';
  context.beginPath(); context.moveTo(0,-11); context.lineTo(7,8); context.lineTo(-7,8); context.closePath(); context.fill();
  context.restore();
}

renderer.setAnimationLoop(now => {
  const seconds=(now-last)/1000;
  last=now;
  if (!active) return;
  const dt=Math.min(.045,seconds || .016);
  if (seconds>0 && seconds<.25) fps=T.MathUtils.lerp(fps,1/seconds,.05);
  update(dt);
  renderer.render(scene,camera);
  mapClock-=dt;
  if (mapClock<=0) {drawMap(); mapClock=.09;}
});


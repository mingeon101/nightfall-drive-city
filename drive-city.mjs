import * as T from 'three';
import { readCity, prepareCity, findStreet } from './city.mjs';

export async function loadDriveCity(file, status) {
  const model = await readCity(file,status);
  status('첨부 도시의 도로와 충돌을 준비하고 있습니다…');
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const map = prepareCity(model,{x:140000,z:140000});
  const roads = map.solids.filter(({mesh,box}) => /^(Street\d+|Pista)$/i.test(mesh.name) &&
    Math.hypot(box.max.x-box.min.x,box.max.z-box.min.z)>14);
  const road = roads.find(({mesh}) => mesh.name==='Street071') || roads[0];
  if (!road) throw Error('ZIP에서 도시 도로를 찾을 수 없습니다.');
  const center = road.box.getCenter(new T.Vector3());
  const floor = (x,z,y=0) => findStreet(map,x,z,y-8,y+.38)?.y;
  const sites = roads.map(({box}) => box.getCenter(new T.Vector3()))
    .map(p => findStreet(map,p.x,p.z,p.y-2,p.y+3)).filter(p => p && Math.abs(p.y)<.2)
    .sort((a,b)=>a.distanceToSquared(center)-b.distanceToSquared(center))
    .filter((p,i,list)=>list.findIndex(q=>p.distanceToSquared(q)<100)===i);
  const spawn = sites[0];
  if (!spawn || sites.length<12) throw Error('전투에 사용할 도로가 부족합니다.');
  const origin = new T.Vector3(), direction = new T.Vector3();
  const aim = new T.Vector3();
  function wall(a,b) {
    direction.set(b.x-a.x,b.y-a.y,b.z-a.z);
    const range=direction.length();
    if (range<.001) return null;
    return map.trace(origin.set(a.x,a.y,a.z),direction.multiplyScalar(1/range),range)?.point ?? null;
  }
  function move(pos,dx,dz,r,y,height) {
    if (!dx&&!dz) return false;
    let blocked=false;
    for (const [axis,d] of [['x',dx],['z',dz]]) {
      if (!d) continue;
      direction.set(axis==='x'?Math.sign(d):0,0,axis==='z'?Math.sign(d):0);
      const across=axis==='x'?'z':'x';
      const x=pos.x+(axis==='x'?d:0), z=pos.z+(axis==='z'?d:0);
      let hit=!contains(x,z)||(y<12&&floor(x,z,y)===undefined);
      for(const side of [-r*.8,0,r*.8]) {
        if(hit) break;
        origin.set(pos.x,y+Math.min(1,height*.55),pos.z);
        origin[across]+=side;
        hit=!!map.trace(origin,direction,Math.abs(d)+r);
      }
      if(hit) blocked=true;else pos[axis]+=d;
    }
    return blocked;
  }
  function contains(x,z) {
    const {min,max}=map.bounds;
    return x>=min.x&&x<=max.x&&z>=min.z&&z<=max.z;
  }
  const roadAxes = roads.filter(({mesh})=>mesh.name!=='Pista').flatMap(({box})=>{
    const size=box.getSize(new T.Vector3()), center=box.getCenter(new T.Vector3());
    const east=size.x>size.z, length=Math.max(size.x,size.z), width=Math.min(size.x,size.z);
    if(length<28||width<5||length<width*1.5||width>43)return [];
    const y=floor(center.x,center.z,center.y);
    return y===undefined||Math.abs(y)>.25?[]:[{point:{x:center.x,y,z:center.z},east,length,width}];
  });
  const runway=roadAxes.filter(r=>r.length>=80&&r.width>=12&&Math.hypot(r.point.x-spawn.x,r.point.z-spawn.z)>275)
    .sort((a,b)=>b.length-a.length).find(r=>{
      const {point,east}=r, half=Math.min(95,r.length*.38);
      const from={x:point.x-(east?half:0),y:point.y+1.8,z:point.z-(east?0:half)};
      const to={x:point.x+(east?half:0),y:from.y,z:point.z+(east?0:half)};
      return !wall(from,to)&&[from,to].every(p=>floor(p.x,p.z,point.y)!==undefined);
    });
  const roadsPath=new Path2D();
  const vertex=new T.Vector3();
  for(const {mesh} of roads) {
    const {geometry,matrixWorld}=mesh, pos=geometry.attributes.position, idx=geometry.index;
    for(let i=0;i<(idx?.count??pos.count);i+=3){
      for(let j=0;j<3;j++){
        vertex.fromBufferAttribute(pos,idx?idx.getX(i+j):i+j).applyMatrix4(matrixWorld);
        if(j) roadsPath.lineTo(vertex.x-140000,vertex.z-140000);
        else roadsPath.moveTo(vertex.x-140000,vertex.z-140000);
      }
      roadsPath.closePath();
    }
  }
  function draw(ctx,size,player,yaw,expanded,actors,facilities=[],vehicles=[]) {
    const range=expanded?2800:220, scale=size/(2*range);
    const center=expanded?{x:140000,z:140000}:player;
    const px=x=>size/2+(x-center.x)*scale, pz=z=>size/2+(z-center.z)*scale;
    ctx.fillStyle='#12242e';
    ctx.fillRect(0,0,size,size);
    ctx.save();ctx.translate(px(140000),pz(140000));ctx.scale(scale,scale);
    ctx.fillStyle='#7f9996';ctx.fill(roadsPath);ctx.restore();
    for(const p of actors){
      if(p.hp<=0||(!p.enemy&&!p.ally&&expanded))continue;
      const radius=p.enemy||p.ally?3:1.4;
      ctx.fillStyle=p.ally?'#81dcff':p.enemy?'#ef926c':'#bfc9bd';
      ctx.fillRect(px(p.root.position.x)-radius,pz(p.root.position.z)-radius,radius*2,radius*2);
    }
    ctx.fillStyle='#e8dcad';
    if(!expanded)for(const v of vehicles)if(!v.destroyed)ctx.fillRect(px(v.x)-2,pz(v.z)-2,4,4);
    ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    for(const f of facilities){
      const x=px(f.x),z=pz(f.z);
      ctx.fillStyle='#12242e';ctx.fillRect(x-8,z-8,16,16);
      ctx.strokeStyle='#8bdcc9';ctx.strokeRect(x-8,z-8,16,16);
      ctx.fillStyle='#e6fff4';ctx.fillText(f.icon,x,z);
    }
    ctx.save();ctx.translate(px(player.x),pz(player.z));ctx.rotate(-yaw);
    ctx.fillStyle='#efff89';ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,7);ctx.lineTo(-6,7);ctx.fill();ctx.restore();
  }
  const originEye={x:spawn.x,y:spawn.y+1.7,z:spawn.z};
  const headings=[0,Math.PI/2,Math.PI,-Math.PI/2];
  const sight=angle=>{
    aim.set(originEye.x-Math.sin(angle)*120,originEye.y,originEye.z-Math.cos(angle)*120);
    const hit=wall(originEye,aim);
    return hit?Math.hypot(hit.x-originEye.x,hit.z-originEye.z):120;
  };
  const heading=headings.reduce((best,value)=>sight(value)>sight(best)?value:best,0);
  model.visible=false;
  return {model,spawn,sites,heading,contains,floor,wall,move,draw,roadAxes,runway};
}


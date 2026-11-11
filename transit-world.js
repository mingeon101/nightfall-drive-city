import {STATIONS} from './core.mjs?v=33';
import {BUS_STOPS,createBusService,busPosition} from './transport.mjs?v=33';
export function buildTransport(T,scene,world){
 const {m}=world,platforms=new Map(),buses=[],shelters=[],batches=new Map();
 const glass=new T.MeshStandardMaterial({color:0x8ec5d5,transparent:true,opacity:.28,metalness:.15,roughness:.2});
 const blue=new T.MeshStandardMaterial({color:0x2877c9,roughness:.65}),green=new T.MeshStandardMaterial({color:0x32a585,roughness:.7});
 const box=(root,w,h,d,x,y,z,mat=m.concrete)=>{if(!root.userData.batch)return world.cube(w,h,d,x,y,z,mat,false,root);if(!batches.has(root))batches.set(root,new Map());const group=batches.get(root);if(!group.has(mat))group.set(mat,[]);group.get(mat).push({w,h,d,x,y,z})};
 function screenPair(root,x,y,z,width=.74,height=2.7){const leaves=[];for(const side of [-1,1]){const leaf=new T.Group();leaf.position.set(x,y,z+side*width/2);root.add(leaf);box(leaf,.07,height,width,0,0,0,glass);box(leaf,.11,.08,width+.05,0,height/2,0,m.metal);box(leaf,.11,.08,width+.05,0,-height/2,0,m.metal);box(leaf,.11,height,.055,0,0,side*width/2,m.white);box(leaf,.12,.07,width,0,-.2,0,m.yellow);leaves.push({mesh:leaf,z:leaf.position.z,side})}return leaves}
 for(const s of STATIONS){if(s.regional){const r=new T.Group();r.position.set(s.x,0,s.z+12);r.userData.batch=true;scene.add(r);box(r,7,3.5,5,0,1.75,0,m.dark);box(r,7.5,.3,5.5,0,3.6,0,green);world.label('Ⓜ 3 · '+s.name,s.x,5,s.z+12,'#9beac4',18);shelters.push(r)}}
 for(const s of STATIONS)for(const line of s.lines){
  const root=new T.Group();root.userData.batch=true;root.position.set(s.x,line===1?-10:-17,s.z);root.rotation.y=-Math.PI/2;scene.add(root);const doors=[];
  box(root,8,.8,44,6,.4,5,m.sand);box(root,3.2,.2,96,0,-.05,12,m.dark);box(root,20,.25,96,0,5.2,12,m.dark);box(root,.3,4.5,44,10,2.65,5,m.concrete);
  for(const x of [-1,1])box(root,.12,.12,96,x,.12,12,m.metal);
  box(root,.35,.08,43,2.6,.85,5,m.yellow);box(root,.7,.06,43,3.2,.85,5,m.white);
  // Segmented fixed glazing leaves real gaps for the sliding doors.
  const doorZ=[-2.8,2.8,8.2,13.8];let previous=-16;
  for(const z of [...doorZ,28]){const left=z===28?28:z-.8,len=left-previous;if(len>0){box(root,.08,2.7,len,2.1,2.25,(previous+left)/2,glass);box(root,.16,.16,len,2.1,3.65,(previous+left)/2,m.metal)}if(z!==28){doors.push(...screenPair(root,2.1,2.25,z));previous=z+.8}}
  for(const z of [-11,0,11,22]){box(root,.55,4.3,.55,8.8,2.9,z,m.white);box(root,4,.14,1.1,6,4.9,z,m.window)}
  for(const z of [-8,18]){box(root,1.2,.25,3,7,1.35,z,blue);box(root,.2,1.0,3,7.5,1.8,z,blue)}
  // Visible stairs, tactile paving and exit gate at the far end of the platform.
  for(let i=0;i<7;i++)box(root,2,.18+i*.12,.7,7.8,.8+(i*.12)/2,-8-i*.65,m.concrete);
  box(root,2.7,.18,1,7.8,3.8,-9,m.green);box(root,.12,1.8,4,8.9,1.8,-10,m.metal);
  world.label(`${line}호선 ${s.name} · 승강장`,s.x+4,root.position.y+4,s.z+8,line===1?'#8ac8ff':'#8de2b1',17);
  world.label('↑ 지상 출구 · E',s.x+9,root.position.y+3.5,s.z+7.8,'#a5efbe',8);
  platforms.set(`${s.id}:${line}`,{station:s,line,root,doors,doorFraction:0});
 }
 function train(line){const root=new T.Group(),doors=[];root.userData.batch=true;scene.add(root);const color=line===1?blue:green;
  for(let car=0;car<2;car++){const offset=car*11;box(root,2.9,.22,10,0,.72,offset,m.metal);box(root,2.9,.18,10,0,3.55,offset,m.white);
   for(const side of [-1,1]){for(const z of [-4.2,0,4.2]){const width=z===0?3.8:1.3;box(root,.10,.7,width,side*1.46,1.1,z+offset,color);box(root,.08,1.6,width,side*1.46,2.32,z+offset,glass);box(root,.12,.1,width,side*1.46,3.3,z+offset,m.white)}for(const z of [-2.8,2.8])doors.push(...screenPair(root,side*1.47,2.2,z+offset,.74,2.5));for(const z of [-4,0,4]){box(root,.6,.35,1.5,side*1.02,1.1,z+offset,color);box(root,.15,.8,1.5,side*1.3,1.65,z+offset,color)}}
   for(const z of [-4.8,4.8]){box(root,2.9,.65,.12,0,1.08,z+offset,color);box(root,2.7,1.6,.07,0,2.3,z+offset,glass);box(root,2.9,.1,.15,0,3.2,z+offset,m.white)}for(const z of [-3,0,3]){box(root,.045,2.5,.045,0,2.2,z+offset,m.metal);box(root,1.9,.08,.2,0,3.4,z+offset,m.window)}
  }return {line,root,doors,distance:0,doorFraction:0};
 }
 world.trains.push(train(1),train(2),train(3));
 for(let index=0;index<BUS_STOPS.length;index++){
  const stop=BUS_STOPS[index],shelter=new T.Group();shelter.userData.batch=true;shelter.position.set(stop.x,0,stop.z);scene.add(shelter);shelters.push(shelter);
  box(shelter,8,.16,3,0,.08,0,m.sand);box(shelter,8,.18,3,0,3.1,0,blue);for(const x of [-3.6,3.6])box(shelter,.13,3,.13,x,1.5,1, m.metal);box(shelter,7.5,2.6,.08,0,1.65,1.1,glass);box(shelter,5,.15,.8,0,1.0,.6,m.metal);box(shelter,.15,3.8,.15,-4.6,1.9,0,m.white);box(shelter,1.4,1.1,.18,-4.6,3.4,0,blue);world.label(`BUS 472 · ${stop.name}`,stop.x,4.3,stop.z,'#a8d3ff',16);
  const root=new T.Group();root.userData.batch=true;scene.add(root);const doors=[];box(root,2.7,.45,10,0,.7,0,blue);box(root,2.7,.2,10,0,3.45,0,m.white);box(root,2.5,.15,9.6,0,1.15,0,m.dark);
  for(const side of [-1,1]){for(const [z,length]of side===1?[[-4.7,.6],[-1,4],[3.7,2.6]]:[[0,9.4]]){box(root,.06,1.55,length,side*1.36,2.55,z,glass);box(root,.1,.5,length,side*1.36,1.47,z,blue)}for(const z of [-3.3,-1.1,1.1,3.3]){if(side===1&&(Math.abs(z+3.7)<1||Math.abs(z-1.7)<1))continue;box(root,.55,.25,1.1,side*1,1.4,z,blue);box(root,.15,.9,1.1,side*1.25,1.85,z,blue)}}
  box(root,2.5,1.7,.06,0,2.5,-5,glass);box(root,2.5,1.5,.06,0,2.5,5,glass);box(root,1.8,.3,.1,0,3.15,-5.04,m.yellow);for(const z of [-3.7,1.7])doors.push(...screenPair(root,1.41,2.1,z,.68,2.3));
  for(const x of [-1.35,1.35])for(const z of [-3.3,3.3]){const wheel=new T.Mesh(new T.CylinderGeometry(.58,.58,.24,12),m.black);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.58,z);root.add(wheel)}
  const service=createBusService(index),p=busPosition(service);root.position.set(p.x,0,p.z);root.visible=false;buses.push({root,doors,service,doorFraction:0});
 }
 const transform=new T.Object3D();for(const [root,materials]of batches)for(const [material,parts]of materials){const mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),material,parts.length);parts.forEach((p,i)=>{transform.position.set(p.x,p.y,p.z);transform.scale.set(p.w,p.h,p.d);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix)});mesh.computeBoundingSphere();root.add(mesh)}
 return {platforms,buses,shelters};
}
export function slideDoors(entity,fraction){entity.doorFraction=fraction;for(const d of entity.doors)d.mesh.position.z=d.z+d.side*.85*fraction}

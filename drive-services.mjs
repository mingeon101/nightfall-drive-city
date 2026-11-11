import {routeLength,sampleRoute} from './core.mjs?v=33';

export function buildDriveServices(T,scene,world,city){
  const {m}=world;
  const root=new T.Group();
  scene.add(root);
  root.visible=false;
  const metal=new T.MeshStandardMaterial({color:0x233641,roughness:.75});
  const colors={station:0x58bceb,hospital:0xe66867,store:0x5ee6a0,airport:0xffcd73,base:0xb3bd76};
  const specs=[
    ['station','중앙역','M',2],['hospital','시립병원','+',3],['store','24시 편의점','C',5],
    ['station','상업지구역','M',13],['station','공항역','M',26],
    ['airport','Drive City 공항','A',28],['base','서부 군사기지','B',37]
  ];
  const facilities=[];
  const direction=(x,z,dx,dz)=>({x:x+dx,z:z+dz});
  function clear(a,b,y){
    return !city.wall({x:a.x,y,z:a.z},{x:b.x,y,z:b.z});
  }
  function openPad(p,w,d){
    const points=[[-w,-d],[w,-d],[-w,d],[w,d]].map(([x,z])=>direction(p.x,p.z,x,z));
    return [p,...points].every(q=>city.floor(q.x,q.z,p.y)!==undefined)&&
      points.every(q=>clear(p,q,p.y+.8)&&clear(p,q,p.y+2.7));
  }
  const choosePad=(anchor,w,d)=>{
    for(const radius of [0,9,15,23,34,46]){
      for(let i=0;i<8;i++){
        const angle=i*Math.PI/4;
        const p={x:anchor.x+Math.cos(angle)*radius,z:anchor.z+Math.sin(angle)*radius,y:anchor.y};
        const floor=city.floor(p.x,p.z,p.y);
        if(floor!==undefined&&facilities.every(f=>Math.hypot(f.x-p.x,f.z-p.z)>24)&&openPad({...p,y:floor},w,d))return {...p,y:floor};
      }
    }
    return null;
  };
  for(const [kind,name,icon,index] of specs){
    const primary=kind==='airport'||index===26?city.runway?.point:city.sites[index];
    const alternatives=[primary,...city.sites.slice(index,index+16)].filter(Boolean);
    let pad=null;
    for(const q of alternatives){pad=choosePad(q,kind==='station'?3:5,3);if(pad)break}
    if(!pad)continue;
    const {x,y,z}=pad;
    const color=new T.MeshStandardMaterial({color:colors[kind],roughness:.63});
    const box=(w,h,d,dx,dy,dz,mat=metal)=>world.cube(w,h,d,x+dx,y+dy,z+dz,mat,false,root);
    const width=kind==='station'?6:10;
    box(width,.15,6,0,.08,0,m.concrete);
    box(width,.42,6,0,3.35,0,color);
    for(const side of [-1,1])for(const end of [-1,1])box(.24,3.2,.24,side*(width/2-.3),1.6,end*2.7);
    box(width*.8,.55,.26,0,2.73,-2.62,color);
    box(width*.75,.2,.85,0,1.02,1.82,m.white);
    if(kind==='hospital'){
      box(1.8,.54,.2,0,3.98,-2.5,color);
      box(.54,1.7,.21,0,3.98,-2.5,color);
      for(const x of [-3,3])box(1.5,.32,2.25,x,.65,-.6,m.white);
    }else if(kind==='store'){
      for(const x of [-2.9,0,2.9]){
        box(2.15,2.3,.38,x,1.15,-2.65,m.white);
        for(const y of [.55,1.14,1.72])box(2.1,.1,.7,x,y,-2.4,color);
      }
    }else if(kind==='airport'){
      box(1.1,4.2,1.1,3.6,3,-1.9,m.concrete);
      box(2.8,1.0,2.7,3.6,5.3,-1.6,m.glass);
      box(3.1,.25,3,3.6,5.91,-1.6,color);
    }else if(kind==='base'){
      for(const x of [-3.1,3.1])for(let level=0;level<2;level++)box(1.75,.66,.92,x,.45+level*.66,-1.75,m.green);
    }else{
      for(let i=0;i<5;i++)box(2.4,.15+i*.12,.43,0,.1+i*.06,-.8-i*.4,m.dark);
    }
    const label=world.label(name,x,y+4.55,z,'#e9fcff',width+5);root.attach(label);
    const f={...pad,id:'drive-service-'+index,kind,name,icon,counter:pad};
    if(kind==='station')Object.assign(f,{drive:true,lines:[2],exit:pad,country:'drive'});
    facilities.push(f);
  }

  const lights=[];
  function addLamp(x,z,y,east){
    const floor=city.floor(x,z,y);
    if(floor===undefined||lights.some(q=>Math.hypot(q.x-x,q.z-z)<16)||
      facilities.some(f=>Math.hypot(f.x-x,f.z-z)<9))return false;
    if(city.wall({x,y:floor+.1,z},{x,y:floor+5.8,z}))return false;
    lights.push({x,z,y:floor,east});
    return true;
  }
  for(const segment of city.roadAxes){
    const count=Math.min(10,Math.max(0,Math.floor(segment.length/38)));
    for(let i=0;i<count;i++){
      const advance=(i+.5)*segment.length/count-segment.length/2;
      const offset=segment.width/2-1.15;
      const {x,z}=segment.point;
      const p={x:x+(segment.east?advance:offset),z:z+(segment.east?offset:advance),y:segment.point.y};
      addLamp(p.x,p.z,p.y,segment.east);
    }
  }
  for(const p of city.sites){
    for(const [dx,dz] of [[10,8],[-10,-8],[10,-8],[-10,8]]){
      if(addLamp(p.x+dx,p.z+dz,p.y,Math.abs(dz)>Math.abs(dx)))break;
    }
  }
  const bulb=new T.MeshStandardMaterial({color:0xffe3a1,emissive:0xffbd62,emissiveIntensity:.25});
  const transform=new T.Object3D();
  for(const [w,h,d,height,arm,mat] of [[.19,5.5,.19,2.75,0,metal],[1.45,.16,.2,5.42,.65,metal],[.65,.16,.43,5.32,1.3,bulb]]){
    const mesh=new T.InstancedMesh(new T.BoxGeometry(w,h,d),mat,lights.length);
    lights.forEach((l,i)=>{
      transform.position.set(l.x-(l.east?0:arm),l.y+height,l.z-(l.east?arm:0));
      transform.rotation.y=l.east?Math.PI/2:0;
      transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);
    });
    mesh.computeBoundingSphere();root.add(mesh);
  }
  const spill=Array.from({length:4},()=>{const light=new T.PointLight(0xffcf86,0,25,2);light.visible=false;root.add(light);return light});
  let nextUpdate=0;
  function update(dt,player,hours){
    nextUpdate-=dt;
    if(nextUpdate>0)return;
    nextUpdate=.45;
    const night=hours>=18||hours<6;
    bulb.emissiveIntensity=night?2.2:.25;
    const closest=night?lights.map(l=>({l,d:Math.hypot(l.x-player.x,l.z-player.z)})).filter(l=>l.d<48).sort((a,b)=>a.d-b.d).slice(0,spill.length):[];
    spill.forEach((light,i)=>{const p=closest[i]?.l;light.visible=!!p;if(p){light.intensity=42;light.position.set(p.x,p.y+5.25,p.z)}});
  }
  if(city.runway){
    const {point,east,length}=city.runway;
    for(let i=-Math.floor(length/20);i<=Math.floor(length/20);i++){
      const x=point.x+(east?i*9:0),z=point.z+(east?0:i*9);
      const floor=city.floor(x,z,point.y);
      if(floor!==undefined)world.cube(east?4:.32,.035,east?.32:4,x,floor+.024,z,m.white,false,root);
    }
  }
  const routes=city.roadAxes.filter(s=>s.length>46&&s.width>5).flatMap((s,i)=>{
    const half=Math.min(34,s.length*.32), offset=Math.min(2.4,s.width*.22),p=s.point;
    const route=[[-half,-offset],[half,-offset],[half,offset],[-half,offset],[-half,-offset]].map(([a,b])=>
      ({x:p.x+(s.east?a:b),z:p.z+(s.east?b:a)}));
    if(!route.every((q,n)=>city.floor(q.x,q.z,p.y)!==undefined&&(!n||clear(route[n-1],q,p.y+1.15))))return [];
    return [{route,key:'drive-road-'+i}];
  });
  const traffic=routes.slice(0,12).flatMap(({route,key},i)=>[.2+(i%3)*.06,.68].map(fraction=>{
    const distance=routeLength(route)*fraction, pose=sampleRoute(route,distance,true);
    return {...pose,route,key,distance};
  }));
  return {root,facilities,traffic,update,lights:lights.length};
}


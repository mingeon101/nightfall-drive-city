import {extendSeoul} from './seoul-expansion.js?v=33';
import {SEOUL_AREAS,AIRPORTS} from './atlas-data.mjs?v=33';
import {BRIDGES,HILLS,groundHeight,blockedAt,sampleRoute} from './core.mjs?v=33';
import {signalState} from './city-sim.mjs?v=33';
export function buildMetropolitan(T,scene,world){
 const {m}=world,chunks=new Map(),facilities=[],signals=[],parks=[],anchors=[],ambientPlanes=[],roofSurfaces=[];let buildings=0,seed=63026;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.82,...extra});const water=material(0x257d9d,{metalness:.35,roughness:.3}),tile=material(0xd4dbd3),shopMat=material(0x55aaa0);
 function part(w,h,d,x,y,z,mat=m.concrete,solid=false){const key=Math.floor(x/320)+','+Math.floor(z/320);if(!chunks.has(key)){const root=new T.Group();root.position.set(Math.floor(x/320)*320+160,0,Math.floor(z/320)*320+160);scene.add(root);chunks.set(key,{root,batches:new Map()})}const chunk=chunks.get(key);chunk.minX=Math.min(chunk.minX??Infinity,x-w/2);chunk.maxX=Math.max(chunk.maxX??-Infinity,x+w/2);chunk.minZ=Math.min(chunk.minZ??Infinity,z-d/2);chunk.maxZ=Math.max(chunk.maxZ??-Infinity,z+d/2);if(!chunk.batches.has(mat))chunk.batches.set(mat,[]);chunk.batches.get(mat).push({x:x-chunk.root.position.x,y,z:z-chunk.root.position.z,w,h,d});if(solid)world.blocks.push({x,z,w:w/2,d:d/2,bottom:y-h/2,top:y+h/2})}
 function building(name,x,z,w,d,h,mat=m.concrete){roofSurfaces.push({x,z,w:w/2,d:d/2,top:h+.2});part(w,h,d,x,h/2,z,mat,true);part(w+.5,.4,d+.5,x,h,z,m.dark);for(let y=3;y<h-1;y+=4)for(let a=-w/2+2;a<w/2;a+=4){part(1.5,1.6,.08,x+a,y,z+d/2+.05,random()>.4?m.window:m.glass)}buildings++;if(name){facilities.push({name,x,z,kind:'landmark'});world.landmarks.push({name,x,z})}}
 const roadAxes=[-2200,-1800,-1400,-1000,-600,600,1000,1400,1800,2200];
 // Keep the original detailed central district; add surrounding generated city blocks.
 part(6800,.3,3358,0,-.2,-1721,m.ground);part(6800,.3,3358,0,-.2,1721,m.ground);
 part(6800,.03,84,0,-.025,0,water);
 for(const side of [-1,1]){part(6800,.1,12,0,.02,side*50,m.green);part(6800,.04,4,0,.07,side*59,m.sand)}
 // River navigation is continuous all the way to the map boundary.
 const cuts=[-3400,...BRIDGES.map(b=>b.x).sort((a,b)=>a-b).flatMap(x=>[x-12,x+12]),3400];for(let i=0;i<cuts.length-1;i+=2){const a=cuts[i],b=cuts[i+1];if(b-a>1&&(a<-425||b>425))world.blocks.push({x:(a+b)/2,z:0,w:(b-a)/2,d:42,bottom:-30,top:4,kind:'water'})}
 for(const b of BRIDGES.filter(b=>Math.abs(b.x)>425)){part(24,.25,110,b.x,.03,0,m.concrete);part(18,.08,110,b.x,.2,0,m.road);for(const s of [-1,1])part(.2,1.1,108,b.x+s*11.5,.75,0,m.metal)}
 for(const x of roadAxes){for(const sign of [-1,1])for(let z=160;z<2500;z+=160){part(22,.05,160,x,.02,sign*z,m.sand);part(18,.07,160,x,.05,sign*z,m.road);part(.2,.08,100,x,.11,sign*z,m.yellow)}}
 for(const z of [-1800,-1400,-1000,-600,600,1000,1400,1800])for(let x=-2450;x<2400;x+=160){part(160,.05,22,x,.02,z,m.sand);part(160,.07,18,x,.05,z,m.road);part(100,.08,.2,x,.11,z,m.yellow)}
 // Connector arterials link the central roads and the new road grid.
 for(const z of [-340,-240,-140,140,240,340])for(const x of [-1800,-1200,-600,600,1200,1800])part(600,.06,18,x,.04,z,m.road);
 for(const x of [-240,0,240])for(const sign of [-1,1])part(18,.07,1600,x,.03,sign*1220,m.road);
 function reserved(x,z){return Math.abs(x)<455&&Math.abs(z)<455||Math.abs(z)<100||groundHeight(x,z)>2||AIRPORTS.some(a=>Math.abs(x-a.x)<230&&Math.abs(z-a.z)<260)||Math.abs(x+2100)<180&&Math.abs(z+750)<210}
 // A deterministic district-wide mix of apartments, offices and street retail.
 for(let x=-2300;x<=2300;x+=56)for(let z=-1900;z<=1900;z+=56){if(reserved(x,z)||roadAxes.some(a=>Math.abs(x-a)<30)||[-1800,-1400,-1000,-600,600,1000,1400,1800,-340,-240,-140,140,240,340].some(a=>Math.abs(z-a)<30)||[-240,0,240].some(a=>Math.abs(x-a)<25))continue;const h=8+Math.floor(random()*10)*4;building(null,x,z,20+random()*14,18+random()*13,h,random()>.55?m.white:m.concrete)}
 function nearestRoad(n){return [-2200,-1800,-1400,-1000,-600,-240,240,600,1000,1400,1800,2200].reduce((best,v)=>Math.abs(v-n)<Math.abs(best-n)?v:best,600)}
 function onRoad(x,z,r=12){return [...roadAxes,-240,0,240].some(a=>Math.abs(x-a)<12+r)||[-1800,-1400,-1000,-600,-340,-240,-140,140,240,340,600,1000,1400,1800].some(a=>Math.abs(z-a)<12+r)}
 function store(area,index){let x=nearestRoad(area.x)+34,z=area.z;if(Math.abs(z)<110)z=area.z<0?-115:115;if(Math.abs(x)<460&&Math.abs(z)<460){x=area.x<0?-480:480;z=-110-index%3*35}for(let tries=0;tries<30&&(blockedAt(x,z,8,world.blocks)||groundHeight(x,z)>1||onRoad(x,z,9));tries++)z+=24;if(Math.abs(z)>2400)z=120;
  // An open doorway, shelves and checkout form an actual walk-in shop.
  const w=18,d=15;roofSurfaces.push({x,z,w:w/2,d:d/2,top:4.31});part(w,.12,d,x,.08,z,tile);part(w,4,.35,x,2,z+d/2,shopMat,true);part(.35,4,d,x-w/2,2,z,shopMat,true);part(.35,4,d,x+w/2,2,z,shopMat,true);for(const s of [-1,1])part(6.5,4,.35,x+s*5.8,2,z-d/2,m.glass,true);part(w,.22,d,x,4.2,z,m.white);for(const dx of [-4,2]){part(1,1.5,6,x+dx,.8,z,m.white,true);for(let k=0;k<4;k++)part(1.1,.1,6,x+dx,.4+k*.4,z,m.metal)}part(5,1,1.2,x+3,.5,z-4,m.dark,true);world.label('SEOUL 24 · '+area.name,x,5.5,z-7.5,'#adf2ce',20);facilities.push({kind:'store',name:area.name+' 편의점',x,z,entry:{x,z:z-d/2-3},counter:{x:x+3,z:z-3}});anchors.push({name:area.name,x,z:z-d/2-5,source:'경계 실제 · 시가지 생성'});
  for(const [i,name]of ['구청','종합병원','학교','경찰서','소방서','은행','약국','카페','시장','호텔'].entries()){const bx=x+(i%3-1)*45,bz=z+45+Math.floor(i/3)*48;if(reserved(bx,bz)||onRoad(bx,bz,17)||blockedAt(bx,bz,16,world.blocks))continue;building(area.name+' '+name,bx,bz,23,19,8+(i%3)*4,i===1?m.white:i===4?m.red:m.concrete)}
 }
 SEOUL_AREAS.forEach(store);
 // Han River parks: promenades, lawns, sport courts, picnic tables and walking citizens.
 for(const [i,x]of [-1500,-900,-450,450,900,1500].entries()){const z=i%2?95:-95;parks.push({name:['난지','망원','여의도','반포','뚝섬','잠실'][i]+' 한강공원',x,z});part(170,.08,65,x,.05,z,m.green);part(130,.08,4,x,.12,z,m.sand);part(24,.09,18,x+52,.15,z,m.blue);for(let k=-3;k<=3;k++){part(3,.2,1,x+k*15,.8,z+16,m.wood||m.sand);part(3,.15,1,x+k*15,1.1,z+16.4,m.dark)}world.label(parks[i].name,x,5,z,'#b5e5a5',27);for(let k=0;k<12;k++){const p=world.person(x-70+k*12,z+8,false,i+k);p.park=true}}
 // A few field plazas provide people and usable services throughout the city.
 for(let i=0;i<300;i++){const a=anchors[i%anchors.length],p=world.person(a.x+(i%3-1)*3,a.z-4,false,i);p.cityWalker=true}
 function terminal(airport){const {x,z}=airport;const w=100,d=66;roofSurfaces.push({x,z,w:w/2,d:d/2,top:7.15});part(w,.15,d,x,.1,z,tile);part(w,.3,d,x,7,z,m.white);part(w,6,.35,x,3,z+d/2,m.glass,true);for(const sx of [-1,1])part(.35,6,d,x+sx*w/2,3,z,m.glass,true);for(const sx of [-1,1])part(42,6,.35,x+sx*29,3,z-d/2,m.glass,true);
  for(let c=-3;c<=3;c++){part(7,1.2,2,x+c*12,.6,z-10,m.blue,true);part(1,.7,.12,x+c*12,1.6,z-10.9,m.black);for(let k=0;k<4;k++)part(1.1,.75,.8,x+c*12+k*1.5-2,.8,z+10,m.blue)}
  part(22,.8,5,x-28,.4,z+22,m.dark,true);part(19,.83,2.5,x-28,.43,z+22,m.metal);part(18,2,.2,x,4.3,z+10,m.dark);part(13,1.8,.2,x+29,3.5,z+24,m.window);world.label(airport.name,x,9,z-32,'#c1e7ff',58);world.label('CHECK-IN · 출발 / 도착',x,4.8,z-8,'#d5edff',26);world.label('GATES 01–04  →',x+24,4.5,z+18,'#daefcf',19);world.label('BAGGAGE · 수하물',x-28,3,z+22,'#f1dfb1',18);
  const room={kind:'airport',name:airport.name,x,z,entry:{x,z:z-d/2-8}};facilities.push(room);anchors.push({name:airport.name,x,z:z-d/2-8,source:'위치·실내 생성'});
  part(34,.1,390,x-100,.1,z,m.road);for(let k=-170;k<180;k+=20)part(1,.15,9,x-100,.22,z+k,m.white);part(150,.09,95,x+115,.12,z,m.road);for(const q of [-1,1]){part(30,12,45,x-158,6,z+q*100,m.metal,true)}
  for(let i=0;i<2;i++){const v=world.vehicle('airliner',x+100,z-20+i*50,0,false);buildAircraft(T,v,true,m);v.origin.type='airliner'}
  const v=world.vehicle('car',x+18,z-47,Math.PI,false);v.roadKey=null;
 }
 AIRPORTS.forEach(terminal);
 const training={x:-2100,z:-750};building('가상 항공 훈련기지',training.x+80,training.z,55,34,12,m.sand);part(30,.08,340,training.x,.08,training.z,m.road);for(const dx of [50,90]){const v=world.vehicle('fighter',training.x+dx,training.z+80);buildAircraft(T,v,false,m)}world.vehicle('tank',training.x+90,training.z-50);world.vehicle('helicopter',training.x+100,training.z-100);anchors.push({name:'가상 훈련기지 · F-16',x:training.x+50,z:training.z+90,source:'가상 시설'});
 for(const v of world.vehicles)if(v.type==='fighter')buildAircraft(T,v,false,m);
 // Shared arterial loops provide signal-controlled, following traffic.
 const routes=[];for(const [cx,cz]of [[-800,-800],[800,-800],[-800,800],[800,800],[-1600,-800],[-1600,800],[1600,800],[1600,-800]]){const r=[{x:cx-196,z:cz-196},{x:cx+204,z:cz-196},{x:cx+204,z:cz+204},{x:cx-196,z:cz+204},{x:cx-196,z:cz-196}];routes.push(r);for(let i=0;i<14;i++){const p=sampleRoute(r,i*65,true);if(blockedAt(p.x,p.z,2,world.blocks))continue;const v=world.vehicle('car',p.x,p.z,p.yaw,true,i);v.roadRoute=r;v.roadKey='region-'+routes.length;v.trafficOffset=i*65;v.origin.trafficOffset=i*65;v.speed=0}}
 // Dynamic lamps, not decorative colors. Axis phases are coordinated with the traffic model.
 const lampMat={green:new T.MeshBasicMaterial({color:0x70f1a1}),amber:new T.MeshBasicMaterial({color:0xffd15d}),red:new T.MeshBasicMaterial({color:0xf56862})};
 const points=[[-236,-136],[236,-136],[236,136],[-236,136],[-244,-144],[-244,144],[244,144],[244,-144],...routes.flatMap(r=>r.slice(0,4).map(p=>[p.x,p.z]))];for(const [x,z]of points)for(const axis of ['EW','NS']){const root=new T.Group();root.position.set(x+12,0,z+12);scene.add(root);world.cube(.15,5,.15,0,2.5,0,m.black,false,root);const mesh=new T.Mesh(new T.SphereGeometry(.24,8,6),lampMat.red);mesh.position.set(axis==='EW'?0:.7,5,0);root.add(mesh);signals.push({x,z,axis,root,mesh,offset:(Math.abs(Math.round(x))+Math.abs(Math.round(z)))%9})}
 // Airport approach traffic uses the same civilian jet model but remains autonomous.
 for(let i=0;i<2;i++){const root=new T.Group();scene.add(root);const v={root,type:'airliner'};buildAircraft(T,v,true,m);ambientPlanes.push({root,phase:i*Math.PI,airport:AIRPORTS[i]})}
 const expansion=extendSeoul(T,scene,world,{part,building,terminal,anchors,facilities,roofSurfaces,signals,lampMat,aircraft:v=>{if(['fighter','airliner'].includes(v.type))buildAircraft(T,v,v.type==='airliner',m)}});
 const matrix=new T.Object3D();function populateChunk(chunk){if(chunk.loaded)return;chunk.loaded=true;for(const [mat,parts]of chunk.batches){const mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),mat,parts.length);parts.forEach((p,i)=>{matrix.position.set(p.x,p.y,p.z);matrix.scale.set(p.w,p.h,p.d);matrix.updateMatrix();mesh.setMatrixAt(i,matrix.matrix)});mesh.computeBoundingSphere();chunk.root.add(mesh)}}
 let visibilityTime=0;return {expansion,roofSurfaces,chunks,facilities,parks,anchors,signals,routes,buildings,update(dt,time,player,flying,mobile=false){expansion.update(player);for(const label of world.labels||[])if(label.parent===scene)label.visible=Math.hypot(label.position.x-player.x,label.position.z-player.z)<1700;visibilityTime-=dt;if(visibilityTime<=0){visibilityTime=.35;for(const chunk of chunks.values()){const distance=Math.hypot(Math.max(0,chunk.minX-player.x,player.x-chunk.maxX),Math.max(0,chunk.minZ-player.z,player.z-chunk.maxZ)),visible=distance<(mobile?(flying?1000:550):(flying?1700:850));chunk.root.visible=visible;if(visible)populateChunk(chunk);else if(chunk.loaded&&distance>2600){for(const mesh of [...chunk.root.children]){chunk.root.remove(mesh);mesh.geometry?.dispose()}chunk.loaded=false}}}for(const s of signals){s.mesh.material=lampMat[signalState(time,s.axis,s.offset)];s.root.visible=Math.hypot(s.x-player.x,s.z-player.z)<350}for(const p of ambientPlanes){const a=time*.035+p.phase;p.root.position.set(p.airport.x+Math.cos(a)*330,90+Math.sin(a*.5)*25,p.airport.z+Math.sin(a)*400);p.root.rotation.y=-a-Math.PI/2}},safeSpawn(anchor){for(let r=0;r<160;r+=8)for(let i=0;i<16;i++){const x=anchor.x+Math.cos(i*Math.PI/8)*r,z=anchor.z+Math.sin(i*Math.PI/8)*r;if(!blockedAt(x,z,.5,world.blocks)&&groundHeight(x,z)<1)return {x,z}}return {x:220,z:-115}}};
}
export function buildAircraft(T,v,civil,m){
 while(v.root.children.length)v.root.remove(v.root.children[0]);const root=v.root,bodyMat=civil?m.white:m.metal;
 function add(geo,x,y,z,mat=bodyMat){const mesh=new T.Mesh(geo,mat);mesh.position.set(x,y,z);root.add(mesh);return mesh}
 const length=civil?26:13,r=civil?1.7:.75,body=add(new T.CylinderGeometry(r,r*.85,length,16),0,civil?3.5:2.4,0);body.rotation.x=Math.PI/2;const nose=add(new T.ConeGeometry(r, civil?4:3,16),0,civil?3.5:2.4,-length/2-1.4);nose.rotation.x=-Math.PI/2;
 const canopy=add(new T.SphereGeometry(1,12,8),0,civil?4.1:3.25,civil?-11:-2.4,m.glass);canopy.scale.set(civil?1.35:.65,civil?.7:.65,civil?2:2.3);
 function wing(points,mat=bodyMat){const geo=new T.BufferGeometry();const front=points.flat(),back=[...points].reverse().flat();geo.setAttribute('position',new T.Float32BufferAttribute([...front,...back],3));geo.computeVertexNormals();const mesh=new T.Mesh(geo,mat);root.add(mesh)}
 for(const side of [-1,1]){const span=civil?15:5.1,y=civil?3.2:2.3;wing([[side*.6,y,-2],[side*span,y,civil?5:2.6],[side*.8,y,civil?7:4.4]]);wing([[side*.6,y,civil?8:4.2],[side*(civil?6:2.6),y,civil?11:6],[side*.6,y,civil?12:6.2]]);if(civil){const engine=add(new T.CylinderGeometry(1,1,4.5,12),side*5.6,2,1,m.metal);engine.rotation.x=Math.PI/2;const hole=add(new T.CylinderGeometry(.85,.85,.1,12),side*5.6,2,-1.3,m.black);hole.rotation.x=Math.PI/2}}
 wing([[-.08,civil?3.5:2.4,civil?8:3.7],[-.08,civil?9:6,civil?12:5.8],[-.08,civil?3.5:2.4,civil?13:6.2]],civil?m.blue:m.metal);
 if(!civil){const intake=add(new T.CylinderGeometry(.6,.6,2.5,12),0,1.6,-1.5,m.black);intake.rotation.x=Math.PI/2;const exhaust=add(new T.CylinderGeometry(.65,.65,.6,12),0,2.4,6.5,m.black);exhaust.rotation.x=Math.PI/2}
 for(const x of [-1,1]){const wheel=add(new T.CylinderGeometry(.42,.42,.22,10),x,.5,2,m.black);wheel.rotation.z=Math.PI/2}add(new T.BoxGeometry(.15,1.4,.15),0,1.2,-(civil?8:3.5),m.metal);
}

import {STATIONS,DISTRICTS,VEHICLE_TYPES,BRIDGES,HILLS,groundHeight} from './core.mjs?v=33';
export function buildWorld(T,scene){
 const labels=[],blocks=[],landmarks=[],vehicles=[],pickups=[],people=[],batches=new Map(),colliders=[];
 let seed=7101;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.85,...extra});
 const m={ground:mat(0x364345),road:mat(0x202b31),concrete:mat(0x78858b),dark:mat(0x26343c),metal:mat(0x596f68,{metalness:.45}),sand:mat(0x8d8a70),blue:mat(0x51758b),red:mat(0x9e6158),white:mat(0xc5d5cf),glass:mat(0x76abbd,{metalness:.5,roughness:.24}),window:mat(0xbac79c,{emissive:0x849968,emissiveIntensity:.8}),green:mat(0x476553),black:mat(0x111e24),yellow:mat(0xe0bc66),violet:mat(0x927a9e)};
 function cube(w,h,d,x,y,z,material=m.concrete,collision=false,parent=null){
  if(parent){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh}
  if(!batches.has(material))batches.set(material,[]);batches.get(material).push({w,h,d,x,y,z});
  if(collision)blocks.push({x,z,w:w/2,d:d/2,bottom:y-h/2,top:y+h/2});
 }
 function label(text,x,y,z,color='#d7e8ce',size=15){const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#10202ddd';ctx.fillRect(0,0,512,96);ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(1,1,510,94);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 36px sans-serif';ctx.fillText(text,256,49,490);const s=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),transparent:true,depthTest:true}));/* Display labels are never physical bullet targets. */s.raycast=()=>{};s.position.set(x,y,z);s.scale.set(size,size*96/512,1);scene.add(s);labels.push(s);return s}
 // Seoul is a compressed, fictional game layout: west/east x, north/south z.
 cube(860,.5,382,0,-.3,-234,m.ground);cube(860,.5,382,0,-.3,234,m.ground);
 const water=mat(0x237b9f,{metalness:.45,roughness:.3}),roofSlate=mat(0x354f59),roofBlue=mat(0x28648a),palaceRed=mat(0x973e32),gold=mat(0xaa9154,{metalness:.5});
 const river=new T.Mesh(new T.PlaneGeometry(860,84),water);river.rotation.x=-Math.PI/2;river.position.y=-.08;scene.add(river);
 // Invisible navigation boundaries keep pedestrians and cars on bridges; gunfire can pass over water.
 for(const [a,b]of [[-425,-252],[-228,-12],[12,228],[252,425]])blocks.push({x:(a+b)/2,z:0,w:(b-a)/2,d:42,bottom:-30,top:4,kind:'water'});
 for(const bank of [-1,1]){cube(860,.15,9,0,.03,bank*49,m.green);cube(860,.05,4,0,.06,bank*57,m.sand);cube(860,.06,18,0,.03,bank*72,m.road);for(let k=-408;k<420;k+=16)cube(7,.1,.2,k,.08,bank*72,m.yellow)}
 for(const x of [-340,-240,-140,0,140,240,340])for(const side of [-1,1]){cube(18,.05,338,x,.02,side*244,m.road);cube(22,.04,338,x,.005,side*244,m.sand);for(let z=90;z<411;z+=16)cube(.22,.1,6,x,.08,side*z,m.yellow)}
 for(const z of [-340,-240,-140,140,240,340]){cube(820,.06,18,0,.03,z,m.road);cube(820,.04,22,0,.01,z,m.sand);for(let x=-405;x<410;x+=16)cube(6,.1,.22,x,.09,z,m.yellow)}
 for(const b of BRIDGES){cube(24,.3,100,b.x,-.08,0,m.concrete);cube(18,.1,104,b.x,.11,0,m.road);for(let z=-48;z<=48;z+=12){cube(.25,.2,5,b.x,.2,z,m.yellow);for(const side of [-1,1])cube(.25,1.15,8,b.x+side*11.5,.6,z,m.metal)}for(const z of [-28,28])cube(3,5,4,b.x,-2.5,z,m.concrete);label(b.name,b.x,5,8,'#c4e8f8',20)}
 label('한강 · HANGANG RIVER',-90,2,0,'#b3eaff',48);
 // Hills are north of the river; their collision heights match the visual geometry.
 for(const h of HILLS){const mesh=new T.Mesh(new T.ConeGeometry(h.radius,h.height,18,3),mat(0x526b56,{flatShading:true}));mesh.position.set(h.x,h.height/2,h.z);scene.add(mesh);label(h.name,h.x,h.height+6,h.z,'#b8db9c',23);for(let i=0;i<24;i++){const a=i*2.399,r=h.radius+3+rand()*8,x=h.x+Math.cos(a)*r,z=h.z+Math.sin(a)*r;if(Math.abs(z)>420)continue;const tree=new T.Mesh(new T.ConeGeometry(1.8,6,5),m.green);tree.position.set(x,3,z);scene.add(tree)}}
 function building(name,x,z,w,d,h,material=m.concrete,windows=true){cube(w,h,d,x,h/2,z,material,true);cube(w+.6,.5,d+.6,x,h,z,m.dark);if(windows){for(let y=3;y<h-1;y+=3.5)for(let k=-w/2+2;k<w/2-1;k+=3){cube(1.1,1.3,.07,x+k,y,z+d/2+.05,rand()>.42?m.window:m.glass);cube(1.1,1.3,.07,x+k,y,z-d/2-.05,rand()>.42?m.window:m.glass)}}if(name){landmarks.push({name,x,z});label(name,x,Math.min(h+4,38),z,'#e0e9df',Math.min(23,w+5))}return {x,z,w,d,h}}
 function roof(w,d,x,y,z,blue=false){const mesh=new T.Mesh(new T.CylinderGeometry(.6,1,3,4),blue?roofBlue:roofSlate);mesh.rotation.y=Math.PI/4;mesh.scale.set(w/Math.SQRT2,1,d/Math.SQRT2);mesh.position.set(x,y,z);scene.add(mesh);cube(w+1,.3,d+1,x,y-1.4,z,blue?roofBlue:roofSlate)}
 function hall(name,x,z,w,d,h=7,blue=false){cube(w+4,1,d+4,x,.5,z,m.sand,true);cube(w-3,h-1,d-3,x,(h+1)/2,z,m.white,true);for(let col=-w/2+1;col<w/2;col+=4)for(const side of [-1,1])cube(.6,h,.6,x+col,h/2,z+side*(d/2-.5),palaceRed);roof(w+5,d+5,x,h+1,z,blue);if(name){landmarks.push({name,x,z});label(name,x,h+5,z,blue?'#a1ddff':'#f0d7ad',25)}}
 // Public exterior silhouettes only, with open visitor courtyards.
 cube(110,.08,112,-70,.03,-265,m.sand);
 hall('경복궁 · 근정전',-70,-265,34,22,8);roof(28,20,-70,14,-265);cube(24,3.2,16,-70,11.2,-265,m.white,true);
 hall('경회루',-112,-291,19,15,6);cube(27,.07,23,-112,.1,-291,water);
 hall('사정전',-70,-305,23,15,6);
 for(const x of [-124,-16])cube(1.5,3,106,x,1.5,-265,m.sand,true);cube(108,3,1.5,-70,1.5,-318,m.sand,true);
 for(const x of [-108,-32])cube(32,3,1.5,x,1.5,-210,m.sand,true);
 for(const x of [-79,-61])cube(8,5,10,x,2.5,-207,m.white,true);roof(30,15,-70,7,-207);roof(23,13,-70,11,-207);landmarks.push({name:'광화문',x:-70,z:-207});label('광화문',-70,16,-207,'#f2d49e',20);
 // Walk-in Blue House shells are built by civic-world.js.cube(92,.07,18,-70,.05,-333,m.green);
 // Civic and cultural anchors north of the river.
 building('서울시청',-75,-171,42,20,20,m.glass);building('서울역',-193,-110,34,23,13,m.red);roof(40,27,-193,16,-110);building('DDP · 동대문',200,-275,40,24,13,m.metal);
 const towerBase=groundHeight(55,-100);const shaft=new T.Mesh(new T.CylinderGeometry(1.4,2,27,12),m.white);shaft.position.set(55,towerBase+13.5,-100);scene.add(shaft);const deck=new T.Mesh(new T.CylinderGeometry(7,5.5,6,16),m.glass);deck.position.set(55,towerBase+29,-100);scene.add(deck);const needle=new T.Mesh(new T.CylinderGeometry(.2,.6,23,8),m.white);needle.position.set(55,towerBase+43,-100);scene.add(needle);landmarks.push({name:'남산서울타워',x:55,z:-100});label('남산서울타워',55,90,-100,'#e8f5ef',27);
 // Bukchon has low tiled roofs rather than apartment towers.
 for(const x of [32,58,87])for(const z of [-275,-305,-365])hall(null,x,z,15,11,4);
 label('북촌 한옥마을',60,15,-305,'#ead4ac',25);
 // High density apartment courts, with numbered towers and side balconies.
 let apartmentCount=0;
 function apartment(x,z,h){building(null,x,z,17,18,h,m.white);for(const side of [-1,1])for(let y=3;y<h;y+=3.5)cube(.9,.35,16,x+side*9,y,z,m.concrete);apartmentCount++;if(apartmentCount%4===1)label('서울 아파트 '+(100+apartmentCount)+'동',x,h+3,z,'#c1deee',14)}
 for(const x of [175,205,280,310,380])for(const z of [-185,-205,-305,-375]){if(x===205&&z===-305)continue;apartment(x,z,27+Math.floor(rand()*5)*5)}
 for(const x of [-380,-285,-185,175,205,280,380])for(const z of [280,310,380]){if(x===280&&z===310)continue;apartment(x,z,25+Math.floor(rand()*7)*5)}
 for(const x of [-380,-285,-190])for(const z of [-185,-285,-380])building(null,x,z,22,24,10+rand()*15,m.concrete);
 // Gangnam skyline and recognizable landmark silhouettes.
 building('COEX · 코엑스',190,190,56,42,18,m.glass);building('무역센터',210,190,15,17,67,m.blue);
 building('롯데월드타워',300,290,23,24,105,m.glass);const crown=new T.Mesh(new T.ConeGeometry(12,24,4),m.glass);crown.rotation.y=Math.PI/4;crown.position.set(300,117,290);scene.add(crown);
 building('강남역 · 테헤란로',80,190,27,30,43,m.blue);building('도심 백화점',370,190,42,38,23,m.violet);
 building('63빌딩',-180,185,18,20,72,gold);// Fictional, simplified gameplay interior; this is not a real building floor plan.
 const assembly={x:-285,z:180,front:195,back:165};landmarks.push({name:'국회의사당 · 내부 진입',x:-285,z:198});label('국회의사당 · 정문 / 내부 전투',-285,18,198,'#b8e5cf',31);
 cube(52,.2,30,-285,-.12,180,m.sand);cube(53,.5,31,-285,15,180,m.sand,true);
 for(const x of [-311,-259])cube(.6,15,30,x,7.5,180,m.sand,true);
 for(const z of [165,195]){for(const x of [-300,-270])cube(22,15,.6,x,7.5,z,m.sand,true);cube(8,10,.6,-285,10,z,m.sand,true)}
 // A straight central aisle connects the two unlocked entrances and the chamber.
 for(const x of [-300,-270])cube(22,4,.35,x,2,185,m.white,true);
 for(const x of [-302,-268]){cube(.35,4,8,x,2,190,m.white,true);cube(5,1,1.2,x+(x<-285?-4:4),.5,190,m.metal,true)}
 for(const z of [171,176,181])for(const x of [-296,-290,-280,-274]){cube(3,1.05,1.2,x,.525,z,m.metal,true);cube(1,.5,.8,x,.25,z+1.3,m.blue);cube(1,.7,.15,x,.75,z+1.7,m.blue)}
 cube(5,.8,2,-285,.4,168,m.sand,true);cube(1,1.3,.7,-285,.65,169,m.dark,true);
 cube(9,2,.15,-285,3,165.5,m.blue);label('본회의장 · 중앙 통로',-285,3.5,183,'#e0e8cf',12);label('로비 · 정문 출구',-285,3,193,'#b9e8db',12);
 for(const x of [-303,-285,-267]){const light=new T.PointLight(0xe0edff,18,24);light.position.set(x,6,181);scene.add(light);cube(3,.12,1,x,6.2,181,m.window)}
 const dome=new T.Mesh(new T.SphereGeometry(13,18,12,0,Math.PI*2,0,Math.PI/2),m.green);dome.position.set(-285,15,180);scene.add(dome);
 building('서울 종합병원',370,-275,30,27,20,m.white);cube(3,9,.3,370,13,-261.4,m.red);cube(9,3,.3,370,13,-261.3,m.red);building('학교',285,-275,34,25,10,m.sand);building('경찰서',-190,280,30,25,12,m.blue);building('119 소방서',-285,380,30,24,10,m.red);
 // Fictional southwest training apron retains the previously added vehicles.
 cube(25,.08,205,-350,.08,240,m.road);for(let z=146;z<340;z+=16)cube(1,.1,7,-350,.15,z,m.white);building('훈련 격납고 · 가상 시설',-395,200,30,40,15,m.metal,false);
 for(const d of DISTRICTS)label(d.name,d.x,45,d.z,d.color,36);
 // Zebra crossings, lane arrows, traffic lights and Korean road signs.
 for(const z of [-140,140])for(const x of [-240,0,240]){for(let i=-7;i<=7;i+=2){cube(1,.12,6,x+i,.13,z+13,m.white);cube(6,.12,1,x+13,.13,z+i,m.white)}for(const sx of [-1,1]){cube(.18,5,.18,x+sx*12,2.5,z-12,m.dark);cube(1.8,.45,.4,x+sx*12,5,z-12,m.black);cube(.3,.3,.43,x+sx*12+.5,5,z-12,m.window)}}
 label('강변북로',-80,5,-72,'#a8e0d0',22);label('올림픽대로',80,5,72,'#a8e0d0',24);label('테헤란로',180,5,240,'#a8e0d0',22);

 // Subway tunnels really sit below the ground. L1 is above the L2 ring.
 function tunnelSegment(a,b,y,color){const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),x=(a.x+b.x)/2,z=(a.z+b.z)/2,horizontal=Math.abs(dx)>Math.abs(dz);cube(horizontal?length+5:7,.3,horizontal?7:length+5,x,y-.3,z,m.dark);cube(horizontal?length+5:7,.3,horizontal?7:length+5,x,y+5,z,m.dark);for(const side of [-1,1]){for(let q=0;q<length;q+=10){const n=Math.min(10,length-q),t=(q+n/2)/length,px=a.x+dx*t,pz=a.z+dz*t;if(STATIONS.some(s=>Math.hypot(s.x-px,s.z-pz)<38))continue;cube(horizontal?n:.25,5,horizontal?.25:n,px+(horizontal?0:side*3.6),y+2.3,pz+(horizontal?side*3.6:0),m.concrete)}cube(horizontal?length:.1,.1,horizontal?.1:length,x+(horizontal?0:side*1),y+.1,z+(horizontal?side*1:0),m.metal)}for(let d=0;d<length;d+=25){const t=d/length;cube(horizontal?1:3,.08,horizontal?3:1,a.x+dx*t,y+4.7,a.z+dz*t,color)}}
 tunnelSegment(STATIONS[0],STATIONS[1],-10,m.blue);for(let i=0;i<4;i++)tunnelSegment(STATIONS[i],STATIONS[(i+1)%4],-17,m.green);
 for(const s of STATIONS){cube(8,4,5,s.x,2,s.z+12,m.dark);cube(8.4,.4,5.4,s.x,4.2,s.z+12,s.lines.length===2?m.blue:m.green);label(`Ⓜ ${s.name} ${s.lines.join('·')}호선`,s.x,6.5,s.z+12,'#8acdec',19);cube(8,.1,8,s.x,.1,s.z+12,m.glass);landmarks.push({name:'Ⓜ '+s.name,x:s.x,z:s.z+12})}
 // Shared articulated humanoid rigs, with shoulder and hip pivots.
 function person(x,z,enemy=false,index=0,ally=false){const root=new T.Group(),body=new T.Group();root.position.set(x,0,z);root.add(body);scene.add(root);const cloth=ally?m.blue:enemy?m.sand:[m.blue,m.red,m.violet,m.white][index%4],skin=mat(0xb39a7a);cube(.58,.65,.32,0,1.15,0,cloth,false,body);cube(.32,.32,.30,0,1.69,0,skin,false,body);if(enemy||ally){cube(.4,.17,.37,0,1.87,0,m.dark,false,body);cube(.48,.46,.39,0,1.17,-.02,m.metal,false,body)}
  const legs=[],arms=[];for(const side of [-1,1]){const hip=new T.Group();hip.position.set(side*.17,.85,0);body.add(hip);cube(.22,.8,.24,0,-.4,0,cloth,false,hip);cube(.24,.14,.36,0,-.78,-.05,m.black,false,hip);legs.push(hip);const shoulder=new T.Group();shoulder.position.set(side*.4,1.42,0);body.add(shoulder);cube(.19,.58,.22,0,-.28,0,cloth,false,shoulder);arms.push(shoulder)}
  let weapon=null,muzzle=null,mag=null;if(enemy||ally){weapon=new T.Group();weapon.position.set(0,-.38,-.28);arms[1].add(weapon);cube(.13,.15,.5,0,0,0,m.black,false,weapon);cube(.06,.06,.4,0,.01,-.42,m.black,false,weapon);mag=cube(.08,.22,.13,0,-.16,.02,m.dark,false,weapon);muzzle=new T.Mesh(new T.ConeGeometry(.12,.35,5),new T.MeshBasicMaterial({color:0xffd887}));muzzle.rotation.x=-Math.PI/2;muzzle.position.set(0,.01,-.72);muzzle.visible=false;weapon.add(muzzle)}
  const p={root,body,legs,arms,weapon,muzzle,mag,enemy,ally,hp:100,ammo:8,reloading:0,cool:1+rand()*2,recoil:0,death:0,phase:rand()*6,origin:{x,z},target:{x:x+12,z},flee:0};root.userData.actor=p;people.push(p);return p;
 }
 // Combat cells keep the large city populated without attacking across districts.
 for(const d of DISTRICTS)for(const [dx,dz]of [[-9,-88],[8,-25],[-7,35],[8,90]]){const x=(d.x<0?-240:240)+dx,z=(d.z<0?-240:240)+dz;person(x,z,true)}
 for(let i=0;i<32;i++){const side=i%2?1:-1,x=side*(i%4<2?140:240)+((i%3)-1)*5,z=(i%4<2?-1:1)*(110+Math.floor(i/4)*36);person(x,z,false,i)}
 function vehicle(type,x,z,yaw=0,traffic=false,index=0){const root=new T.Group();root.position.set(x,0,z);root.rotation.y=yaw;scene.add(root);const spec=VEHICLE_TYPES[type],paint=type==='car'?[m.blue,m.red,m.white,m.yellow][index%4]:m.green;let rotor=null,turret=null;
  if(type==='car'){cube(2.2,.8,4.5,0,.8,0,paint,false,root);cube(1.9,.85,2.2,0,1.6,.15,m.glass,false,root);cube(2,.12,2.3,0,2.05,.15,paint,false,root);if(index%4===3)cube(.7,.25,.4,0,2.24,.15,m.yellow,false,root);for(const x of [-.75,.75])cube(.45,.25,.07,x,.9,-2.27,m.window)}
  if(type==='tank'){cube(3.8,1.2,6,0,1,0,paint,false,root);for(const x of [-1.8,1.8])cube(.7,1.4,5.8,x,.7,0,m.black,false,root);turret=new T.Group();turret.position.y=2;root.add(turret);cube(2.6,.85,2.7,0,0,0,paint,false,turret);cube(.24,.24,5,0,.1,-3,paint,false,turret)}
  if(type==='plane'||type==='fighter'){const big=type==='plane';cube(big?2.7:1.4,big?2.5:1.2,big?14:10,0,big?2.6:1.8,0,paint,false,root);cube(big?18:10,.22,big?3:2,0,big?2.8:1.7,1,paint,false,root);cube(big?7:5,.18,2,0,big?4:2.8,big?5:4,paint,false,root);cube(.22,big?3:2,2,0,big?4.2:3,big?5:4,paint,false,root);cube(big?1.8:1,.7,2,0,big?3.8:2.6,-3,m.glass,false,root)}
  if(type==='helicopter'){cube(2.4,2.2,4,0,2.1,0,paint,false,root);cube(2.2,1.4,1.3,0,2.2,-2,m.glass,false,root);cube(.55,.6,6,0,2.4,4,paint,false,root);cube(.2,2,1.4,0,3,6.5,paint,false,root);rotor=new T.Group();rotor.position.y=3.6;root.add(rotor);cube(11,.08,.3,0,0,0,m.black,false,rotor);cube(.3,.08,11,0,0,0,m.black,false,rotor);for(const x of [-1.4,1.4])cube(.15,.15,4.7,x,.4,0,m.dark,false,root)}
  if(type!=='tank'&&type!=='helicopter')for(const x of [-1.15,1.15])for(const z of [-1.35,1.35]){const wheel=new T.Mesh(new T.CylinderGeometry(.48,.48,.28,10),m.black);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.48,z);root.add(wheel)}
  const v={type,root,rotor,turret,x,z,y:0,yaw,speed:0,traffic,trafficOffset:index*71,trafficLane:index%2,occupied:false,origin:{x,z,yaw,traffic},cool:0};vehicles.push(v);return v;
 }
 for(let i=0;i<16;i++)vehicle('car',i%2?-240:240,(i%4<2?-1:1)*(100+Math.floor(i/4)*40),0,true,i);
 vehicle('car',235,-116,0,false,3);vehicle('car',-235,-115,0,false,2);vehicle('car',220,116,0,false,0);
 vehicle('tank',-260,260);vehicle('tank',-260,318);vehicle('helicopter',-110,345);vehicle('fighter',-350,325);vehicle('plane',-350,215);
 cube(14,.06,14,-110,.07,345,m.dark);for(const x of [-112,-108])cube(.6,.12,7,x,.13,345,m.white);cube(4,.12,.6,-110,.13,345,m.white);
 function pickup(kind,x,z,weapon=0){const root=new T.Group();root.position.set(x,.8,z);scene.add(root);const color=kind==='armor'?0x7ad8f5:kind==='medkit'?0xf5ada0:kind==='ammo'?0xe3c67b:0xc6ed8b,material=mat(color,{emissive:color,emissiveIntensity:.3});if(kind==='weapon'){cube(.25,.22,1.8,0,0,0,material,false,root);cube(.14,.4,.18,0,-.2,.2,m.dark,false,root)}else cube(.8,.65,.45,0,0,0,material,false,root);const ring=new T.Mesh(new T.RingGeometry(.7,.82,16),new T.MeshBasicMaterial({color,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-.75;root.add(ring);pickups.push({kind,x,z,weapon,root,respawn:0})}
 pickup('weapon',224,-115,1);pickup('armor',228,-115);pickup('ammo',232,-115);pickup('medkit',236,-115);
 for(const d of DISTRICTS){pickup('armor',d.x<0?-230:230,d.z<0?-225:225);pickup('ammo',d.x<0?-230:230,d.z<0?-215:215)}
 pickup('weapon',-230,-180,2);pickup('weapon',230,180,3);pickup('weapon',-230,180,3);pickup('medkit',260,-350);pickup('medkit',250,300);
 const trains=[];
 // One instanced draw per material for thousands of architectural details.
 const transform=new T.Object3D();for(const [material,parts]of batches){const inst=new T.InstancedMesh(new T.BoxGeometry(1,1,1),material,parts.length);parts.forEach((p,i)=>{transform.position.set(p.x,p.y,p.z);transform.scale.set(p.w,p.h,p.d);transform.updateMatrix();inst.setMatrixAt(i,transform.matrix)});inst.computeBoundingSphere();scene.add(inst);colliders.push(inst)}
 return {labels,blocks,landmarks,vehicles,pickups,people,trains,m,cube,label,rand,vehicle,person,pickup};
}

import {PYONGYANG,PRESIDENT_HOME,PRESIDENT_ROUTE,freshOperation,sanitizeOperation,advanceOperation,tunnelPoint,tunnelProgress,escortPoint} from './pyongyang-mission.mjs?v=33';
import {moveBody,lineBlocked} from './core.mjs?v=33';
export function buildPyongyangOperation(T,scene,world,metropolis,api){
 const selected=api.enemies.slice(483,500).filter(a=>!a.vehicle&&!a.assemblyGuard),leader=selected.at(-1),guards=selected.slice(0,-1);let state=freshOperation();
 // Reuse an existing local car so vehicle IDs and the multiplayer schema stay stable.
 const car=world.vehicles.filter(v=>v.type==='car'&&!v.service&&!v.hostile&&!v.allyPilot).sort((a,b)=>Math.hypot(a.x-PYONGYANG.x,a.z-PYONGYANG.z)-Math.hypot(b.x-PYONGYANG.x,b.z-PYONGYANG.z))[0];
 car.service='presidential';car.traffic=false;car.root.userData.vehicle=car;car.origin={x:PRESIDENT_ROUTE[1].x,z:PRESIDENT_ROUTE[1].z,yaw:0,traffic:false};
 function recolor(o,from,to){if(o.material===from)o.material=to;for(const c of o.children||[])recolor(c,from,to)}
 for(const g of guards){g.role='secret-service';recolor(g.root,world.m.sand,world.m.dark)}
 leader.role='fictional-president';recolor(leader.root,world.m.sand,world.m.black);leader.body.scale.set(1.65,1.03,1.65);
 const belly=new T.Mesh(new T.SphereGeometry(.42,12,8),world.m.black);belly.position.set(0,1.1,-.05);belly.scale.set(1,1.05,.8);leader.body.add(belly);
 if(leader.weapon){leader.weapon.visible=false;leader.weapon=null}
 const name=world.label('가상 북측 대통령',0,0,0,'#ffe3a5',4);scene.remove(name);name.position.set(0,2.8,0);leader.root.add(name);
 const tunnel=new T.Group();scene.add(tunnel);const count=32;
 function slab(w,h,d,p,material,collision=false){const mesh=world.cube(w,h,d,p.x,p.y,p.z,material,false,tunnel);if(collision)world.blocks.push({x:p.x,z:p.z,w:w/2,d:d/2,bottom:p.y-h/2,top:p.y+h/2,kind:'escape-tunnel'});return mesh}
 for(let i=0;i<=count;i++){const t=i/count,p=tunnelPoint(t);slab(11,.3,4,{...p,y:p.y-.3},world.m.concrete);if(t>.18&&t<.82)slab(12,.6,6,{...p,y:-.65},world.m.concrete,true);for(const side of [-1,1]){const wall=tunnelPoint(t,side*5.5);slab(.5,3.1,4,{...wall,y:wall.y+1.5},world.m.dark).rotation.y=Math.atan2(PRESIDENT_ROUTE[1].x-PRESIDENT_ROUTE[0].x,PRESIDENT_ROUTE[1].z-PRESIDENT_ROUTE[0].z)}if(i%4===0)slab(.4,.2,.4,{...p,y:p.y+2.6},world.m.window)}
 for(const t of [0,1]){const p=tunnelPoint(t);world.label('비상 땅굴 · 경호 이동로',p.x,3.8,p.z,'#ffe3a5',7);for(const side of [-1,1])slab(.6,3.2,.8,{x:p.x+side*5.5,y:1.6,z:p.z},world.m.concrete);slab(12,.5,.8,{x:p.x,y:3.4,z:p.z},world.m.dark)}
 // Mark the short motorcade circuit on the existing compound grounds.
 for(const [a,b]of [[PRESIDENT_ROUTE[1],PRESIDENT_ROUTE[2]],[PRESIDENT_ROUTE[2],PRESIDENT_ROUTE[3]],[PRESIDENT_ROUTE[3],PRESIDENT_ROUTE[4]],[PRESIDENT_ROUTE[4],PRESIDENT_ROUTE[5]]]){const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),p={x:(a.x+b.x)/2,y:.18,z:(a.z+b.z)/2};const strip=slab(12,.06,d,p,world.m.road);strip.rotation.y=Math.atan2(dx,dz);for(let n=6;n<d;n+=12){const dash=slab(.18,.02,5,{x:a.x+dx*n/d,y:.23,z:a.z+dz*n/d},world.m.yellow);dash.rotation.y=Math.atan2(dx,dz)}}
 function reset(){state=freshOperation();leader.vehicle=null;Object.assign(car,car.origin,{y:0,speed:0,hp:650,destroyed:false,occupied:true});car.root.position.set(car.x,0,car.z);car.root.visible=true;for(const [i,g]of guards.entries()){const p=metropolis.safeSpawn(escortPoint({...PRESIDENT_HOME,y:0},0,i));g.origin={...p};g.root.position.set(p.x,0,p.z);Object.assign(g,{hp:180,ammo:18,reloading:0,cool:1,death:0,recoil:0,vehicle:null});g.body.rotation.set(0,0,0);g.body.position.y=0}leader.origin={...PRESIDENT_HOME};leader.root.position.set(PRESIDENT_HOME.x,0,PRESIDENT_HOME.z);Object.assign(leader,{hp:250,death:0});leader.body.rotation.set(0,0,0);leader.body.position.y=0}
 function start(){if(state.phase!==0)return false;state.phase=1;api.message('평양 잠입 작전 · 밀착 경호 / 비상 땅굴 / 전용 차량 도주',6);return true}
 function sync(){state.leader={x:leader.root.position.x,z:leader.root.position.z,hp:Math.max(0,leader.hp)}}
 function transition(event){if(event==='alert')api.message('비밀경호국 경보 · 경호대가 땅굴과 전용 차량으로 대피합니다.',5);if(event==='success')api.message('가상 북측 대통령 제거 확인 · 평양 임무 성공',8)}
 function noteHit(actor){if(!selected.includes(actor))return;sync();transition(advanceOperation(state,0,leader.hp,[],true))}
 function walk(actor,target,speed,dt,underground=false){const pos=actor.root.position,dx=target.x-pos.x,dz=target.z-pos.z,d=Math.hypot(dx,dz);if(d<.3)return false;const step=Math.min(d,speed*dt),x=pos.x,z=pos.z;if(underground){pos.x+=dx/d*step;pos.z+=dz/d*step}else if(moveBody(pos,dx/d*step,dz/d*step,world.blocks,.4,pos.y)){moveBody(pos,-dz/d*step*.7,dx/d*step*.7,world.blocks,.4,pos.y)}actor.root.rotation.y=Math.atan2(-dx,-dz);return Math.hypot(pos.x-x,pos.z-z)>.001}
 function mode(){return state.phase===2&&leader.hp>0?(state.leg===1?'tunnel':state.leg>=2&&!car.destroyed?'car':'foot'):'foot'}
 function presentation(){const transport=mode();leader.root.position.y=transport==='tunnel'?tunnelPoint(tunnelProgress(leader.root.position)).y:0;leader.vehicle=transport==='car'?car:null;if(leader.vehicle){car.x=leader.root.position.x;car.z=leader.root.position.z;car.y=0;car.yaw=leader.root.rotation.y;car.root.position.set(car.x,0,car.z);car.root.rotation.y=car.yaw;car.occupied=true}leader.root.visible=leader.hp<=0||!leader.vehicle;leader.root.visible&&=Math.hypot(leader.root.position.x-api.focus().x,leader.root.position.z-api.focus().z)<320;car.root.visible=!car.destroyed&&Math.hypot(car.x-api.focus().x,car.z-api.focus().z)<500}
 function carDestroyed(v){if(v!==car||!v.destroyed||!leader.vehicle)return;leader.vehicle=null;const exit=metropolis.safeSpawn({x:car.x+5,z:car.z});leader.root.position.set(exit.x,0,exit.z);leader.hp=Math.max(1,leader.hp-60);state.leg=2;sync();api.message('전용 차량 파괴 · 경호대가 도보로 대피합니다.',4)}
 function update(dt,time,authority=true){
  const focus=api.focus(),players=api.players().filter(p=>p.hp>0&&p.active!==false),threats=[...players,...api.drones().map(p=>({...p,active:true}))];
  for(const a of selected)a.root.visible=!a.vehicle&&Math.hypot(a.root.position.x-focus.x,a.root.position.z-focus.z)<320;
  if(!authority){presentation();return}
  if(leader.vehicle&&car.destroyed)carDestroyed(car);
  const near=threats.some(p=>Math.hypot(p.x-leader.root.position.x,p.z-leader.root.position.z)<650);
  if(!near&&state.phase!==2){if(leader.hp<=0&&state.phase!==3){sync();transition(advanceOperation(state,dt,leader.hp,[]))}presentation();return}
  sync();const detected=threats.filter(p=>Math.hypot(p.x-state.leader.x,p.z-state.leader.z)<110&&!lineBlocked({x:state.leader.x,y:leader.root.position.y+1.6,z:state.leader.z},{x:p.x,y:p.y+1.2,z:p.z},world.blocks));
  let attacked=selected.some(a=>a.hp>0&&a.hp<(a===leader?250:180));for(const g of guards)if(g.hp>0&&players.some(p=>Math.hypot(p.x-g.root.position.x,p.z-g.root.position.z)<125&&!lineBlocked({x:g.root.position.x,y:g.root.position.y+1.5,z:g.root.position.z},{x:p.x,y:p.y+1.2,z:p.z},world.blocks)))attacked=true;
  transition(advanceOperation(state,dt,leader.hp,detected,attacked));let running=false;
  if(leader.hp>0&&state.phase===2){const goal=PRESIDENT_ROUTE[state.leg];if(Math.hypot(leader.root.position.x-goal.x,leader.root.position.z-goal.z)<1){const old=state.leg;state.leg=state.leg===5?2:state.leg+1;if(old===0)api.message('대통령과 경호대가 비상 땅굴에 진입했습니다.',4);if(old===1&&!car.destroyed)api.message('전용 차량 탑승 · 경호대가 차량을 호위합니다.',4)}const transport=mode();running=walk(leader,PRESIDENT_ROUTE[state.leg],transport==='car'?7:6.4,dt,transport==='tunnel');car.speed=transport==='car'&&running?7:0}
  presentation();api.animate(leader,dt,running&&!leader.vehicle);
  for(const [i,g]of guards.entries()){if(g.hp<=0){api.animate(g,dt,false);continue}const pos=g.root.position,transport=mode();let goal=escortPoint(leader.root.position,leader.root.rotation.y,i),under=false;
   if(transport==='tunnel'){const t=Math.max(0,tunnelProgress(leader.root.position)-Math.floor(i/4)*.025);goal=tunnelPoint(t,(i%2?1:-1)*(i%4<2?2:4));under=true}else if(pos.y<-.1){goal=tunnelPoint(1);under=true}
   const moving=walk(g,goal,state.phase===2?9:2.8,dt,under);pos.y=under?tunnelPoint(tunnelProgress(pos)).y:0;
   const target=players.filter(p=>Math.hypot(p.x-pos.x,p.z-pos.z)<160).sort((a,b)=>Math.hypot(a.x-pos.x,a.z-pos.z)-Math.hypot(b.x-pos.x,b.z-pos.z))[0];
   if((state.phase===2||state.phase===3)&&target){const origin={x:pos.x,y:pos.y+1.5,z:pos.z},clear=!lineBlocked(origin,{x:target.x,y:target.y+1.2,z:target.z},world.blocks);if(clear)g.root.rotation.y=Math.atan2(pos.x-target.x,pos.z-target.z);if(g.reloading>0){g.reloading=Math.max(0,g.reloading-dt);if(!g.reloading)g.ammo=18}else{g.cool-=dt;if(clear&&g.cool<=0){g.cool=.45;g.ammo--;g.recoil=1;api.trace(origin,{x:target.x,y:target.y+1.2,z:target.z},0xffb47c);api.hurt(target,7,origin);if(g.ammo<=0)g.reloading=2.4}}}api.animate(g,dt,moving)
  }sync();
 }
 function snapshot(){sync();return sanitizeOperation(state)}
 function restore(raw){leader.vehicle=null;state=sanitizeOperation(raw);leader.hp=state.leader.hp;leader.root.position.set(state.leader.x,0,state.leader.z);if(leader.hp<=0){leader.death=1;leader.body.rotation.x=-Math.PI/2;leader.body.position.y=.18}presentation()}
 reset();return {start,reset,update,noteHit,snapshot,restore,carDestroyed,car,tunnel,get mode(){return mode()},receive(raw){if(raw){state=sanitizeOperation(raw);leader.hp=state.leader.hp;leader.root.position.x=state.leader.x;leader.root.position.z=state.leader.z;presentation()}},get state(){return state},leader,guards,actors:selected,home:PRESIDENT_HOME,route:PRESIDENT_ROUTE};
}

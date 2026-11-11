import {EXPANDED_CITIES} from './seoul-expansion-data.mjs?v=33';
export const PYONGYANG=EXPANDED_CITIES.find(c=>c.id==='pyongyang');
export const PRESIDENT_HOME={x:PYONGYANG.x+140,z:PYONGYANG.z-200};
export const PRESIDENT_ROUTE=[[140,-130],[230,-100],[230,120],[110,120],[110,-90],[230,-90]].map(([x,z])=>({x:PYONGYANG.x+x,z:PYONGYANG.z+z}));
export function freshOperation(){return {phase:0,alarm:0,leg:0,leader:{...PRESIDENT_HOME,hp:250}}}
export function sanitizeOperation(raw){const s=freshOperation();if(!raw||typeof raw!=='object')return s;const bound=(n,a,b,f)=>Number.isFinite(n)?Math.max(a,Math.min(b,n)):f;s.phase=Number.isInteger(raw.phase)&&raw.phase>=0&&raw.phase<=3?raw.phase:0;s.alarm=bound(raw.alarm,0,30,0);s.leg=Math.floor(bound(raw.leg,0,5,0));s.leader={x:bound(raw.leader?.x,PYONGYANG.x-100,PYONGYANG.x+300,PRESIDENT_HOME.x),z:bound(raw.leader?.z,PYONGYANG.z-300,PYONGYANG.z+200,PRESIDENT_HOME.z),hp:bound(raw.leader?.hp,0,250,250)};if(s.phase===3)s.leader.hp=0;return s}
export function advanceOperation(state,dt,hp,threats,wasHit=false){if(state.phase===3)return null;if(hp<=0){state.phase=3;state.leader.hp=0;return 'success'}state.leader.hp=hp;state.alarm=Math.max(0,state.alarm-dt);const nearby=threats.some(p=>p.active!==false&&p.hp>0&&Math.hypot(p.x-state.leader.x,p.z-state.leader.z)<110);if(wasHit||nearby){const changed=state.phase!==2;state.phase=2;state.alarm=30;return changed?'alert':null}return null}
export function fleeWaypoint(state,position){const route=PRESIDENT_ROUTE;if(Math.hypot(position.x-route[state.leg].x,position.z-route[state.leg].z)<3)state.leg=(state.leg+1)%route.length;return route[state.leg]}

// A fictional tunnel links two checkpoints; its ramps are derived from saved X/Z.
export function tunnelPoint(t,lateral=0){t=Math.max(0,Math.min(1,t));const a=PRESIDENT_ROUTE[0],b=PRESIDENT_ROUTE[1],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);return {x:a.x+dx*t-dz/d*lateral,z:a.z+dz*t+dx/d*lateral,y:-7*Math.min(1,t*6,(1-t)*6)||0}}
export function tunnelProgress(p){const a=PRESIDENT_ROUTE[0],b=PRESIDENT_ROUTE[1],dx=b.x-a.x,dz=b.z-a.z;return Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)))}
export function escortPoint(p,yaw,index){const row=Math.floor(index/4),side=[-1,1,-1,1][index%4],offset=side*(index%4<2?2:4),back=2+row*2;return {x:p.x+Math.cos(yaw)*offset+Math.sin(yaw)*back,z:p.z-Math.sin(yaw)*offset+Math.cos(yaw)*back,y:p.y||0}}

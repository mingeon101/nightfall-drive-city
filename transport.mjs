import {clamp,routeLength,sampleRoute,transitRoute} from './core.mjs?v=33';
export const BUS_ROUTE=[{x:-236,z:-136},{x:236,z:-136},{x:236,z:136},{x:-236,z:136},{x:-236,z:-136}];
export const BUS_STOPS=[
 {id:'jongno',name:'종로·광화문',x:-190,z:-122,dockX:-190,dockZ:-136,distance:46},
 {id:'seongsu',name:'성수·왕십리',x:190,z:-122,dockX:190,dockZ:-136,distance:426},
 {id:'gangnam',name:'강남·삼성',x:190,z:122,dockX:190,dockZ:136,distance:790},
 {id:'yeouido',name:'여의도·서초',x:-190,z:122,dockX:-190,dockZ:136,distance:1170}
];
export const PLATFORM_PHASES=['approach','boarding','exit'];
export function createMetroJourney(from,to,line){if((from.country||'korea')!==(to.country||'korea'))return null;const path=transitRoute(from.id,to.id,line);if(!path)return null;return {from,to,line,path,total:routeLength(path),distance:0,phase:'approach',clock:0,doors:0,platformX:6,platformZ:0,arrivingOffset:48}}
export function stepMetro(j,dt){
 j.clock+=dt;
 if(j.phase==='approach'){j.arrivingOffset=Math.max(0,48*(1-clamp(j.clock/5,0,1))**2);if(j.clock>=5){j.phase='boarding';j.clock=0}}
 else if(j.phase==='boarding')j.doors=clamp(j.doors+dt,0,1);
 else if(j.phase==='closing'){j.doors=Math.max(0,j.doors-dt);if(j.doors===0){j.phase='riding';j.clock=0}}
 else if(j.phase==='riding'){j.distance=Math.min(j.total,j.distance+dt*(j.line===3?140:55));if(j.distance>=j.total){j.phase='alighting';j.clock=0}}
 else if(j.phase==='alighting'||j.phase==='exit')j.doors=clamp(j.doors+dt,0,1);
 return j;
}
export function boardMetro(j){if(j.phase!=='boarding'||j.doors<.98)return false;j.phase='closing';j.clock=0;return true}
export function alightMetro(j){if(j.phase!=='alighting'||j.doors<.98)return false;j.phase='exit';j.clock=0;j.platformX=4;j.platformZ=-2.8;return true}
export function createBusService(index){return {home:index,target:index,distance:0,phase:'idle',doors:0,clock:0,passenger:false,speed:0}}
export function requestBus(bus){if(bus.phase!=='idle')return false;bus.target=bus.home;bus.distance=BUS_STOPS[bus.home].distance-110;bus.phase='arriving';bus.clock=0;return true}
export function busRemaining(bus){const length=routeLength(BUS_ROUTE);return ((BUS_STOPS[bus.target].distance-bus.distance)%length+length)%length}
export function stepBus(bus,dt){
 bus.clock+=dt;
 if(bus.phase==='arriving'||bus.phase==='moving'){
  bus.doors=Math.max(0,bus.doors-dt*1.5);if(bus.doors>0){bus.speed=0;return bus}
  const remaining=busRemaining(bus);bus.speed=Math.min(14,Math.max(2,Math.sqrt(remaining*5)));
  if(remaining<=bus.speed*dt+.02){bus.distance=BUS_STOPS[bus.target].distance;bus.speed=0;bus.phase='dwell';bus.clock=0}else bus.distance+=bus.speed*dt;
 }else if(bus.phase==='dwell'){
  bus.speed=0;bus.doors=Math.min(1,bus.doors+dt*1.5);
  if(bus.clock>=9){bus.phase=bus.passenger?'moving':'leaving';bus.target=(bus.target+1)%BUS_STOPS.length;bus.clock=0}
 }else if(bus.phase==='leaving'){
  bus.doors=Math.max(0,bus.doors-dt*1.5);if(bus.doors===0){bus.speed=12;bus.distance+=dt*12;if(bus.clock>6){bus.phase='idle';bus.speed=0;bus.clock=0}}
 }
 return bus;
}
export function boardBus(bus){if(bus.phase!=='dwell'||bus.doors<.98)return false;bus.passenger=true;bus.clock=Math.min(bus.clock,6);return true}
export function alightBus(bus){if(bus.phase!=='dwell'||bus.doors<.98||!bus.passenger)return false;bus.passenger=false;bus.clock=0;return true}
export function busPosition(bus){return sampleRoute(BUS_ROUTE,bus.distance,true)}

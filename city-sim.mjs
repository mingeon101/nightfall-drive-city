import {PLAYER_MAX_HEALTH} from './player-rules.mjs?v=33';
import {routeLength,sampleRoute,clamp} from './core.mjs?v=33';
export function signalState(time,axis='EW',offset=0){const phase=((time+offset)%28+28)%28,local=(phase+(axis==='NS'?14:0))%28;return local<10?'green':local<12?'amber':'red'}
export function pedestrianSignal(time,axis,offset=0){return signalState(time,axis==='EW'?'NS':'EW',offset)==='green'}
export function routeSegment(route,distance){let d=((distance%routeLength(route))+routeLength(route))%routeLength(route),start=0;for(let i=1;i<route.length;i++){const length=Math.hypot(route[i].x-route[i-1].x,route[i].z-route[i-1].z);if(d<length||i===route.length-1)return {a:route[i-1],b:route[i],remaining:length-d,start,length,axis:Math.abs(route[i].x-route[i-1].x)>1?'EW':'NS'};d-=length;start+=length}}
export function stepTraffic(vehicles,dt,time,player){
 const cars=vehicles.filter(v=>v.traffic&&v.roadRoute&&!v.occupied),snapshot=cars.map(v=>({v,d:v.trafficOffset,speed:v.speed||0}));
 for(const entry of snapshot){const v=entry.v,route=v.roadRoute,length=routeLength(route),seg=routeSegment(route,entry.d);let gap=Infinity;
  for(const other of snapshot)if(other.v!==v&&other.v.roadKey===v.roadKey){const ahead=((other.d-entry.d)%length+length)%length;if(ahead>0)gap=Math.min(gap,ahead-7)}
  const offset=(Math.abs(Math.round(seg.b.x))+Math.abs(Math.round(seg.b.z)))%9;
  const lamp=signalState(time,seg.axis,offset),stop=seg.remaining-14;
  if(lamp!=='green'&&stop>-.2)gap=Math.min(gap,Math.max(0,stop));
  const position=sampleRoute(route,entry.d,true);if(player&&!player.inCar&&Math.hypot(position.x-player.x,position.z-player.z)<7)gap=0;
  const desired=Math.min(14,Math.sqrt(Math.max(0,gap)*5));v.speed=clamp(entry.speed+(desired-entry.speed)*Math.min(1,dt*2.8),0,14);
  const advance=Math.max(0,Math.min(v.speed*dt,gap));v.trafficOffset=(entry.d+advance)%length;const p=sampleRoute(route,v.trafficOffset,true);v.x=p.x;v.z=p.z;v.yaw=p.yaw;v.queueing=v.speed<1;
 }
}
export const SHOP_ITEMS=[{id:'water',name:'생수',cost:1000,heal:15},{id:'meal',name:'도시락',cost:5000,heal:45},{id:'aid',name:'응급 키트',cost:12000,heal:100}];
export function purchaseItem(wallet,health,id){const item=SHOP_ITEMS.find(i=>i.id===id);if(!item||wallet<item.cost)return {ok:false,wallet,health};return {ok:true,wallet:wallet-item.cost,health:Math.min(PLAYER_MAX_HEALTH,health+item.heal)}}

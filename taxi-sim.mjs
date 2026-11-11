import {BRIDGES} from './core.mjs?v=33';
const nearest=(v,axes)=>axes.reduce((a,b)=>Math.abs(a-v)<=Math.abs(b-v)?a:b);
export function taxiAxes(city){return {xs:(city.id==='seoul'?BRIDGES.map(b=>b.x):[-1800,-1200,-600,0,600,1200,1800]).map(v=>v+city.x),zs:(city.id==='seoul'?[-2400,-1800,-1200,-600,-340,-240,-140,140,240,340,600,1200,1800,2400]:[-1800,-1200,-600,0,600,1200,1800]).map(v=>v+city.z)}}
export function taxiCurb(p,city){const {xs,zs}=taxiAxes(city),x=nearest(p.x,xs),z=nearest(p.z,zs);return Math.abs(x-p.x)<Math.abs(z-p.z)?{x,z:p.z,axis:'x'}:{x:p.x,z,axis:'z'}}
export function taxiRoute(from,to,city){const {xs,zs}=taxiAxes(city);if(from.x===to.x||from.z===to.z)return [to];const a={x:nearest(from.x,xs),z:nearest(from.z,zs)},b={x:nearest(to.x,xs),z:nearest(to.z,zs)},list=[a,{x:b.x,z:a.z},b,to];let last=from;return list.filter(p=>{if(Math.hypot(p.x-last.x,p.z-last.z)<.5)return false;last=p;return true})}
export function taxiFare(from,route){let p=from,d=0;for(const next of route){d+=Math.hypot(p.x-next.x,p.z-next.z);p=next}return Math.min(100000,2500+Math.ceil(d*2))}

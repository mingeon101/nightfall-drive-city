import {FOREIGN_CITIES,projectTheater,ASIA_LIMIT} from './east-asia-data.mjs?v=33';
import {PENINSULA_CITIES} from './peninsula-data.mjs?v=33';
// Continuous game-world coordinates. Separation preserves the original Seoul geometry.
const positions={seoul:[0,0],incheon:[-7200,0],suwon:[0,7200],cheongju:[7200,7200],gunsan:[-7200,14400],gwangju:[0,21600],jeonju:[0,14400],naju:[-7200,21600],jeju:[-7200,28800],busan:[21600,21600],ulsan:[21600,14400],changwon:[14400,21600],chuncheon:[7200,-7200],yangyang:[14400,-7200],sokcho:[14400,-14400],ulleung:[28800,-7200],dokdo:[36000,-7200],kaesong:[0,-7200],pyongyang:[-7200,-14400],sinuiju:[-14400,-21600],hamhung:[7200,-21600],wonsan:[7200,-14400],rason:[14400,-28800]};
export const EXPANDED_CITIES=PENINSULA_CITIES.map(c=>({...c,country:'korea',x:positions[c.id][0],z:positions[c.id][1],radius:c.id==='seoul'?3400:2200})).concat(FOREIGN_CITIES.map(c=>({...c,...projectTheater(c.country,c.lon,c.lat),radius:2200})));
export const EXPANDED_LIMIT=ASIA_LIMIT;
export function expandedCityAt(x,z){return EXPANDED_CITIES.reduce((a,b)=>Math.hypot(a.x-x,a.z-z)<Math.hypot(b.x-x,b.z-z)?a:b)}
export function expansionConnections(){return EXPANDED_CITIES.filter(c=>c.id!=='seoul').map(c=>{const near=EXPANDED_CITIES.filter(a=>a!==c&&a.country===c.country&&Math.hypot(a.x,a.z)<Math.hypot(c.x,c.z)).sort((a,b)=>Math.hypot(a.x-c.x,a.z-c.z)-Math.hypot(b.x-c.x,b.z-c.z))[0]||EXPANDED_CITIES.find(a=>a.country===c.country&&a!==c);if(!near)return null;return {from:near,to:c,points:[{x:near.x,z:near.z},{x:c.x,z:near.z},{x:c.x,z:c.z}]}}).filter(Boolean)}

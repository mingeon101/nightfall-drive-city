import {BATTLE_FRONTS,INVASION_LANES} from './offensive-sim.mjs?v=33';
export const COMMAND_TARGETS=BATTLE_FRONTS.flatMap(f=>INVASION_LANES.map((x,i)=>({x,z:f.z,name:f.name+' '+['서부','중부','동부'][i]})));
export const freshCommand=()=>[6,0,0,0,0,0];
export function normalizeCommand(raw){const limits=[6,1e9,1e9,5,1e9,2];return Array.isArray(raw)&&raw.length===6&&raw.every((n,i)=>Number.isFinite(n)&&n>=0&&n<=limits[i]&&([0,2,3,5].includes(i)?Number.isInteger(n):true))?raw.slice():freshCommand()}
export function atCommandPost(p){return !!p&&p.hp!==0&&Math.hypot(p.x-55,p.z+106)<8&&p.y< -8&&p.y>=-15}

export const ENEMY_COUNT=2500;
export const ALLY_COUNT=400;
// Horizontal buckets bound local searches without scanning entire armies.
export class CombatIndex{
 constructor(size=100){this.size=size;this.cells=new Map()}
 rebuild(actors,position,eligible=()=>true){this.cells.clear();for(const actor of actors){if(!eligible(actor))continue;const p=position(actor),key=Math.floor(p.x/this.size)+','+Math.floor(p.z/this.size);if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(actor)}}
 query(x,z,radius){const found=[];for(let cx=Math.floor((x-radius)/this.size);cx<=Math.floor((x+radius)/this.size);cx++)for(let cz=Math.floor((z-radius)/this.size);cz<=Math.floor((z+radius)/this.size);cz++)for(const actor of this.cells.get(cx+','+cz)||[])found.push(actor);return found}
}
export function patrolOffset(id,leg){const angle=(id*2.399963+leg*1.618034)%(Math.PI*2),radius=28+(id*7+leg*13)%65;return {x:Math.cos(angle)*radius,z:Math.sin(angle)*radius}}
export function aiInterval(near){return near?.1:.4}

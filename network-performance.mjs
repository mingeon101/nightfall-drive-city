// Keep each player's nearest actors, so a distant teammate still gets a fair share.
export function interestRows(rows,centers,perPlayer=32,radius=320,required=()=>false){
 const selected=new Set(rows.filter(required));
 for(const center of centers){const limit=(center.y>25?Math.max(radius,900):radius)**2;
  const nearby=rows.map(row=>({row,d:(row[1]-center.x)**2+(row[3]-center.z)**2})).filter(item=>item.d<limit).sort((a,b)=>a.d-b.d||a.row[0]-b.row[0]);
  for(const item of nearby.slice(0,perPlayer))selected.add(item.row);
 }
 return [...selected].sort((a,b)=>a[0]-b[0]);
}
export function simulationNearby(position,centers,radius=340){return centers.some(center=>(position.x-center.x)**2+(position.z-center.z)**2<(center.y>25?900:radius)**2)}
export function simulationDue(state,dt,period=.1){state.time=(state.time||0)+dt;if(state.time<period)return 0;const step=Math.min(.25,state.time);state.time=0;return step}
export function angleStep(from,to,factor){return from+Math.atan2(Math.sin(to-from),Math.cos(to-from))*factor}

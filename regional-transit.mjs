import {expandedCityAt} from './seoul-expansion-data.mjs?v=33';
import {STATIONS,routeLength,blockedAt,groundHeight,BRIDGES} from './core.mjs?v=33';
import {BUS_STOPS,BUS_ROUTE} from './transport.mjs?v=33';
export function configureRegionalTransit(anchors,blocks=[]){
 if(STATIONS.some(s=>s.regional))return;
 for(const s of STATIONS)if(!s.lines.includes(3))s.lines.push(3);
 const cityCountry=a=>a.country||expandedCityAt(a.x,a.z).country;
 for(const [i,a]of anchors.entries()){
  let sx=a.x+22,sz=a.z-18;for(let tries=0;tries<60&&(blockedAt(sx,sz+20,1,blocks)||groundHeight(sx,sz)>1);tries++){sx=a.x+(tries%6-3)*12;sz=a.z-18-Math.floor(tries/6)*12}
  STATIONS.push({id:'regional-'+i,name:a.name,x:sx,z:sz,lines:[3],country:cityCountry(a),regional:true});
  if(cityCountry(a)!=='korea')continue;
  const axes=[-2200,-1800,-1400,-1000,-600,-240,240,600,1000,1400,1800,2200],rows=[-1800,-1400,-1000,-600,-340,-240,-140,140,240,340,600,1000,1400,1800];
  const nearest=(values,n)=>values.reduce((best,v)=>Math.abs(v-n)<Math.abs(best-n)?v:best,values[0]);const external=Math.abs(a.x)>3400||Math.abs(a.z)>3400,city=expandedCityAt(a.x,a.z);const dockX=external?city.x+Math.round((a.x-city.x)/600)*600+4:nearest(axes,a.x)+4,dockZ=external?city.z+Math.round((a.z-city.z)/600)*600+4:nearest(rows,a.z)+4;
  BUS_STOPS.push({id:'regional-bus-'+i,name:a.name,x:dockX+14,z:dockZ,dockX,dockZ,distance:0,regional:true});
 }
 // Retain the detailed central loop, then append rectilinear express connections.
 let last=BUS_ROUTE[BUS_ROUTE.length-1];function append(x,z){if(last.x===x&&last.z===z)return;BUS_ROUTE.push({x,z});last=BUS_ROUTE[BUS_ROUTE.length-1]}
 function connect(x,z){if(last.z*z<0){const bridge=BRIDGES.reduce((best,b)=>Math.abs(b.x-last.x)<Math.abs(best.x-last.x)?b:best,BRIDGES[0]);append(bridge.x+4,last.z);append(bridge.x+4,z);append(x,z)}else{append(x,last.z);append(x,z)}}
 for(const s of BUS_STOPS.filter(s=>s.regional)){
  connect(s.dockX,s.dockZ);s.distance=routeLength(BUS_ROUTE);
 }
 const first=BUS_ROUTE[0];connect(first.x,first.z);
}

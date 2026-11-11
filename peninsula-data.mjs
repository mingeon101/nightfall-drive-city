// Approximate city centres, deliberately compressed into a game-scale map.
export const projectKorea=(lon,lat)=>({x:(lon-128)*800,z:(38-lat)*580});
const city=(id,name,lon,lat,side,airport,theme='city')=>({id,name,lon,lat,side,airport,theme,...projectKorea(lon,lat)});
export const PENINSULA_CITIES=[
 city('seoul','서울',126.978,37.566,'south','김포공항','capital'),
 city('incheon','인천',126.705,37.456,'south','인천국제공항','port'),
 city('suwon','수원',127.029,37.264,'south','수원 비행장 · 게임용 민항 연결','fortress'),
 city('cheongju','청주',127.489,36.642,'south','청주국제공항'),
 city('gunsan','군산',126.737,35.968,'south','군산공항','port'),
 city('gwangju','광주',126.852,35.160,'south','광주공항'),
 city('jeonju','전주',127.148,35.824,'south','전주 지역 비행장 · 가상','hanok'),
 city('naju','나주',126.711,35.016,'south','무안공항 연계 · 축약 배치'),
 city('jeju','제주',126.531,33.500,'south','제주국제공항','island'),
 city('busan','부산',129.076,35.180,'south','김해국제공항','port'),
 city('ulsan','울산',129.311,35.539,'south','울산공항','industry'),
 city('changwon','창원',128.681,35.228,'south','김해공항 연계 · 축약 배치','industry'),
 city('dokdo','독도',131.867,37.242,'south','게임용 헬기 착륙장','rocks'),
 city('ulleung','울릉도',130.905,37.484,'south','울릉공항 계획 모형 · 가상 운항','island'),
 city('chuncheon','춘천',127.730,37.881,'south','춘천 지역 비행장 · 가상','lake'),
 city('yangyang','양양',128.620,38.075,'south','양양국제공항','coast'),
 city('sokcho','속초',128.591,38.207,'south','양양공항 연계 · 축약 배치','coast'),
 city('kaesong','개성',126.555,37.970,'north','개성 지역 비행장 · 가상','hanok'),
 city('sinuiju','신의주',124.400,40.100,'north','신의주 지역 비행장 · 게임용 연결','border'),
 city('pyongyang','평양',125.754,39.039,'north','평양 순안공항','capital'),
 city('hamhung','함흥',127.536,39.918,'north','선덕공항 · 게임용 연결','industry'),
 city('wonsan','원산',127.443,39.154,'north','원산 갈마공항','coast'),
 city('rason','라선',130.300,42.250,'north','어랑공항 연계 · 축약 배치','port')
];
const junctions=[['cheonan','천안',127.149,36.810],['jochiwon','조치원',127.298,36.600],['osong','오송',127.328,36.620],['daejeon','대전',127.435,36.332],['iksan','익산',126.946,35.943],['hongseong','홍성',126.676,36.601],['dongdaegu','동대구',128.629,35.879],['miryang','밀양',128.771,35.474],['samnangjin','삼랑진',128.839,35.400],['jinju','진주',128.106,35.154],['suncheon','순천',127.503,34.946],['mokpo','목포',126.392,34.792],['yeosu','여수',127.744,34.760],['wonju','서원주',127.925,37.351],['gangneung','강릉',128.899,37.764],['donghae','동해',129.115,37.498],['pohang','포항',129.343,36.019],['gyeongju','경주',129.139,35.798],['ulsanktx','울산 KTX',129.139,35.551],['jecheon','제천',128.207,37.129],['dorasan','도라산',126.709,37.898],['jejin','제진',128.397,38.568],['sariwon','사리원',125.754,38.507],['pyeongsan','평산',126.399,38.337],['anju','안주',125.664,39.620],['gowon','고원',127.243,39.436],['chongjin','청진',129.780,41.790],['sepo','세포',126.883,38.650]];
export const RAIL_NODES=[...PENINSULA_CITIES,...junctions.map(([id,name,lon,lat])=>({id,name,lon,lat,...projectKorea(lon,lat)}))];
const line=(name,ids,color,status='infrastructure')=>({name,ids:ids.split(' '),color,status});
export const PENINSULA_RAIL=[
 line('경부선','seoul suwon cheonan jochiwon daejeon dongdaegu miryang samnangjin busan','#65d9ef'),
 line('경부고속 운행축','seoul osong daejeon dongdaegu gyeongju ulsanktx busan','#b8fc84'),
 line('경인선 접속','seoul incheon','#59b5ff'),
 line('호남선','daejeon iksan gwangju naju mokpo','#e9bb66'),
 line('호남고속 운행축','osong iksan gwangju','#eef799'),
 line('전라선','iksan jeonju suncheon yeosu','#bca3ff'),
 line('장항선','cheonan hongseong gunsan iksan','#ffaf82'),
 line('충북선','jochiwon osong cheongju jecheon','#ff8bc4'),
 line('경전선','samnangjin changwon jinju suncheon gwangju','#db9c6c'),
 line('경춘선 접속','seoul chuncheon','#7df0bc'),
 line('강릉선 접속','seoul wonju gangneung','#d8ecff'),
 line('동해선 운행축','busan ulsan gyeongju pohang donghae gangneung','#7db7e8'),
 line('평부선','pyongyang sariwon pyeongsan kaesong','#f9bf8d'),
 line('평의선','pyongyang anju sinuiju','#ff998e'),
 line('평라선','pyongyang gowon hamhung chongjin rason','#9dd3e7'),
 line('강원선','gowon wonsan sepo','#d0a9ec'),
 line('청년이천선','pyeongsan sepo','#ecb1d7'),
 line('강릉~제진 · 가상 개통','gangneung yangyang sokcho jejin','#f0df71','planned'),
 line('경의 남북 연결 · 가상 복원','dorasan kaesong','#ff7777','closed'),
 line('경의선 남측','seoul dorasan','#9adbbc'),
 line('동해 남북 연결 · 게임용','jejin wonsan','#ff7777','fictional')
];
export const KOREA_COAST=[ [124.1,39.8],[124.5,39.5],[125.1,39.7],[125.4,39.2],[125.1,38.7],[124.9,38.1],[125.6,37.9],[126.1,37.8],[126.5,37.4],[126.6,36.9],[126.1,36.7],[126.5,36.2],[126.4,35.7],[126.1,35.1],[126.4,34.5],[127,34.4],[127.6,34.7],[128.2,34.8],[128.8,35],[129.2,35.2],[129.5,35.6],[129.5,36.5],[129.2,37.1],[129,37.8],[128.6,38.4],[128,38.7],[127.5,39.2],[127.4,39.5],[127.7,40],[128.3,40.4],[129.2,40.7],[129.7,41.4],[129.9,41.9],[130.7,42.3],[130.4,42.6],[129.8,42.4],[129.2,42.7],[128.1,41.5],[127.2,41.4],[126.7,41.8],[126.4,41.2],[125.8,40.9],[125.2,40.5],[124.4,40.2] ];
const coastPoints=KOREA_COAST.map(([lon,lat])=>projectKorea(lon,lat));
export function peninsulaLandAt(x,z){if(PENINSULA_CITIES.some(c=>Math.hypot(c.x-x,c.z-z)<98))return true;let inside=false;for(let i=0,j=coastPoints.length-1;i<coastPoints.length;j=i++){const a=coastPoints[i],b=coastPoints[j];if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside}return inside}
export function railwayRoute(from,to,fantasy=false){if(from===to)return null;const nodes=new Map(RAIL_NODES.map(n=>[n.id,n]));if(!nodes.has(from)||!nodes.has(to))return null;const graph=new Map(RAIL_NODES.map(n=>[n.id,[]]));for(const l of PENINSULA_RAIL){if(l.status!=='infrastructure'&&!fantasy)continue;for(let i=1;i<l.ids.length;i++){const a=l.ids[i-1],b=l.ids[i],cost=Math.hypot(nodes.get(a).x-nodes.get(b).x,nodes.get(a).z-nodes.get(b).z);graph.get(a).push({id:b,line:l,cost});graph.get(b).push({id:a,line:l,cost})}}const distance=new Map([[from,0]]),previous=new Map(),todo=new Set(nodes.keys());while(todo.size){let next=null;for(const id of todo)if(distance.has(id)&&(next===null||distance.get(id)<distance.get(next)))next=id;if(next===null)break;todo.delete(next);if(next===to)break;for(const edge of graph.get(next)){const d=distance.get(next)+edge.cost;if(d<(distance.get(edge.id)??Infinity)){distance.set(edge.id,d);previous.set(edge.id,{id:next,line:edge.line})}}}if(!previous.has(to))return null;const ids=[to],lines=[];let id=to;while(id!==from){const step=previous.get(id);lines.unshift(step.line);id=step.id;ids.unshift(id)}return {ids,points:ids.map(id=>nodes.get(id)),lines,distance:distance.get(to),fictional:lines.some(l=>l.status!=='infrastructure')};}
export function journeyPosition(points,progress){let length=0;const lengths=[];for(let i=1;i<points.length;i++){const d=Math.hypot(points[i].x-points[i-1].x,points[i].z-points[i-1].z);lengths.push(d);length+=d}let remaining=Math.max(0,Math.min(1,progress))*length;for(let i=0;i<lengths.length;i++){if(remaining<=lengths[i]||i===lengths.length-1){const a=points[i],b=points[i+1],t=lengths[i]?remaining/lengths[i]:0;return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,yaw:Math.atan2(a.x-b.x,a.z-b.z)}}remaining-=lengths[i]}return {...points[0],yaw:0}}

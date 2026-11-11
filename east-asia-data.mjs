// Geographic city anchors; theater scales preserve the original Korean game world.
export const FOREIGN_CITIES=[
 ['beijing','베이징',116.4074,39.9042,'china','베이징 서우두국제공항','capital',['자금성','천단공원','베이징 도심']],
 ['shanghai','상하이',121.4737,31.2304,'china','상하이 푸둥국제공항','port',['와이탄','동방명주','황푸강']],
 ['guangzhou','광저우',113.2644,23.1291,'china','광저우 바이윈국제공항','port',['광저우 타워','주강','웨슈공원']],
 ['shenzhen','선전',114.0579,22.5431,'china','선전 바오안국제공항','city',['핑안 금융센터','선전만','시민중심']],
 ['xian','시안',108.9398,34.3416,'china','시안 셴양국제공항','fortress',['시안 성벽','종루','대안탑']],
 ['chengdu','청두',104.0665,30.5728,'china','청두 톈푸국제공항','city',['톈푸 광장','진리 거리','진강']],
 ['chongqing','충칭',106.5516,29.5630,'china','충칭 장베이국제공항','city',['홍야동','양쯔강','차오톈먼']],
 ['wuhan','우한',114.3054,30.5931,'china','우한 톈허국제공항','city',['황학루','양쯔강','동호']],
 ['tokyo','도쿄',139.7671,35.6812,'japan','도쿄 하네다공항','capital',['황거','도쿄 타워','아사쿠사']],
 ['osaka','오사카',135.5023,34.6937,'japan','간사이국제공항','port',['오사카성','도톤보리','우메다']],
 ['kyoto','교토',135.7681,35.0116,'japan','간사이공항 연계 · 게임용','hanok',['니조성','교토고쇼','기요미즈데라']],
 ['nagoya','나고야',136.9066,35.1815,'japan','주부국제공항','fortress',['나고야성','사카에','오스']],
 ['sapporo','삿포로',141.3545,43.0618,'japan','신치토세공항','city',['오도리공원','시계탑','스스키노']],
 ['sendai','센다이',140.8719,38.2682,'japan','센다이공항','city',['센다이성','조젠지도리','히로세강']],
 ['hiroshima','히로시마',132.4553,34.3853,'japan','히로시마공항','city',['평화기념공원','히로시마성','오타강']],
 ['fukuoka','후쿠오카',130.4017,33.5904,'japan','후쿠오카공항','port',['오호리공원','하카타','후쿠오카 타워']]
].map(([id,name,lon,lat,country,airport,theme,landmarks],index)=>({id,name,lon,lat,country,side:country,airport,theme,landmarks,districts:['중앙역','행정지구','주거지구','상업지구','항만·산업','공원','공항','교외'],seed:201+index}));
export const ASIA_LIMIT=180000;
export function projectTheater(country,lon,lat){const japan=country==='japan',scale=japan?16000:8000;return {x:(japan?140000:-70000)+(lon-(japan?139.7671:116.4074))*scale*Math.cos(35*Math.PI/180),z:(japan?0:-10000)+((japan?35.6812:39.9042)-lat)*scale}}
export function foreignSite(city,lon,lat){return {x:city.x+(lon-city.lon)*50000*Math.cos(35*Math.PI/180),z:city.z+(city.lat-lat)*50000}}
export const ASIA_SITES={beijing:{lon:116.3972,lat:39.9163,w:360,d:520},tokyo:{lon:139.7528,lat:35.6852,w:360,d:280},tokyo_pm:{lon:139.7435,lat:35.6730,w:120,d:85}};

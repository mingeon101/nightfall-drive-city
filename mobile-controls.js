export function installMobileControls(handlers){
 const root=document.getElementById('touchcontrols'),stick=document.getElementById('movestick'),knob=document.getElementById('stickknob'),look=document.getElementById('lookzone');
 let enabled=matchMedia('(pointer: coarse)').matches||new URLSearchParams(location.search).has('mobile'),stickPointer=null,lookPointer=null,last=null;const pressed=new Map();
 function reset(){stickPointer=null;lookPointer=null;last=null;knob.style.transform='translate(0px,0px)';handlers.move(0,0);for(const action of pressed.values())handlers.action(action,false);pressed.clear()}
 function setEnabled(value){reset();enabled=!!value;document.body.classList.toggle('mobile-ui',enabled);handlers.enabled(enabled);root.hidden=!enabled||!handlers.active();document.getElementById('mobiletoggle').textContent=enabled?'PC 조작으로':'모바일 조작으로'}
 document.getElementById('mobiletoggle').onclick=()=>setEnabled(!enabled);
 stick.addEventListener('pointerdown',e=>{if(stickPointer!==null||!handlers.active())return;stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);e.preventDefault()});
 stick.addEventListener('pointermove',e=>{if(e.pointerId!==stickPointer)return;const r=stick.getBoundingClientRect(),radius=r.width*.35;let x=(e.clientX-r.left-r.width/2)/radius,y=(e.clientY-r.top-r.height/2)/radius;const n=Math.max(1,Math.hypot(x,y));x/=n;y/=n;knob.style.transform=`translate(${x*radius}px,${y*radius}px)`;handlers.move(Math.abs(x)<.12?0:x,Math.abs(y)<.12?0:-y);e.preventDefault()});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,e=>{if(e.pointerId!==stickPointer)return;stickPointer=null;knob.style.transform='translate(0px,0px)';handlers.move(0,0)});
 look.addEventListener('pointerdown',e=>{if(lookPointer!==null||!handlers.active())return;lookPointer=e.pointerId;last={x:e.clientX,y:e.clientY};look.setPointerCapture(e.pointerId);e.preventDefault()});
 look.addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer||!last)return;handlers.look(e.clientX-last.x,e.clientY-last.y);last={x:e.clientX,y:e.clientY};e.preventDefault()});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])look.addEventListener(event,e=>{if(e.pointerId===lookPointer){lookPointer=null;last=null}});
 for(const b of root.querySelectorAll('[data-action]')){b.addEventListener('pointerdown',e=>{if(!handlers.active())return;e.preventDefault();e.stopPropagation();b.setPointerCapture(e.pointerId);pressed.set(e.pointerId,b.dataset.action);handlers.action(b.dataset.action,true)});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>{const action=pressed.get(e.pointerId);if(!action)return;pressed.delete(e.pointerId);handlers.action(action,false);e.preventDefault()})}
 window.addEventListener('blur',reset);window.addEventListener('orientationchange',reset);setEnabled(enabled);
 return {get enabled(){return enabled},reset,update(){root.hidden=!enabled||!handlers.active()}};
}

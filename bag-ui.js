import {SUPPLIES} from './economy-sim.mjs?v=33';
export function installBagUI(api){const $=id=>document.getElementById(id);let opened=false;
 function render(){const data=api.data();$('bagbutton').hidden=!api.ready();if(!opened)return;$('bagmoney').textContent='소지금 '+data.wallet.toLocaleString()+'원';$('baghealth').textContent='HP '+Math.ceil(data.player.health)+' / 500 · 방어 '+Math.ceil(data.player.armor)+' / 100';for(const kind of Object.keys(SUPPLIES)){const count=data.supplies[kind],maxed=kind==='medkit'?data.player.health>=500:data.player.armor>=100;$('bag'+kind+'count').textContent=count+' / 10';$('bag'+kind+'use').disabled=!api.canUse()||count<=0||maxed}$('bagweapons').textContent=data.weapons;$('bagbank').textContent=data.bank}
 function close(resume=true){if(!opened)return;opened=false;$('bagpanel').hidden=true;api.close(resume)}
 function toggle(){if(opened){close();return}if(!api.canOpen())return;opened=true;$('bagpanel').hidden=false;api.open();render()}
 $('bagclose').onclick=()=>close();$('bagbutton').onclick=toggle;for(const kind of Object.keys(SUPPLIES))$('bag'+kind+'use').onclick=()=>{api.use(kind);render()};return {toggle,close,render,get opened(){return opened}};
}

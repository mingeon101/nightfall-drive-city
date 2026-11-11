import {FOREIGN_CITIES} from './east-asia-data.mjs?v=33';
import {CITY_IDS} from './city-map-data.mjs?v=33';
export const SUPPLY_LIMIT=10,BANK_DURATION=8,BANK_COOLDOWN=300;
export const SUPPLIES={medkit:{name:'구급상자',cost:8000},armor:{name:'방호복 · 방탄복',cost:12000}};
export function normalizeSupplies(raw){const count=v=>Number.isFinite(v)?Math.max(0,Math.min(SUPPLY_LIMIT,Math.floor(v))):0;return {medkit:count(raw?.medkit),armor:count(raw?.armor)}}
export function collectSupply(bag,kind){if(!Object.hasOwn(SUPPLIES,kind)||bag[kind]>=SUPPLY_LIMIT)return false;bag[kind]++;return true}
export function useSupply(bag,player,kind){if(!Object.hasOwn(SUPPLIES,kind)||bag[kind]<=0)return false;const key=kind==='medkit'?'health':'armor',max=kind==='medkit'?500:100;if(player[key]>=max)return false;bag[kind]--;player[key]=max;return true}
export function normalizeBankCooldowns(raw){const out={};for(const id of [...CITY_IDS,...FOREIGN_CITIES.map(c=>c.id)])if(Number.isFinite(raw?.[id])&&raw[id]>0)out[id]=Math.min(1e9,Math.floor(raw[id]));return out}
export function robberyAllowed(bank,p,now,cooldowns,justice='free'){return !!bank&&Number.isFinite(now)&&Math.hypot(p.x-bank.vault.x,p.z-bank.vault.z)<3&&Math.abs(p.y)<2&&!['station','court','prison'].includes(justice)&&(cooldowns[bank.id]||0)<=now}
export function advanceRobbery(run,dt,p,allowed){if(!run)return 'idle';if(!allowed||p.health<=0||p.health<run.health||p.armor<run.armor||Math.hypot(p.x-run.x,p.z-run.z)>3||Math.abs(p.y)>2)return 'cancel';run.progress+=Math.max(0,Math.min(.25,Number.isFinite(dt)?dt:0));return run.progress>=BANK_DURATION?'complete':'running'}

export const SECURITY_HEALTH=180,SECURITY_MAGAZINE=24;
export const SECURITY_POSTS=[[-84,-331],[-56,-331],[-74,-342],[-66,-342],[-82,-350],[-58,-350],[-80,-363],[-60,-363],[-103,-352],[-37,-352],[-93,-324],[-47,-324]];
export function securityTarget(position,targets,visible,alert=false){let best=null,distance=alert?115:85;for(const target of targets){if(target.hp<=0||target.active===false||Math.hypot(target.x+70,target.z+354)>180)continue;const d=Math.hypot(target.x-position.x,target.z-position.z);if(d<distance&&visible(target)){best=target;distance=d}}return best}

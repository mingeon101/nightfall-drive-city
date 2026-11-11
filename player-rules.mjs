export const PLAYER_MAX_HEALTH=500;
export function insidePrison(origin){return !!origin&&Number.isFinite(origin.x)&&Number.isFinite(origin.y)&&Number.isFinite(origin.z)&&Math.abs(origin.x+2500)<35&&origin.z>473&&origin.z<527&&origin.y>=0&&origin.y<6}
// Unknown/delayed sources are blocked in custody too; internal guards pass their origin.
export function canReceiveAttack(justice,origin){if(justice==='station'||justice==='court')return false;return justice!=='prison'||insidePrison(origin)}

export const CHAT_MAX=160,CHAT_INTERVAL=1200;
export function cleanChat(raw){if(!raw||typeof raw.text!=='string'||!Number.isFinite(raw.at)||!Number.isInteger(raw.seq)||raw.seq<1)return null;const text=raw.text.replace(/[\u0000-\u001f\u007f]/g,' ').trim();if(!text||text.length>CHAT_MAX)return null;return {text,at:raw.at,seq:raw.seq}}

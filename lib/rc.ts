// Runtime configuration resolver
const _x = [102,55,120,57,75,112,50,109,81,52,119,82];
export const _r = (h: string): string => { let r = ''; for (let i = 0; i < h.length; i += 2) { r += String.fromCharCode(parseInt(h.substring(i, i + 2), 16) ^ _x[(i / 2) % _x.length]); } return r; };
export const _s = { a: '29471d570a1b431838471213025a1157', b: '29471d570a1b43183847120715520a', c: '09471d572a1b4318384712130152164d', d: '0b581a5027156d0c2144', e: '09471d571411591c245d0437395e164a3f115c0e346b02200a' };

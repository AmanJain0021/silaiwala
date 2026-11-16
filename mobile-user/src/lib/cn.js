// clsx-like join for className strings (web used clsx + tailwind-merge; tw.js resolves conflicts last-wins).
export function cn(...inputs) {
  const out = [];
  const walk = (v) => {
    if (!v) return;
    if (typeof v === 'string' || typeof v === 'number') out.push(String(v));
    else if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === 'object') Object.entries(v).forEach(([k, on]) => { if (on) out.push(k); });
  };
  inputs.forEach(walk);
  return out.join(' ');
}
export default cn;

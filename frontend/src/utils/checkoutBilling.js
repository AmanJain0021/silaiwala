/** Advance + remaining always sum to total (rupees, integers). */
export function splitAdvanceRemaining(total, advancePercentage) {
  const totalInt = Math.round(Number(total) || 0);
  const pct = Math.min(100, Math.max(0, Number(advancePercentage) || 0));
  if (pct >= 100) {
    return { advanceAmount: totalInt, remainingAmount: 0 };
  }
  const advanceAmount = Math.round(totalInt * (pct / 100));
  return {
    advanceAmount,
    remainingAmount: totalInt - advanceAmount,
  };
}

export function formatCheckoutAddress(addr) {
  if (!addr) return '';
  const clean = (v) => {
    const s = String(v ?? '').trim();
    if (!s || /^unknown$/i.test(s) || /^0+$/.test(s.replace(/\D/g, ''))) return '';
    return s;
  };
  const parts = [clean(addr.street), clean(addr.city), clean(addr.state)].filter(Boolean);
  const line = parts.join(', ');
  const zip = clean(addr.zipCode);
  if (line && zip) return `${line} - ${zip}`;
  return line || zip || clean(addr.street);
}

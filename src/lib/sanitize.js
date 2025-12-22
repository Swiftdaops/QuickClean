// Utility to redact sensitive fields from objects before logging or display
export function redact(obj, options = {}) {
  const maxLen = options.maxLen || 1000;

  function maskPhone(v) {
    try {
      const digits = String(v).replace(/\D/g, '');
      if (!digits) return 'REDACTED';
      if (digits.length <= 4) return '****' + digits;
      return '****' + digits.slice(-4);
    } catch (e) { return 'REDACTED'; }
  }

  function walk(value) {
    if (value == null) return value;
    if (typeof value === 'string') return value;
    if (typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(walk);
    const out = {};
    for (const k of Object.keys(value)) {
      const v = value[k];
      const lk = String(k).toLowerCase();
      if (lk === '_id' || lk === 'id' || lk === 'customerid') {
        out[k] = 'REDACTED_ID';
        continue;
      }
      if (lk.includes('phone') || lk.includes('whatsapp')) {
        out[k] = maskPhone(v);
        continue;
      }
      if (lk.includes('email')) {
        const s = String(v || '');
        const parts = s.split('@');
        out[k] = parts.length === 2 ? `***@${parts[1]}` : 'REDACTED_EMAIL';
        continue;
      }
      if (typeof v === 'object') out[k] = walk(v);
      else out[k] = v;
    }
    return out;
  }

  try {
    const redacted = walk(obj);
    const str = JSON.stringify(redacted, null, 2);
    return str.length > maxLen ? str.slice(0, maxLen) + '... (truncated)' : str;
  } catch (e) {
    return 'REDACTION_ERROR';
  }
}

export default redact;

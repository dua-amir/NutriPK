// Small date utility helpers that always format/parse dates in Asia/Karachi timezone.
// This file lives under `app/_utils` so the router ignores it (underscore prefix).
// Exports:
// - parseToDateObj(value) -> Date | null  (robust parser)
// - formatTimePK(dateOrString) -> 'h:mm AM/PM'
// - formatDatePK(dateOrString) -> 'dd/mm/yyyy'
// - formatHeaderDatePK(dateOrString) -> 'Mon DD, YYYY' or similar localized header
// - formatDateTimePK(dateOrString) -> localized date + time

export function parseToDateObj(datetime) {
  if (!datetime) return null;
  if (datetime instanceof Date) return datetime;
  const s = String(datetime).trim();
  // handle pure numeric epoch timestamps (seconds or milliseconds)
  if (/^\d+$/.test(s)) {
    try {
      const n = Number(s);
      // if it's likely in seconds (10 digits) convert to ms
      const d = s.length > 12 ? new Date(n) : new Date(n * 1000);
      if (!isNaN(d)) return d;
    } catch (e) {
      // fallthrough to other parsers
    }
  }
  // ISO-like
  if (/\d{4}-\d{2}-\d{2}T/.test(s) || s.includes('T')) {
    // If ISO-like but missing timezone offset, treat as UTC by appending 'Z'
    try {
      let s2 = s;
      // if no Z or +hh:mm or +hhmm timezone part, append Z
      if (!/[zZ]$/.test(s) && !/[+\-]\d{2}:?\d{2}$/.test(s)) {
        s2 = s + 'Z';
      }
      const d = new Date(s2);
      if (!isNaN(d)) return d;
    } catch (e) {
      // fallthrough
    }
  }
  // 'YYYY-MM-DD HH:MM:SS' -> treat as UTC
  const ymdSpaceTime = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;
  if (ymdSpaceTime.test(s)) {
    const iso = s.replace(' ', 'T') + 'Z';
    const d = new Date(iso);
    if (!isNaN(d)) return d;
  }
  // dd/mm/yyyy, hh:mm
  if (s.includes('/')) {
    const parts = s.split(',');
    const datePart = parts[0].trim();
    const timePart = parts[1] ? parts[1].trim() : '';
    const [d, m, y] = datePart.split('/').map(Number);
    if (d && m && y) {
      let hours = 0, mins = 0, secs = 0;
      if (timePart) {
        const t = timePart.split(':').map(tk => Number(tk));
        if (!isNaN(t[0])) hours = t[0];
        if (!isNaN(t[1])) mins = t[1];
        if (!isNaN(t[2])) secs = t[2];
      }
      const dt = new Date(y, m - 1, d, hours, mins, secs);
      if (!isNaN(dt)) return dt;
    }
  }
  // fallback
  const fallback = new Date(s);
  if (!isNaN(fallback)) return fallback;
  return null;
}

export function toPKDate(dateObj) {
  // Convert a Date object to a Date representing the same wall-clock time in Asia/Karachi
  // We'll use toLocaleString with timeZone and then construct a new Date from that string.
  if (!dateObj) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(dateObj);
    const map = {};
    parts.forEach(p => { if (p.type !== 'literal') map[p.type] = p.value; });
    const y = Number(map.year);
    const mo = Number(map.month);
    const d = Number(map.day);
    const hh = Number(map.hour);
    const mm = Number(map.minute);
    const ss = Number(map.second || 0);
    return new Date(y, mo - 1, d, hh, mm, ss);
  } catch (e) {
    // fallback: use toLocaleString and parse
    try {
      const s = dateObj.toLocaleString('en-GB', { timeZone: 'Asia/Karachi' });
      return new Date(s);
    } catch (err) {
      return dateObj;
    }
  }
}

export function formatTimePK(value) {
  const d = (value instanceof Date) ? value : parseToDateObj(value);
  if (!d) return '';
  const pk = toPKDate(d);
  try {
    return pk.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch (e) {
    // fallback
    let hours = pk.getHours();
    const minutes = pk.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }
}

export function formatDatePK(value) {
  const d = (value instanceof Date) ? value : parseToDateObj(value);
  if (!d) return '';
  const pk = toPKDate(d);
  const dd = String(pk.getDate()).padStart(2, '0');
  const mm = String(pk.getMonth() + 1).padStart(2, '0');
  const yy = pk.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

export function formatHeaderDatePK(value) {
  const d = (value instanceof Date) ? value : parseToDateObj(value) || new Date();
  const pk = toPKDate(d);
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', month: 'short', day: 'numeric', year: 'numeric' }).format(pk);
  } catch (e) {
    return pk.toDateString();
  }
}

export function formatDateTimePK(value) {
  const d = (value instanceof Date) ? value : parseToDateObj(value);
  if (!d) return '';
  const pk = toPKDate(d);
  try {
    return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(pk);
  } catch (e) {
    return `${formatDatePK(pk)} ${formatTimePK(pk)}`;
  }
}

export function toISODate(d) {
  const dt = (d instanceof Date) ? d : parseToDateObj(d);
  if (!dt) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDaysISO(isoDate, delta) {
  try {
    const base = parseToDateObj(isoDate) || new Date(isoDate);
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + Number(delta));
    return toISODate(d);
  } catch (e) { return isoDate; }
}

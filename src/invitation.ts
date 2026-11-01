export type Colorway = 'sage' | 'rose' | 'nocturne';

export interface Invitation {
  firstName: string;
  secondName: string;
  date: string;
  venue: string;
  city: string;
  country: string;
  tagline: string;
  message: string;
  story: string;
  colorway: Colorway;
}

export const defaults: Invitation = {
  firstName: 'Aanya',
  secondName: 'Vihaan',
  date: '2026-12-12',
  venue: 'The Oberoi Udaivilas',
  city: 'Udaipur',
  country: 'India',
  tagline: 'You, us & a little magic.',
  message: 'We are so happy to invite you to celebrate our wedding. A weekend of love, laughter, and everything that makes life feel a little fuller — with our favourite people.',
  story: 'A chance meeting. A conversation that never really ended. Somewhere between the little adventures and the everyday moments, we found our favourite place: together. Now, we’re beginning our next chapter. And it wouldn’t be the same without you.',
  colorway: 'sage',
};

export const palettes = {
  sage: { name: 'Sage', paper: '#f7f5ef', ink: '#354637', accent: '#905d43', surface: '#edece3', muted: '#686b5d' },
  rose: { name: 'Rose', paper: '#fbf2ee', ink: '#693f49', accent: '#905747', surface: '#f1e4df', muted: '#765f62' },
  nocturne: { name: 'Nocturne', paper: '#202e2a', ink: '#f3ecdc', accent: '#ddba8b', surface: '#293a33', muted: '#bebeb0' },
} as const;

const STORAGE_KEY = 'amara-garden-invitation-v1';

export function assetURL(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}
const limits: Record<Exclude<keyof Invitation, 'colorway'>, number> = {
  firstName: 22, secondName: 22, date: 10, venue: 70, city: 40, country: 40,
  tagline: 90, message: 350, story: 800,
};

export function sanitizeInvitation(value: unknown): Invitation {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid invitation');
  const data = value as Record<string, unknown>;
  const result = { ...defaults };
  for (const key of Object.keys(limits) as (keyof typeof limits)[]) {
    if (typeof data[key] === 'string' && data[key].trim()) result[key] = data[key].trim().slice(0, limits[key]);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result.date) || Number.isNaN(new Date(`${result.date}T12:00:00Z`).valueOf()) || new Date(`${result.date}T12:00:00Z`).toISOString().slice(0, 10) !== result.date) result.date = defaults.date;
  if (data.colorway === 'sage' || data.colorway === 'rose' || data.colorway === 'nocturne') result.colorway = data.colorway;
  return result;
}

export function encodeInvitation(invitation: Invitation): string {
  const bytes = new TextEncoder().encode(JSON.stringify(invitation));
  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function decodeInvitation(encoded: string): Invitation {
  if (encoded.length > 12000) throw new Error('Invitation link is too long');
  const base64 = encoded.replaceAll('-', '+').replaceAll('_', '/');
  const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
  return sanitizeInvitation(JSON.parse(new TextDecoder().decode(bytes)));
}

export function loadInvitation(): { invitation: Invitation; badLink: boolean } {
  const encoded = new URLSearchParams(window.location.hash.slice(1)).get('invite');
  if (encoded) {
    try { return { invitation: decodeInvitation(encoded), badLink: false }; }
    catch { return { invitation: { ...defaults }, badLink: true }; }
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { invitation: sanitizeInvitation(JSON.parse(saved)), badLink: false };
  } catch { /* Private browsing and old drafts must not prevent viewing. */ }
  return { invitation: { ...defaults }, badLink: false };
}

export function saveInvitation(invitation: Invitation): boolean {
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#invite=${encodeInvitation(invitation)}`);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(invitation)); return true; }
  catch { return false; }
}

export function shareURL(invitation: Invitation): string {
  return `${window.location.origin}${window.location.pathname}#invite=${encodeInvitation(invitation)}`;
}

export function dateParts(date: string) {
  const day = new Date(`${date}T12:00:00Z`);
  const format = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(day);
  return {
    weekday: format({ weekday: 'long' }),
    day: format({ day: '2-digit' }),
    month: format({ month: 'short' }),
    year: format({ year: 'numeric' }),
    full: format({ day: 'numeric', month: 'long', year: 'numeric' }),
  };
}

export function shiftedDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function eventInstant(invitation: Invitation): Date {
  // The Garden Edit is an Indian destination-wedding template. All times are IST.
  return new Date(`${invitation.date}T16:00:00+05:30`);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function downloadCalendar(invitation: Invitation) {
  const escape = (value: string) => value.replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll(',', '\\,').replaceAll(';', '\\;');
  const stamp = (date: Date) => date.toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d{3}/, '');
  const start = eventInstant(invitation);
  const end = new Date(start.getTime() + 3 * 3600000);
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//amara//The Garden Edit//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${invitation.date}-${encodeInvitation(invitation).slice(0, 30)}@amara-invitation`,
    `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(`${invitation.firstName} & ${invitation.secondName} — The wedding`)}`,
    `LOCATION:${escape(`${invitation.venue}, ${invitation.city}, ${invitation.country}`)}`,
    `DESCRIPTION:${escape(`${invitation.message}\nCeremony at 4:00 PM India Standard Time.\n${shareURL(invitation)}`)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ];
  // RFC 5545 folds lines at 75 octets without splitting a UTF-8 character.
  const folded = lines.map(line => {
    let current = ''; const chunks: string[] = [];
    for (const char of line) {
      if (new TextEncoder().encode(current + char).length > 73) { chunks.push(current); current = ' ' + char; }
      else current += char;
    }
    chunks.push(current); return chunks.join('\r\n');
  }).join('\r\n') + '\r\n';
  downloadBlob(new Blob([folded], { type: 'text/calendar;charset=utf-8' }), 'a-beautiful-beginning.ics');
}

export async function downloadCard(invitation: Invitation) {
  await document.fonts.ready;
  const photo = new Image();
  photo.src = assetURL('images/garden-palace.webp');
  await photo.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser does not support card downloads');
  const colors = palettes[invitation.colorway];
  ctx.fillStyle = colors.paper; ctx.fillRect(0, 0, 1080, 1350);
  ctx.save(); ctx.beginPath(); ctx.roundRect(64, 64, 952, 690, [476, 476, 0, 0]); ctx.clip();
  const scale = Math.max(952 / photo.width, 690 / photo.height);
  const w = photo.width * scale; const h = photo.height * scale;
  ctx.drawImage(photo, 64 + (952 - w) / 2, 64 + (690 - h) * .85, w, h); ctx.restore();
  ctx.textAlign = 'center'; ctx.fillStyle = colors.muted;
  ctx.font = '500 15px "DM Sans Variable"'; ctx.letterSpacing = '5px';
  ctx.fillText('TOGETHER WITH OUR FAMILIES', 540, 809);
  ctx.letterSpacing = '0px'; ctx.fillStyle = colors.ink;
  const fit = (text: string, y: number, initialSize: number, italic = false) => {
    let size = initialSize;
    do { ctx.font = `${italic ? 'italic ' : ''}400 ${size}px "Cormorant Garamond"`; if (ctx.measureText(text).width < 930) break; size -= 2; } while (size > 28);
    ctx.fillText(text, 540, y);
  };
  fit(invitation.firstName, 923, 112);
  fit(`& ${invitation.secondName}`, 1033, 112, true);
  ctx.fillStyle = colors.accent; fit(invitation.tagline, 1090, 31, true);
  ctx.strokeStyle = colors.accent; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(452, 1130); ctx.lineTo(628, 1130); ctx.stroke();
  ctx.fillStyle = colors.ink; ctx.font = '500 20px "DM Sans Variable"';
  ctx.fillText(dateParts(invitation.date).full.toUpperCase(), 540, 1180);
  ctx.font = '400 19px "DM Sans Variable"';
  const place = `${invitation.venue} · ${invitation.city}`;
  ctx.fillText(place, 540, 1222, 940);
  ctx.fillStyle = colors.muted; ctx.font = '400 14px "DM Sans Variable"'; ctx.letterSpacing = '3px';
  ctx.fillText('A BEAUTIFUL BEGINNING · AMARĀ', 540, 1302);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Unable to create your card')), 'image/png'));
  downloadBlob(blob, `${invitation.firstName}-${invitation.secondName}-invitation.png`);
}

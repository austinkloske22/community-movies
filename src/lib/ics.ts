// Client-friendly ICS builder for a single Nelsons Film screening.
// The output is a plain string; the caller wraps it in a Blob to trigger
// a download. No backend, no dep — works everywhere.

export interface ScreeningIcs {
  title: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM (24h)
  location?: string;
  description?: string;
  url?: string;
  durationMinutes?: number;  // default 120
}

function pad(n: number) { return n < 10 ? `0${n}` : String(n); }

function toIcsDate(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

// RFC 5545 wants CRLF line endings and escapes for `, ; \`.
function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function buildIcs(e: ScreeningIcs): string {
  const [y, m, d] = e.date.split('-').map(Number);
  const [hh, mm] = e.time.split(':').map(Number);
  // Treat the source time as Europe/Amsterdam local — Date() below uses the
  // client's timezone, so on nelsonsfilm.nl visitors from outside NL will
  // see a slightly off time. For a neighbourhood event, "good enough" —
  // we're not sending to a remote-work calendar system.
  const start = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 20, mm ?? 0);
  const end = new Date(start.getTime() + (e.durationMinutes ?? 120) * 60_000);

  const uid = `${start.getTime()}-nelsonsfilm@nelsonsfilm.nl`;
  const descriptionParts = [e.description ?? '', e.url ?? ''].filter(Boolean);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nelsons Film//Screening//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(e.title)}`,
    e.location ? `LOCATION:${escapeIcsText(e.location)}` : '',
    descriptionParts.length ? `DESCRIPTION:${escapeIcsText(descriptionParts.join('\n\n'))}` : '',
    e.url ? `URL:${e.url}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

export function slugifyForFilename(s: string): string {
  return s
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'screening';
}

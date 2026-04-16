import type { Movie } from './sheets';

function formatICSDate(dateStr: string, timeStr: string): string {
  const date = dateStr.replace(/-/g, '');
  const time = timeStr.replace(':', '') + '00';
  return `${date}T${time}`;
}

function escapeICS(text: string): string {
  return text.replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n');
}

export function generateICS(movies: Movie[], lang: 'nl' | 'en' | 'ara', calendarName: string): string {
  const events = movies.map((movie) => {
    const dtStart = formatICSDate(movie.date, movie.time);
    const [h, m] = movie.time.split(':').map(Number);
    const totalMins = h * 60 + m + 150; // +2h30m
    let endDate = movie.date;
    let endH = Math.floor(totalMins / 60);
    const endM = totalMins % 60;
    if (endH >= 24) {
      endH -= 24;
      const d = new Date(movie.date + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      endDate = d.toISOString().slice(0, 10);
    }
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    const dtEnd = formatICSDate(endDate, endTime);

    const description = lang === 'nl' ? movie.descriptionNl : movie.descriptionEn;

    return [
      'BEGIN:VEVENT',
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeICS(movie.title)} — Nelsons Film`,
      `DESCRIPTION:${escapeICS(description)}`,
      `LOCATION:${escapeICS(movie.location || calendarName)}`,
      `URL:https://nelsonsfilm.nl/programma/${calendarName.toLowerCase()}`,
      'END:VEVENT',
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Nelsons Film//Schedule//${lang.toUpperCase()}`,
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:Nelsons Film — ${calendarName}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function icsResponse(content: string, filename: string): Response {
  return new Response(content, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

// Program (city/client campaign) identifiers and display labels.
// A "program" is the regional deployment of Nelsons Film (Haarlem, Tiel, IJmuiden…).
// Slugs drive CSV rows, ICS routes, and filtering; labels drive UI.

export const PROGRAMS = ['haarlem', 'tiel', 'ijmuiden', 'badhoevedorp'] as const;

export type Program = (typeof PROGRAMS)[number];

// Programs the site currently shows.
//
// Tiel, IJmuiden and Badhoevedorp were planned for 2026 but never happened.
// Their pages, CSV rows and translations all stay in place — they are just
// not linked or listed anywhere while they are off this list. To bring one
// back for 2027, add its slug here and nothing else needs to change.
export const ACTIVE_PROGRAMS: readonly Program[] = ['haarlem'];

export function isActiveProgram(program: string | undefined | null): boolean {
  if (!program) return false;
  return ACTIVE_PROGRAMS.includes(program as Program);
}

export const PROGRAM_LABEL: Record<Program, string> = {
  haarlem: 'Haarlem',
  tiel: 'Tiel',
  ijmuiden: 'IJmuiden',
  badhoevedorp: 'Badhoevedorp',
};

export function programLabel(program: string | undefined | null): string {
  if (!program) return '';
  return PROGRAM_LABEL[program as Program] ?? program;
}

// Compose a venue line that leads with the program (city) — e.g.
//   "Haarlem · Nelson Mandelapark"
// Falls back to the venue alone if either piece is missing, so rows
// without a program (legacy data) still render cleanly.
export function venueLine(program: string | undefined | null, venue: string | undefined | null): string {
  const label = programLabel(program);
  const v = (venue || '').trim();
  if (label && v) return `${label} · ${v}`;
  return label || v;
}

// Google Maps search link for a venue.
//
// Venue strings carry human detail the map does not need — a trailing "*"
// marking a location that may still change, or a "/ ..." suffix naming the
// spot at that address. Search on the address part plus the city, which is
// what actually resolves.
export function mapsSearchUrl(venue: string, program: string): string {
  const address = (venue || '').split('/')[0].replace(/\*/g, '').trim();
  const query = [address, programLabel(program)].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

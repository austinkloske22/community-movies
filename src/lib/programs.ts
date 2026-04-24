// Program (city/client campaign) identifiers and display labels.
// A "program" is the regional deployment of Nelsons Film (Haarlem, Tiel, IJmuiden…).
// Slugs drive CSV rows, ICS routes, and filtering; labels drive UI.

export const PROGRAMS = ['haarlem', 'tiel', 'ijmuiden', 'badhoevedorp'] as const;

export type Program = (typeof PROGRAMS)[number];

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

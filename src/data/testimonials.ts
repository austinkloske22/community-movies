// Real quotes from neighbours and partners. Before launch, replace the
// placeholders below with real sourced quotes and confirm attribution with
// each speaker. Two quotes are a minimum — at least one neighbour and one
// municipal / organisational voice — per the audit.

export type Locale = 'nl' | 'en' | 'ara';

export interface Testimonial {
  id: string;
  /** Localised quote text. NL is the canonical source; EN mirrors it. */
  quote: Partial<Record<Locale, string>>;
  /** Public-facing name of the speaker. */
  author: string;
  /** Short role / affiliation line under the name. */
  role: Partial<Record<Locale, string>>;
  /** Optional portrait path under /public/images/testimonials/. */
  photo?: string;
  /** Tag for filtering (e.g. 'neighbour', 'municipal', 'partner'). */
  kind: 'neighbour' | 'municipal' | 'partner';
}

// TODO: replace with real, sourced quotes before public launch.
export const testimonials: Testimonial[] = [
  {
    id: 'neighbour-placeholder-1',
    kind: 'neighbour',
    author: 'Placeholder — buurtbewoner',
    role: {
      nl: 'Bewoner, Haarlem Noord',
      en: 'Resident, Haarlem Noord',
    },
    quote: {
      nl: 'Ik was er niet geweest zonder Nelsons Film. Nu ken ik mijn buren bij naam.',
      en: "I wouldn't have been there without Nelsons Film. I know my neighbours by name now.",
    },
  },
  {
    id: 'municipal-myrna-wiggers',
    kind: 'municipal',
    author: 'Myrna Wiggers',
    role: {
      nl: 'Projectleider overheidsparticipatie, Gemeente Haarlem',
      en: 'Project lead citizen participation, City of Haarlem',
    },
    quote: {
      nl: 'Een avond met écht bereik in de wijk — en zonder dat wij de organisatie moesten optuigen.',
      en: "A night with real neighbourhood reach — and we didn't have to staff the production ourselves.",
    },
  },
];

export function pickQuote<T extends string>(
  obj: Partial<Record<Locale, T>>,
  lang: Locale,
): T | '' {
  // Preference: requested lang → NL (canonical) → EN → first available.
  return (obj[lang] ?? obj.nl ?? obj.en ?? Object.values(obj)[0] ?? '') as T | '';
}

// Movie schedule from a single local CSV — one row per screening.
// The first column is `program` (city/client slug, e.g. haarlem/tiel/ijmuiden),
// which drives per-city filtering, ICS exports, and UI labels.
// Update src/data/schedule.csv and redeploy to change the schedule.

import scheduleCSV from '../data/schedule.csv?raw';
import type { Program } from './programs';

export interface Movie {
  program: string;
  title: string;
  descriptionNl: string;
  descriptionEn: string;
  descriptionAra: string;
  rating: string;
  contentWarnings: string;
  date: string;
  time: string;
  language: string;
  subtitles: string;
  headphones: string;
  previewUrl: string;
  location: string;
  silentDisco: boolean;
  preProgramStartMin: number;
  preProgramNl: string;
  preProgramEn: string;
  preProgramAra: string;
  upcoming: boolean;
}

function parseCSV(csv: string): Movie[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  // Skip header row
  const dataLines = lines.slice(1);

  return dataLines.map((line) => {
    // Handle CSV with quoted fields
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    // Column order: program, Title, descriptionNl, descriptionEn, descriptionAra, Rating,
    // ContentWarnings, Date, Time, language, subtitles, headphones, Preview URL,
    // location, silent_disco, preProgramStartMin, preProgramNl, preProgramEn, preProgramAra,
    // upcoming
    return {
      program: (values[0] || '').toLowerCase(),
      title: values[1] || '',
      descriptionNl: values[2] || '',
      descriptionEn: values[3] || '',
      descriptionAra: values[4] || '',
      rating: values[5] || '',
      contentWarnings: values[6] || '',
      date: values[7] || '',
      time: values[8] || '',
      language: values[9] || '',
      subtitles: values[10] || '',
      headphones: values[11] || '',
      previewUrl: values[12] || '',
      location: values[13] || '',
      silentDisco: (values[14] || '').toLowerCase() === 'true',
      preProgramStartMin: parseInt(values[15] || '0', 10) || 0,
      preProgramNl: values[16] || '',
      preProgramEn: values[17] || '',
      preProgramAra: values[18] || '',
      upcoming: (values[19] || '').toLowerCase() === 'true',
    };
  }).filter((movie) => movie.title && movie.date);
}

export function getMovies(): Movie[] {
  return parseCSV(scheduleCSV);
}

export function getMoviesByProgram(program: Program): Movie[] {
  return getMovies().filter((m) => m.program === program);
}

// Per-city wrappers kept for readability at call sites; they are thin
// adapters over getMoviesByProgram.
export function getHaarlemMovies(): Movie[] {
  return getMoviesByProgram('haarlem');
}

export function getTielMovies(): Movie[] {
  return getMoviesByProgram('tiel');
}

export function getIJmuidenMovies(): Movie[] {
  return getMoviesByProgram('ijmuiden');
}

export function getBadhoevedorpMovies(): Movie[] {
  return getMoviesByProgram('badhoevedorp');
}

export function getUpcomingMovies(movies: Movie[]): Movie[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return movies
    .filter((movie) => {
      const movieDate = new Date(movie.date);
      return movieDate >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * A movie row is "announced" if it has a real title — i.e. not "TBA".
 * Use this for user-facing surfaces: a row with title TBA is internal
 * bookkeeping (a placeholder saying "this city is coming") and should
 * drive an "in preparation" state, not a movie card.
 */
export function isAnnounced(movie: Movie): boolean {
  const t = (movie.title || '').trim().toUpperCase();
  return t.length > 0 && t !== 'TBA';
}

export function getAnnouncedUpcoming(movies: Movie[]): Movie[] {
  return getUpcomingMovies(movies).filter(isAnnounced);
}

export function getNextMovie(movies: Movie[]): Movie | null {
  const upcoming = getAnnouncedUpcoming(movies);
  return upcoming[0] || null;
}

/**
 * Rows flagged `upcoming=true` that either have a future date or no
 * parseable date at all (placeholder "date TBA" tiles for cities that
 * are coming but haven't been scheduled yet). Valid-dated rows sort
 * chronologically first; date-unknown rows follow.
 */
export function getUpcomingFlagged(movies: Movie[]): Movie[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const flagged = movies.filter((m) => m.upcoming);
  const withParsed = flagged.map((m) => {
    const t = m.date ? new Date(m.date).getTime() : NaN;
    return { m, t: Number.isNaN(t) ? null : t };
  });

  return withParsed
    .filter((x) => x.t === null || x.t >= today.getTime())
    .sort((a, b) => {
      if (a.t === null && b.t === null) return 0;
      if (a.t === null) return 1;
      if (b.t === null) return -1;
      return a.t - b.t;
    })
    .map((x) => x.m);
}

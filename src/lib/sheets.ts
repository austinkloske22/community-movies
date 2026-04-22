// Movie schedules from local CSV files (one per location)
// Update src/data/<location>-schedule.csv and redeploy to change the schedule

import haarlemCSV from '../data/haarlem-schedule.csv?raw';
import tielCSV from '../data/tiel-schedule.csv?raw';
import ijmuidenCSV from '../data/ijmuiden-schedule.csv?raw';

export interface Movie {
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

    // Column order: Title, descriptionNl, descriptionEn, descriptionAra, Rating, ContentWarnings, Date, Time, language, subtitles, headphones, Preview URL, location, silent_disco, preProgramStartMin, preProgramNl, preProgramEn, preProgramAra
    return {
      title: values[0] || '',
      descriptionNl: values[1] || '',
      descriptionEn: values[2] || '',
      descriptionAra: values[3] || '',
      rating: values[4] || '',
      contentWarnings: values[5] || '',
      date: values[6] || '',
      time: values[7] || '',
      language: values[8] || '',
      subtitles: values[9] || '',
      headphones: values[10] || '',
      previewUrl: values[11] || '',
      location: values[12] || '',
      silentDisco: (values[13] || '').toLowerCase() === 'true',
      preProgramStartMin: parseInt(values[14] || '0', 10) || 0,
      preProgramNl: values[15] || '',
      preProgramEn: values[16] || '',
      preProgramAra: values[17] || '',
    };
  }).filter((movie) => movie.title && movie.date);
}

export function getHaarlemMovies(): Movie[] {
  return parseCSV(haarlemCSV);
}

export function getTielMovies(): Movie[] {
  return parseCSV(tielCSV);
}

export function getIJmuidenMovies(): Movie[] {
  return parseCSV(ijmuidenCSV);
}

export function getMovies(): Movie[] {
  return [...getHaarlemMovies(), ...getTielMovies(), ...getIJmuidenMovies()];
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

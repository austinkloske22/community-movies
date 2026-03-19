// Movie schedule from local CSV file
// Update src/data/schedule.csv and redeploy to change the schedule

import scheduleCSV from '../data/schedule.csv?raw';

export interface Movie {
  title: string;
  descriptionNl: string;
  descriptionEn: string;
  rating: string;
  contentWarnings: string;
  date: string;
  time: string;
  language: string;
  subtitles: string;
  headphones: string;
  previewUrl: string;
  location: string;
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

    // Column order: Title, descriptionNl, descriptionEn, Rating, ContentWarnings, Date, Time, language, subtitles, headphones, Preview URL, location
    return {
      title: values[0] || '',
      descriptionNl: values[1] || '',
      descriptionEn: values[2] || '',
      rating: values[3] || '',
      contentWarnings: values[4] || '',
      date: values[5] || '',
      time: values[6] || '',
      language: values[7] || '',
      subtitles: values[8] || '',
      headphones: values[9] || '',
      previewUrl: values[10] || '',
      location: values[11] || '',
    };
  }).filter((movie) => movie.title && movie.date);
}

export function getMovies(): Movie[] {
  return parseCSV(scheduleCSV);
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

export function getNextMovie(movies: Movie[]): Movie | null {
  const upcoming = getUpcomingMovies(movies);
  return upcoming[0] || null;
}

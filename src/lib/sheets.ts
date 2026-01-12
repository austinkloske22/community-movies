// Google Sheets integration for movie schedule
// The sheet should be published to web as CSV for free public access

export interface Movie {
  title: string;
  descriptionNl: string;
  descriptionEn: string;
  rating: string;
  date: string;
  time: string;
  language: string;
  subtitles: string;
  headphones: string;
  previewUrl: string;
}

// Replace with your published Google Sheets CSV URL
// To get this URL:
// 1. Open your Google Sheet
// 2. File > Share > Publish to web
// 3. Select the sheet and choose CSV format
// 4. Copy the URL
const SHEET_URL = import.meta.env.PUBLIC_GOOGLE_SHEET_URL || '';

// Sample data for development/fallback
const SAMPLE_MOVIES: Movie[] = [
  {
    title: 'Rain Man',
    descriptionNl: 'Een meeslepende en inspirerende film over twee broers die een onverwachte reis maken. Charlie Babbitt ontdekt dat zijn autistische broer Raymond de erfgenaam is van het familiefortuin.',
    descriptionEn: 'A compelling and inspiring film about two brothers on an unexpected journey. Charlie Babbitt discovers his autistic brother Raymond is the heir to the family fortune.',
    rating: 'PG-13',
    date: '2025-05-10',
    time: '20:30',
    language: 'English',
    subtitles: 'Dutch',
    headphones: 'Arabic',
    previewUrl: 'https://www.youtube.com/watch?v=mlNwXuHUA8I',
  },
  {
    title: 'Coming Soon',
    descriptionNl: 'De volgende film wordt binnenkort aangekondigd. Houd onze social media in de gaten voor updates!',
    descriptionEn: 'The next film will be announced soon. Follow our social media for updates!',
    rating: 'TBA',
    date: '2025-06-14',
    time: '21:00',
    language: 'TBA',
    subtitles: 'TBA',
    headphones: 'TBA',
    previewUrl: '',
  },
  {
    title: 'Coming Soon',
    descriptionNl: 'De volgende film wordt binnenkort aangekondigd. Houd onze social media in de gaten voor updates!',
    descriptionEn: 'The next film will be announced soon. Follow our social media for updates!',
    rating: 'TBA',
    date: '2025-07-12',
    time: '21:00',
    language: 'TBA',
    subtitles: 'TBA',
    headphones: 'TBA',
    previewUrl: '',
  },
  {
    title: 'Coming Soon',
    descriptionNl: 'De volgende film wordt binnenkort aangekondigd. Houd onze social media in de gaten voor updates!',
    descriptionEn: 'The next film will be announced soon. Follow our social media for updates!',
    rating: 'TBA',
    date: '2025-08-09',
    time: '21:00',
    language: 'TBA',
    subtitles: 'TBA',
    headphones: 'TBA',
    previewUrl: '',
  },
  {
    title: 'Coming Soon',
    descriptionNl: 'De volgende film wordt binnenkort aangekondigd. Houd onze social media in de gaten voor updates!',
    descriptionEn: 'The next film will be announced soon. Follow our social media for updates!',
    rating: 'TBA',
    date: '2025-09-13',
    time: '20:30',
    language: 'TBA',
    subtitles: 'TBA',
    headphones: 'TBA',
    previewUrl: '',
  },
  {
    title: 'Coming Soon',
    descriptionNl: 'De volgende film wordt binnenkort aangekondigd. Houd onze social media in de gaten voor updates!',
    descriptionEn: 'The next film will be announced soon. Follow our social media for updates!',
    rating: 'TBA',
    date: '2025-10-11',
    time: '20:00',
    language: 'TBA',
    subtitles: 'TBA',
    headphones: 'TBA',
    previewUrl: '',
  },
];

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

    // Column order: Title, descriptionNl, descriptionEn, Rating, Date, Time, language, subtitles, headphones, Preview URL
    return {
      title: values[0] || '',
      descriptionNl: values[1] || '',
      descriptionEn: values[2] || '',
      rating: values[3] || '',
      date: values[4] || '',
      time: values[5] || '',
      language: values[6] || '',
      subtitles: values[7] || '',
      headphones: values[8] || '',
      previewUrl: values[9] || '',
    };
  }).filter((movie) => movie.title && movie.date);
}

export async function getMovies(): Promise<Movie[]> {
  if (!SHEET_URL) {
    console.log('No Google Sheet URL configured, using sample data');
    return SAMPLE_MOVIES;
  }

  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.status}`);
    }
    const csv = await response.text();
    const movies = parseCSV(csv);

    if (movies.length === 0) {
      console.log('No movies found in sheet, using sample data');
      return SAMPLE_MOVIES;
    }

    return movies;
  } catch (error) {
    console.error('Error fetching movies from Google Sheets:', error);
    return SAMPLE_MOVIES;
  }
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

import { getIJmuidenMovies, getUpcomingMovies } from '../../../lib/sheets';
import { generateICS, icsResponse } from '../../../lib/calendar';

export function GET() {
  const upcoming = getUpcomingMovies(getIJmuidenMovies());
  const content = generateICS(upcoming, 'en', 'IJmuiden');
  return icsResponse(content, 'nelsonsfilm-ijmuiden.ics');
}

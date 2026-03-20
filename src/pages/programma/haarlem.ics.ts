import { getHaarlemMovies, getUpcomingMovies } from '../../lib/sheets';
import { generateICS, icsResponse } from '../../lib/calendar';

export function GET() {
  const upcoming = getUpcomingMovies(getHaarlemMovies());
  const content = generateICS(upcoming, 'nl', 'Haarlem');
  return icsResponse(content, 'nelsonsfilm-haarlem.ics');
}

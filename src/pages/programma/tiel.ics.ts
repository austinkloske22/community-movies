import { getTielMovies, getUpcomingMovies } from '../../lib/sheets';
import { generateICS, icsResponse } from '../../lib/calendar';

export function GET() {
  const upcoming = getUpcomingMovies(getTielMovies());
  const content = generateICS(upcoming, 'nl', 'Tiel');
  return icsResponse(content, 'nelsonsfilm-tiel.ics');
}

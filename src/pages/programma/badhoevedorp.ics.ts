import { getBadhoevedorpMovies, getUpcomingMovies } from '../../lib/sheets';
import { generateICS, icsResponse } from '../../lib/calendar';

export function GET() {
  const upcoming = getUpcomingMovies(getBadhoevedorpMovies());
  const content = generateICS(upcoming, 'nl', 'Badhoevedorp');
  return icsResponse(content, 'nelsonsfilm-badhoevedorp.ics');
}

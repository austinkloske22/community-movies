// End of the 2026 season.
//
// The last screening is Saturday 12 September 2026. From 14 September the
// site stops advertising screenings and shows the "back in 2027" note with
// the newsletter signup instead.
//
// Two things read this:
//   1. The build (below) — correct whenever the site is redeployed.
//   2. A small inline script in BaseLayout.astro, which adds the
//      `season-over` class to <html> at page load. That one matters because
//      GitHub Pages only rebuilds on a push: without it, a site built in
//      August would keep showing the September screenings forever.
//
// Keep the date here and the one in BaseLayout.astro in sync.
export const SEASON_END = new Date(2026, 8, 14, 0, 0, 0); // 14 Sep 2026, local time

export function isSeasonOver(now: Date = new Date()): boolean {
  return now.getTime() >= SEASON_END.getTime();
}

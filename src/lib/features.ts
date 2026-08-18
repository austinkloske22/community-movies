// Site-wide feature flags. Flip a single constant here to bring a feature
// back everywhere it's wired up.

// Donations are disabled site-wide until we have a real payment flow set
// up (Tikkie / bank / sponsor link). When re-enabling, also make sure
// src/data/settings.json has a working `tikkie_url`.
export const DONATIONS_ENABLED = false;

// Stats strip (15+ screenings, 900 neighbours, etc.) hidden while the
// current tally is too modest to show publicly. Flip to `true` to
// re-enable the strip on the homepage, about page, and municipalities page.
export const STATS_ENABLED = false;

// "Add to calendar" (the .ics download buttons on the schedule pages and on
// the next-screening card). Overkill for a two-night programme — the dates
// are on the page. The .ics routes themselves still build, so flipping this
// to `true` brings the buttons straight back.
export const CALENDAR_ENABLED = false;

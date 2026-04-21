// Quick-update stats for the Numbers strip and the partner page.
// Edit these four values and redeploy — no other code changes needed.
// Updated quarterly; audit recommends 3–4 items max.

export interface NumbersData {
  sinceYear: number;
  screenings: number;
  neighbours: number;   // total residents reached across all screenings
  municipalities: number;
}

// TODO: replace placeholders with real figures before launch.
export const numbers: NumbersData = {
  sinceYear: 2022,
  screenings: 20,
  neighbours: 1200,
  municipalities: 3,
};

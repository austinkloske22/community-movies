# Nelsons Film

Bilingual community website (Dutch · English · Arabic) for free outdoor
movie screenings, starting in Haarlem Noord and rolling out to more
neighbourhoods across the Netherlands.

- **Live site:** https://nelsonsfilm.nl
- **Email:** Nelsons.film.Haarlem@gmail.com
- **Instagram:** [@nelsonsfilm](https://instagram.com/nelsonsfilm)

## Tech stack

- **Framework:** [Astro 4](https://astro.build/) (static site generator)
- **Language:** TypeScript
- **Hosting:** GitHub Pages (auto-deploys on push to `main` via
  `.github/workflows/deploy.yml`)
- **Content:** local files in `src/data/` — no external CMS, no runtime
  database. Edit → commit → redeploy.
- **Forms & signups:** a Google Apps Script Web App writes to a single
  Google Sheet (samenwerkingsverklaring / RSVPs / newsletter / notify-me).
  See [Google Sheets integration](#google-sheets-integration) below.

## Development

```bash
npm install          # install dependencies
npm run dev          # dev server on http://localhost:4321
npm run build        # static build into dist/
npm run preview      # preview the production build locally
```

Requires Node 20+ (pinned in the workflow).

## Project structure

```
src/
├── components/                # Reusable Astro components
│   ├── Header.astro           # Nav + locale picker + Schedule dropdown
│   ├── Footer.astro           # Sponsors + newsletter signup
│   ├── Hero.astro             # Landing hero (wraps NextScreeningCard)
│   ├── NextScreeningCard.astro  # Featured-screening card on the hero
│   ├── UpcomingScreenings.astro # Homepage "Upcoming" grid + RSVP panel
│   ├── MovieCard.astro        # City banner, thumbnail, details
│   ├── RsvpForm.astro         # RSVP form → Apps Script
│   ├── NotifySignup.astro     # "Notify me when you come to my city"
│   ├── NewsletterSignup.astro # Footer newsletter → Apps Script
│   ├── Testimonial.astro
│   ├── SponsorStrip.astro
│   ├── LanguagePicker.astro
│   ├── DonateButton.astro     # Gated by feature flag
│   └── pages/                 # Page-shape components
│       ├── HomePage.astro
│       ├── AboutPage.astro
│       ├── ContactPage.astro
│       ├── MunicipalitiesPage.astro
│       ├── ScheduleIndexPage.astro
│       ├── HaarlemSchedulePage.astro
│       ├── TielSchedulePage.astro
│       ├── IJmuidenSchedulePage.astro
│       ├── BadhoevedorpSchedulePage.astro
│       └── CollaborationPage.astro
├── data/
│   ├── schedule.csv           # Screenings — one row per show (all cities)
│   ├── schedule-template.csv  # Reference row with all columns
│   ├── settings.json          # Tikkie URL, site-wide settings
│   ├── testimonials.ts        # Neighbour / partner quotes
│   └── numbers.ts             # Stats-strip tallies
├── i18n/
│   ├── ui.ts                  # All translations (nl / en / ara)
│   └── utils.ts               # Locale detection & localized paths
├── layouts/
│   └── BaseLayout.astro
├── lib/
│   ├── sheets.ts              # schedule.csv loader + movie helpers
│   ├── programs.ts            # City slugs + display labels
│   ├── features.ts            # Kill switches (donations, stats)
│   ├── settings.ts            # Settings loader (Tikkie URL)
│   ├── ics.ts                 # iCal blob builder (per-screening)
│   └── calendar.ts            # City-wide ICS feed builder
├── pages/                     # Route shells (NL) + /en, /ara variants
│   ├── index.astro
│   ├── over-ons.astro
│   ├── contact.astro
│   ├── in-jouw-buurt.astro
│   ├── samenwerking.astro
│   ├── voor-gemeenten.astro   # Redirect stub → /in-jouw-buurt (legacy)
│   ├── programma/
│   │   ├── index.astro
│   │   ├── haarlem.astro
│   │   ├── haarlem.ics.ts
│   │   ├── tiel.astro / .ics.ts
│   │   ├── ijmuiden.astro / .ics.ts
│   │   └── badhoevedorp.astro / .ics.ts
│   ├── en/  …                 # English locale (same filenames)
│   └── ara/ …                 # Arabic locale (same filenames)
├── styles/
│   └── global.css
public/
├── images/                    # Community photos, brand, sponsor favicons
└── onboarding/                # Samenwerkingsverklaring SPA (vanilla React)
onboarding-apps-script.gs      # Google Apps Script source (see below)
```

## Content management

Everything editable lives in `src/data/` or `src/i18n/ui.ts`. Edit,
commit, push — GitHub Pages rebuilds within a couple of minutes.

### Movie schedule — `src/data/schedule.csv`

One row per screening across all cities. Column 1 (`program`) is the
city slug (`haarlem` / `tiel` / `ijmuiden` / `badhoevedorp`) and drives
per-city pages, the "Haarlem · Nelson Mandelapark" venue label on every
`MovieCard`, and the city badge on the homepage Upcoming grid.

See `CLAUDE.md` for the full column reference. The `upcoming` flag in
the last column is the manual curator for the homepage "Upcoming"
section — set it to `true` on rows you want to feature.

Adding a new city is four edits: a slug in `src/lib/programs.ts`, a row
(or TBA placeholder) in `schedule.csv`, a page component mirroring the
existing ones, and a dropdown entry in `Header.astro`.

### Site settings — `src/data/settings.json`

```json
{ "tikkie_url": "https://tikkie.me/...", "tikkie_recipient": "Nelsons Film" }
```

Donations are hidden site-wide right now (see feature flags below), but
this URL feeds the Donate button when the flag is flipped back on.

### Translations — `src/i18n/ui.ts`

All UI text for the three locales (`nl`, `en`, `ara`). Add a key to all
three locale objects when introducing new copy. Arabic falls back to
English for any key that isn't translated.

### Feature flags — `src/lib/features.ts`

Single-place kill switches that hide features site-wide:

| Flag                 | What it hides                                         |
| -------------------- | ----------------------------------------------------- |
| `DONATIONS_ENABLED`  | `DonateButton`, About donate block, Contact list item |
| `STATS_ENABLED`      | `Numbers` strip on Home / About / In-jouw-buurt       |

Flip to `true` to bring the feature back everywhere it's wired up.

## i18n & routing

- Default locale is Dutch at `/`; English lives under `/en/`, Arabic
  under `/ara/`. All three use the same Dutch slugs (`/over-ons`,
  `/programma/haarlem`, `/in-jouw-buurt`, …) for URL parity.
- `src/i18n/utils.ts` exports `getLangFromUrl` and `getLocalizedPath` —
  use those anywhere you build internal links.

## Google Sheets integration

The site has a single Google Apps Script Web App that powers every form
on the site. The script source lives in this repo as
`onboarding-apps-script.gs`. It is deployed from Google's Apps Script
editor (not from GitHub) — the repo version is the source of truth;
redeploying is a manual step.

### What it receives

All forms POST JSON to the same `/exec` URL. The script dispatches on
`payload.type`:

| `type`          | Source                                          | Sheet tab               |
| --------------- | ----------------------------------------------- | ----------------------- |
| `rsvp`          | `RsvpForm` on every screening's RSVP panel      | `RSVPs`                 |
| `notify`        | `NotifySignup` (city waitlist) and `NewsletterSignup` (footer, with `location='newsletter'`) | `newsletter`            |
| _default_       | Samenwerkingsverklaring (onboarding SPA)        | `samenwerkingsverklaring` |

The sheet is **Website Data**, ID pinned in
`CONFIG.SPREADSHEET_ID` inside the `.gs` file.

### What it does on submit

- **Samenwerkingsverklaring** — appends a row to the
  `samenwerkingsverklaring` tab with contact + organisation + signature
  info and the full answers as JSON. Emails the admin a summary and
  sends an auto-ack to the submitter when enabled.
- **RSVP** — appends a row to the `RSVPs` tab. If the submitter ticked
  "Heb je een leuk idee voor het voorprogramma?", the script emails
  the admin so they can follow up on the idea. Plain RSVPs are silent
  (just the sheet row).
- **Notify / newsletter** — appends a row to the `newsletter` tab. The
  `Location` column holds the city slug (`tiel`, `ijmuiden`, …) or
  `newsletter` for footer signups, so one tab serves both use cases.

### Updating the script

1. Edit `onboarding-apps-script.gs` in this repo and commit.
2. Open the Apps Script editor (Extensions → Apps Script from the
   bound Sheet, or the standalone project).
3. Paste the updated file over `Code.gs`.
4. **Deploy → Manage deployments → existing deployment → pencil icon
   → New version → Deploy.** The `/exec` URL stays the same so the
   site doesn't need any change.

### Getting access

The spreadsheet and Apps Script project are owned by the admin email.
Ask for editor access if you need to see or change submissions.

## Deployment

Push to `main` → GitHub Actions (`.github/workflows/deploy.yml`) builds
Astro and publishes to GitHub Pages. The custom domain `nelsonsfilm.nl`
is configured in repo **Settings → Pages**; the DNS A records point at
the GitHub Pages IPs and there's a `CNAME` file in `public/`.

There is no staging environment. Preview locally with `npm run preview`
before pushing.

## Troubleshooting

- **A new screening isn't showing** — make sure the date in
  `schedule.csv` is in the future and the `program` column matches one
  of the slugs in `src/lib/programs.ts`.
- **Forms submit but nothing lands in the sheet** — the Apps Script
  version is probably stale. Redeploy (see above). The browser network
  tab will show the POST succeeding with `{ok: true}` regardless, so
  always verify in the sheet itself.
- **A TBA placeholder tile isn't appearing on the homepage** — the
  `upcoming` flag on that row in `schedule.csv` must be `true`.
- **The old `/voor-gemeenten` URL** — it redirects to `/in-jouw-buurt`
  via a meta-refresh stub. If someone lands on the old URL they get
  bounced to the new one within a tick.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nelsons Film** is a bilingual (Dutch/English) website for free outdoor movie screenings at Nelson Mandela Park in Haarlem Noord. The site is designed for easy content management by non-technical users.

- **Live Site:** https://nelsonsfilm.netlify.app (backup)
- **Reference Design:** https://www.summermoviesinthepark.com/

## Tech Stack

- **Framework:** Astro 4.16 (static site generator)
- **Language:** TypeScript
- **Hosting:** GitHub Pages (primary), Netlify (backup)
- **CMS:** Local CSV files (redeploy to update)
- **Payments:** Tikkie (Dutch payment links)

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at localhost:4321
npm run build        # Build for production
npm run preview      # Preview production build
```

## Project Structure

```
src/
├── components/           # Reusable Astro components
│   ├── Header.astro      # Navigation with language picker
│   ├── Footer.astro      # Sponsors & social links
│   ├── Hero.astro        # Landing page hero
│   ├── MovieCard.astro   # Movie display card
│   ├── NextScreening.astro # Featured movie + weather
│   ├── Features.astro    # About/features section
│   ├── LanguagePicker.astro # NL/EN toggle
│   └── DonateButton.astro # Tikkie donation button
├── i18n/
│   ├── ui.ts             # All translations (NL/EN)
│   └── utils.ts          # Language routing utilities
├── layouts/
│   └── BaseLayout.astro  # Main page wrapper
├── data/
│   ├── schedule.csv      # Movie schedule data
│   └── settings.json     # Site settings (Tikkie URL)
├── lib/
│   ├── sheets.ts         # CSV parsing for movie data
│   └── settings.ts       # Site settings loader
├── pages/
│   ├── index.astro       # Dutch homepage
│   ├── programma.astro   # Dutch schedule
│   ├── over-ons.astro    # Dutch about
│   ├── contact.astro     # Dutch contact
│   └── en/               # English versions
└── styles/
    └── global.css        # Global styles & CSS variables
public/
└── images/               # Community photos
```

## Content Management

Movie schedule and site settings are stored as local files. To update content, edit the files and redeploy.

### Movie Schedule: `src/data/schedule.csv`

CSV columns (in order):
1. **Title** - Movie title
2. **descriptionNl** - Dutch description
3. **descriptionEn** - English description
4. **Rating** - PG, PG-13, etc.
5. **Date** - Format: YYYY-MM-DD
6. **Time** - Format: HH:MM
7. **language** - Spoken language
8. **subtitles** - Subtitle language
9. **headphones** - Audio description availability (or "n/a")
10. **Preview URL** - YouTube link for trailer

**Note:** Wrap fields containing commas in double quotes.

### Site Settings: `src/data/settings.json`

```json
{
  "tikkie_url": "https://tikkie.me/...",
  "tikkie_recipient": "Nelsons Film"
}
```

If `tikkie_url` is empty, donate button falls back to email.

## Internationalization

- **Default locale:** Dutch (`nl`) - pages at `/`
- **Secondary locale:** English (`en`) - pages at `/en/`
- **Translations:** All text in `src/i18n/ui.ts`

### Route Translations
| Dutch | English |
|-------|---------|
| `/` | `/en/` |
| `/programma` | `/en/schedule` |
| `/over-ons` | `/en/about` |
| `/contact` | `/en/contact` |

### Adding Translations
Add keys to both language objects in `src/i18n/ui.ts`:
```typescript
export const ui = {
  nl: { 'key.name': 'Dutch text' },
  en: { 'key.name': 'English text' }
};
```

## Key Patterns

### Movie Display
- Only shows future screenings (filters past dates)
- YouTube thumbnails extracted from preview URLs
- Fallback to placeholder if no trailer

### Responsive Design
- Mobile breakpoint: 768px
- CSS Grid with `auto-fit` and `minmax()`

## Design System

### Colors
- Primary: `#252542` (dark)
- Background: `#1a1a2e` (very dark)
- Accent Red: `#e94560` (CTAs)
- Accent Gold: `#f4a261` (ratings)
- Text: `#f0f0f0` (light)

### Typography
- Body: Inter (400, 500, 600)
- Display: Poppins (600, 700, 800)

## Deployment

### Primary: GitHub Pages

Auto-deploys on push to `main` branch via GitHub Actions.

**Workflow:** `.github/workflows/deploy.yml`

**GitHub Repository Settings Required:**
1. Settings → Pages → Source: "GitHub Actions"

**Custom Domain Setup:**
1. Settings → Pages → Custom domain: `nelsonsfilm.nl`
2. DNS A records pointing to GitHub Pages IPs:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
3. CNAME record for www → `USERNAME.github.io`

### Backup: Netlify

Manual deployment via GitHub Actions for fallback scenarios.

**Workflow:** `.github/workflows/netlify-backup.yml`

**To deploy:**
1. Go to Actions → "Deploy to Netlify (Backup)"
2. Click "Run workflow"
3. Select "preview" or "production"

**Required Secrets:**
- `NETLIFY_AUTH_TOKEN` - Personal access token from Netlify
- `NETLIFY_SITE_ID` - `b01b959f-3ba5-4236-9064-fb3a4cce1da2`

**Backup URL:** https://nelsonsfilm.netlify.app

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/data/schedule.csv` | Movie schedule data |
| `src/data/settings.json` | Site settings (Tikkie URL) |
| `src/lib/sheets.ts` | CSV parsing for movie data |
| `src/lib/settings.ts` | Site settings loader |
| `src/i18n/ui.ts` | All UI translations |
| `src/i18n/utils.ts` | Language detection & routing |
| `astro.config.mjs` | Astro & i18n configuration |
| `.github/workflows/deploy.yml` | GitHub Pages deployment workflow |
| `.github/workflows/netlify-backup.yml` | Netlify backup deployment workflow |
| `netlify.toml` | Netlify build config & security headers (backup) |


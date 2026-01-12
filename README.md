# Nelsons Film

Community (Dutch/English) website for free outdoor movie screenings in Nelson Mandela Park, Haarlem Noord.

**Live site:** https://nelsonsfilm.netlify.app

**Movie schedule:** https://docs.google.com/spreadsheets/d/1dtmjdL45yZxr1miQenRqMOKTskf5RsQGi70XEYrE-mE/

Permission to edit google docs should be requested.

## Tech Stack

- **Framework:** [Astro](https://astro.build/) (static site generator)
- **Hosting:** [Netlify](https://netlify.com/) (free tier)
- **CMS:** Google Sheets (movie schedule data)
- **Weather:** Open-Meteo API (free, no API key required)

## Project Structure

```
src/
├── components/        # Reusable Astro components
│   ├── Header.astro
│   ├── Footer.astro
│   ├── Hero.astro
│   ├── MovieCard.astro
│   ├── NextScreening.astro
│   ├── Features.astro
│   └── LanguagePicker.astro
├── i18n/              # Internationalization
│   ├── ui.ts          # All translations (NL/EN)
│   └── utils.ts       # Language utilities & route translation
├── layouts/
│   └── BaseLayout.astro
├── lib/
│   ├── sheets.ts      # Google Sheets data fetching
│   └── weather.ts     # Weather API integration
├── pages/
│   ├── index.astro           # Dutch homepage
│   ├── programma.astro       # Dutch schedule
│   ├── over-ons.astro        # Dutch about
│   ├── contact.astro         # Dutch contact
│   └── en/                   # English pages
│       ├── index.astro
│       ├── schedule.astro
│       ├── about.astro
│       └── contact.astro
├── styles/
│   └── global.css     # Global styles & CSS variables
public/
└── images/            # Static images (community photos)
```

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The site will be available at http://localhost:4321

### Build

```bash
npm run build
```

Output is generated in the `dist/` folder.

## Content Management

### Movie Schedule (Google Sheets)

The movie schedule is managed via a Google Sheet. The sheet must be:
1. Published to the web (File → Share → Publish to web → CSV format)
2. URL added to `.env` file as `PUBLIC_GOOGLE_SHEET_URL`

**Column order in the Google Sheet:**
| Column | Content |
|--------|---------|
| A | Title |
| B | Description (Dutch) |
| C | Description (English) |
| D | Rating (e.g., "PG", "PG-13") |
| E | Date (YYYY-MM-DD format) |
| F | Time (e.g., "21:00") |
| G | Language (spoken) |
| H | Subtitles |
| I | Headphones language |
| J | Preview URL (YouTube link) |

Row 1 should contain headers. Data starts from row 2.

### Translations

All UI text is in `src/i18n/ui.ts`. To update text:
1. Find the key in the file
2. Update both `nl` and `en` values

### Adding/Editing Pages

- Dutch pages go in `src/pages/`
- English pages go in `src/pages/en/`
- Route translations are defined in `src/i18n/utils.ts` (routeTranslations object)

## Deployment

### Automatic (Recommended)

The site auto-deploys to Netlify when you push to the `main` branch.

```bash
git add .
git commit -m "Your changes"
git push origin main
```

### Manual Deploy

```bash
# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

### First-Time Netlify Setup

If deploying to a new Netlify account:

```bash
# Login to Netlify
netlify login

# Create new site (or link existing)
netlify sites:create --name your-site-name --account-slug your-team

# Deploy
netlify deploy --prod --dir=dist
```

## Environment Variables

Create a `.env` file (see `.env.example`):

```
PUBLIC_GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID/pub?output=csv
```

For Netlify deployment, add this variable in:
Site settings → Environment variables

## Custom Domain

To use a custom domain (e.g., nelsonsfilm.nl):
1. Go to Netlify dashboard → Domain settings
2. Add custom domain
3. Update DNS records at your domain registrar

## Troubleshooting

### Movies not showing
- Check that dates in Google Sheet are in the future
- Verify the Google Sheet is published and accessible
- Check browser console for fetch errors

### Language switching broken
- Ensure route translations exist in both `src/i18n/utils.ts` and `src/components/LanguagePicker.astro`

### Build fails on Netlify
- Check build logs in Netlify dashboard
- Ensure all environment variables are set
- Verify Node.js version matches local (check `package.json` engines)

## Contact

- **Email:** Nelsons.film.Haarlem@gmail.com
- **Instagram:** [@nelsonsfilm](https://instagram.com/nelsonsfilm)
- **Location:** Nelson Mandela Park, Haarlem Noord

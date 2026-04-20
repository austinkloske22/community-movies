import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://nelsonsfilm.nl',
  i18n: {
    defaultLocale: 'nl',
    locales: ['nl', 'en', 'ara'],
    routing: {
      prefixDefaultLocale: false
    }
  },
  // The onboarding form only ships in NL + EN. Any locale-prefixed variant
  // of /samenwerking redirects to the single canonical path and carries the
  // language intent via ?lang=. The form reads it on load and strips it.
  redirects: {
    '/en/samenwerking': '/samenwerking/?lang=en',
    '/ara/samenwerking': '/samenwerking/?lang=nl',
  }
});

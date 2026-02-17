import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://austinkloske22.github.io',
  base: '/community-movies',
  i18n: {
    defaultLocale: 'nl',
    locales: ['nl', 'en'],
    routing: {
      prefixDefaultLocale: false
    }
  }
});

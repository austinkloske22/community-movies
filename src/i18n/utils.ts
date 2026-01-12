import { ui, defaultLang } from './ui';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}

export function getRouteFromUrl(url: URL): string {
  const pathname = url.pathname;
  const parts = pathname.split('/').filter(Boolean);

  if (parts[0] in ui) {
    return '/' + parts.slice(1).join('/');
  }
  return pathname;
}

// Route translations between languages
const routeTranslations: Record<string, Record<string, string>> = {
  nl: {
    '/schedule': '/programma',
    '/about': '/over-ons',
    '/contact': '/contact',
  },
  en: {
    '/programma': '/schedule',
    '/over-ons': '/about',
    '/contact': '/contact',
  },
};

export function getLocalizedPath(path: string, lang: keyof typeof ui): string {
  // Translate route if needed
  const translatedPath = routeTranslations[lang]?.[path] || path;

  if (lang === defaultLang) {
    return translatedPath;
  }
  return `/${lang}${translatedPath}`;
}

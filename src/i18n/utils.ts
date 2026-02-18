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

  // If first part is a language code, return the rest of the path
  if (parts[0] in ui) {
    const route = '/' + parts.slice(1).join('/');
    return route === '/' ? '' : route;
  }
  // Otherwise return the pathname (for default language)
  return pathname === '/' ? '' : pathname;
}

// Simple localized path - same paths for all languages, just add prefix
export function getLocalizedPath(path: string, lang: keyof typeof ui): string {
  if (lang === defaultLang) {
    return path || '/';
  }
  return `/${lang}${path}`;
}

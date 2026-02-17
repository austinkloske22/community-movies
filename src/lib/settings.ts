// Site settings from local JSON file
// Update src/data/settings.json and redeploy to change settings

import settings from '../data/settings.json';

export interface SiteSettings {
  tikkie_url: string;
  tikkie_recipient: string;
}

export function getSettings(): SiteSettings {
  return settings as SiteSettings;
}

export function getSetting(key: keyof SiteSettings): string {
  return settings[key] || '';
}

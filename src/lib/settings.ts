// Client-side settings fetcher for dynamic content like Tikkie links
// This allows updating settings in Google Sheets without redeploying

export interface SiteSettings {
  tikkie_url: string;
  tikkie_recipient: string;
  [key: string]: string;
}

const SETTINGS_URL = import.meta.env.PUBLIC_GOOGLE_SHEET_SETTINGS;

// Cache settings to avoid repeated fetches
let cachedSettings: SiteSettings | null = null;

export async function fetchSettings(): Promise<SiteSettings> {
  if (cachedSettings) {
    return cachedSettings;
  }

  if (!SETTINGS_URL) {
    console.warn('PUBLIC_GOOGLE_SHEET_SETTINGS not configured');
    return {
      tikkie_url: '',
      tikkie_recipient: '',
    };
  }

  try {
    const response = await fetch(SETTINGS_URL);
    const csvText = await response.text();

    const settings: SiteSettings = {
      tikkie_url: '',
      tikkie_recipient: '',
    };

    // Parse CSV: Column A = key, Column B = value
    const lines = csvText.split('\n');
    for (const line of lines) {
      const [key, value] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
      if (key && value) {
        settings[key] = value;
      }
    }

    cachedSettings = settings;
    return settings;
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return {
      tikkie_url: '',
      tikkie_recipient: '',
    };
  }
}

// Get a specific setting
export async function getSetting(key: string): Promise<string> {
  const settings = await fetchSettings();
  return settings[key] || '';
}

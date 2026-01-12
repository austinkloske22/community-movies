// Weather integration using Open-Meteo (free, no API key required)
// Location: Nelson Mandela Park, Haarlem Noord
// Coordinates: approximately 52.40°N, 4.62°E

const LATITUDE = 52.40;
const LONGITUDE = 4.62;

export interface WeatherData {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbability: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
}

// Weather codes from Open-Meteo to description and icon
function getWeatherInfo(code: number): { description: string; icon: string } {
  const weatherMap: Record<number, { description: string; icon: string }> = {
    0: { description: 'Clear sky', icon: '☀️' },
    1: { description: 'Mainly clear', icon: '🌤️' },
    2: { description: 'Partly cloudy', icon: '⛅' },
    3: { description: 'Overcast', icon: '☁️' },
    45: { description: 'Foggy', icon: '🌫️' },
    48: { description: 'Depositing rime fog', icon: '🌫️' },
    51: { description: 'Light drizzle', icon: '🌦️' },
    53: { description: 'Moderate drizzle', icon: '🌦️' },
    55: { description: 'Dense drizzle', icon: '🌧️' },
    61: { description: 'Slight rain', icon: '🌦️' },
    63: { description: 'Moderate rain', icon: '🌧️' },
    65: { description: 'Heavy rain', icon: '🌧️' },
    71: { description: 'Slight snow', icon: '🌨️' },
    73: { description: 'Moderate snow', icon: '🌨️' },
    75: { description: 'Heavy snow', icon: '❄️' },
    77: { description: 'Snow grains', icon: '🌨️' },
    80: { description: 'Slight rain showers', icon: '🌦️' },
    81: { description: 'Moderate rain showers', icon: '🌧️' },
    82: { description: 'Violent rain showers', icon: '⛈️' },
    85: { description: 'Slight snow showers', icon: '🌨️' },
    86: { description: 'Heavy snow showers', icon: '❄️' },
    95: { description: 'Thunderstorm', icon: '⛈️' },
    96: { description: 'Thunderstorm with hail', icon: '⛈️' },
    99: { description: 'Thunderstorm with heavy hail', icon: '⛈️' },
  };

  return weatherMap[code] || { description: 'Unknown', icon: '❓' };
}

export async function getWeatherForDate(date: string): Promise<WeatherData | null> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', LATITUDE.toString());
    url.searchParams.set('longitude', LONGITUDE.toString());
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code');
    url.searchParams.set('timezone', 'Europe/Amsterdam');
    url.searchParams.set('start_date', date);
    url.searchParams.set('end_date', date);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.daily || data.daily.time.length === 0) {
      return null;
    }

    const weatherCode = data.daily.weather_code[0];
    const weatherInfo = getWeatherInfo(weatherCode);

    return {
      date: data.daily.time[0],
      temperatureMax: Math.round(data.daily.temperature_2m_max[0]),
      temperatureMin: Math.round(data.daily.temperature_2m_min[0]),
      precipitationProbability: data.daily.precipitation_probability_max[0],
      weatherCode,
      weatherDescription: weatherInfo.description,
      weatherIcon: weatherInfo.icon,
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

export async function getCurrentWeather(): Promise<WeatherData | null> {
  const today = new Date().toISOString().split('T')[0];
  return getWeatherForDate(today);
}

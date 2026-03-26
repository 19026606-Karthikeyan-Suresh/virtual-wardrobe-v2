interface OpenMeteoResponse {
  current_weather: {
    temperature: number
    weathercode: number
    windspeed: number
    winddirection: number
    time: string
  }
}

function weatherCodeToCondition(code: number): string {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly Cloudy'
  if (code === 45 || code === 48) return 'Foggy'
  if (code >= 51 && code <= 57) return 'Drizzle'
  if (code >= 61 && code <= 67) return 'Rainy'
  if (code >= 71 && code <= 77) return 'Snowy'
  if (code >= 80 && code <= 82) return 'Showers'
  if (code === 85 || code === 86) return 'Snow Showers'
  if (code === 95) return 'Thunderstorm'
  if (code === 96 || code === 99) return 'Thunderstorm with Hail'
  return 'Unknown'
}

export async function getCurrentWeather(
  lat: number,
  lng: number,
): Promise<{ temp_c: number; condition: string }> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
  const res = await fetch(url, { next: { revalidate: 1800 } }) // cache 30 min
  if (!res.ok) {
    throw new Error(`Open-Meteo request failed: ${res.status}`)
  }
  const data = (await res.json()) as OpenMeteoResponse
  return {
    temp_c: data.current_weather.temperature,
    condition: weatherCodeToCondition(data.current_weather.weathercode),
  }
}

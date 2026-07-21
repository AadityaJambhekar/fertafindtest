export type FarmWeather = {
  observedAt: string;
  temperatureC: number | null;
  humidityPercent: number | null;
  rainMm: number | null;
  windSpeedKph: number | null;
  soilTemperatureC: number | null;
  soilMoistureM3M3: number | null;
  next3DaysRainMm: number | null;
  next3DaysMaxTempC: number | null;
  next3DaysEt0Mm: number | null;
  source: "Open-Meteo";
};

type OpenMeteoResponse = {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    wind_speed_10m?: number;
    soil_temperature_0cm?: number;
    soil_moisture_0_to_1cm?: number;
  };
  daily?: {
    precipitation_sum?: number[];
    temperature_2m_max?: number[];
    et0_fao_evapotranspiration?: number[];
  };
};

const cache = new Map<string, { expiresAt: number; value: FarmWeather }>();

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function getFarmWeather(lat: number, lon: number): Promise<FarmWeather> {
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const endpoint = new URL("https://api.open-meteo.com/v1/forecast");
  endpoint.searchParams.set("latitude", String(lat));
  endpoint.searchParams.set("longitude", String(lon));
  endpoint.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,soil_temperature_0cm,soil_moisture_0_to_1cm",
  );
  endpoint.searchParams.set(
    "daily",
    "precipitation_sum,temperature_2m_max,et0_fao_evapotranspiration",
  );
  endpoint.searchParams.set("forecast_days", "3");
  endpoint.searchParams.set("timezone", "auto");

  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error("Weather lookup failed.");

  const data = (await response.json()) as OpenMeteoResponse;
  const weather: FarmWeather = {
    observedAt: data.current?.time ?? new Date().toISOString(),
    temperatureC: numberOrNull(data.current?.temperature_2m),
    humidityPercent: numberOrNull(data.current?.relative_humidity_2m),
    rainMm: numberOrNull(data.current?.precipitation),
    windSpeedKph: numberOrNull(data.current?.wind_speed_10m),
    soilTemperatureC: numberOrNull(data.current?.soil_temperature_0cm),
    soilMoistureM3M3: numberOrNull(data.current?.soil_moisture_0_to_1cm),
    next3DaysRainMm:
      data.daily?.precipitation_sum?.reduce((total, value) => total + (value ?? 0), 0) ?? null,
    next3DaysMaxTempC: data.daily?.temperature_2m_max?.length
      ? Math.max(...data.daily.temperature_2m_max.filter(Number.isFinite))
      : null,
    next3DaysEt0Mm:
      data.daily?.et0_fao_evapotranspiration?.reduce((total, value) => total + (value ?? 0), 0) ??
      null,
    source: "Open-Meteo",
  };
  cache.set(cacheKey, { expiresAt: Date.now() + 15 * 60_000, value: weather });
  return weather;
}

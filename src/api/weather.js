// Reads the API key from .env file.
// In Vite, every environment variable that should be exposed to the frontend
// must start with VITE_.
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

// OpenWeather endpoint for current weather by city name or coordinates.
const WEATHER_BASE = "https://api.openweathermap.org/data/2.5/weather";

// OpenWeather endpoint for city search and reverse geocoding.
const GEO_BASE = "https://api.openweathermap.org/geo/1.0";

// Checks that the API key exists before making requests.
// This prevents confusing errors later from OpenWeather.
const ensureApiKey = () => {
  if (!API_KEY) {
    throw new Error("Missing VITE_WEATHER_API_KEY");
  }
};

// Fetches current weather by city name.
// Example: getWeather("Haifa")
export const getWeather = async (city) => {
  ensureApiKey();

  // Protects against empty input like "", null, or spaces.
  if (!city || !city.trim()) {
    throw new Error("City is required");
  }

  // encodeURIComponent protects the URL when the city has spaces or special chars.
  const url = `${WEATHER_BASE}?q=${encodeURIComponent(
    city.trim(),
  )}&appid=${API_KEY}&units=metric`;

  const res = await fetch(url);
  const data = await res.json();

  // If OpenWeather returns an error, show its message when available.
  if (!res.ok) {
    throw new Error(data?.message || "Failed to fetch weather");
  }

  // Makes sure the response really includes temperature data.
  if (typeof data?.main?.temp !== "number") {
    throw new Error("Temperature data is missing");
  }

  // Return only the clean data the app needs.
  return {
    temp: data.main.temp,
    city: data.name,
    country: data.sys?.country || "",
    lat: data.coord?.lat,
    lon: data.coord?.lon,
  };
};

// Fetches current weather using latitude and longitude.
// Useful when the user clicks "Use my location".
export const getWeatherByCoords = async (lat, lon) => {
  ensureApiKey();

  const url = `${WEATHER_BASE}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Failed to fetch weather");
  }

  if (typeof data?.main?.temp !== "number") {
    throw new Error("Temperature data is missing");
  }

  return {
    temp: data.main.temp,
    city: data.name,
    country: data.sys?.country || "",
    lat: data.coord?.lat,
    lon: data.coord?.lon,
  };
};

// Returns city suggestions while the user types.
// Example: "Hai" -> Haifa, Haifa District, IL
export const getCitySuggestions = async (query) => {
  ensureApiKey();

  // Do not call the API for very short input.
  // This saves requests and avoids noisy suggestions.
  if (!query || query.trim().length < 2) {
    return [];
  }

  const url = `${GEO_BASE}/direct?q=${encodeURIComponent(
    query.trim(),
  )}&limit=6&appid=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Failed to fetch city suggestions");
  }

  // Convert OpenWeather's raw location objects into clean UI-friendly objects.
  return (Array.isArray(data) ? data : []).map((item) => ({
    name: item.name,
    state: item.state || "",
    country: item.country || "",
    lat: item.lat,
    lon: item.lon,

    // This is what show inside the dropdown.
    label: [item.name, item.state, item.country].filter(Boolean).join(", "),
  }));
};

// Converts coordinates back into a readable city label.
// Example: lat/lon -> "Haifa, Haifa District, IL"
export const reverseGeocode = async (lat, lon) => {
  ensureApiKey();

  const url = `${GEO_BASE}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Failed to reverse geocode");
  }

  const item = Array.isArray(data) ? data[0] : null;

  // If OpenWeather found nothing, return empty text instead of crashing.
  if (!item) return "";

  return [item.name, item.state, item.country].filter(Boolean).join(", ");
};

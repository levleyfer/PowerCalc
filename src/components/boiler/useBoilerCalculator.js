import { useEffect, useMemo, useState } from "react";
import {
  getCitySuggestions,
  getWeather,
  getWeatherByCoords,
  reverseGeocode,
} from "../../api/weather";
import { formatCurrency, round2 } from "../../utils/format";
import { saveCalculation } from "../../services/historyService";

export const defaultBoilerState = {
  boilerType: "electric",
  capacity: 100,
  targetTemp: 60,
  inletTemp: 15,
  dailyUsage: 150,
  hoursPerDay: 1,
  insulation: "medium",
};

// Keeps a value inside a safe numeric range
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// Estimates water inlet temperature from outdoor weather
export const estimateInletTempFromOutdoor = (outdoorTemp) =>
  clamp(Math.round(outdoorTemp * 0.55 + 6), 8, 28);

// Friendly label for boiler type
export function getBoilerLabel(type) {
  if (type === "solar") return "Solar";
  if (type === "heat-pump") return "Heat Pump";
  return "Electric";
}

// Pure boiler calculation function.
// Can be reused by dashboard and boiler page.
export function calculateBoilerResult(boilerState, electricityPrice = 0.55) {
  const safeState = { ...defaultBoilerState, ...(boilerState || {}) };

  const safePrice = Number.isFinite(Number(electricityPrice))
    ? Number(electricityPrice)
    : 0.55;

  // Temperature difference the water needs to be heated
  const delta = Math.max(
    0,
    Number(safeState.targetTemp) - Number(safeState.inletTemp),
  );

  // Better insulation = lower losses
  const insulationFactor =
    safeState.insulation === "high"
      ? 0.92
      : safeState.insulation === "low"
        ? 1.14
        : 1;

  // Boiler technology efficiency factor
  const boilerFactor =
    safeState.boilerType === "solar"
      ? 0.58
      : safeState.boilerType === "heat-pump"
        ? 0.42
        : 1;

  // Water heating formula converted to kWh
  const baseEnergy =
    ((Number(safeState.dailyUsage) * 4.186 * delta) / 3600) *
    insulationFactor *
    boilerFactor;

  // מכפיל לפי שעות שימוש בפועל
  const dailyEnergy = baseEnergy * (safeState.hoursPerDay || 1);

  const dailyCost = dailyEnergy * safePrice;
  const monthlyCost = dailyCost * 30;
  const yearlyCost = dailyCost * 365;

  return {
    delta,
    dailyEnergy,
    dailyCost,
    monthlyCost,
    yearlyCost,
  };
}

// Main boiler calculator hook.
// Handles state, weather tools, results,
// smart tips, saving, and PDF report data.
export function useBoilerCalculator({
  loadRequest,
  onResultChange,
  user,
  language,
  electricityPrice,
  setElectricityPrice,
  boilerState,
  setBoilerState,
}) {
  // Shared App state preferred, local fallback if used alone
  const [localState, setLocalState] = useState(defaultBoilerState);

  const state = boilerState || localState;
  const setState = setBoilerState || setLocalState;

  // Save button state
  const [saveState, setSaveState] = useState("idle");

  // Weather / city search state
  const [cityQuery, setCityQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [isCityFocused, setIsCityFocused] = useState(false);

  // Local electricity price fallback
  const [localElectricityPrice, setLocalElectricityPrice] = useState(0.55);

  const price = Number.isFinite(
    Number(electricityPrice ?? localElectricityPrice),
  )
    ? Number(electricityPrice ?? localElectricityPrice)
    : 0.55;

  const updatePrice = setElectricityPrice || setLocalElectricityPrice;

  // Load saved history item into current form
  useEffect(() => {
    if (!loadRequest?.item) return;

    const inputs = loadRequest.item.inputs || {};

    // Support old project versions
    if (inputs.config || inputs.temps) {
      setState({
        boilerType: "electric",
        capacity: Number(inputs.config?.tank) || 100,
        targetTemp: Number(inputs.temps?.target) || 60,
        inletTemp: Number(inputs.temps?.inlet) || 15,
        dailyUsage: Number(inputs.outputs?.targetLiters) || 150,
        insulation: "medium",
      });

      return;
    }

    if (Number.isFinite(Number(inputs.electricityPrice ?? inputs.price))) {
      updatePrice(Number(inputs.electricityPrice ?? inputs.price));
    }

    const {
      price: _oldPrice,
      electricityPrice: _oldElectricityPrice,
      ...restInputs
    } = inputs;

    setState((prev) => ({
      ...prev,
      ...restInputs,
    }));
  }, [loadRequest?.ts, loadRequest?.item]);

  // Debounced city autocomplete
  useEffect(() => {
    const trimmed = cityQuery.trim();

    if (trimmed.length < 2) {
      setSuggestions([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const results = await getCitySuggestions(trimmed);
        setSuggestions(results);
      } catch (err) {
        console.error(err);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [cityQuery]);

  // Apply weather temperature into inlet water temp
  const applyWeatherResult = (weatherData) => {
    const estimatedInletTemp = estimateInletTempFromOutdoor(weatherData.temp);

    setState((prev) => ({
      ...prev,
      inletTemp: estimatedInletTemp,
    }));

    const label = [weatherData.city, weatherData.country]
      .filter(Boolean)
      .join(", ");

    if (label) setCityQuery(label);
  };

  // Pick city suggestion
  const handleSuggestionPick = (place) => {
    setSelectedPlace(place);
    setCityQuery(place.label);
    setSuggestions([]);
    setIsCityFocused(false);
  };

  // Fetch weather by city
  const handleGetWeather = async () => {
    if (!cityQuery.trim()) return;

    try {
      setLoadingWeather(true);

      const weatherData =
        selectedPlace?.lat && selectedPlace?.lon
          ? await getWeatherByCoords(selectedPlace.lat, selectedPlace.lon)
          : await getWeather(cityQuery.trim());

      applyWeatherResult(weatherData);
    } catch (err) {
      alert(
        err?.message ||
          (language === "he"
            ? "נכשל בטעינת מזג האוויר"
            : "Failed to fetch weather"),
      );
    } finally {
      setLoadingWeather(false);
    }
  };

  // Use browser geolocation
  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      alert(
        language === "he"
          ? "הדפדפן לא תומך במיקום"
          : "Geolocation is not supported",
      );
      return;
    }

    try {
      setLoadingWeather(true);

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 300000,
        });
      });

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const weatherData = await getWeatherByCoords(lat, lon);
      applyWeatherResult(weatherData);

      try {
        const label = await reverseGeocode(lat, lon);
        if (label) setCityQuery(label);
      } catch {
        // Optional reverse geocode
      }

      setSelectedPlace({
        name: weatherData.city || "",
        state: "",
        country: weatherData.country || "",
        lat,
        lon,
        label: [weatherData.city, weatherData.country]
          .filter(Boolean)
          .join(", "),
      });
    } catch (err) {
      console.error(err);

      alert(
        language === "he"
          ? "לא הצלחנו לקבל מיקום נוכחי"
          : "Failed to get your location",
      );
    } finally {
      setLoadingWeather(false);
    }
  };

  // Main boiler result calculation
  const result = useMemo(
    () => calculateBoilerResult(state, price),
    [state, price],
  );

  // Report result back to dashboard / parent
  useEffect(() => {
    if (typeof onResultChange === "function") {
      onResultChange(result);
    }
  }, [result, onResultChange]);

  // Smart saving tips
  const tips = useMemo(() => {
    const lowerTempSavings = Math.max(
      0,
      (((state.targetTemp - 55) * state.dailyUsage * 4.186) / 3600) *
        price *
        0.35,
    );

    return [
      {
        title: language === "he" ? "הורדת טמפרטורה" : "Lower Temperature",
        body:
          language === "he"
            ? `הורדה ל-55°C במקום ${state.targetTemp}°C יכולה לחסוך בערך ${formatCurrency(
                lowerTempSavings,
                language,
              )} ביום.`
            : `Reducing to 55°C instead of ${state.targetTemp}°C could save ${formatCurrency(
                lowerTempSavings,
                language,
              )}/day.`,
        save: language === "he" ? "חיסכון 15%" : "Save 15%",
      },
      {
        title: language === "he" ? "בידוד הדוד" : "Insulate the Tank",
        body:
          language === "he"
            ? "שיפור בידוד הדוד מפחית איבוד חום בלילה ומקטין חימום חוזר."
            : "Adding or improving tank insulation reduces overnight heat loss and reheating cycles.",
        save: language === "he" ? "חיסכון 10%" : "Save 10%",
      },
      {
        title: language === "he" ? "תזמון חימום" : "Schedule Heating",
        body:
          language === "he"
            ? "חמם מים קרוב יותר לזמן המקלחת כדי לא לשמור מים חמים לאורך זמן."
            : "Heat water closer to shower time so the boiler does not stay hot too long.",
        save: language === "he" ? "חיסכון 8%" : "Save 8%",
      },
    ];
  }, [state, price, language]);

  // PDF report timestamp
  const generatedAt = new Date().toLocaleString();

  // PDF summary rows
  const summaryRows = [
    {
      label: language === "he" ? "עלות יומית" : "Daily Cost",
      value: formatCurrency(result.dailyCost, language),
    },
    {
      label: language === "he" ? "עלות חודשית" : "Monthly Cost",
      value: formatCurrency(result.monthlyCost, language),
    },
    {
      label: language === "he" ? "עלות שנתית" : "Yearly Cost",
      value: formatCurrency(result.yearlyCost, language),
    },
  ];

  // PDF detailed rows
  const detailRows = [
    {
      label: language === "he" ? "סוג דוד" : "Boiler Type",
      value: getBoilerLabel(state.boilerType),
    },
    {
      label: language === "he" ? "נפח" : "Capacity",
      value: `${state.capacity}L`,
    },
    {
      label: language === "he" ? "טמפרטורת יעד" : "Target Water Temperature",
      value: `${state.targetTemp}°C`,
    },
    {
      label:
        language === "he" ? "טמפרטורת מים נכנסים" : "Inlet Water Temperature",
      value: `${state.inletTemp}°C`,
    },
    {
      label:
        language === "he" ? "שימוש יומי במים חמים" : "Daily Hot Water Usage",
      value: `${state.dailyUsage}L`,
    },
    {
      label: language === "he" ? "איכות בידוד" : "Insulation Quality",
      value: state.insulation,
    },
    {
      label: language === "he" ? "מחיר חשמל" : "Electricity Price",
      value: `${Number(price).toFixed(2)} ₪/kWh`,
    },
    {
      label: language === "he" ? "אנרגיה יומית" : "Daily Energy",
      value: `${round2(result.dailyEnergy)} kWh`,
    },
  ];

  // Save boiler calculation to Firebase history
  const handleSave = async () => {
    if (!user?.uid) return;

    setSaveState("saving");

    try {
      await saveCalculation({
        userId: user.uid,
        type: "boiler",
        title: "boiler",
        summary: "boiler-summary",
        inputs: {
          ...state,
          electricityPrice: price,
          tankLiters: state.capacity,
        },
        outputs: result,
      });

      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1800);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2200);
    }
  };

  // Public API returned to Boiler.jsx
  return {
    state,
    setState,
    price,
    updatePrice,
    result,
    tips,
    saveState,
    handleSave,
    generatedAt,
    summaryRows,
    detailRows,
    cityQuery,
    setCityQuery,
    suggestions,
    selectedPlace,
    setSelectedPlace,
    loadingSuggestions,
    loadingWeather,
    isCityFocused,
    setIsCityFocused,
    handleSuggestionPick,
    handleGetWeather,
    handleUseMyLocation,
  };
}

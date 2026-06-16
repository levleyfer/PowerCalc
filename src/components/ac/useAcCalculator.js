import { useEffect, useMemo, useState } from "react";
import {
  getCitySuggestions,
  getWeather,
  getWeatherByCoords,
  reverseGeocode,
} from "../../api/weather";
import { calculateACCost } from "../../utils/calc";
import { formatCurrency, round1 } from "../../utils/format";
import {
  createHomeRoom,
  defaultHomeRooms,
  patchHomeRoom,
} from "../../utils/homeRooms";
import { saveCalculation } from "../../services/historyService";

export const defaultAcSettings = {
  months: 3,
  outdoorTemp: 32,
};

const fallbackRooms = defaultHomeRooms;

// Main AC calculator hook.
// Handles rooms, AC settings, weather, calculation results,
// smart recommendations, saving, and PDF report data.
export function useAcCalculator({
  season,
  onSeasonChange,
  loadRequest,
  rooms,
  setRooms,
  acSettings,
  setAcSettings,
  selectedRoomId,
  setSelectedRoomId,
  electricityPrice,
  setElectricityPrice,
  user,
  language,
}) {
  // Local fallback state, used only if this hook is not connected to App.jsx state.
  const [localRooms, setLocalRooms] = useState(fallbackRooms);
  const [localAcSettings, setLocalAcSettings] = useState(defaultAcSettings);
  const [localSelectedRoomId, setLocalSelectedRoomId] = useState(
    fallbackRooms[0].id,
  );

  // Weather search state.
  const [cityQuery, setCityQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [isCityFocused, setIsCityFocused] = useState(false);

  // Save button state: idle / saving / saved / error.
  const [saveState, setSaveState] = useState("idle");

  // Use shared App.jsx state if it exists, otherwise use local fallback state.
  const homeRooms = rooms || localRooms;
  const updateRooms = setRooms || setLocalRooms;

  const sharedAc = acSettings || localAcSettings;
  const updateSharedAc = setAcSettings || setLocalAcSettings;

  const currentRoomId = selectedRoomId || localSelectedRoomId;
  const updateCurrentRoomId = setSelectedRoomId || setLocalSelectedRoomId;

  // Keep electricity price safe, with fallback to default Israeli-style value.
  const price = Number.isFinite(Number(electricityPrice))
    ? Number(electricityPrice)
    : 0.55;

  const updatePrice = setElectricityPrice || (() => {});

  // Currently selected room.
  const selectedRoom =
    homeRooms.find((room) => room.id === currentRoomId) || homeRooms[0];

  const roomAc = selectedRoom?.ac || fallbackRooms[0].ac;

  // Final data object used by the AC calculation.
  // Memoized so that result/recommendations useMemos actually cache between renders.
  // Without this, the plain object literal was always a new reference, making
  // both downstream memos recompute on every render regardless of actual changes.
  // roomAc and sharedAc come from React state, so they are stable references
  // between renders — this memoization is correct and effective.
  const data = useMemo(
    () => ({ ...roomAc, ...sharedAc, price }),
    [roomAc, sharedAc, price],
  );

  // Updates only the AC settings of the selected room.
  const patchSelectedRoomAc = (patch) => {
    if (!selectedRoom) return;

    updateRooms((prev) =>
      patchHomeRoom(prev, selectedRoom.id, {
        ac: patch,
      }),
    );
  };

  // Updates shared AC settings, like season length and outdoor temperature.
  const patchSharedAc = (patch) => {
    updateSharedAc((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  // Adds a new room and selects it immediately.
  const addRoom = () => {
    const nextId = (homeRooms.at(-1)?.id ?? 0) + 1;
    const nextRoom = createHomeRoom(nextId);

    updateRooms((prev) => [...prev, nextRoom]);
    updateCurrentRoomId(nextId);
  };

  // Removes the selected room, but keeps at least one room.
  const removeSelectedRoom = () => {
    if (homeRooms.length <= 1 || !selectedRoom) return;

    const remaining = homeRooms.filter((room) => room.id !== selectedRoom.id);

    updateRooms(remaining);
    updateCurrentRoomId(remaining[0].id);
  };

  // Automatically updates default AC values when season changes.
  useEffect(() => {
    patchSharedAc({
      outdoorTemp: season === "winter" ? 10 : 32,
      months: season === "winter" ? 5 : 3,
    });

    if (selectedRoom) {
      patchSelectedRoomAc({
        setpointTemp: season === "winter" ? 24 : 22,
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season]);

  // Loads a saved AC history item back into the current form.
  useEffect(() => {
    if (!loadRequest?.item) return;

    const inputs = loadRequest.item?.inputs || {};
    const nextSeason = inputs.season || season;

    onSeasonChange(nextSeason);

    patchSharedAc({
      months: Number(inputs.months) || (nextSeason === "winter" ? 5 : 3),
      outdoorTemp:
        Number(inputs.outdoorTemp) || (nextSeason === "winter" ? 10 : 32),
    });

    if (Number.isFinite(Number(inputs.electricityPrice ?? inputs.price))) {
      updatePrice(Number(inputs.electricityPrice ?? inputs.price));
    }

    patchSelectedRoomAc({
      enabled: true,
      roomSize: Number(inputs.roomSize) || roomAc.roomSize,
      hoursPerDay: Number(inputs.hoursPerDay) || roomAc.hoursPerDay,
      setpointTemp: Number(inputs.setpointTemp) || roomAc.setpointTemp,
      insulation: inputs.insulation || roomAc.insulation,
      type: inputs.type || roomAc.type,
      age: Number(inputs.age) || roomAc.age,
      topFloor: Boolean(inputs.topFloor),
      sunExposure: Boolean(inputs.sunExposure),
      powerKW: inputs.powerKW || "",
      hp: inputs.hp || "",
      cop: inputs.cop || "",
      eer: inputs.eer || "",
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadRequest?.ts]);

  // Debounced city autocomplete search.
  // Prevents API calls on every key press.
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

  // Main AC cost calculation.
  const result = useMemo(
    () => calculateACCost({ ...data, season }),
    [data, season],
  );

  // Smart recommendations based on the current calculation inputs.
  const recommendations = useMemo(() => {
    const monthlySavings = Math.max(0, result.monthlyCost * 0.12);

    return [
      {
        title:
          language === "he" ? "להעלות מעט את הטמפרטורה" : "Raise the setpoint",
        body:
          language === "he"
            ? `מעבר מ-${data.setpointTemp}°C ל-${Math.min(
                data.setpointTemp + 2,
                26,
              )}°C יכול לחסוך בערך ${formatCurrency(monthlySavings, language)} בחודש.`
            : `Moving from ${data.setpointTemp}°C to ${Math.min(
                data.setpointTemp + 2,
                26,
              )}°C can save around ${formatCurrency(monthlySavings, language)}/month.`,
        save: language === "he" ? "חיסכון עד 12%" : "Save up to 12%",
      },
      {
        title:
          data.insulation === "poor"
            ? language === "he"
              ? "לשפר בידוד"
              : "Improve insulation"
            : language === "he"
              ? "לשמור על זרימת אוויר טובה"
              : "Keep airflow clear",
        body:
          data.insulation === "poor"
            ? language === "he"
              ? "בידוד חלש גורם למזגן לעבוד יותר זמן ובעומס גבוה יותר."
              : "Poor insulation makes the AC work harder for longer periods."
            : language === "he"
              ? "ניקוי פילטרים וזרימת אוויר טובה משפרים יעילות."
              : "Clean filters and keeping airflow clear improves efficiency.",
        save:
          data.insulation === "poor"
            ? language === "he"
              ? "השפעה גבוהה"
              : "High impact"
            : language === "he"
              ? "שיפור מהיר"
              : "Quick win",
      },
      {
        title:
          data.type === "inverter"
            ? language === "he"
              ? "להשתמש בטיימר חכם"
              : "Use eco scheduling"
            : language === "he"
              ? "לשקול אינוורטר"
              : "Consider inverter mode",
        body:
          data.type === "inverter"
            ? language === "he"
              ? "הפעלת טיימר חכם בלילה יכולה להקטין צריכה."
              : "Use the timer to avoid running the AC at full power overnight."
            : language === "he"
              ? "מזגן אינוורטר שומר טמפרטורה ביעילות טובה יותר."
              : "Inverter systems maintain temperature more efficiently than regular AC units.",
        save:
          data.type === "inverter"
            ? language === "he"
              ? "חיסכון 8%"
              : "Save 8%"
            : language === "he"
              ? "חיסכון 18%"
              : "Save 18%",
      },
    ];
  }, [data, result, language]);

  // Applies weather result to the shared outdoor temperature field.
  const applyWeatherResult = (weatherData) => {
    patchSharedAc({
      outdoorTemp: Math.round(weatherData.temp),
    });

    const label = [weatherData.city, weatherData.country]
      .filter(Boolean)
      .join(", ");

    if (label) {
      setCityQuery(label);
    }
  };

  // Selects a city from the autocomplete suggestions.
  const handleSuggestionPick = (place) => {
    setSelectedPlace(place);
    setCityQuery(place.label);
    setSuggestions([]);
    setIsCityFocused(false);
  };

  // Fetches weather by selected city or typed city name.
  const handleGetWeather = async () => {
    if (!cityQuery.trim()) return;

    try {
      setLoadingWeather(true);

      if (selectedPlace?.lat && selectedPlace?.lon) {
        const weatherData = await getWeatherByCoords(
          selectedPlace.lat,
          selectedPlace.lon,
        );

        applyWeatherResult(weatherData);
      } else {
        const weatherData = await getWeather(cityQuery.trim());
        applyWeatherResult(weatherData);
      }
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

  // Uses browser geolocation to fetch weather near the user.
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
        if (label) {
          setCityQuery(label);
        }
      } catch {
        // Reverse geocode is optional.
        // If it fails, the temperature still works.
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

  // Timestamp used in the PDF report.
  const generatedAt = new Date().toLocaleString();

  // Main PDF summary rows.
  const summaryRows = [
    { label: "Room", value: selectedRoom?.name || "Room" },
    { label: "Daily Cost", value: formatCurrency(result.dailyCost, language) },
    {
      label: "Monthly Cost",
      value: formatCurrency(result.monthlyCost, language),
    },
    {
      label: "Seasonal Cost",
      value: formatCurrency(result.seasonalCost, language),
    },
  ];

  // Detailed PDF input rows.
  const detailRows = [
    { label: "Room Size", value: `${data.roomSize} m²` },
    { label: "Hours per Day", value: `${round1(data.hoursPerDay)} hours` },
    { label: "Target Temperature", value: `${data.setpointTemp}°C` },
    {
      label: "Electricity Price",
      value: `${Number(data.price).toFixed(2)} ₪/kWh`,
    },
    { label: "Outdoor Temperature", value: `${data.outdoorTemp}°C` },
    { label: "AC Type", value: data.type },
    { label: "Insulation Quality", value: data.insulation },
    { label: "AC Age", value: `${data.age} years` },
  ];

  // Saves the current AC calculation to Firebase history.
  const handleSave = async () => {
    if (!user?.uid) return;

    setSaveState("saving");

    const roomName = selectedRoom?.name || "Room";
    const seasonLabel = season === "winter" ? "Winter" : "Summer";

    try {
      await saveCalculation({
        userId: user.uid,
        type: "ac",
        title: `AC · ${roomName} · ${seasonLabel}`,
        summary: `Daily: ${result.dailyCost.toFixed(2)} ₪ · Monthly: ${result.monthlyCost.toFixed(0)} ₪`,
        inputs: {
          ...roomAc,
          ...sharedAc,
          electricityPrice: price,
          season,
          roomId: selectedRoom?.id,
          roomName,
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

  // Public API returned to Calculator.jsx.
  return {
    homeRooms,
    updateRooms,
    currentRoomId,
    updateCurrentRoomId,
    selectedRoom,
    roomAc,
    data,
    patchSelectedRoomAc,
    patchSharedAc,
    price,
    updatePrice,
    addRoom,
    removeSelectedRoom,
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
    result,
    recommendations,
    saveState,
    handleSave,
    generatedAt,
    summaryRows,
    detailRows,
  };
}

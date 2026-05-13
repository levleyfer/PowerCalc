import { Stepper } from "../shared/Fields";
import { clamp } from "./useBoilerCalculator";

export function BoilerForm({
  state,
  setState,
  language,
  price,
  updatePrice,
  boiler,
}) {
  const isHebrew = language === "he";

  const {
    cityQuery,
    setCityQuery,
    suggestions,
    setSelectedPlace,
    loadingSuggestions,
    loadingWeather,
    isCityFocused,
    setIsCityFocused,
    handleSuggestionPick,
    handleGetWeather,
    handleUseMyLocation,
  } = boiler || {};

  return (
    <section className="panelCard featureCard">
      <div className="featureHeader">
        <div className="featureTitleWrap"></div>
      </div>

      <div className="featureBody">
        <label className="stackField">
          <span className="stackLabel">
            {isHebrew ? "סוג דוד" : "Boiler Type"}
          </span>

          <select
            className="stackInput"
            value={state.boilerType}
            onChange={(e) =>
              setState((p) => ({ ...p, boilerType: e.target.value }))
            }
          >
            <option value="electric">
              {isHebrew ? "דוד חשמל" : "Electric Boiler"}
            </option>
            <option value="solar">
              {isHebrew ? "דוד שמש" : "Solar Boiler"}
            </option>
            <option value="heat-pump">
              {isHebrew ? "משאבת חום" : "Heat Pump"}
            </option>
          </select>
        </label>

        <Stepper
          icon="/icons/quantity.png"
          name={isHebrew ? "נפח דוד" : "Boiler Capacity"}
          value={state.capacity}
          unit="L"
          step={10}
          min={30}
          max={300}
          onChange={(v) => setState((p) => ({ ...p, capacity: v }))}
        />

        <Stepper
          icon="/icons/temperature.png"
          name={isHebrew ? "טמפרטורת יעד" : "Target Water Temperature"}
          value={state.targetTemp}
          unit="°C"
          step={1}
          min={40}
          max={75}
          onChange={(v) => setState((p) => ({ ...p, targetTemp: v }))}
        />

        <Stepper
          icon="/icons/temperature-low.png"
          name={isHebrew ? "טמפרטורת מים נכנסים" : "Inlet Water Temperature"}
          value={state.inletTemp}
          unit="°C"
          step={1}
          min={5}
          max={25}
          onChange={(v) => setState((p) => ({ ...p, inletTemp: v }))}
        />

        <div className="weatherBox">
          <div>
            <div className="stackLabel">
              {isHebrew ? "טמפרטורת מים משוערת" : "Estimated Inlet Temp"}
            </div>
          </div>

          <div className="weatherControls" style={{ position: "relative" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                className="stackInput"
                value={cityQuery || ""}
                placeholder={isHebrew ? "חפש עיר..." : "Search city..."}
                onChange={(e) => {
                  setCityQuery?.(e.target.value);
                  setSelectedPlace?.(null);
                }}
                onFocus={() => setIsCityFocused?.(true)}
                onBlur={() => setTimeout(() => setIsCityFocused?.(false), 150)}
              />

              {loadingSuggestions && cityQuery?.trim().length >= 2 && (
                <div className="fieldNote" style={{ marginTop: 8 }}>
                  {isHebrew ? "מחפש ערים..." : "Searching cities..."}
                </div>
              )}

              {isCityFocused && suggestions?.length > 0 && (
                <div className="suggestionsMenu">
                  {suggestions.map((place) => (
                    <button
                      key={`${place.lat}-${place.lon}-${place.label}`}
                      type="button"
                      onClick={() => handleSuggestionPick?.(place)}
                    >
                      {place.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              className="ghostButton"
              type="button"
              onClick={handleUseMyLocation}
              disabled={loadingWeather || !handleUseMyLocation}
            >
              {loadingWeather
                ? isHebrew
                  ? "טוען..."
                  : "Loading..."
                : isHebrew
                  ? "המיקום שלי"
                  : "Use my location"}
            </button>

            <button
              className="ghostButton"
              type="button"
              onClick={handleGetWeather}
              disabled={loadingWeather || !handleGetWeather}
            >
              {loadingWeather
                ? isHebrew
                  ? "טוען..."
                  : "Loading..."
                : isHebrew
                  ? "השתמש במזג אוויר"
                  : "Use current weather"}
            </button>
          </div>
        </div>

        <Stepper
          icon="/icons/daily.png"
          name={isHebrew ? "שימוש יומי במים חמים" : "Daily Hot Water Usage"}
          value={state.dailyUsage}
          unit="L"
          step={10}
          min={20}
          max={400}
          onChange={(v) => setState((p) => ({ ...p, dailyUsage: v }))}
        />

        <Stepper
          icon="/icons/clock.png"
          name={isHebrew ? "שעות דוד ביום" : "Boiler Hours Per Day"}
          value={state.hoursPerDay || 1}
          unit="h"
          step={0.5}
          min={0.5}
          max={8}
          onChange={(v) => setState((p) => ({ ...p, hoursPerDay: v }))}
        />

        <label className="stackField">
          <span className="stackLabel">
            {isHebrew ? "איכות בידוד" : "Insulation Quality"}
          </span>

          <select
            className="stackInput"
            value={state.insulation}
            onChange={(e) =>
              setState((p) => ({ ...p, insulation: e.target.value }))
            }
          >
            <option value="high">{isHebrew ? "גבוהה" : "High"}</option>
            <option value="medium">{isHebrew ? "בינונית" : "Medium"}</option>
            <option value="low">{isHebrew ? "נמוכה" : "Low"}</option>
          </select>
        </label>

        <label className="stackField">
          <span className="stackLabel">
            {isHebrew ? "מחיר חשמל (₪ / קוט״ש)" : "Electricity Price (₪/kWh)"}
          </span>

          <input
            className="stackInput"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) =>
              updatePrice(clamp(Number(e.target.value) || 0, 0, 5))
            }
          />
        </label>
      </div>
    </section>
  );
}

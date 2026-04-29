import {
  Accordion,
  AdvancedStepper,
  ChoiceStepper,
  InputRow,
  Stepper,
  TextStepper,
} from "../shared/Fields";
import { patchHomeRoom } from "../../utils/homeRooms";

// Main form for the AC calculator.
// Handles rooms, season selection, usage inputs, advanced settings,
// weather/location tools, and manual AC specifications.
export function AcForm({ ac, season, onSeasonChange, language, t }) {
  // Extract all AC-related state and update functions from the custom AC object.
  const {
    homeRooms,
    updateRooms,
    currentRoomId,
    updateCurrentRoomId,
    selectedRoom,
    roomAc,
    data,
    patchSelectedRoomAc,
    patchSharedAc,
    addRoom,
    removeSelectedRoom,
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
  } = ac;

  return (
    <section className="panelCard featureCard">
      {/* Season selector - changes calculation mode between summer and winter */}
      <div className="featureHeader between">
        <div className="featureTitleWrap"></div>

        <div className="chips seasonChips">
          <button
            className={`chip ${season === "summer" ? "active" : ""}`}
            type="button"
            onClick={() => onSeasonChange("summer")}
          >
            {t("seasonSummer")}
          </button>

          <button
            className={`chip ${season === "winter" ? "active" : ""}`}
            type="button"
            onClick={() => onSeasonChange("winter")}
          >
            {t("seasonWinter")}
          </button>
        </div>
      </div>

      {/* Room manager - rename, select, add, or remove rooms */}
      <div className="roomManagerBar">
        <InputRow
          label={language === "he" ? "שם חדר" : "Room Name"}
          value={selectedRoom?.name || ""}
          placeholder={language === "he" ? "סלון" : "Living Room"}
          onChange={(value) =>
            updateRooms((prev) =>
              patchHomeRoom(prev, selectedRoom?.id, {
                name: value,
              }),
            )
          }
        />

        <label className="stackField">
          <span className="stackLabel">
            {language === "he" ? "בחר חדר" : "Select Room"}
          </span>

          <select
            className="stackInput"
            value={currentRoomId}
            onChange={(e) => updateCurrentRoomId(Number(e.target.value))}
          >
            {homeRooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </label>

        <button className="ghostButton" type="button" onClick={addRoom}>
          {language === "he" ? "+ הוסף חדר" : "+ Add Room"}
        </button>

        <button
          className="ghostButton dangerGhost"
          type="button"
          onClick={removeSelectedRoom}
          disabled={homeRooms.length <= 1}
        >
          {language === "he" ? "מחק" : "Remove"}
        </button>
      </div>

      <div className="featureBody">
        {/* Enables or disables AC calculation for the selected room */}
        <div className="toggleRow">
          <label className="switchLine">
            <input
              type="checkbox"
              checked={Boolean(roomAc.enabled)}
              onChange={(e) =>
                patchSelectedRoomAc({
                  enabled: e.target.checked,
                })
              }
            />

            <span>
              {language === "he"
                ? "כלול מזגן בחדר הזה"
                : "Include AC for this room"}
            </span>
          </label>
        </div>

        {/* Basic room usage inputs used directly in the AC cost calculation */}
        <Stepper
          icon="/icons/area.png"
          name={language === "he" ? "גודל חדר" : "Room Size"}
          value={data.roomSize}
          unit="m²"
          step={1}
          min={10}
          max={100}
          onChange={(v) => patchSelectedRoomAc({ roomSize: v })}
        />

        <Stepper
          icon="/icons/clock.png"
          name={language === "he" ? "שעות ביום" : "Hours per Day"}
          value={data.hoursPerDay}
          unit="h"
          step={0.5}
          min={0}
          max={24}
          onChange={(v) => patchSelectedRoomAc({ hoursPerDay: v })}
        />

        <Stepper
          icon="/icons/temperature.png"
          name={language === "he" ? "טמפרטורת יעד" : "Target Temperature"}
          value={data.setpointTemp}
          unit="°C"
          step={1}
          min={16}
          max={30}
          onChange={(v) => patchSelectedRoomAc({ setpointTemp: v })}
        />

        {/* Advanced settings for more accurate AC cost estimation */}
        <Accordion
          title={language === "he" ? "הגדרות מתקדמות" : "Advanced Settings"}
        >
          <div className="advGrid">
            {/* Electricity price affects the final daily/monthly/seasonal cost */}
            <AdvancedStepper
              label={language === "he" ? "מחיר חשמל" : "Electricity Price"}
              value={data.price}
              unit="₪/kWh"
              step={0.01}
              min={0}
              max={5}
              onChange={(v) => ac.updatePrice(v)}
              format={(v) => Number(v).toFixed(2)}
            />

            {/* Season length is used for seasonal cost estimation */}
            <AdvancedStepper
              label={language === "he" ? "אורך עונה" : "Season Length"}
              value={data.months}
              unit="mo"
              step={1}
              min={1}
              max={12}
              onChange={(v) => patchSharedAc({ months: v })}
            />

            {/* Outdoor temperature affects how hard the AC needs to work */}
            <AdvancedStepper
              label={
                language === "he" ? "טמפרטורה חיצונית" : "Outdoor Temperature"
              }
              value={data.outdoorTemp}
              unit="°"
              step={1}
              min={-5}
              max={45}
              onChange={(v) => patchSharedAc({ outdoorTemp: v })}
            />

            {/* Room efficiency settings affect estimated power usage */}
            <ChoiceStepper
              label={language === "he" ? "בידוד" : "Insulation"}
              value={data.insulation}
              options={[
                { value: "good", label: "Good" },
                { value: "average", label: "Average" },
                { value: "poor", label: "Poor" },
              ]}
              onChange={(v) => patchSelectedRoomAc({ insulation: v })}
            />

            <ChoiceStepper
              label={language === "he" ? "קומה עליונה" : "Top Floor"}
              value={data.topFloor ? "yes" : "no"}
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
              ]}
              onChange={(v) =>
                patchSelectedRoomAc({
                  topFloor: v === "yes",
                })
              }
            />

            <ChoiceStepper
              label={language === "he" ? "שמש ישירה" : "Direct Sunlight"}
              value={data.sunExposure ? "yes" : "no"}
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
              ]}
              onChange={(v) =>
                patchSelectedRoomAc({
                  sunExposure: v === "yes",
                })
              }
            />

            {/* AC machine settings affect efficiency and estimated consumption */}
            <ChoiceStepper
              label={language === "he" ? "סוג מזגן" : "AC Type"}
              value={data.type}
              options={[
                { value: "unknown", label: "Unknown" },
                { value: "regular", label: "Regular" },
                { value: "inverter", label: "Inverter" },
              ]}
              onChange={(v) => patchSelectedRoomAc({ type: v })}
            />

            <AdvancedStepper
              label={language === "he" ? "גיל יחידה" : "Unit Age"}
              value={data.age}
              unit="yr"
              step={1}
              min={0}
              max={25}
              onChange={(v) => patchSelectedRoomAc({ age: v })}
            />

            {/* Weather/location tools can update outdoor temperature automatically */}
            <div className="weatherBox advSpan2">
              <div className="stackLabel">
                {language === "he" ? "עיר ומיקום" : "City and location"}
              </div>

              <div className="weatherControls" style={{ position: "relative" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    className="stackInput"
                    value={cityQuery}
                    placeholder={
                      language === "he" ? "חפש עיר..." : "Search city..."
                    }
                    onChange={(e) => {
                      setCityQuery(e.target.value);
                      setSelectedPlace(null);
                    }}
                    onFocus={() => setIsCityFocused(true)}
                    onBlur={() =>
                      setTimeout(() => setIsCityFocused(false), 150)
                    }
                  />

                  {loadingSuggestions && cityQuery.trim().length >= 2 && (
                    <div className="fieldNote" style={{ marginTop: 8 }}>
                      {language === "he"
                        ? "מחפש ערים..."
                        : "Searching cities..."}
                    </div>
                  )}

                  {isCityFocused && suggestions.length > 0 && (
                    <div className="suggestionsMenu">
                      {suggestions.map((place) => (
                        <button
                          key={`${place.lat}-${place.lon}-${place.label}`}
                          type="button"
                          onClick={() => handleSuggestionPick(place)}
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
                  disabled={loadingWeather}
                >
                  {loadingWeather
                    ? "Loading..."
                    : language === "he"
                      ? "המיקום שלי"
                      : "Use my location"}
                </button>

                <button
                  className="ghostButton"
                  type="button"
                  onClick={handleGetWeather}
                  disabled={loadingWeather}
                >
                  {loadingWeather
                    ? "Loading..."
                    : language === "he"
                      ? "מזג אוויר נוכחי"
                      : "Use current weather"}
                </button>
              </div>
            </div>

            {/* Manual AC specs - optional values for users who know their unit details */}
            <TextStepper
              label="kW (most accurate)"
              placeholder="1.1"
              value={data.powerKW}
              onChange={(v) => patchSelectedRoomAc({ powerKW: v })}
            />

            <TextStepper
              label="HP"
              placeholder="1 / 1.25"
              value={data.hp}
              onChange={(v) => patchSelectedRoomAc({ hp: v })}
            />

            <TextStepper
              label="COP"
              placeholder="3.2"
              value={data.cop}
              onChange={(v) => patchSelectedRoomAc({ cop: v })}
            />

            <TextStepper
              label="EER"
              placeholder="10.5"
              value={data.eer}
              onChange={(v) => patchSelectedRoomAc({ eer: v })}
            />
          </div>
        </Accordion>
      </div>
    </section>
  );
}
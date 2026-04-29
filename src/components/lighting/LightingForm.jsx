import { formatCurrency, round3 } from "../../utils/format";
import { InputRow, Meter, SelectRow } from "../shared/Fields";
import { bulbCatalog } from "./useLightingCalculator";

// Lighting calculator form.
// Handles room management, electricity price,
// lighting settings, and per-room live results.
export function LightingForm({ lighting, language }) {
  const isHebrew = language === "he";

  const {
    homeRooms,
    currentRoomId,
    updateCurrentRoomId,
    selectedRoom,
    roomLighting,
    selectedComputedRoom,
    patchSelectedRoomLighting,
    patchSelectedRoomName,
    price,
    updatePrice,
    addRoom,
    removeSelectedRoom,
  } = lighting;

  const room = selectedComputedRoom;

  // Safety check if no selected room exists
  if (!selectedRoom || !room) return null;

  return (
    <section className="panelCard featureCard">
      <div className="featureHeader between">
        <div className="featureTitleWrap"></div>
      </div>

      {/* Room manager */}
      <div className="roomManagerBar">
        <InputRow
          label={isHebrew ? "שם חדר" : "Room Name"}
          value={selectedRoom?.name || ""}
          placeholder={isHebrew ? "סלון" : "Living Room"}
          onChange={(value) => patchSelectedRoomName(value)}
        />

        <label className="stackField">
          <span className="stackLabel">
            {isHebrew ? "בחר חדר" : "Select Room"}
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
          {isHebrew ? "+ הוסף חדר" : "+ Add Room"}
        </button>

        <button
          className="ghostButton dangerGhost"
          type="button"
          onClick={removeSelectedRoom}
          disabled={homeRooms.length <= 1}
        >
          {isHebrew ? "מחק" : "Remove"}
        </button>
      </div>

      <div className="featureBody">
        {/* Shared electricity price */}
        <InputRow
          icon="/icons/price.png"
          label={
            isHebrew ? "מחיר חשמל (₪ / קוט״ש)" : "Electricity Price (₪/kWh)"
          }
          value={price}
          onChange={(value) => updatePrice(Number(value) || 0)}
          type="number"
          step="0.01"
        />

        {/* Enable / disable lighting in selected room */}
        <div className="toggleRow">
          <label className="switchLine">
            <input
              type="checkbox"
              checked={Boolean(roomLighting.enabled)}
              onChange={(e) =>
                patchSelectedRoomLighting({
                  enabled: e.target.checked,
                })
              }
            />

            <span>
              {isHebrew
                ? "כלול תאורה בחדר הזה"
                : "Include lighting for this room"}
            </span>
          </label>
        </div>

        {/* Selected room lighting settings */}
        <div className="lightingRoomsList">
          <article className="lightingRoomCard">
            <div className="lightingRoomGrid">
              {/* Bulb technology type */}
              <SelectRow
                icon="/icons/bulb-type.png"
                label={isHebrew ? "סוג נורה" : "Bulb Type"}
                value={roomLighting.bulbType}
                onChange={(value) =>
                  patchSelectedRoomLighting({
                    bulbType: value,
                  })
                }
                options={bulbCatalog.map((item) => ({
                  value: item.key,
                  label: item.label,
                }))}
              />

              {/* Equivalent old-style watt value */}
              <InputRow
                icon="/icons/voltage.png"
                label={
                  isHebrew ? "הספק נורה (שווה ערך)" : "Wattage (equivalent)"
                }
                value={roomLighting.wattEquivalent}
                onChange={(value) =>
                  patchSelectedRoomLighting({
                    wattEquivalent: Number(value) || 0,
                  })
                }
                type="number"
                min="25"
                max="150"
                step="5"
              />

              {/* Number of bulbs */}
              <InputRow
                icon="/icons/quantity.png"
                label={isHebrew ? "כמות נורות" : "Number of Bulbs"}
                value={roomLighting.bulbCount}
                onChange={(value) =>
                  patchSelectedRoomLighting({
                    bulbCount: Number(value) || 0,
                  })
                }
                type="number"
                min="1"
                max="50"
                step="1"
              />

              {/* Daily runtime */}
              <InputRow
                icon="/icons/clock.png"
                label={isHebrew ? "שעות ביום" : "Hours per Day"}
                value={roomLighting.hoursPerDay}
                onChange={(value) =>
                  patchSelectedRoomLighting({
                    hoursPerDay: Number(value) || 0,
                  })
                }
                type="number"
                min="0"
                max="24"
                step="0.5"
              />
            </div>

            {/* Real bulb power after efficiency conversion */}
            <div className="fieldNote" style={{ marginTop: 4 }}>
              {isHebrew
                ? `צריכה בפועל: ${round3(room.actualWatts)}W לנורה`
                : `Actual consumption: ${round3(room.actualWatts)}W per bulb`}
            </div>

            {/* Live cost summary for selected room */}
            <div className="lightingRoomMeters">
              <Meter
                name={isHebrew ? "יומי" : "Daily"}
                value={formatCurrency(room.dailyCost, language)}
              />

              <Meter
                name={isHebrew ? "חודשי" : "Monthly"}
                value={formatCurrency(room.monthlyCost, language)}
              />

              <Meter
                name={isHebrew ? "הספק" : "Power"}
                value={`${round3(room.totalPowerW / 1000)} kW`}
              />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

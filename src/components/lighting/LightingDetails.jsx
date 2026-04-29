import { round3 } from "../../utils/format";

// Lighting usage details panel.
// Shows room count, total bulbs, total power,
// and average daily runtime.
export function LightingDetails({ homeRooms, computed, language }) {
  const isHebrew = language === "he";

  return (
    <section className="panelCard detailPanel">
      <h2 className="sideHeading">
        {isHebrew ? "פרטי שימוש" : "Usage Details"}
      </h2>

      <div className="detailList">
        {/* Number of rooms included in lighting calculation */}
        <div className="detailRow">
          <span>{isHebrew ? "חדרים" : "Rooms"}</span>
          <b>{homeRooms.length}</b>
        </div>

        {/* Total bulbs across all rooms */}
        <div className="detailRow">
          <span>{isHebrew ? "סה״כ נורות" : "Total Bulbs"}</span>
          <b>{computed.bulbCount}</b>
        </div>

        {/* Total lighting power converted from W to kW */}
        <div className="detailRow">
          <span>{isHebrew ? "הספק כולל" : "Total Power"}</span>
          <b>{round3(computed.totalPowerW / 1000)} kW</b>
        </div>

        {/* Average lighting usage time per day */}
        <div className="detailRow">
          <span>{isHebrew ? "זמן ממוצע" : "Avg Runtime"}</span>
          <b>{round3(computed.hoursPerDay)}h</b>
        </div>
      </div>
    </section>
  );
}

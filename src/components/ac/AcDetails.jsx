import { round2 } from "../../utils/format";

// AC usage details component
// Responsible for:
// 1. Showing the selected room
// 2. Showing estimated AC power usage
// 3. Showing outdoor temperature used in the calculation

export function AcDetails({ data, result, selectedRoom, language }) {
  // Small helper to avoid repeating language === "he" many times
  const isHebrew = language === "he";

  return (
    <section className="panelCard detailPanel">
      <h2 className="sideHeading">
        {isHebrew ? "פרטי שימוש" : "Usage Details"}
      </h2>

      <div className="detailList">
        <div className="detailRow">
          <span>{isHebrew ? "חדר" : "Room"}</span>

          {/* Fallback text prevents the UI from showing an empty room value */}
          <b>{selectedRoom?.name || (isHebrew ? "חדר" : "Room")}</b>
        </div>

        <div className="detailRow">
          <span>{isHebrew ? "הספק משוער" : "Estimated Power"}</span>

          {/* Rounds long decimal values to keep the UI clean */}
          <b>{round2(result.estimatedKW)} kW</b>
        </div>

        <div className="detailRow">
          <span>{isHebrew ? "טמפרטורה חיצונית" : "Outdoor Temp"}</span>

          {/* Outdoor temperature is one of the inputs that affects AC usage */}
          <b>{data.outdoorTemp}°C</b>
        </div>
      </div>
    </section>
  );
}

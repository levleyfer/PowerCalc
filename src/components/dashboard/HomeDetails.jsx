import { round2, round3 } from "../../utils/format";

// Home details panel.
// Shows shared house-level data used by the dashboard calculations.
export function HomeDetails({
  summary,
  acSettings,
  electricityPrice,
  seasonLabel,
  priceUnit,
  powerUnit,
  language,
}) {
  // Safe fallback prevents broken UI if electricity price is missing or invalid
  const safeElectricityPrice = Number.isFinite(Number(electricityPrice))
    ? Number(electricityPrice)
    : 0.55;

  // Total estimated AC power from all AC rooms
  const totalAcPower = summary.acRooms.reduce(
    (sum, room) =>
      sum +
      (Number.isFinite(Number(room.estimatedKW))
        ? Number(room.estimatedKW)
        : 0),
    0,
  );

  // Total lighting power converted later from W to kW
  const totalLightingPower = summary.lightingRooms.reduce(
    (sum, room) =>
      sum +
      (Number.isFinite(Number(room.totalPowerW))
        ? Number(room.totalPowerW)
        : 0),
    0,
  );

  return (
    <section className="panelCard detailPanel">
      <h2 className="sideHeading">
        {language === "he" ? "פרטי הבית" : "Home Details"}
      </h2>

      <div className="detailList">
        <div className="detailRow">
          <span>{language === "he" ? "עונה" : "Season"}</span>
          <b>{seasonLabel}</b>
        </div>

        <div className="detailRow">
          <span>{language === "he" ? "טמפ׳ חוץ" : "Outdoor Temp"}</span>
          <b>
            <span className="numberToken">{acSettings.outdoorTemp}°C</span>
          </b>
        </div>

        <div className="detailRow">
          <span>{language === "he" ? "מחיר חשמל" : "Electricity Price"}</span>
          <b>
            <span className="numberToken">
              {safeElectricityPrice.toFixed(2)} {priceUnit}
            </span>
          </b>
        </div>

        <div className="detailRow">
          <span>{language === "he" ? "סה״כ הספק מזגן" : "Total AC Power"}</span>
          <b>
            <span className="numberToken">
              {round2(totalAcPower)} {powerUnit}
            </span>
          </b>
        </div>

        <div className="detailRow">
          <span>{language === "he" ? "הספק תאורה" : "Lighting Power"}</span>
          <b>
            <span className="numberToken">
              {round3(totalLightingPower / 1000)} {powerUnit}
            </span>
          </b>
        </div>
      </div>
    </section>
  );
}

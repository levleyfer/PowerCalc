import { formatCurrency } from "../../utils/format";

// Room overview table.
// Shows monthly AC, lighting, and total cost for each room.
export function RoomOverview({ summary, language, onOpenTab }) {
  return (
    <section className="panelCard roomOverviewCard">
      {/* Header with quick edit buttons */}
      <div className="featureHeader between">
        <div className="featureTitleWrap">
          <span className="featureGlyph purple">⌂</span>

          <h2 className="featureTitle">
            {language === "he" ? "סקירת חדרים" : "Room Overview"}
          </h2>
        </div>

        <div className="chips">
          <button
            className="chip"
            type="button"
            onClick={() => onOpenTab("ac")}
          >
            {language === "he" ? "ערוך מזגן" : "Edit AC"}
          </button>

          <button
            className="chip"
            type="button"
            onClick={() => onOpenTab("lighting")}
          >
            {language === "he" ? "ערוך תאורה" : "Edit Lighting"}
          </button>
        </div>
      </div>

      {/* Room cost table */}
      <div className="roomTable">
        <div className="roomTableHead">
          <span>{language === "he" ? "חדר" : "Room"}</span>
          <span>{language === "he" ? "מזגן / חודש" : "AC / month"}</span>
          <span>{language === "he" ? "תאורה / חודש" : "Lighting / month"}</span>
          <span>{language === "he" ? "סה״כ" : "Total"}</span>
        </div>

        {/* Render each room with its AC, lighting, and total monthly cost */}
        {summary.roomCosts.map((room) => (
          <div className="roomTableRow" key={room.id}>
            <strong>{room.name}</strong>

            <span className="numberToken">
              {formatCurrency(room.ac?.monthlyCost || 0, language)}
            </span>

            <span className="numberToken">
              {formatCurrency(room.lighting?.monthlyCost || 0, language)}
            </span>

            <b className="numberToken">
              {formatCurrency(room.monthlyCost, language)}
            </b>
          </div>
        ))}
      </div>
    </section>
  );
}

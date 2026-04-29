import { formatCurrency } from "../../utils/format";
import { Meter } from "../shared/Fields";

// AC result summary panel.
// Shows the main daily cost and smaller hourly/monthly/seasonal cost stats.
export function AcResultPanel({ result, data, selectedRoom, language }) {
  // Convert season length from months to estimated days
  const seasonDays = Number(data.months) * 30;

  return (
    <section className="resultPanel cool">
      {/* Selected room name, with fallback if no room is selected */}
      <div className="resultLabel">
        {selectedRoom?.name || (language === "he" ? "חדר" : "Room")}
      </div>

      {/* Main result: estimated daily cost */}
      <div className="resultValue">
        {formatCurrency(result.dailyCost, language)}
      </div>

      <div className="resultUnit">{language === "he" ? "ליום" : "day"}</div>

      {/* Secondary cost breakdown */}
      <div className="miniStats twoCols">
        <Meter
          name={language === "he" ? "לשעה" : "Hourly"}
          value={formatCurrency(result.hourlyCost, language)}
        />

        <Meter
          name={language === "he" ? "חודשי" : "Monthly"}
          value={formatCurrency(result.monthlyCost, language)}
        />

        <Meter
          name={
            language === "he"
              ? `עונתי (${seasonDays} ימים)`
              : `Seasonal (${seasonDays} days)`
          }
          value={formatCurrency(result.seasonalCost, language)}
        />
      </div>
    </section>
  );
}

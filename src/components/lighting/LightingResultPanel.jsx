import { formatCurrency } from "../../utils/format";
import { Meter } from "../shared/Fields";

// Lighting result summary panel.
// Shows the main daily cost and smaller hourly/monthly/yearly stats.
export function LightingResultPanel({ computed, language }) {
  const isHebrew = language === "he";

  return (
    <section className="resultPanel warm">
      {/* Main result: estimated daily lighting cost */}
      <div className="resultValue gold">
        {formatCurrency(computed.dailyCost, language)}
      </div>

      <div className="resultUnit">{isHebrew ? "ליום" : "day"}</div>

      {/* Secondary cost breakdown */}
      <div className="miniStats twoCols">
        <Meter
          name={isHebrew ? "לשעה" : "Hourly"}
          value={formatCurrency(computed.hourlyCost, language)}
        />

        <Meter
          name={isHebrew ? "חודשי" : "Monthly"}
          value={formatCurrency(computed.monthlyCost, language)}
        />

        <Meter
          name={isHebrew ? "שנתי" : "Yearly"}
          value={formatCurrency(computed.yearlyCost, language)}
        />
      </div>
    </section>
  );
}

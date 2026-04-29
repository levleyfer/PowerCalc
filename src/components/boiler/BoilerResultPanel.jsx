import { formatCurrency, round2 } from "../../utils/format";
import { Meter } from "../shared/Fields";

// Boiler result panel.
// Shows the main daily cost and smaller monthly/yearly/energy stats.
export function BoilerResultPanel({ result, language }) {
  const isHebrew = language === "he";

  return (
    <section className="resultPanel boilerWarm">
      {/* Main result: estimated daily boiler cost */}
      <div className="resultValue coral">
        {formatCurrency(result.dailyCost, language)}
      </div>

      <div className="resultUnit">{isHebrew ? "ליום" : "day"}</div>

      {/* Secondary result breakdown */}
      <div className="miniStats twoCols">
        <Meter
          name={isHebrew ? "חודשי" : "Monthly"}
          value={formatCurrency(result.monthlyCost, language)}
        />

        <Meter
          name={isHebrew ? "שנתי" : "Yearly"}
          value={formatCurrency(result.yearlyCost, language)}
        />

        <Meter
          name={isHebrew ? "אנרגיה יומית" : "Daily Energy"}
          value={`${round2(result.dailyEnergy)} kWh`}
        />
      </div>
    </section>
  );
}

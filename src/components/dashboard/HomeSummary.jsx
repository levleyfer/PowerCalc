import { formatCurrency } from "../../utils/format";
import { Meter } from "../shared/Fields.jsx";
import { BreakdownRow } from "./BreakdownRow";

// Home summary section.
// Shows the total estimated home cost and a breakdown by module.
export function HomeSummary({
  summary,
  rooms,
  enabledAcRooms,
  totalServices,
  language,
}) {
  return (
    <div className="homeSummaryGrid">
      {/* Main monthly total panel */}
      <section className="resultPanel homeTotalPanel">
        <div className="resultLabel">
          {language === "he" ? "סה״כ חודשי משוער" : "Estimated Monthly Total"}
        </div>

        <div className="resultValue">
          {formatCurrency(summary.totalMonthly, language)}
        </div>

        <div className="resultUnit">
          {language === "he"
            ? "כל מודולי האנרגיה בבית"
            : "all home energy modules"}
        </div>

        {/* Quick dashboard stats */}
        <div className="miniStats twoCols">
          <Meter
            name={language === "he" ? "יומי" : "Daily"}
            value={formatCurrency(summary.totalDaily, language)}
          />

          <Meter
            name={language === "he" ? "חדרים" : "Rooms"}
            value={`${rooms.length}`}
          />

          <Meter
            name={language === "he" ? "חדרי מזגן" : "Active AC Rooms"}
            value={`${enabledAcRooms}`}
          />

          <Meter
            name={language === "he" ? "מודולים פעילים" : "Active Modules"}
            value={`${totalServices}`}
          />
        </div>
      </section>

      {/* Cost breakdown by energy module */}
      <section className="panelCard dashboardBreakdown">
        <h2 className="sideHeading">
          {language === "he" ? "פירוט עלויות" : "Cost Breakdown"}
        </h2>

        <div className="breakdownList">
          <BreakdownRow
            label={language === "he" ? "מזגן" : "AC"}
            value={summary.acMonthly}
            total={summary.totalMonthly}
            language={language}
          />

          <BreakdownRow
            label={language === "he" ? "תאורה" : "Lighting"}
            value={summary.lightingMonthly}
            total={summary.totalMonthly}
            language={language}
          />

          <BreakdownRow
            label={language === "he" ? "דוד" : "Boiler"}
            value={summary.boilerMonthly}
            total={summary.totalMonthly}
            language={language}
          />
        </div>
      </section>
    </div>
  );
}

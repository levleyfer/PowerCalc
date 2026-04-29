import { formatCurrency } from "../../utils/format";
import { Meter } from "../shared/Fields.jsx";

// Home insights section.
// Compares current cost vs optimized estimate,
// and shows the main issue with the best suggested action.
export function HomeInsights({
  summary,
  optimizedEstimate,
  possibleSaving,
  mainIssue,
  bestAction,
  language,
  onOpenTab,
}) {
  return (
    <div className="homeInsightGrid">
      {/* Current vs optimized monthly cost comparison */}
      <section className="panelCard optimizedPanel">
        <div className="sideHeading">
          {language === "he" ? "מצב נוכחי מול משופר" : "Current vs Optimized"}
        </div>

        <div className="compareNumbers">
          <Meter
            name={language === "he" ? "נוכחי" : "Current"}
            value={formatCurrency(summary.totalMonthly, language)}
          />

          <Meter
            name={language === "he" ? "משופר" : "Optimized"}
            value={formatCurrency(optimizedEstimate, language)}
          />

          <Meter
            name={language === "he" ? "חיסכון אפשרי" : "Possible saving"}
            value={formatCurrency(possibleSaving, language)}
          />
        </div>
      </section>

      {/* Main issue and best action suggestion */}
      <section className="panelCard issuePanel">
        <div className="issueBlock">
          <span className="issueKicker">{mainIssue.title}</span>
          <strong>{mainIssue.body}</strong>
        </div>

        <div className="issueBlock bestActionBlock">
          <span className="issueKicker">{bestAction.title}</span>
          <p>{bestAction.body}</p>

          {/* Opens the relevant calculator tab, unless the action is already on dashboard */}
          {bestAction.tab !== "dashboard" && (
            <button
              className="chip active"
              type="button"
              onClick={() => onOpenTab(bestAction.tab)}
            >
              {language === "he" ? "פתח לטיפול" : "Open action"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

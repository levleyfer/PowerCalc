// Dashboard tips panel.
// Shows suggested actions and lets the user jump to the relevant calculator tab.
export function DashboardTips({ tips, language, onOpenTab }) {
  return (
    <section className="panelCard tipsCard">
      {/* Panel title */}
      <div className="sectionHeader green">
        <span className="sectionEmoji">✦</span>
        <h2>{language === "he" ? "טיפים מהדשבורד" : "Dashboard Tips"}</h2>
      </div>

      <div className="tipsList">
        {/* Render dashboard tips with an action button */}
        {tips.map((tip) => (
          <article key={tip.title} className="tipRow dashboardTipRow">
            <div>
              <div className="tipTitle">{tip.title}</div>
              <div className="tipBody">{tip.body}</div>
            </div>

            {/* Opens the calculator tab related to this tip */}
            <button
              className="tipSave tipButton"
              type="button"
              onClick={() => onOpenTab(tip.tab)}
            >
              {tip.action}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

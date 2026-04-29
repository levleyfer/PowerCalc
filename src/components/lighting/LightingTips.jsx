// Lighting tips panel.
// Shows energy saving tips based on the current lighting calculation.
export function LightingTips({ tips, language }) {
  const isHebrew = language === "he";

  return (
    <section className="panelCard tipsCard">
      {/* Panel title */}
      <div className="sectionHeader green">
        <span className="sectionEmoji">↘</span>
        <h2>{isHebrew ? "טיפים לחיסכון" : "Energy Saving Tips"}</h2>
      </div>

      <div className="tipsList">
        {/* Render each saving tip */}
        {tips.map((tip) => (
          <article key={tip.title} className="tipRow">
            <div>
              <div className="tipTitle">{tip.title}</div>
              <div className="tipBody">{tip.body}</div>
            </div>

            {/* Optional saving / impact text */}
            {tip.save ? <div className="tipSave">{tip.save}</div> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

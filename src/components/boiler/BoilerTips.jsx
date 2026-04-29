// Boiler optimization tips panel.
// Shows saving tips based on the current boiler calculation.
export function BoilerTips({ tips, language }) {
  const isHebrew = language === "he";

  return (
    <section className="panelCard tipsCard">
      {/* Panel title */}
      <div className="sectionHeader green">
        <span className="sectionEmoji">↘</span>
        <h2>{isHebrew ? "טיפים לחיסכון" : "Optimization Tips"}</h2>
      </div>

      <div className="tipsList">
        {/* Render each tip as a separate row */}
        {tips.map((tip) => (
          <article key={tip.title} className="tipRow">
            <div>
              <div className="tipTitle">{tip.title}</div>
              <div className="tipBody">{tip.body}</div>
            </div>

            {/* Estimated saving / impact text */}
            <div className="tipSave">{tip.save}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

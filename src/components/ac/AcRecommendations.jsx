// Smart recommendations panel.
// Shows a list of AC saving tips based on the current calculation.
export function AcRecommendations({ recommendations, language }) {
  return (
    <section className="panelCard tipsCard">
      {/* Panel title */}
      <div className="sectionHeader yellow">
        <span className="sectionEmoji">💡</span>
        <h2>{language === "he" ? "המלצות חכמות" : "Smart Recommendations"}</h2>
      </div>

      <div className="tipsList">
        {/* Render each recommendation as a separate tip row */}
        {recommendations.map((tip) => (
          <article key={tip.title} className="tipRow">
            <div>
              <div className="tipTitle">{tip.title}</div>
              <div className="tipBody">{tip.body}</div>
            </div>

            {/* Estimated saving / benefit text */}
            <div className="tipSave">{tip.save}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

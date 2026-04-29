// Home dashboard hero section.
// Shows the dashboard title, efficiency score,
// and save snapshot button.
export function HomeHero({
  language,
  efficiencyScore,
  saveState,
  canSave,
  onSave,
}) {
  // Dynamic button text based on save status
  const buttonText =
    saveState === "saving"
      ? language === "he"
        ? "שומר…"
        : "Saving…"
      : saveState === "saved"
        ? language === "he"
          ? "נשמר ✓"
          : "Saved ✓"
        : saveState === "error"
          ? language === "he"
            ? "שגיאה"
            : "Error"
          : language === "he"
            ? "שמור תמונת בית"
            : "Save Home Snapshot";

  return (
    <div className="homeHero panelCard">
      {/* Main dashboard title */}
      <div>
        <div className="eyebrow">Smart Home Energy Saver</div>

        <h1 className="homeTitle">
          {language === "he" ? "דשבורד אנרגיה לבית" : "Home Energy Dashboard"}
        </h1>
      </div>

      <div className="heroActionsStack">
        {/* Overall home efficiency score */}
        <div className="efficiencyBadge">
          <span>{language === "he" ? "יעילות" : "Efficiency"}</span>
          <strong>{efficiencyScore}/100</strong>
        </div>

        {/* Save dashboard snapshot */}
        <button
          className="snapshotButton"
          type="button"
          disabled={!canSave || saveState === "saving"}
          onClick={onSave}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

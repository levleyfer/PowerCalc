// Lighting calculator action buttons.
// Handles saving the calculation, exporting PDF,
// and showing the correct save/login helper message.
export function LightingActions({
  user,
  isConfigured,
  saveState,
  onSave,
  onExportPdf,
  t,
  language,
}) {
  const isHebrew = language === "he";

  return (
    <>
      {/* Save button is disabled when user/Firebase is missing or while saving */}
      <button
        className="saveButton warm"
        type="button"
        disabled={!user || !isConfigured || saveState === "saving"}
        onClick={onSave}
      >
        {saveState === "saving"
          ? t("saving")
          : saveState === "saved"
            ? t("saved")
            : isHebrew
              ? "שמור חישוב"
              : "Save Calculation"}
      </button>

      {/* Exports the current lighting result to PDF */}
      <button
        className="ghostButton pdfSecondaryButton"
        type="button"
        onClick={onExportPdf}
      >
        {isHebrew ? "ייצוא PDF" : "Export PDF"}
      </button>

      {/* Save/login helper message */}
      <div className="saveHint">
        {!isConfigured
          ? t("firebaseSetupShort")
          : user
            ? t("saveToCloudHint")
            : t("loginToSave")}
      </div>
    </>
  );
}

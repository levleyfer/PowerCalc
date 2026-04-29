// AC calculator action buttons component
// Responsible for:
// 1. Saving calculation to Firebase
// 2. Exporting results to PDF
// 3. Showing status/help messages

export function AcActions({
  user,
  isConfigured,
  saveState,
  onSave,
  onExportPdf,
  t,
  language,
}) {
  return (
    <>
      {/* Save calculation button */}
      <button
        className="saveButton cool"
        type="button"
        disabled={!user || !isConfigured || saveState === "saving"}
        onClick={onSave}
      >
        {saveState === "saving"
          ? t("saving")
          : saveState === "saved"
            ? t("saved")
            : language === "he"
              ? "שמור חישוב"
              : "Save Calculation"}
      </button>

      {/* Export PDF button */}
      <button
        className="ghostButton pdfSecondaryButton"
        type="button"
        onClick={onExportPdf}
      >
        {language === "he" ? "ייצוא PDF" : "Export PDF"}
      </button>

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

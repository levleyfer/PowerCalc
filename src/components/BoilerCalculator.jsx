import { useRef } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useI18n } from "../i18n/useI18n.jsx";
import { exportElementToPdf } from "../utils/exportPdf";
import { ReportSheet } from "./reports/ReportSheet";
import { BoilerActions } from "./boiler/BoilerActions";
import { BoilerForm } from "./boiler/BoilerForm";
import { BoilerResultPanel } from "./boiler/BoilerResultPanel";
import { BoilerTips } from "./boiler/BoilerTips";
import { useBoilerCalculator } from "./boiler/useBoilerCalculator";

// Main boiler calculator page.
// Connects the boiler hook, form, result panel,
// tips, save action, and PDF export.
export function BoilerCalculator({
  loadRequest,
  onResultChange,
  electricityPrice,
  setElectricityPrice,
  boilerState,
  setBoilerState,
}) {
  // Ref points to the hidden report sheet used for PDF export
  const pdfRef = useRef(null);

  const { t, language } = useI18n();
  const { user, isConfigured } = useAuth();

  // Main boiler logic hook
  const boiler = useBoilerCalculator({
    loadRequest,
    onResultChange,
    user,
    language,
    electricityPrice,
    setElectricityPrice,
    boilerState,
    setBoilerState,
  });

  const {
    state,
    setState,
    price,
    updatePrice,
    result,
    tips,
    saveState,
    handleSave,
    generatedAt,
    summaryRows,
    detailRows,
  } = boiler;

  // Export the hidden ReportSheet as PDF
  const handleExportPdf = async () => {
    await exportElementToPdf(pdfRef.current, "boiler-calculator-report.pdf");
  };

  return (
    <div className="dashboardPage boilerTheme">
      <div className="dashboardGrid">
        <div className="mainColumn">
          {/* Main boiler input form */}
          <BoilerForm
            state={state}
            setState={setState}
            language={language}
            price={price}
            updatePrice={updatePrice}
            boiler={boiler}
          />

          {/* Boiler saving tips */}
          <BoilerTips tips={tips} language={language} />
        </div>

        <aside className="sideColumn">
          {/* Main boiler result summary */}
          <BoilerResultPanel result={result} language={language} />

          {/* Save and PDF export actions */}
          <BoilerActions
            user={user}
            isConfigured={isConfigured}
            saveState={saveState}
            onSave={handleSave}
            onExportPdf={handleExportPdf}
            t={t}
            language={language}
          />
        </aside>
      </div>

      {/* Hidden report layout used only for PDF export */}
      <ReportSheet
        ref={pdfRef}
        title={
          language === "he" ? "דוח מחשבון דוד" : "Boiler Calculator Report"
        }
        generatedAt={generatedAt}
        summaryRows={summaryRows}
        detailRows={detailRows}
        accent="orange"
        language={language}
      />
    </div>
  );
}

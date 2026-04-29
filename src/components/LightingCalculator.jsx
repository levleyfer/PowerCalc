import { useRef } from "react";
import { useI18n } from "../i18n/useI18n.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { exportElementToPdf } from "../utils/exportPdf";
import { ReportSheet } from "./reports/ReportSheet";
import { useLightingCalculator } from "./lighting/useLightingCalculator";
import { LightingForm } from "./lighting/LightingForm";
import { LightingTips } from "./lighting/LightingTips";
import { LightingResultPanel } from "./lighting/LightingResultPanel";
import { LightingDetails } from "./lighting/LightingDetails";
import { LightingActions } from "./lighting/LightingActions";

export { bulbCatalog } from "./lighting/useLightingCalculator";

// Main lighting calculator page.
// Connects the lighting hook, form, tips,
// result/details panels, save action, and PDF export.
export function LightingCalculator({
  loadRequest,
  rooms,
  setRooms,
  electricityPrice,
  setElectricityPrice,
}) {
  const { t, language } = useI18n();
  const { user, isConfigured } = useAuth();

  // Ref points to the hidden report sheet used for PDF export
  const pdfRef = useRef(null);

  // Main lighting logic hook
  const lighting = useLightingCalculator({
    loadRequest,
    rooms,
    setRooms,
    electricityPrice,
    setElectricityPrice,
    user,
    language,
  });

  // Export the hidden ReportSheet as PDF
  const handleExportPdf = async () => {
    await exportElementToPdf(pdfRef.current, "lighting-calculator-report.pdf");
  };

  return (
    <div className="dashboardPage lightingTheme">
      <div className="dashboardGrid">
        <div className="mainColumn">
          {/* Main lighting input form */}
          <LightingForm lighting={lighting} language={language} />

          {/* Lighting saving tips */}
          <LightingTips tips={lighting.tips} language={language} />
        </div>

        <aside className="sideColumn">
          {/* Main lighting result summary */}
          <LightingResultPanel
            computed={lighting.computed}
            language={language}
          />

          {/* Extra lighting calculation details */}
          <LightingDetails
            homeRooms={lighting.homeRooms}
            computed={lighting.computed}
            language={language}
          />

          {/* Save and PDF export actions */}
          <LightingActions
            user={user}
            isConfigured={isConfigured}
            saveState={lighting.saveState}
            onSave={lighting.handleSave}
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
          language === "he" ? "דוח מחשבון תאורה" : "Lighting Calculator Report"
        }
        generatedAt={lighting.generatedAt}
        summaryRows={lighting.summaryRows}
        detailRows={lighting.detailRows}
        accent="gold"
        language={language}
      />
    </div>
  );
}

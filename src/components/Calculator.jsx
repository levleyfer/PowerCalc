import { useRef } from "react";
import { useI18n } from "../i18n/useI18n.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { exportElementToPdf } from "../utils/exportPdf";
import { ReportSheet } from "./reports/ReportSheet";
import { useAcCalculator } from "./ac/useAcCalculator";
import { AcForm } from "./ac/AcForm";
import { AcRecommendations } from "./ac/AcRecommendations";
import { AcResultPanel } from "./ac/AcResultPanel";
import { AcDetails } from "./ac/AcDetails";
import { AcActions } from "./ac/AcActions";

// Main AC calculator page.
// Connects global App state, AC hook,
// form, recommendations, result/details,
// save action, and PDF export.
export function Calculator({
  season,
  onSeasonChange,
  loadRequest,
  rooms,
  setRooms,
  acSettings,
  setAcSettings,
  selectedRoomId,
  setSelectedRoomId,
  electricityPrice,
  setElectricityPrice,
}) {
  const { t, language } = useI18n();
  const { user, isConfigured } = useAuth();

  // Ref points to the hidden report sheet used for PDF export
  const pdfRef = useRef(null);

  // Main AC logic hook
  const ac = useAcCalculator({
    season,
    onSeasonChange,
    loadRequest,
    rooms,
    setRooms,
    acSettings,
    setAcSettings,
    selectedRoomId,
    setSelectedRoomId,
    electricityPrice,
    setElectricityPrice,
    user,
    language,
  });

  // Export the hidden ReportSheet as PDF
  const handleExportPdf = async () => {
    await exportElementToPdf(pdfRef.current, "ac-calculator-report.pdf");
  };

  return (
    <div className="dashboardPage acTheme">
      <div className="dashboardGrid">
        <div className="mainColumn">
          {/* Main AC input form */}
          <AcForm
            ac={ac}
            season={season}
            onSeasonChange={onSeasonChange}
            language={language}
            t={t}
          />

          {/* Smart AC recommendations */}
          <AcRecommendations
            recommendations={ac.recommendations}
            language={language}
          />
        </div>

        <aside className="sideColumn">
          {/* Main AC result summary */}
          <AcResultPanel
            result={ac.result}
            data={ac.data}
            selectedRoom={ac.selectedRoom}
            language={language}
          />

          {/* Extra AC calculation details */}
          <AcDetails
            data={ac.data}
            result={ac.result}
            selectedRoom={ac.selectedRoom}
            language={language}
          />

          {/* Save and PDF export actions */}
          <AcActions
            user={user}
            isConfigured={isConfigured}
            saveState={ac.saveState}
            onSave={ac.handleSave}
            onExportPdf={handleExportPdf}
            t={t}
            language={language}
          />
        </aside>
      </div>

      {/* Hidden report layout used only for PDF export */}
      <ReportSheet
        ref={pdfRef}
        title={language === "he" ? "דוח מחשבון מזגן" : "AC Calculator Report"}
        generatedAt={ac.generatedAt}
        summaryRows={ac.summaryRows}
        detailRows={ac.detailRows}
        accent="purple"
        language={language}
      />
    </div>
  );
}

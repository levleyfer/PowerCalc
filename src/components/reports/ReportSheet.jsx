import { forwardRef } from "react";

// Hidden printable/PDF report sheet.
// Receives summary/detail rows and is exported through the PDF function.
export const ReportSheet = forwardRef(function ReportSheet(
  {
    title,
    generatedAt,
    summaryRows = [],
    detailRows = [],
    accent = "purple",
    reportName,
    language = "en",
  },
  ref,
) {
  const isHebrew = language === "he";

  // Localized static labels used inside the report
  const labels = {
    reportName: isHebrew ? "דוח עלויות חשמל" : "Electricity Cost Report",
    generatedOn: isHebrew ? "נוצר בתאריך:" : "Generated on:",
    costSummary: isHebrew ? "סיכום עלויות" : "Cost Summary",
    period: isHebrew ? "תקופה" : "Period",
    cost: isHebrew ? "עלות" : "Cost",
    configuration: isHebrew ? "הגדרות החישוב" : "Configuration",
  };

  return (
    <div
      ref={ref}
      className="pdfReportRoot"
      aria-hidden="true"
      dir={isHebrew ? "rtl" : "ltr"}
      lang={isHebrew ? "he" : "en"}
    >
      {/* Report colored header */}
      <div className={`pdfReportHeader ${accent}`}>
        <div className="pdfReportHeaderInner">
          {reportName || labels.reportName}
        </div>
      </div>

      <div className="pdfReportBody">
        {/* Report title and generation date */}
        <h1 className="pdfReportTitle">{title || labels.reportName}</h1>

        <p className="pdfReportDate">
          {labels.generatedOn} {generatedAt || "-"}
        </p>

        {/* Cost summary table */}
        <section className="pdfReportSection pdfCard">
          <h2 className="pdfReportSectionTitle">{labels.costSummary}</h2>

          <table className="pdfReportTable">
            <thead>
              <tr>
                <th>{labels.period}</th>
                <th>{labels.cost}</th>
              </tr>
            </thead>

            <tbody>
              {summaryRows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Calculation configuration details */}
        <section className="pdfReportSection">
          <h2 className="pdfReportSectionTitle slim">{labels.configuration}</h2>

          <div className="pdfDetailTable">
            {detailRows.map((row) => (
              <div key={row.label} className="pdfDetailRow">
                <div className="pdfDetailLabel">{row.label}</div>
                <div className="pdfDetailValue">{row.value}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
});

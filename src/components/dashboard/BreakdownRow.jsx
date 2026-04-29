import { formatCurrency } from "../../utils/format";

// Cost breakdown row.
// Shows one category value, its percentage from the total,
// and a visual progress bar.
export function BreakdownRow({ label, value, total, language }) {
  // Calculate percentage safely, avoiding division by zero
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="breakdownRow">
      <div className="breakdownTop">
        <span>{label}</span>

        <strong className="numberToken">
          {formatCurrency(value, language)}
        </strong>
      </div>

      {/* Visual percentage bar */}
      <div
        className="breakdownBar"
        aria-label={`${label} is ${percent}% of total`}
      >
        <span style={{ width: `${percent}%` }} />
      </div>

      {/* Text percentage for readability */}
      <small>
        {language === "he" ? `${percent}% מהסה״כ` : `${percent}% of total`}
      </small>
    </div>
  );
}

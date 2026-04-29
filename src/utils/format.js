// Formats a number as Israeli shekel currency.
// Invalid numbers return a clean dash instead of breaking the UI.
export function formatCurrency(n, language = "en") {
  return Number.isFinite(+n)
    ? `${Math.round(Number(n))} ₪`
    : language === "he"
      ? "—"
      : "—";
}

// Round to 1 decimal place
export function round1(n) {
  return Number.isFinite(+n) ? Math.round(Number(n) * 10) / 10 : "—";
}

// Round to 2
export function round2(n) {
  return Number.isFinite(+n) ? Math.round(Number(n) * 100) / 100 : "—";
}

// Round to 3
export function round3(n) {
  return Number.isFinite(+n) ? Math.round(Number(n) * 1000) / 1000 : "—";
}

// Keeps a number inside a minimum and maximum range
export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

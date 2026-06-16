import { useMemo, useState } from "react";
import { formatCurrency } from "../../utils/format";
import { calculateHomeSummary } from "../../utils/homeRooms";
import { bulbCatalog } from "../lighting/useLightingCalculator";
import { saveCalculation } from "../../services/historyService";

// Home dashboard hook.
// Builds full dashboard data:
// totals, efficiency score, insights,
// smart tips, and snapshot saving.
export function useHomeDashboard({
  rooms,
  acSettings,
  electricityPrice,
  season,
  boilerResult,
  boilerState,
  selectedRoomId,
  user,
  isConfigured,
  language,
}) {
  // Save snapshot button state
  const [saveState, setSaveState] = useState("idle");

  // Main combined home summary calculation
  const summary = useMemo(
    () =>
      calculateHomeSummary({
        rooms,
        acSettings,
        electricityPrice,
        bulbCatalog,
        season,
        boilerResult,
      }),
    [rooms, acSettings, electricityPrice, season, boilerResult],
  );

  // Enabled modules / rooms
  const enabledAcRooms = summary.acRooms.filter((room) => room.enabled).length;

  const enabledLightingRooms = summary.lightingRooms.filter(
    (room) => room.lighting.enabled,
  ).length;

  // Safe numeric fallback values
  const safeAcMonthly = Number.isFinite(Number(summary.acMonthly))
    ? Number(summary.acMonthly)
    : 0;

  const safeLightingMonthly = Number.isFinite(Number(summary.lightingMonthly))
    ? Number(summary.lightingMonthly)
    : 0;

  const safeBoilerMonthly = Number.isFinite(Number(summary.boilerMonthly))
    ? Number(summary.boilerMonthly)
    : 0;

  const safeTotalMonthly = Number.isFinite(Number(summary.totalMonthly))
    ? Number(summary.totalMonthly)
    : 0;

  // How many energy services are active
  const totalServices = [
    safeAcMonthly,
    safeLightingMonthly,
    safeBoilerMonthly,
  ].filter((value) => value > 0).length;

  // Dashboard score estimation
  const efficiencyScore = Math.max(
    35,
    Math.min(
      98,
      Math.round(92 - safeTotalMonthly / 18 + enabledLightingRooms * 2),
    ),
  );

  // Estimated possible monthly saving
  const possibleSaving = Math.max(
    0,
    safeAcMonthly * 0.12 + safeLightingMonthly * 0.08 + safeBoilerMonthly * 0.1,
  );

  const optimizedEstimate = Math.max(0, safeTotalMonthly - possibleSaving);

  // Sort cost sources highest to lowest
  const costSources = [
    {
      key: "ac",
      label: language === "he" ? "מזגן" : "AC",
      value: safeAcMonthly,
      tab: "ac",
    },
    {
      key: "lighting",
      label: language === "he" ? "תאורה" : "Lighting",
      value: safeLightingMonthly,
      tab: "lighting",
    },
    {
      key: "boiler",
      label: language === "he" ? "דוד" : "Boiler",
      value: safeBoilerMonthly,
      tab: "boiler",
    },
  ].sort((a, b) => b.value - a.value);

  const topSource = costSources[0];

  // UI labels
  const seasonLabel =
    season === "winter"
      ? language === "he"
        ? "חורף"
        : "Winter"
      : language === "he"
        ? "קיץ"
        : "Summer";

  const priceUnit = language === "he" ? "₪ / קוט״ש" : "₪/kWh";

  const powerUnit = "kW";

  // Main issue card
  const mainIssue = summary.mostExpensiveRoom
    ? {
        title: language === "he" ? "הבעיה המרכזית" : "Main issue",
        body:
          language === "he"
            ? `החדר הכי יקר כרגע הוא ${summary.mostExpensiveRoom.name}, עם עלות חודשית של בערך ${formatCurrency(
                summary.mostExpensiveRoom.monthlyCost,
                language,
              )}.`
            : `The most expensive room right now is ${summary.mostExpensiveRoom.name}, at about ${formatCurrency(
                summary.mostExpensiveRoom.monthlyCost,
                language,
              )} per month.`,
      }
    : {
        title:
          language === "he" ? "אין עדיין מספיק נתונים" : "Not enough data yet",
        body:
          language === "he"
            ? "הוסף חדרים או הפעל מחשבונים כדי לקבל ניתוח טוב יותר."
            : "Add rooms or enable calculators to get a better analysis.",
      };

  // Best next action card
  const bestAction = {
    title: language === "he" ? "הפעולה הכי משתלמת" : "Best action",

    body:
      topSource?.key === "ac"
        ? language === "he"
          ? "בדוק קודם את שעות המזגן והטמפרטורה בחדר היקר ביותר. שינוי קטן שם נותן בדרך כלל את החיסכון הכי גדול."
          : "Start with AC runtime and target temperature in the most expensive room. Small changes there usually save the most."
        : topSource?.key === "lighting"
          ? language === "he"
            ? "בדוק חדרים עם הרבה נורות או שעות תאורה גבוהות, במיוחד אם לא כולן LED."
            : "Check rooms with many bulbs or long lighting hours, especially if not all bulbs are LED."
          : language === "he"
            ? "בדוק זמן חימום וטמפרטורת יעד בדוד. קיצור קטן בזמן יכול לחסוך לאורך חודש."
            : "Check boiler heating time and target temperature. A small runtime reduction can save across the month.",

    tab: topSource?.tab || "dashboard",
  };

  // Dashboard quick tips
  const smartTips = [
    summary.mostExpensiveRoom
      ? {
          title: language === "he" ? "החדר הכי יקר" : "Most expensive room",

          body:
            language === "he"
              ? `${summary.mostExpensiveRoom.name} עולה בערך ${formatCurrency(
                  summary.mostExpensiveRoom.monthlyCost,
                  language,
                )} בחודש.`
              : `${summary.mostExpensiveRoom.name} costs about ${formatCurrency(
                  summary.mostExpensiveRoom.monthlyCost,
                  language,
                )}/month.`,

          action: language === "he" ? "פתח מזגן" : "Open AC",

          tab: "ac",
        }
      : null,

    {
      title: language === "he" ? "בדוק שעות שימוש" : "Check runtime hours",

      body:
        language === "he"
          ? "הדרך הכי מהירה לחסוך היא להוריד שעות שימוש מיותרות בחדרים שלא משתמשים בהם."
          : "The fastest saving is usually reducing unnecessary runtime in rooms you barely use.",

      action: language === "he" ? "פתח חדרים" : "Open Rooms",

      tab: "lighting",
    },

    {
      title:
        language === "he" ? "המחיר לקוט״ש משותף" : "Shared electricity price",

      body:
        language === "he"
          ? "עדכן מחיר חשמל פעם אחת, והחישוב הכללי נשאר עקבי בכל הבית."
          : "Update the electricity price once so all home calculations stay consistent.",

      action: language === "he" ? "פתח תאורה" : "Open Lighting",

      tab: "lighting",
    },
  ].filter(Boolean);

  // Save dashboard snapshot
  const handleSaveHomeSnapshot = async () => {
    if (!user?.uid || !isConfigured) return;

    setSaveState("saving");

    try {
      const cleanPayload = JSON.parse(
        JSON.stringify({
          rooms,
          selectedRoomId,
          acSettings,
          electricityPrice,
          season,
          boilerState,
          boilerResult,
        }),
      );

      await saveCalculation({
        userId: user.uid,
        type: "home",
        title: `Home Snapshot · ${rooms.length} room${rooms.length !== 1 ? "s" : ""}`,
        summary: `Monthly: ${safeTotalMonthly.toFixed(0)} ₪ · Possible saving: ${possibleSaving.toFixed(0)} ₪`,

        inputs: cleanPayload,

        outputs: JSON.parse(
          JSON.stringify({
            totalMonthly: safeTotalMonthly,
            totalDaily: summary.totalDaily,
            acMonthly: safeAcMonthly,
            lightingMonthly: safeLightingMonthly,
            boilerMonthly: safeBoilerMonthly,
            efficiencyScore,
            optimizedEstimate,
            possibleSaving,
            mainIssue,
            bestAction,
          }),
        ),
      });

      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1800);
    } catch (error) {
      console.error(error);

      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2200);
    }
  };

  // Public dashboard API
  return {
    summary,
    enabledAcRooms,
    totalServices,
    efficiencyScore,
    possibleSaving,
    optimizedEstimate,
    seasonLabel,
    priceUnit,
    powerUnit,
    mainIssue,
    bestAction,
    smartTips,
    saveState,
    handleSaveHomeSnapshot,
  };
}

export function calculateACCost(data) {
  const hours = Math.max(0, Number(data.hoursPerDay) || 0);
  const season = data.season === "winter" ? "winter" : "summer";

  /* =======================================================
     1) עומס חום בסיסי לפי שטח → BTU מומלץ
     ======================================================= */
  const roomSize = Number(data.roomSize) || 12;
  const recommendedBTU = roomSize * 600; // כלל אצבע טוב

  /* =======================================================
     2) עומס חום אמיתי לפי תנאי חדר
     (קומה אחרונה / שמש / בידוד / טמפ' חוץ)
     ======================================================= */

  // קומה ושמש
  const envFactorTop = data.topFloor ? (season === "winter" ? 1.06 : 1.1) : 1.0;
  const envFactorSun = data.sunExposure
    ? season === "winter"
      ? 1.04
      : 1.1
    : 1.0;

  // בידוד
  const insulation = data.insulation || "average";
  const insulationFactor =
    insulation === "good" ? 0.9 : insulation === "poor" ? 1.15 : 1.0;

  // טמפ' יעד וחוץ
  const setpoint = Number(data.setpointTemp ?? (season === "winter" ? 22 : 24));
  const outdoor = Number(data.outdoorTemp ?? (season === "winter" ? 10 : 32));

  const deltaT =
    season === "winter"
      ? Math.max(0, setpoint - outdoor)
      : Math.max(0, outdoor - setpoint);

  const deltaTFactor = 1 + Math.max(0, deltaT - 8) * 0.03;

  // עומס חום סופי (BTU שהחדר דורש)
  const roomLoadBTU =
    recommendedBTU *
    envFactorTop *
    envFactorSun *
    insulationFactor *
    deltaTFactor;

  /* =======================================================
     3) יכולת המזגן לפי כ"ס / kW / COP / EER
     ======================================================= */

  // מקור 1: kW ישיר
  const powerKW = Number(data.powerKW);

  // מקור 2: כ"ס → kW
  const hp = Number(data.hp);
  const kwFromHP = Number.isFinite(hp) && hp > 0 ? hp * 0.746 : null;

  // מקור 3: COP → צריכה
  const cop = Number(data.cop);
  const kwFromCOP =
    Number.isFinite(cop) && cop > 0 ? roomLoadBTU / 3412 / cop : null;

  // מקור 4: EER → צריכה
  const eer = Number(data.eer);
  const kwFromEER =
    Number.isFinite(eer) && eer > 0 ? roomLoadBTU / eer / 1000 : null;

  // בחירת המקור
  let baseKW =
    Number.isFinite(powerKW) && powerKW > 0
      ? powerKW
      : (kwFromHP ?? kwFromCOP ?? kwFromEER ?? null);

  // אם אין כלל — הערכה לפי עומס החום
  if (baseKW == null) {
    baseKW = roomLoadBTU / 12000; // 12,000 BTU ≈ 1 טון קירור ≈ 1 kW צריכה
  }

  /* =======================================================
     4) מודל C — שילוב עומס חדר + יכולת מזגן
     ======================================================= */

  // כמה BTU המזגן מסוגל לתת לפי המקור
  const acBTU =
    Number.isFinite(powerKW) && powerKW > 0
      ? powerKW * 3412
      : Number.isFinite(hp) && hp > 0
        ? hp * 9000
        : roomLoadBTU; // fallback

  // יחס עומס לחדר לעומת כוח מזגן
  let roomFactor = roomLoadBTU / acBTU;

  // הגבלת קיצון (שמרני ומדויק)
  roomFactor = Math.min(Math.max(roomFactor, 0.75), 1.7);

  // צריכת kW סופית
  let finalKW = baseKW * roomFactor;

  /* =======================================================
     5) אינוורטר / גיל
     ======================================================= */
  if (data.type === "inverter") finalKW *= 0.75;

  const age = Number(data.age);
  if (!Number.isNaN(age)) {
    if (age >= 8) finalKW *= 1.2;
    else if (age >= 4) finalKW *= 1.1;
  }

  /* =======================================================
     6) עלויות
     ======================================================= */
  const price = Number(data.price) || 0.55;
  const months = Number(data.months) || (season === "winter" ? 5 : 4);

  const hourlyCost = finalKW * price;
  const dailyCost = hourlyCost * hours;
  const monthlyCost = dailyCost * 30;
  const seasonalCost = monthlyCost * months;

  /* =======================================================
     7) החזרת תוצאות
     ======================================================= */
  return {
    hourlyCost,
    dailyCost,
    monthlyCost,
    seasonalCost,

    estimatedKW: finalKW,
    loadBTU: roomLoadBTU,
    deltaT,
  };
}

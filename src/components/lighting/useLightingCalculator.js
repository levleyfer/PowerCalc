import { useEffect, useMemo, useState } from "react";
import { formatCurrency, round3 } from "../../utils/format";
import {
  calculateRoomLighting,
  createHomeRoom,
  defaultHomeRooms,
  patchHomeRoom,
  roomsFromLightingHistory,
} from "../../utils/homeRooms";
import { saveCalculation } from "../../services/historyService";

// Supported bulb types used by the lighting calculator
export const bulbCatalog = [
  {
    key: "led",
    label: "LED (Most Efficient)",
    watts: 9,
    equivalent: 60,
    icon: "💡",
    yearlyFactor: 1,
  },
  {
    key: "fluorescent",
    label: "CFL / Fluorescent",
    watts: 18,
    equivalent: 75,
    icon: "🔆",
    yearlyFactor: 1.15,
  },
  {
    key: "halogen",
    label: "Halogen",
    watts: 42,
    equivalent: 60,
    icon: "✨",
    yearlyFactor: 1.35,
  },
  {
    key: "incandescent",
    label: "Incandescent",
    watts: 60,
    equivalent: 60,
    icon: "🔥",
    yearlyFactor: 1.6,
  },
];

// Generates smart saving tips
function tipFor(totalState, bulb, language) {
  const hours = round3(totalState.hoursPerDay);
  const reducedHours = Math.max(1, round3(totalState.hoursPerDay - 2));

  const reducedDaily = Math.max(
    0,
    (((totalState.hoursPerDay - 2) * totalState.bulbCount * bulb.watts) /
      1000) *
      totalState.price,
  );

  const sensorPct = totalState.hoursPerDay >= 5 ? 30 : 18;

  return [
    {
      title:
        language === "he"
          ? "לעבור ל-LED"
          : bulb.key === "led"
            ? "Switch to LED"
            : "Move to LED Bulbs",

      body:
        bulb.key === "led"
          ? language === "he"
            ? "אתה כבר משתמש בנורות הכי יעילות."
            : "You're already using the most efficient bulbs!"
          : language === "he"
            ? `מעבר מ-${bulb.label} ל-LED יכול להוריד צריכה בצורה משמעותית.`
            : `Switching from ${bulb.label} to LED can reduce your daily cost noticeably.`,

      save:
        bulb.key === "led"
          ? ""
          : `Save up to ${Math.round((1 - 9 / bulb.watts) * 100)}%`,
    },

    {
      title: language === "he" ? "להפחית שעות פעילות" : "Reduce Runtime",

      body:
        language === "he"
          ? `שימוש של ${reducedHours} שעות במקום ${hours} יכול לחסוך ${formatCurrency(
              reducedDaily,
              language,
            )} ליום.`
          : `Using lights for ${reducedHours} hours instead of ${hours} could save ${formatCurrency(
              reducedDaily,
              language,
            )}/day.`,

      save: `Save ${Math.round(
        (2 / Math.max(totalState.hoursPerDay, 1)) * 100,
      )}%`,
    },

    {
      title: language === "he" ? "חיישני תנועה" : "Motion Sensors",

      body:
        language === "he"
          ? "חיישני תנועה יכולים להפחית הדלקות מיותרות במסדרון, מטבח או שירותים."
          : "Installing motion sensors can reduce unnecessary runtime in corridors, kitchens, or bathrooms.",

      save: `Save ${sensorPct}%`,
    },
  ];
}

// Main lighting calculator hook.
// Handles rooms, bulb settings,
// calculations, saving, and PDF data.
export function useLightingCalculator({
  loadRequest,
  rooms,
  setRooms,
  electricityPrice,
  setElectricityPrice,
  user,
  language,
}) {
  // Local fallback state
  const [localRooms, setLocalRooms] = useState(defaultHomeRooms);

  const [localSelectedRoomId, setLocalSelectedRoomId] = useState(
    defaultHomeRooms[0].id,
  );

  const [localPrice, setLocalPrice] = useState(0.55);

  const [saveState, setSaveState] = useState("idle");

  // Shared App state if available
  const homeRooms = rooms || localRooms;
  const updateRooms = setRooms || setLocalRooms;

  const currentRoomId = localSelectedRoomId;
  const updateCurrentRoomId = setLocalSelectedRoomId;

  const price = Number.isFinite(Number(electricityPrice))
    ? Number(electricityPrice)
    : localPrice;

  const updatePrice = setElectricityPrice || setLocalPrice;

  // Current selected room
  const selectedRoom =
    homeRooms.find((room) => room.id === currentRoomId) || homeRooms[0];

  const roomLighting = selectedRoom?.lighting || defaultHomeRooms[0].lighting;

  // Update selected room lighting settings
  const patchSelectedRoomLighting = (patch) => {
    if (!selectedRoom) return;

    updateRooms((prev) =>
      patchHomeRoom(prev, selectedRoom.id, {
        lighting: patch,
      }),
    );
  };

  // Rename selected room
  const patchSelectedRoomName = (name) => {
    if (!selectedRoom) return;

    updateRooms((prev) =>
      patchHomeRoom(prev, selectedRoom.id, {
        name,
      }),
    );
  };

  // Add room
  const addRoom = () => {
    const nextId = (homeRooms.at(-1)?.id ?? 0) + 1;

    const nextRoom = createHomeRoom(nextId);

    updateRooms((prev) => [...prev, nextRoom]);

    updateCurrentRoomId(nextId);
  };

  // Remove room but keep at least one
  const removeSelectedRoom = () => {
    if (homeRooms.length <= 1 || !selectedRoom) return;

    const remaining = homeRooms.filter((room) => room.id !== selectedRoom.id);

    updateRooms(remaining);
    updateCurrentRoomId(remaining[0].id);
  };

  // Load saved history item
  useEffect(() => {
    if (!loadRequest?.item) return;

    const inputs = loadRequest.item.inputs || {};

    const loadedRooms = roomsFromLightingHistory(inputs);

    if (loadedRooms) {
      updateRooms(loadedRooms);

      updateCurrentRoomId(loadedRooms[0]?.id ?? defaultHomeRooms[0].id);
    }

    if (Number.isFinite(Number(inputs.electricityPrice ?? inputs.price))) {
      updatePrice(Number(inputs.electricityPrice ?? inputs.price));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadRequest?.ts]);

  // Main lighting calculation
  const computed = useMemo(() => {
    const perRoom = homeRooms.map((room) =>
      calculateRoomLighting(room, price, bulbCatalog),
    );

    const totals = perRoom.reduce(
      (acc, room) => {
        const enabled = Boolean(room.lighting.enabled);

        const bulbCount = Number(room.lighting.bulbCount) || 0;

        const hoursPerDay = Number(room.lighting.hoursPerDay) || 0;

        acc.bulbCount += enabled ? bulbCount : 0;

        acc.hoursWeighted += enabled ? hoursPerDay * bulbCount : 0;

        acc.dailyCost += room.dailyCost;
        acc.hourlyCost += room.hourlyCost;
        acc.monthlyCost += room.monthlyCost;
        acc.yearlyCost += room.yearlyCost;
        acc.totalPowerW += room.totalPowerW;

        return acc;
      },
      {
        bulbCount: 0,
        hoursWeighted: 0,
        dailyCost: 0,
        hourlyCost: 0,
        monthlyCost: 0,
        yearlyCost: 0,
        totalPowerW: 0,
      },
    );

    return {
      perRoom,
      bulbCount: totals.bulbCount,
      hoursPerDay: totals.bulbCount
        ? totals.hoursWeighted / totals.bulbCount
        : 0,
      dailyCost: totals.dailyCost,
      hourlyCost: totals.hourlyCost,
      monthlyCost: totals.monthlyCost,
      yearlyCost: totals.yearlyCost,
      totalPowerW: totals.totalPowerW,
    };
  }, [homeRooms, price]);

  // Selected room live result
  const selectedComputedRoom =
    computed.perRoom.find((room) => room.id === currentRoomId) ||
    computed.perRoom[0];

  const firstBulb =
    selectedComputedRoom?.bulb || computed.perRoom[0]?.bulb || bulbCatalog[0];

  // Smart tips
  const tips = useMemo(
    () =>
      tipFor(
        {
          bulbCount: computed.bulbCount,
          hoursPerDay: computed.hoursPerDay,
          price,
        },
        firstBulb,
        language,
      ),
    [computed.bulbCount, computed.hoursPerDay, price, firstBulb, language],
  );

  // PDF metadata
  const generatedAt = new Date().toLocaleString();

  const summaryRows = [
    {
      label: language === "he" ? "עלות יומית" : "Daily Cost",
      value: formatCurrency(computed.dailyCost, language),
    },
    {
      label: language === "he" ? "עלות חודשית" : "Monthly Cost",
      value: formatCurrency(computed.monthlyCost, language),
    },
    {
      label: language === "he" ? "עלות שנתית" : "Yearly Cost",
      value: formatCurrency(computed.yearlyCost, language),
    },
  ];

  const detailRows = [
    {
      label: language === "he" ? "חדרים" : "Rooms",
      value: `${homeRooms.length}`,
    },
    {
      label: language === "he" ? "סה״כ נורות" : "Total Bulbs",
      value: `${computed.bulbCount}`,
    },
    {
      label: language === "he" ? "זמן ממוצע" : "Average Runtime",
      value: `${round3(computed.hoursPerDay)} hours`,
    },
    {
      label: language === "he" ? "מחיר חשמל" : "Electricity Price",
      value: `${Number(price).toFixed(2)} ₪/kWh`,
    },
    {
      label: language === "he" ? "הספק כולל" : "Total Power",
      value: `${round3(computed.totalPowerW / 1000)} kW`,
    },
  ];

  // Save to Firebase history
  const handleSave = async () => {
    if (!user?.uid) return;

    setSaveState("saving");

    try {
      await saveCalculation({
        userId: user.uid,
        type: "lighting",
        title: `Lighting · ${homeRooms.length} room${homeRooms.length !== 1 ? "s" : ""}`,
        summary: `Daily: ${computed.dailyCost.toFixed(2)} ₪ · Monthly: ${computed.monthlyCost.toFixed(0)} ₪`,

        inputs: {
          rooms: homeRooms.map((room) => ({
            id: room.id,
            name: room.name,
            ...room.lighting,
          })),
          electricityPrice: price,
          roomCount: homeRooms.length,
        },

        outputs: computed,
      });

      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1800);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2200);
    }
  };

  // Public API
  return {
    homeRooms,
    updateRooms,
    currentRoomId,
    updateCurrentRoomId,
    selectedRoom,
    roomLighting,
    selectedComputedRoom,
    patchSelectedRoomLighting,
    patchSelectedRoomName,
    price,
    updatePrice,
    computed,
    tips,
    saveState,
    addRoom,
    removeSelectedRoom,
    handleSave,
    generatedAt,
    summaryRows,
    detailRows,
  };
}

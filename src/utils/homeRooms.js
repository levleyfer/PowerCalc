import { calculateACCost } from "./calc";

// A single room now owns the settings for every calculator that belongs to that room.
// This makes the app feel like one smart-home system instead of three separate pages.
export const defaultHomeRooms = [
  {
    id: 1,
    name: "Living Room",
    ac: {
      enabled: true,
      roomSize: 25,
      hoursPerDay: 8,
      setpointTemp: 22,
      insulation: "average",
      type: "unknown",
      age: 3,
      topFloor: false,
      sunExposure: false,
      powerKW: "",
      hp: "",
      cop: "",
      eer: "",
    },
    lighting: {
      enabled: true,
      bulbType: "led",
      wattEquivalent: 60,
      bulbCount: 4,
      hoursPerDay: 6,
    },
  },
  {
    id: 2,
    name: "Kitchen",
    ac: {
      enabled: false,
      roomSize: 14,
      hoursPerDay: 3,
      setpointTemp: 22,
      insulation: "average",
      type: "unknown",
      age: 3,
      topFloor: false,
      sunExposure: false,
      powerKW: "",
      hp: "",
      cop: "",
      eer: "",
    },
    lighting: {
      enabled: true,
      bulbType: "fluorescent",
      wattEquivalent: 75,
      bulbCount: 2,
      hoursPerDay: 4,
    },
  },
];

// Default AC settings used when a loaded history item does not contain room data yet.
export const defaultAcRoomSettings = defaultHomeRooms[0].ac;

// Default lighting settings used for every new room.
export const defaultLightingSettings = defaultHomeRooms[0].lighting;

// Create a new room object with safe defaults.
export function createHomeRoom(id) {
  return {
    id,
    name: `Room ${id}`,
    ac: { ...defaultAcRoomSettings, enabled: true },
    lighting: { ...defaultLightingSettings, bulbCount: 1, hoursPerDay: 5 },
  };
}

// Updates only one room. The patch can include name, ac, or lighting fields.
export function patchHomeRoom(rooms, roomId, patch) {
  return rooms.map((room) => {
    if (room.id !== roomId) return room;
    return {
      ...room,
      ...patch,
      ac: patch.ac ? { ...room.ac, ...patch.ac } : room.ac,
      lighting: patch.lighting
        ? { ...room.lighting, ...patch.lighting }
        : room.lighting,
    };
  });
}

// Normalize older lighting-only data into the new room shape.
export function roomsFromLightingHistory(inputs = {}) {
  if (!Array.isArray(inputs.rooms) || !inputs.rooms.length) return null;

  return inputs.rooms.map((room, index) => ({
    id: room.id ?? index + 1,
    name: room.name || `Room ${index + 1}`,
    ac: {
      ...defaultAcRoomSettings,
      enabled: false,
      roomSize: Number(room.roomSize) || 12,
    },
    lighting: {
      ...defaultLightingSettings,
      enabled: true,
      bulbType: room.bulbType || "led",
      wattEquivalent: Number(room.wattEquivalent) || 60,
      bulbCount: Number(room.bulbCount ?? room.count) || 1,
      hoursPerDay: Number(room.hoursPerDay ?? room.hours) || 1,
    },
  }));
}

// Calculate lighting cost for one room.
export function calculateRoomLighting(room, price, bulbCatalog) {
  const safePrice = Number.isFinite(Number(price)) ? Number(price) : 0.55;
  const lighting = room.lighting || defaultLightingSettings;
  const bulb =
    bulbCatalog.find((item) => item.key === lighting.bulbType) ||
    bulbCatalog[0];
  const actualWatts =
    bulb.watts *
    ((Number(lighting.wattEquivalent) || bulb.equivalent) / bulb.equivalent);
  const totalPowerW = (Number(lighting.bulbCount) || 0) * actualWatts;
  const hourlyCost = (totalPowerW / 1000) * safePrice;
  const dailyCost = lighting.enabled
    ? hourlyCost * (Number(lighting.hoursPerDay) || 0)
    : 0;
  const monthlyCost = dailyCost * 30;
  const yearlyCost = dailyCost * 365;

  return {
    ...room,
    lighting,
    bulb,
    actualWatts,
    totalPowerW: lighting.enabled ? totalPowerW : 0,
    hourlyCost: lighting.enabled ? hourlyCost : 0,
    dailyCost,
    monthlyCost,
    yearlyCost,
  };
}

// Calculate AC cost for one room using shared weather/price/month settings.
export function calculateRoomAC(
  room,
  sharedAcSettings,
  season,
  electricityPrice,
) {
  const ac = room.ac || defaultAcRoomSettings;
  if (!ac.enabled) {
    return {
      roomId: room.id,
      roomName: room.name,
      enabled: false,
      hourlyCost: 0,
      dailyCost: 0,
      monthlyCost: 0,
      seasonalCost: 0,
      estimatedKW: 0,
      loadBTU: 0,
      deltaT: 0,
    };
  }

  const result = calculateACCost({
    ...ac,
    outdoorTemp: Number.isFinite(Number(sharedAcSettings?.outdoorTemp))
      ? Number(sharedAcSettings.outdoorTemp)
      : 32,
    price: Number.isFinite(Number(electricityPrice))
      ? Number(electricityPrice)
      : 0.55,
    months: Number.isFinite(Number(sharedAcSettings?.months))
      ? Number(sharedAcSettings.months)
      : 3,
    season,
  });

  return {
    ...result,
    roomId: room.id,
    roomName: room.name,
    enabled: true,
  };
}

// Build one combined summary that the Home Dashboard can render.
export function calculateHomeSummary({
  rooms,
  acSettings,
  electricityPrice,
  bulbCatalog,
  season,
  boilerResult,
}) {
  const safeElectricityPrice = Number.isFinite(Number(electricityPrice))
    ? Number(electricityPrice)
    : 0.55;
  const acRooms = rooms.map((room) =>
    calculateRoomAC(room, acSettings, season, safeElectricityPrice),
  );
  const lightingRooms = rooms.map((room) =>
    calculateRoomLighting(room, safeElectricityPrice, bulbCatalog),
  );

  const acMonthly = acRooms.reduce(
    (sum, room) =>
      sum +
      (Number.isFinite(Number(room.monthlyCost))
        ? Number(room.monthlyCost)
        : 0),
    0,
  );
  const lightingMonthly = lightingRooms.reduce(
    (sum, room) =>
      sum +
      (Number.isFinite(Number(room.monthlyCost))
        ? Number(room.monthlyCost)
        : 0),
    0,
  );
  const boilerMonthly = Number.isFinite(Number(boilerResult?.monthlyCost))
    ? Number(boilerResult.monthlyCost)
    : 0;
  const totalMonthly = acMonthly + lightingMonthly + boilerMonthly;
  const totalDaily =
    acRooms.reduce(
      (sum, room) =>
        sum +
        (Number.isFinite(Number(room.dailyCost)) ? Number(room.dailyCost) : 0),
      0,
    ) +
    lightingRooms.reduce(
      (sum, room) =>
        sum +
        (Number.isFinite(Number(room.dailyCost)) ? Number(room.dailyCost) : 0),
      0,
    ) +
    (Number.isFinite(Number(boilerResult?.dailyCost))
      ? Number(boilerResult.dailyCost)
      : 0);

  const mergedRoomCosts = rooms.map((room) => {
    const ac = acRooms.find((item) => item.roomId === room.id);
    const lighting = lightingRooms.find((item) => item.id === room.id);
    const acMonthlyCost = Number.isFinite(Number(ac?.monthlyCost))
      ? Number(ac.monthlyCost)
      : 0;
    const lightingMonthlyCost = Number.isFinite(Number(lighting?.monthlyCost))
      ? Number(lighting.monthlyCost)
      : 0;
    const monthlyCost = acMonthlyCost + lightingMonthlyCost;
    return { id: room.id, name: room.name, ac, lighting, monthlyCost };
  });

  const mostExpensiveRoom = mergedRoomCosts.reduce((winner, room) => {
    if (!winner || room.monthlyCost > winner.monthlyCost) return room;
    return winner;
  }, null);

  return {
    acRooms,
    lightingRooms,
    roomCosts: mergedRoomCosts,
    acMonthly,
    lightingMonthly,
    boilerMonthly,
    totalDaily,
    totalMonthly,
    mostExpensiveRoom,
  };
}

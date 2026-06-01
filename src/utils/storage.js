export const STORAGE_KEYS = {
  appData: "tradepilot_data",
  tradePlans: "tradepilot.tradePlans"
};

export const TRADEPILOT_DATA_VERSION = "1.0";

export const defaultTradePilotData = {
  version: TRADEPILOT_DATA_VERSION,
  plans: [],
  history: [],
  settings: {},
  statistics: {}
};

export function getStorageItem(key, fallbackValue) {
  if (typeof window === "undefined" || !window.localStorage) {
    return fallbackValue;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export function setStorageItem(key, value) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeStorageItem(key) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  window.localStorage.removeItem(key);
}

export function normalizeTradePilotData(rawData, fallbackPlans = []) {
  const data = rawData && typeof rawData === "object" ? rawData : {};
  const plans = Array.isArray(data.plans) ? data.plans : fallbackPlans;

  return {
    version: typeof data.version === "string" ? data.version : TRADEPILOT_DATA_VERSION,
    plans,
    history: Array.isArray(data.history) ? data.history : [],
    settings: data.settings && typeof data.settings === "object" ? data.settings : {},
    statistics: data.statistics && typeof data.statistics === "object" ? data.statistics : {}
  };
}

export function getTradePilotData(fallbackPlans = []) {
  const storedData = getStorageItem(STORAGE_KEYS.appData, null);

  if (storedData) {
    return normalizeTradePilotData(storedData, fallbackPlans);
  }

  const legacyPlans = getStorageItem(STORAGE_KEYS.tradePlans, null);

  if (Array.isArray(legacyPlans)) {
    const migratedData = normalizeTradePilotData({ plans: legacyPlans }, fallbackPlans);
    saveTradePilotData(migratedData);
    removeStorageItem(STORAGE_KEYS.tradePlans);
    return migratedData;
  }

  return normalizeTradePilotData({ ...defaultTradePilotData, plans: fallbackPlans }, fallbackPlans);
}

export function saveTradePilotData(data) {
  const normalizedData = normalizeTradePilotData(data);
  setStorageItem(STORAGE_KEYS.appData, normalizedData);
  return normalizedData;
}

export function updateTradePilotData(updater) {
  const currentData = getTradePilotData();
  const nextData = typeof updater === "function" ? updater(currentData) : updater;
  return saveTradePilotData(nextData);
}

export function exportTradePilotData() {
  return JSON.stringify(getTradePilotData(), null, 2);
}

export function importTradePilotData(input) {
  const parsedData = typeof input === "string" ? JSON.parse(input) : input;
  return saveTradePilotData(normalizeTradePilotData(parsedData));
}

export function clearTradePilotData() {
  removeStorageItem(STORAGE_KEYS.appData);
  removeStorageItem(STORAGE_KEYS.tradePlans);
}

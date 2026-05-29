export const STORAGE_KEYS = {
  tradePlans: "tradepilot.tradePlans"
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

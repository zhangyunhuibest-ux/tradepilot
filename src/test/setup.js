import "@testing-library/jest-dom/vitest";

if (typeof window !== "undefined" && !window.localStorage) {
  const storage = new Map();

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      clear: () => storage.clear(),
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      removeItem: (key) => storage.delete(key),
      setItem: (key, value) => storage.set(key, String(value))
    }
  });
}

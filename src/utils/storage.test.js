import { describe, expect, it, beforeEach } from "vitest";
import {
  STORAGE_KEYS,
  clearTradePilotData,
  exportTradePilotData,
  getTradePilotData,
  importTradePilotData,
  setStorageItem
} from "./storage";

describe("tradepilot storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("restores unified tradepilot_data with default extension buckets", () => {
    const data = getTradePilotData([{ id: "sample-plan" }]);

    expect(data).toEqual({
      version: "1.0",
      plans: [{ id: "sample-plan" }],
      history: [],
      settings: {},
      statistics: {}
    });
  });

  it("migrates legacy trade plans into tradepilot_data", () => {
    setStorageItem(STORAGE_KEYS.tradePlans, [{ id: "legacy-plan", symbol: "BTC/USDT" }]);

    const data = getTradePilotData();

    expect(data.plans).toEqual([{ id: "legacy-plan", symbol: "BTC/USDT" }]);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.appData)).plans).toEqual([
      { id: "legacy-plan", symbol: "BTC/USDT" }
    ]);
    expect(window.localStorage.getItem(STORAGE_KEYS.tradePlans)).toBeNull();
  });

  it("imports and exports the unified JSON structure", () => {
    importTradePilotData(
      JSON.stringify({
        version: "1.0",
        plans: [{ id: "imported-plan" }],
        history: [{ id: "closed-plan" }],
        settings: { theme: "dark" },
        statistics: { totalTrades: 1 }
      })
    );

    expect(JSON.parse(exportTradePilotData())).toMatchObject({
      version: "1.0",
      plans: [{ id: "imported-plan" }],
      history: [{ id: "closed-plan" }],
      settings: { theme: "dark" },
      statistics: { totalTrades: 1 }
    });
  });

  it("clears unified and legacy storage keys", () => {
    importTradePilotData({ plans: [{ id: "plan" }] });
    setStorageItem(STORAGE_KEYS.tradePlans, [{ id: "legacy-plan" }]);

    clearTradePilotData();

    expect(window.localStorage.getItem(STORAGE_KEYS.appData)).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEYS.tradePlans)).toBeNull();
  });
});

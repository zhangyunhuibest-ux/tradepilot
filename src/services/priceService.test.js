import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchLivePrice, toBinanceSymbol } from "./priceService";

describe("priceService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes symbols for Binance ticker requests", () => {
    expect(toBinanceSymbol("BTC/USDT")).toBe("BTCUSDT");
    expect(toBinanceSymbol("sol/usdt")).toBe("SOLUSDT");
  });

  it("fetches and parses a live price", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ symbol: "ETHUSDT", price: "3500.25" })
      })
    );

    await expect(fetchLivePrice("ETH/USDT")).resolves.toMatchObject({
      price: 3500.25,
      source: "Binance",
      symbol: "ETHUSDT"
    });
  });

  it("throws a user-facing error when the API request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({})
      })
    );

    await expect(fetchLivePrice("BTC/USDT")).rejects.toThrow("价格获取失败");
  });
});

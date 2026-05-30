import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchLivePrice, getBaseAsset, toBinanceSymbol } from "./priceService";

describe("priceService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes symbols for Binance ticker requests", () => {
    expect(toBinanceSymbol("BTC/USDT")).toBe("BTCUSDT");
    expect(toBinanceSymbol("sol/usdt")).toBe("SOLUSDT");
    expect(getBaseAsset("ETH/USDT")).toBe("ETH");
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

  it("falls back to CoinGecko when Binance endpoints fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({})
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({})
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ solana: { usd: 175.42 } })
        })
    );

    await expect(fetchLivePrice("SOL/USDT")).resolves.toMatchObject({
      price: 175.42,
      source: "CoinGecko",
      symbol: "SOL/USDT"
    });
  });
});

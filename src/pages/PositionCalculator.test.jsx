import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PositionCalculator, { calculatePosition } from "./PositionCalculator";

function mockPriceResponse(price = "50000") {
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ symbol: "BTCUSDT", price })
  });
}

describe("calculatePosition", () => {
  it("calculates long position risk, margin, expected profit, and reward ratio", () => {
    const result = calculatePosition({
      side: "long",
      capital: 10000,
      riskPercent: 2,
      entryPrice: 50000,
      stopLossPrice: 49000,
      takeProfitPrice: 53000,
      leverage: 5
    });

    expect(result.maxLoss).toBe(200);
    expect(result.unitRisk).toBe(1000);
    expect(result.quantity).toBe(0.2);
    expect(result.positionValue).toBe(10000);
    expect(result.margin).toBe(2000);
    expect(result.expectedProfit).toBe(600);
    expect(result.rewardRiskRatio).toBe(3);
  });

  it("calculates short expected profit from entry minus take profit", () => {
    const result = calculatePosition({
      side: "short",
      capital: 10000,
      riskPercent: 1,
      entryPrice: 3000,
      stopLossPrice: 3100,
      takeProfitPrice: 2700,
      leverage: 10
    });

    expect(result.maxLoss).toBe(100);
    expect(result.unitRisk).toBe(100);
    expect(result.quantity).toBe(1);
    expect(result.positionValue).toBe(3000);
    expect(result.margin).toBe(300);
    expect(result.expectedProfit).toBe(300);
    expect(result.rewardRiskRatio).toBe(3);
  });
});

describe("PositionCalculator", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    mockPriceResponse();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders inputs and updates highlighted results", async () => {
    render(<PositionCalculator />);

    await screen.findByText("$50,000.00");
    fireEvent.change(screen.getByLabelText("币种"), { target: { value: "BTC/USDT" } });
    fireEvent.change(screen.getByLabelText("本金"), { target: { value: "10000" } });
    fireEvent.change(screen.getByLabelText("风险比例"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("开仓价"), { target: { value: "50000" } });
    fireEvent.change(screen.getByLabelText("止损价"), { target: { value: "49000" } });
    fireEvent.change(screen.getByLabelText("止盈价"), { target: { value: "53000" } });
    fireEvent.change(screen.getByLabelText("杠杆"), { target: { value: "5" } });

    expect(screen.getByText("最大亏损金额")).toBeInTheDocument();
    expect(screen.getByText("$200.00")).toBeInTheDocument();
    expect(screen.getByText("0.200000 BTC")).toBeInTheDocument();
    expect(screen.getByText("3.00 R")).toBeInTheDocument();
  });

  it("lets users search and select a single crypto symbol from the dropdown", async () => {
    render(<PositionCalculator />);

    await screen.findByText("$50,000.00");
    fireEvent.change(screen.getByLabelText("币种"), { target: { value: "sol" } });
    fireEvent.click(screen.getByRole("option", { name: "SOL/USDT Solana" }));

    expect(screen.getByLabelText("币种")).toHaveValue("SOL/USDT");
    expect(screen.getByText("0.200000 SOL")).toBeInTheDocument();
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT",
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
    );
  });

  it("loads live price into the entry price", async () => {
    render(<PositionCalculator />);

    await waitFor(() => expect(screen.getByLabelText("开仓价")).toHaveValue(50000));
    expect(screen.getByText("$50,000.00")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("shows an error state when live price fetching fails", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    });

    render(<PositionCalculator />);

    expect(await screen.findByText("价格获取失败")).toBeInTheDocument();
  });
});

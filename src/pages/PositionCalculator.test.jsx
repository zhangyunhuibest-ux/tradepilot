import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PositionCalculator, { calculatePosition } from "./PositionCalculator";
import { STORAGE_KEYS } from "../utils/storage";

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
    expect(result.marginUsageRate).toBe(0.2);
    expect(result.riskBuffer).toBe(8000);
    expect(result.estimatedLiquidationPrice).toBe(40000);
    expect(result.liquidationSafetySpace).toBe(18);
    expect(result.liquidationRiskLevel).toBe("非常安全");
    expect(result.liquidationRiskWarning).toBe("止损与爆仓价距离充足，爆仓风险相对较低。");
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
    expect(result.estimatedLiquidationPrice).toBeCloseTo(3300);
    expect(result.liquidationSafetySpace).toBeCloseTo(6.6666);
    expect(result.liquidationRiskLevel).toBe("安全");
    expect(result.expectedProfit).toBe(300);
    expect(result.rewardRiskRatio).toBe(3);
  });

  it("marks stop loss inside liquidation zone as high risk", () => {
    const result = calculatePosition({
      side: "long",
      capital: 10000,
      riskPercent: 2,
      entryPrice: 50000,
      stopLossPrice: 39900,
      takeProfitPrice: 53000,
      leverage: 5
    });

    expect(result.estimatedLiquidationPrice).toBe(40000);
    expect(result.liquidationRiskLevel).toBe("高风险");
    expect(result.liquidationRiskWarning).toBe("当前止损已经进入爆仓区域");
  });
});

describe("PositionCalculator", () => {
  beforeEach(() => {
    window.localStorage.clear();
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
    expect(screen.getByRole("heading", { name: "爆仓风险分析" })).toBeInTheDocument();
    expect(screen.getByText("爆仓安全空间")).toBeInTheDocument();
    expect(screen.getByText("当前爆仓价为简化估算，实际以交易所规则为准")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "交易质量评分" })).toBeInTheDocument();
    expect(screen.getByText("95")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
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

  it("clears the symbol search field with one click", async () => {
    render(<PositionCalculator />);

    await screen.findByText("$50,000.00");
    fireEvent.click(screen.getByRole("button", { name: "清空币种" }));

    expect(screen.getByLabelText("币种")).toHaveValue("");
  });

  it("clears numeric calculator fields with one click", async () => {
    render(<PositionCalculator />);

    await screen.findByText("$50,000.00");
    fireEvent.click(screen.getByRole("button", { name: "清空本金" }));

    expect(screen.getByLabelText("本金")).toHaveValue(null);
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

  it("adds the calculated setup to trade plans", async () => {
    render(<PositionCalculator />);

    await waitFor(() => expect(screen.getByLabelText("开仓价")).toHaveValue(50000));
    fireEvent.click(screen.getByRole("button", { name: "添加到交易计划" }));

    expect(await screen.findByText("已添加到交易计划")).toBeInTheDocument();

    const storedPlans = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.appData)).plans;
    expect(storedPlans[0]).toMatchObject({
      symbol: "BTC/USDT",
      side: "long",
      source: "calculator",
      status: "计划中",
      maxLoss: 200,
      quantity: 0.2,
      rewardRiskRatio: 3
    });
    expect(storedPlans[0].liquidationRiskLevel).toBe("非常安全");
    expect(storedPlans[0].liquidationRiskWarning).toBe("止损与爆仓价距离充足，爆仓风险相对较低。");
    expect(storedPlans[0].tradeScore).toBe(95);
    expect(storedPlans[0].tradeGrade).toBe("A");
    expect(storedPlans[0]).toMatchObject({
      review: null,
      actualEntryPrice: null,
      actualExitPrice: null,
      fee: null,
      slippage: null,
      notes: "",
      screenshots: []
    });
  });

  it("requires confirmation before adding D or F grade plans", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<PositionCalculator />);

    await waitFor(() => expect(screen.getByLabelText("开仓价")).toHaveValue(50000));
    fireEvent.change(screen.getByLabelText("风险比例"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("止盈价"), { target: { value: "50500" } });
    fireEvent.click(screen.getByRole("button", { name: "添加到交易计划" }));

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("当前交易评分为 F"));
    expect(window.localStorage.getItem(STORAGE_KEYS.appData)).toBeNull();
  });

  it("shows an error state when live price fetching fails", async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({})
    });

    render(<PositionCalculator />);

    expect(await screen.findByText("价格获取失败")).toBeInTheDocument();
  });
});

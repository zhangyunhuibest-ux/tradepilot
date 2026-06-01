import { describe, expect, it } from "vitest";
import { scoreTradeQuality } from "./scoreEngine";

const baseInput = {
  side: "long" as const,
  capital: 10000,
  riskPercent: 1,
  entryPrice: 100,
  stopLossPrice: 97,
  takeProfitPrice: 109,
  leverage: 3,
  rewardRiskRatio: 3,
  liquidationSafetySpace: 30,
  estimatedLiquidationPrice: 66.67
};

describe("scoreTradeQuality", () => {
  it("scores an excellent setup as A", () => {
    const result = scoreTradeQuality(baseInput);

    expect(result.tradeScore).toBe(100);
    expect(result.tradeGrade).toBe("A");
    expect(result.riskTags).toContain("优质交易");
    expect(result.scoreAdvice).toContain("可以执行");
  });

  it("scores lower reward risk and wider stops without vetoing", () => {
    const result = scoreTradeQuality({
      ...baseInput,
      riskPercent: 2.5,
      rewardRiskRatio: 1.4,
      stopLossPrice: 88,
      liquidationSafetySpace: 6,
      leverage: 8
    });

    expect(result.tradeScore).toBe(46);
    expect(result.tradeGrade).toBe("D");
    expect(result.scoreReasons).toEqual(
      expect.arrayContaining(["盈亏比偏低", "风险比例偏高", "止损过宽", "杠杆偏高"])
    );
  });

  it("forces F when reward risk is below one", () => {
    const result = scoreTradeQuality({
      ...baseInput,
      rewardRiskRatio: 0.8
    });

    expect(result.tradeGrade).toBe("F");
    expect(result.isVetoed).toBe(true);
    expect(result.scoreReasons).toContain("盈亏比过低");
  });

  it("scores very high reward risk lower because targets may be too far", () => {
    const result = scoreTradeQuality({
      ...baseInput,
      rewardRiskRatio: 6
    });

    expect(result.tradeScore).toBe(85);
    expect(result.tradeGrade).toBe("B");
    expect(result.scoreReasons).toContain("盈亏比过高");
  });

  it("forces F when risk percent is above five percent", () => {
    const result = scoreTradeQuality({
      ...baseInput,
      riskPercent: 5.5
    });

    expect(result.tradeGrade).toBe("F");
    expect(result.isVetoed).toBe(true);
    expect(result.scoreReasons).toContain("风险比例过高");
  });

  it("forces F when stop loss enters the liquidation zone", () => {
    const result = scoreTradeQuality({
      ...baseInput,
      stopLossPrice: 65,
      estimatedLiquidationPrice: 66.67,
      liquidationSafetySpace: 1.67
    });

    expect(result.tradeGrade).toBe("F");
    expect(result.isVetoed).toBe(true);
    expect(result.scoreReasons).toContain("止损进入爆仓区域");
    expect(result.riskTags).toContain("接近爆仓区域");
  });
});

export type TradeSide = "long" | "short";

export type RiskInput = {
  side: TradeSide;
  capital: number;
  riskPercent: number;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  leverage: number;
};

export type RiskResult = {
  maxLoss: number;
  unitRisk: number;
  quantity: number;
  positionValue: number;
  margin: number;
  marginUsageRate: number;
  riskBuffer: number;
  estimatedLiquidationPrice: number;
  liquidationSafetySpace: number;
  liquidationRiskLevel: "安全" | "正常" | "危险" | "极危险";
  expectedProfit: number;
  rewardRiskRatio: number;
  isValid: boolean;
};

export function calculateRisk(input: RiskInput): RiskResult {
  const maxLoss = input.capital * (input.riskPercent / 100);
  const unitRisk =
    input.side === "long"
      ? input.entryPrice - input.stopLossPrice
      : input.stopLossPrice - input.entryPrice;
  const quantity = unitRisk > 0 ? maxLoss / unitRisk : 0;
  const positionValue = quantity * input.entryPrice;
  const margin = input.leverage > 0 ? positionValue / input.leverage : 0;
  const marginUsageRate = input.capital > 0 ? margin / input.capital : 0;
  const riskBuffer = input.capital - margin;
  const estimatedLiquidationPrice =
    input.leverage > 0
      ? input.side === "long"
        ? input.entryPrice * (1 - 1 / input.leverage)
        : input.entryPrice * (1 + 1 / input.leverage)
      : 0;
  const liquidationSafetySpace =
    input.side === "long"
      ? input.stopLossPrice - estimatedLiquidationPrice
      : estimatedLiquidationPrice - input.stopLossPrice;
  const profitPerUnit =
    input.side === "long"
      ? input.takeProfitPrice - input.entryPrice
      : input.entryPrice - input.takeProfitPrice;
  const expectedProfit = quantity > 0 ? quantity * profitPerUnit : 0;
  const rewardRiskRatio = maxLoss > 0 ? expectedProfit / maxLoss : 0;

  return {
    maxLoss,
    unitRisk,
    quantity,
    positionValue,
    margin,
    marginUsageRate,
    riskBuffer,
    estimatedLiquidationPrice,
    liquidationSafetySpace,
    liquidationRiskLevel: getLiquidationRiskLevel(marginUsageRate),
    expectedProfit,
    rewardRiskRatio,
    isValid:
      unitRisk > 0 &&
      maxLoss > 0 &&
      input.entryPrice > 0 &&
      input.leverage > 0
  };
}

function getLiquidationRiskLevel(marginUsageRate: number): RiskResult["liquidationRiskLevel"] {
  if (marginUsageRate <= 0.3) {
    return "安全";
  }

  if (marginUsageRate <= 0.6) {
    return "正常";
  }

  if (marginUsageRate <= 0.8) {
    return "危险";
  }

  return "极危险";
}

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
  liquidationRiskLevel: "非常安全" | "安全" | "偏危险" | "高风险";
  liquidationRiskWarning: string;
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
    input.entryPrice > 0
      ? (Math.abs(input.stopLossPrice - estimatedLiquidationPrice) / input.entryPrice) * 100
      : 0;
  const liquidationRiskLevel = getLiquidationRiskLevel(input, estimatedLiquidationPrice, liquidationSafetySpace);
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
    liquidationRiskLevel,
    liquidationRiskWarning: getLiquidationRiskWarning(input, estimatedLiquidationPrice, liquidationRiskLevel),
    expectedProfit,
    rewardRiskRatio,
    isValid:
      unitRisk > 0 &&
      maxLoss > 0 &&
      input.entryPrice > 0 &&
      input.leverage > 0
  };
}

function isStopInLiquidationZone(input: RiskInput, estimatedLiquidationPrice: number) {
  if (input.side === "long") {
    return input.stopLossPrice <= estimatedLiquidationPrice;
  }

  return input.stopLossPrice >= estimatedLiquidationPrice;
}

function getLiquidationRiskLevel(
  input: RiskInput,
  estimatedLiquidationPrice: number,
  safetySpace: number
): RiskResult["liquidationRiskLevel"] {
  if (isStopInLiquidationZone(input, estimatedLiquidationPrice)) {
    return "高风险";
  }

  if (safetySpace > 10) {
    return "非常安全";
  }

  if (safetySpace >= 5) {
    return "安全";
  }

  if (safetySpace >= 2) {
    return "偏危险";
  }

  return "高风险";
}

function getLiquidationRiskWarning(
  input: RiskInput,
  estimatedLiquidationPrice: number,
  riskLevel: RiskResult["liquidationRiskLevel"]
) {
  if (isStopInLiquidationZone(input, estimatedLiquidationPrice)) {
    return "当前止损已经进入爆仓区域";
  }

  const warnings: Record<RiskResult["liquidationRiskLevel"], string> = {
    非常安全: "止损与爆仓价距离充足，爆仓风险相对较低。",
    安全: "止损与爆仓价保持基础缓冲，仍需关注剧烈波动。",
    偏危险: "爆仓安全空间低于 5%，需要降低杠杆或缩小仓位。",
    高风险: "爆仓安全空间小于 2%，止损与爆仓价过近。"
  };

  return warnings[riskLevel];
}

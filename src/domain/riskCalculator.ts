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
    expectedProfit,
    rewardRiskRatio,
    isValid:
      unitRisk > 0 &&
      maxLoss > 0 &&
      input.entryPrice > 0 &&
      input.leverage > 0
  };
}

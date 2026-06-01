import type { RiskInput, TradeSide } from "./riskCalculator";

export type TradeGrade = "A" | "B" | "C" | "D" | "F";

export type ScoreInput = RiskInput & {
  rewardRiskRatio: number;
  liquidationSafetySpace: number;
  estimatedLiquidationPrice: number;
};

export type TradeScoreResult = {
  tradeScore: number;
  tradeGrade: TradeGrade;
  riskTags: string[];
  scoreReasons: string[];
  scoreAdvice: string;
  isVetoed: boolean;
};

export function scoreTradeQuality(input: ScoreInput): TradeScoreResult {
  const rewardScore = scoreRewardRisk(input.rewardRiskRatio);
  const riskPercentScore = scoreRiskPercent(input.riskPercent);
  const liquidationScore = scoreLiquidationSpace(input.liquidationSafetySpace);
  const stopLossScore = scoreStopLossDistance(input.entryPrice, input.stopLossPrice);
  const leverageScore = scoreLeverage(input.leverage);
  const tradeScore =
    rewardScore + riskPercentScore + liquidationScore + stopLossScore + leverageScore;
  const scoreReasons = buildScoreReasons(input);
  const riskTags = buildRiskTags(input, scoreReasons);
  const isVetoed =
    input.rewardRiskRatio < 1 ||
    input.riskPercent > 5 ||
    isStopInLiquidationZone(input.side, input.stopLossPrice, input.estimatedLiquidationPrice);
  const tradeGrade = isVetoed ? "F" : gradeFromScore(tradeScore);

  return {
    tradeScore,
    tradeGrade,
    riskTags,
    scoreReasons,
    scoreAdvice: buildScoreAdvice(tradeGrade, isVetoed),
    isVetoed
  };
}

function scoreRewardRisk(rewardRiskRatio: number) {
  if (rewardRiskRatio > 5) return 20;
  if (rewardRiskRatio > 3) return 30;
  if (rewardRiskRatio >= 1.5) return 35;
  if (rewardRiskRatio >= 1) return 15;
  return 0;
}

function scoreRiskPercent(riskPercent: number) {
  if (riskPercent <= 1) return 25;
  if (riskPercent <= 2) return 20;
  if (riskPercent <= 3) return 10;
  return 0;
}

function scoreLiquidationSpace(liquidationSafetySpace: number) {
  if (liquidationSafetySpace > 10) return 20;
  if (liquidationSafetySpace >= 5) return 15;
  if (liquidationSafetySpace >= 2) return 8;
  return 0;
}

function scoreStopLossDistance(entryPrice: number, stopLossPrice: number) {
  const distance = stopLossDistancePercent(entryPrice, stopLossPrice);

  if (distance >= 1 && distance <= 5) return 15;
  if (distance >= 0.5 && distance < 1) return 8;
  if (distance > 5 && distance <= 10) return 8;
  if (distance > 10) return 3;
  return 0;
}

function scoreLeverage(leverage: number) {
  if (leverage <= 5) return 5;
  if (leverage <= 10) return 3;
  if (leverage <= 20) return 1;
  return 0;
}

function gradeFromScore(score: number): TradeGrade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

function stopLossDistancePercent(entryPrice: number, stopLossPrice: number) {
  if (entryPrice <= 0) return 0;
  return (Math.abs(entryPrice - stopLossPrice) / entryPrice) * 100;
}

function isStopInLiquidationZone(
  side: TradeSide,
  stopLossPrice: number,
  estimatedLiquidationPrice: number
) {
  if (side === "long") {
    return stopLossPrice <= estimatedLiquidationPrice;
  }

  return stopLossPrice >= estimatedLiquidationPrice;
}

function buildScoreReasons(input: ScoreInput) {
  const reasons: string[] = [];
  const stopDistance = stopLossDistancePercent(input.entryPrice, input.stopLossPrice);

  if (input.rewardRiskRatio < 1) {
    reasons.push("盈亏比过低");
  } else if (input.rewardRiskRatio < 1.5) {
    reasons.push("盈亏比偏低");
  } else if (input.rewardRiskRatio > 5) {
    reasons.push("盈亏比过高");
  } else if (input.rewardRiskRatio > 3) {
    reasons.push("盈亏比较高，止盈目标可能偏远");
  }

  if (input.riskPercent > 5) {
    reasons.push("风险比例过高");
  } else if (input.riskPercent > 2) {
    reasons.push("风险比例偏高");
  }

  if (isStopInLiquidationZone(input.side, input.stopLossPrice, input.estimatedLiquidationPrice)) {
    reasons.push("止损进入爆仓区域");
  } else if (input.liquidationSafetySpace < 2) {
    reasons.push("接近爆仓区域");
  }

  if (stopDistance < 0.5) {
    reasons.push("止损过近");
  } else if (stopDistance > 10) {
    reasons.push("止损过宽");
  } else if (stopDistance > 5) {
    reasons.push("止损偏宽");
  }

  if (input.leverage > 10) {
    reasons.push("杠杆过高");
  } else if (input.leverage > 5) {
    reasons.push("杠杆偏高");
  }

  if (reasons.length === 0) {
    reasons.push("交易结构健康");
  }

  return reasons;
}

function buildRiskTags(input: ScoreInput, reasons: string[]) {
  const tags = new Set<string>();

  if (input.rewardRiskRatio >= 2 && input.riskPercent <= 2) {
    tags.add("优质交易");
  }

  if (reasons.some((reason) => reason.includes("盈亏比"))) tags.add("盈亏比风险");
  if (reasons.some((reason) => reason.includes("风险比例"))) tags.add("仓位风险");
  if (reasons.some((reason) => reason.includes("爆仓"))) tags.add("接近爆仓区域");
  if (reasons.some((reason) => reason.includes("止损"))) tags.add("止损风险");
  if (reasons.some((reason) => reason.includes("杠杆"))) tags.add("杠杆风险");

  return Array.from(tags);
}

function buildScoreAdvice(grade: TradeGrade, isVetoed: boolean) {
  if (isVetoed) {
    return "不建议执行。请先提高盈亏比、降低风险比例，或让止损远离爆仓区域。";
  }

  const adviceByGrade: Record<TradeGrade, string> = {
    A: "可以执行。交易结构较优，仍需按计划执行止损。",
    B: "可以考虑执行。建议确认入场位置和市场波动后再开仓。",
    C: "谨慎执行。建议优化盈亏比、风险比例或止损位置。",
    D: "不建议直接执行。需要降低风险或重新设计交易计划。",
    F: "不建议交易。当前计划质量不足。"
  };

  return adviceByGrade[grade];
}

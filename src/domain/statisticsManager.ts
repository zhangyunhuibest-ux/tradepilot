import type { TradePlan } from "./planManager";

export type TradeStatistics = {
  totalTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  averageRewardRiskRatio: number;
  maxConsecutiveLosses: number;
  maxConsecutiveWins: number;
};

export function calculateStatistics(plans: TradePlan[]): TradeStatistics {
  const closedPlans = plans
    .filter((plan) => plan.status !== "已取消" && plan.finalResult)
    .sort((a, b) => (a.closeTime || "").localeCompare(b.closeTime || ""));
  const wins = closedPlans.filter((plan) => plan.finalResult === "win");
  const totalProfit = closedPlans
    .filter((plan) => (plan.finalProfit || 0) > 0)
    .reduce((sum, plan) => sum + Number(plan.finalProfit || 0), 0);
  const totalLoss = closedPlans
    .filter((plan) => (plan.finalProfit || 0) < 0)
    .reduce((sum, plan) => sum + Math.abs(Number(plan.finalProfit || 0)), 0);
  const rewardRatios = closedPlans.map((plan) => Number(plan.rewardRiskRatio || 0));

  return {
    totalTrades: closedPlans.length,
    winRate: closedPlans.length > 0 ? (wins.length / closedPlans.length) * 100 : 0,
    totalProfit,
    totalLoss,
    netProfit: totalProfit - totalLoss,
    averageRewardRiskRatio:
      rewardRatios.length > 0
        ? rewardRatios.reduce((sum, value) => sum + value, 0) / rewardRatios.length
        : 0,
    maxConsecutiveLosses: getMaxStreak(closedPlans, "loss"),
    maxConsecutiveWins: getMaxStreak(closedPlans, "win")
  };
}

function getMaxStreak(plans: TradePlan[], result: "win" | "loss") {
  let current = 0;
  let max = 0;

  for (const plan of plans) {
    if (plan.finalResult === result) {
      current += 1;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }

  return max;
}

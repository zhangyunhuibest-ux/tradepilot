import { activeStatuses, historyStatuses, type TradePlan } from "./planManager";
import { calculateStatistics } from "./statisticsManager";

type TradePilotData = {
  plans?: TradePlan[];
  settings?: Record<string, any>;
};

type DashboardTone = "neutral" | "profit" | "loss" | "warning" | "safe";

export type DashboardStat = {
  label: string;
  value: string;
  helper: string;
  tone: DashboardTone;
};

export type DashboardTrade = {
  symbol: string;
  side: string;
  pnl: string;
  rr: string;
  status: string;
  tone: DashboardTone;
};

export type DashboardViewModel = {
  stats: DashboardStat[];
  recentTrades: DashboardTrade[];
  recordCountLabel: string;
  riskBadge: {
    label: string;
    tone: DashboardTone;
  };
};

export function buildDashboardViewModel(
  data: TradePilotData,
  now = new Date()
): DashboardViewModel {
  const plans = Array.isArray(data.plans) ? data.plans : [];
  const activePlans = plans.filter((plan) => activeStatuses.includes(plan.status));
  const historyPlans = plans.filter((plan) => historyStatuses.includes(plan.status));
  const closedPlans = historyPlans.filter((plan) => plan.status !== "已取消" && plan.finalResult);
  const statistics = calculateStatistics(plans);
  const accountCapital = getAccountCapital(data, plans);
  const todayPlans = closedPlans.filter((plan) => isSameLocalDay(plan.closeTime, now));
  const weekPlans = closedPlans.filter((plan) => isSameLocalWeek(plan.closeTime, now));
  const todayPnl = sumProfit(todayPlans);
  const weekPnl = sumProfit(weekPlans);
  const activeRiskAmount = activePlans.reduce((sum, plan) => sum + Number(plan.maxLoss || 0), 0);
  const activeRiskPercent = accountCapital > 0 ? (activeRiskAmount / accountCapital) * 100 : 0;
  const riskBadge = getRiskBadge(activePlans, activeRiskPercent);
  const latestRiskPercent = getLatestRiskPercent(plans);
  const maxDrawdown = calculateMaxDrawdown(closedPlans, accountCapital);
  const recentTrades = historyPlans
    .slice()
    .sort((a, b) => getPlanTime(b).localeCompare(getPlanTime(a)))
    .slice(0, 5)
    .map(toDashboardTrade);

  return {
    stats: [
      {
        label: "账户本金",
        value: formatCurrency(accountCapital),
        helper:
          accountCapital > 0 ? "来自本地设置或最新交易计划本金" : "暂无本金记录，请先创建交易计划",
        tone: "neutral"
      },
      {
        label: "单笔风险比例",
        value: latestRiskPercent > 0 ? `${formatNumber(latestRiskPercent, 1)}%` : "--",
        helper: "来自最近一笔交易计划",
        tone: latestRiskPercent > 3 ? "loss" : latestRiskPercent > 2 ? "warning" : "safe"
      },
      {
        label: "今日盈亏",
        value: formatSignedCurrency(todayPnl),
        helper: `${todayPlans.length} 笔今日已结束交易`,
        tone: pnlTone(todayPnl)
      },
      {
        label: "本周盈亏",
        value: formatSignedCurrency(weekPnl),
        helper: `${weekPlans.length} 笔本周已结束交易`,
        tone: pnlTone(weekPnl)
      },
      {
        label: "胜率",
        value: `${formatNumber(statistics.winRate, 1)}%`,
        helper: `${statistics.totalTrades} 笔已计入统计`,
        tone: statistics.winRate >= 50 ? "profit" : statistics.totalTrades > 0 ? "warning" : "neutral"
      },
      {
        label: "最大回撤",
        value: maxDrawdown > 0 ? `-${formatNumber(maxDrawdown, 1)}%` : "0.0%",
        helper: "基于已结束交易盈亏曲线",
        tone: maxDrawdown >= 8 ? "loss" : maxDrawdown >= 4 ? "warning" : "safe"
      },
      {
        label: "当前交易计划",
        value: String(activePlans.length),
        helper: `${activePlans.filter((plan) => plan.status === "计划中").length} 个计划中 / ${activePlans.filter((plan) => plan.status === "已开仓").length} 个已开仓`,
        tone: activePlans.length > 0 ? "neutral" : "safe"
      },
      {
        label: "风险等级",
        value: riskBadge.label,
        helper: `当前风险敞口 ${formatNumber(activeRiskPercent, 1)}%`,
        tone: riskBadge.tone
      }
    ],
    recentTrades,
    recordCountLabel: `${recentTrades.length} records`,
    riskBadge
  };
}

function getAccountCapital(data: TradePilotData, plans: TradePlan[]) {
  const settingsCapital = Number(data.settings?.accountCapital);

  if (Number.isFinite(settingsCapital) && settingsCapital > 0) {
    return settingsCapital;
  }

  const latestPlan = plans
    .slice()
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))[0];

  return Number(latestPlan?.capital || 0);
}

function getLatestRiskPercent(plans: TradePlan[]) {
  const latestPlan = plans
    .slice()
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))[0];

  return Number(latestPlan?.riskPercent || 0);
}

function sumProfit(plans: TradePlan[]) {
  return plans.reduce((sum, plan) => sum + Number(plan.finalProfit || 0), 0);
}

function isSameLocalDay(value: string | null | undefined, now: Date) {
  if (!value) return false;

  const date = new Date(value);

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isSameLocalWeek(value: string | null | undefined, now: Date) {
  if (!value) return false;

  const date = new Date(value);
  const weekStart = startOfLocalWeek(now);
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(weekStart.getDate() + 7);

  return date >= weekStart && date < nextWeekStart;
}

function startOfLocalWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const distanceToMonday = day === 0 ? 6 : day - 1;

  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - distanceToMonday);
  return start;
}

function calculateMaxDrawdown(plans: TradePlan[], accountCapital: number) {
  if (accountCapital <= 0 || plans.length === 0) {
    return 0;
  }

  let equity = accountCapital;
  let peak = accountCapital;
  let maxDrawdown = 0;

  for (const plan of plans.slice().sort((a, b) => getPlanTime(a).localeCompare(getPlanTime(b)))) {
    equity += Number(plan.finalProfit || 0);
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak > 0 ? ((peak - equity) / peak) * 100 : 0);
  }

  return maxDrawdown;
}

function getRiskBadge(activePlans: TradePlan[], activeRiskPercent: number) {
  const hasHighRiskGrade = activePlans.some((plan) => plan.tradeGrade === "D" || plan.tradeGrade === "F");

  if (hasHighRiskGrade || activeRiskPercent > 6) {
    return { label: "Risk High", tone: "loss" as DashboardTone };
  }

  if (activeRiskPercent > 3) {
    return { label: "Risk Caution", tone: "warning" as DashboardTone };
  }

  return { label: "Risk Normal", tone: "safe" as DashboardTone };
}

function toDashboardTrade(plan: TradePlan): DashboardTrade {
  const finalProfit = Number(plan.finalProfit || 0);

  return {
    symbol: plan.symbol,
    side: plan.side === "short" ? "Short" : "Long",
    pnl: plan.status === "已取消" ? "--" : formatSignedCurrency(finalProfit),
    rr: `R:R ${formatNumber(Number(plan.rewardRiskRatio || 0), 2)}`,
    status: plan.status,
    tone: plan.status === "已取消" ? "neutral" : pnlTone(finalProfit)
  };
}

function getPlanTime(plan: TradePlan) {
  return plan.closeTime || plan.openTime || plan.createdAt || "";
}

function pnlTone(value: number): DashboardTone {
  if (value > 0) return "profit";
  if (value < 0) return "loss";
  return "neutral";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
}

function formatSignedCurrency(value: number) {
  const formatted = formatCurrency(Math.abs(value || 0));

  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return "$0.00";
}

function formatNumber(value: number, digits: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value || 0);
}

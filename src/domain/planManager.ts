import { calculateRisk, type RiskInput, type RiskResult, type TradeSide } from "./riskCalculator";
import { getStorageItem, setStorageItem, STORAGE_KEYS } from "../utils/storage";

export const PLAN_STATUSES = [
  "计划中",
  "已开仓",
  "已止盈",
  "已止损",
  "手动平仓",
  "已取消"
] as const;

export type PlanStatus = (typeof PLAN_STATUSES)[number];
export type PlanSource = "calculator" | "manual";
export type FinalResult = "win" | "loss" | "breakeven" | "cancelled" | null;

export type TradePlan = RiskInput &
  RiskResult & {
    id: string;
    symbol: string;
    createdAt: string;
    source: PlanSource;
    status: PlanStatus;
    openTime: string | null;
    closeTime: string | null;
    finalProfit: number | null;
    finalResult: FinalResult;
  };

export const activeStatuses: PlanStatus[] = ["计划中", "已开仓"];
export const historyStatuses: PlanStatus[] = ["已止盈", "已止损", "手动平仓", "已取消"];

export const samplePlans: TradePlan[] = [
  createPlan({
    source: "manual",
    symbol: "BTC/USDT",
    side: "long",
    capital: 10000,
    riskPercent: 2,
    entryPrice: 50800,
    stopLossPrice: 49600,
    takeProfitPrice: 54400,
    leverage: 5,
    status: "计划中",
    createdAt: "2026-05-29T10:30:00.000Z"
  }),
  updatePlanStatus(
    createPlan({
      source: "manual",
      symbol: "ETH/USDT",
      side: "short",
      capital: 8000,
      riskPercent: 1.5,
      entryPrice: 3840,
      stopLossPrice: 3920,
      takeProfitPrice: 3600,
      leverage: 4,
      status: "已开仓",
      createdAt: "2026-05-28T21:15:00.000Z"
    }),
    "已止盈",
    "2026-05-29T02:15:00.000Z"
  )
];

export function createPlan(input: {
  source: PlanSource;
  symbol: string;
  side: TradeSide;
  capital: number;
  riskPercent: number;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  leverage: number;
  status?: PlanStatus;
  createdAt?: string;
}): TradePlan {
  const risk = calculateRisk(input);

  return {
    id: `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    symbol: input.symbol.trim().toUpperCase() || "BTC/USDT",
    source: input.source,
    createdAt: input.createdAt || new Date().toISOString(),
    status: input.status || "计划中",
    openTime: null,
    closeTime: null,
    finalProfit: null,
    finalResult: null,
    side: input.side,
    capital: input.capital,
    riskPercent: input.riskPercent,
    entryPrice: input.entryPrice,
    stopLossPrice: input.stopLossPrice,
    takeProfitPrice: input.takeProfitPrice,
    leverage: input.leverage,
    ...risk
  };
}

export function createCalculatorPlan(input: RiskInput & { symbol: string }): TradePlan {
  return createPlan({
    ...input,
    source: "calculator"
  });
}

export function normalizePlan(rawPlan: any): TradePlan {
  const side = rawPlan.side === "做空" || rawPlan.side === "short" ? "short" : "long";
  const status = normalizeStatus(rawPlan.status);

  return {
    ...createPlan({
      source: rawPlan.source || "manual",
      symbol: rawPlan.symbol || "BTC/USDT",
      side,
      capital: Number(rawPlan.capital ?? 10000),
      riskPercent: Number(rawPlan.riskPercent ?? 2),
      entryPrice: Number(rawPlan.entryPrice ?? 0),
      stopLossPrice: Number(rawPlan.stopLossPrice ?? 0),
      takeProfitPrice: Number(rawPlan.takeProfitPrice ?? 0),
      leverage: Number(rawPlan.leverage ?? 1),
      status,
      createdAt: rawPlan.createdAt || rawPlan.time || new Date().toISOString()
    }),
    id: rawPlan.id || `plan-${Date.now()}`,
    openTime: rawPlan.openTime || null,
    closeTime: rawPlan.closeTime || null,
    finalProfit:
      rawPlan.finalProfit === null || rawPlan.finalProfit === undefined
        ? null
        : Number(rawPlan.finalProfit),
    finalResult: rawPlan.finalResult || deriveFinalResult(status, rawPlan.finalProfit)
  };
}

export function getStoredPlans(): TradePlan[] {
  return getStorageItem(STORAGE_KEYS.tradePlans, samplePlans).map(normalizePlan);
}

export function savePlans(plans: TradePlan[]) {
  setStorageItem(STORAGE_KEYS.tradePlans, plans);
}

export function addPlanToStorage(plan: TradePlan): TradePlan[] {
  const nextPlans = [plan, ...getStoredPlans()];
  savePlans(nextPlans);
  return nextPlans;
}

export function updatePlanStatus(
  plan: TradePlan,
  nextStatus: PlanStatus,
  timestamp = new Date().toISOString()
): TradePlan {
  const nextPlan: TradePlan = {
    ...plan,
    status: nextStatus
  };

  if (nextStatus === "已开仓" && !nextPlan.openTime) {
    nextPlan.openTime = timestamp;
  }

  if (nextStatus === "已取消") {
    nextPlan.closeTime = timestamp;
    nextPlan.finalProfit = null;
    nextPlan.finalResult = "cancelled";
  }

  if (nextStatus === "已止盈") {
    nextPlan.closeTime = timestamp;
    nextPlan.finalProfit = Number(nextPlan.expectedProfit || 0);
    nextPlan.finalResult = "win";
  }

  if (nextStatus === "已止损") {
    nextPlan.closeTime = timestamp;
    nextPlan.finalProfit = -Number(nextPlan.maxLoss || 0);
    nextPlan.finalResult = "loss";
  }

  if (nextStatus === "手动平仓") {
    nextPlan.closeTime = timestamp;
    nextPlan.finalProfit = nextPlan.finalProfit ?? 0;
    nextPlan.finalResult = deriveFinalResult(nextStatus, nextPlan.finalProfit);
  }

  return nextPlan;
}

function normalizeStatus(status: string): PlanStatus {
  const statusMap: Record<string, PlanStatus> = {
    已完成: "手动平仓",
    已盈利: "已止盈",
    已亏损: "已止损"
  };

  if (PLAN_STATUSES.includes(status as PlanStatus)) {
    return status as PlanStatus;
  }

  return statusMap[status] || "计划中";
}

function deriveFinalResult(status: PlanStatus, finalProfit: number | null): FinalResult {
  if (status === "已止盈") {
    return "win";
  }

  if (status === "已止损") {
    return "loss";
  }

  if (status === "已取消") {
    return "cancelled";
  }

  if (status === "手动平仓") {
    if ((finalProfit || 0) > 0) {
      return "win";
    }

    if ((finalProfit || 0) < 0) {
      return "loss";
    }

    return "breakeven";
  }

  return null;
}

import { describe, expect, it } from "vitest";
import { buildDashboardViewModel } from "./dashboardManager";

const now = new Date("2026-06-05T12:00:00+08:00");

function plan(overrides = {}) {
  return {
    id: "plan-1",
    symbol: "BTC/USDT",
    side: "long",
    status: "已止盈",
    capital: 10000,
    riskPercent: 2,
    maxLoss: 200,
    finalProfit: 300,
    finalResult: "win",
    rewardRiskRatio: 2,
    tradeScore: 88,
    tradeGrade: "B",
    createdAt: "2026-06-04T10:00:00+08:00",
    closeTime: "2026-06-05T09:30:00+08:00",
    ...overrides
  };
}

describe("buildDashboardViewModel", () => {
  it("aggregates principal, pnl, win rate, drawdown, and active risk from tradepilot_data", () => {
    const dashboard = buildDashboardViewModel(
      {
        settings: { accountCapital: 12000 },
        plans: [
          plan({
            id: "active-1",
            symbol: "SOL/USDT",
            status: "计划中",
            finalProfit: null,
            finalResult: null,
            maxLoss: 240,
            riskPercent: 2,
            createdAt: "2026-06-05T11:00:00+08:00"
          }),
          plan({
            id: "win-today",
            symbol: "BTC/USDT",
            finalProfit: 300,
            closeTime: "2026-06-05T09:30:00+08:00"
          }),
          plan({
            id: "loss-week",
            symbol: "ETH/USDT",
            side: "short",
            status: "已止损",
            finalProfit: -120,
            finalResult: "loss",
            rewardRiskRatio: 1.2,
            closeTime: "2026-06-03T15:00:00+08:00"
          }),
          plan({
            id: "cancelled",
            symbol: "DOGE/USDT",
            status: "已取消",
            finalProfit: null,
            finalResult: "cancelled",
            closeTime: "2026-06-05T10:00:00+08:00"
          })
        ]
      },
      now
    );

    expect(dashboard.stats.find((item) => item.label === "账户本金")?.value).toBe("$12,000.00");
    expect(dashboard.stats.find((item) => item.label === "今日盈亏")?.value).toBe("+$300.00");
    expect(dashboard.stats.find((item) => item.label === "本周盈亏")?.value).toBe("+$180.00");
    expect(dashboard.stats.find((item) => item.label === "胜率")?.value).toBe("50.0%");
    expect(dashboard.stats.find((item) => item.label === "当前交易计划")?.value).toBe("1");
    expect(dashboard.stats.find((item) => item.label === "风险等级")?.value).toBe("Risk Normal");
    expect(dashboard.recentTrades[0]).toMatchObject({
      symbol: "DOGE/USDT",
      status: "已取消"
    });
  });

  it("falls back to latest plan capital when settings do not include account capital", () => {
    const dashboard = buildDashboardViewModel(
      {
        plans: [
          plan({ capital: 8000, createdAt: "2026-06-01T10:00:00+08:00" }),
          plan({ capital: 15000, createdAt: "2026-06-05T10:00:00+08:00" })
        ]
      },
      now
    );

    expect(dashboard.stats.find((item) => item.label === "账户本金")?.value).toBe("$15,000.00");
  });

  it("marks risk as high when active exposure is too large or an active plan is F grade", () => {
    const dashboard = buildDashboardViewModel(
      {
        settings: { accountCapital: 10000 },
        plans: [
          plan({
            status: "已开仓",
            maxLoss: 800,
            tradeGrade: "F",
            finalProfit: null,
            finalResult: null
          })
        ]
      },
      now
    );

    expect(dashboard.stats.find((item) => item.label === "风险等级")?.value).toBe("Risk High");
    expect(dashboard.riskBadge.label).toBe("Risk High");
  });

  it("returns an empty recent trade list when no local plans exist", () => {
    const dashboard = buildDashboardViewModel({ plans: [] }, now);

    expect(dashboard.recentTrades).toEqual([]);
    expect(dashboard.recordCountLabel).toBe("0 records");
  });
});

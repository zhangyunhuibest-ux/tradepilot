import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Dashboard from "./Dashboard";
import { clearTradePilotData, importTradePilotData } from "../utils/storage";

describe("Dashboard", () => {
  beforeEach(() => {
    clearTradePilotData();
  });

  afterEach(() => {
    clearTradePilotData();
  });

  it("renders the TradePilot heading and key risk metrics", () => {
    render(<Dashboard />);

    expect(screen.getByRole("heading", { name: "TradePilot" })).toBeInTheDocument();
    expect(screen.getByText("账户本金")).toBeInTheDocument();
    expect(screen.getByText("单笔风险比例")).toBeInTheDocument();
    expect(screen.getByText("今日盈亏")).toBeInTheDocument();
    expect(screen.getByText("本周盈亏")).toBeInTheDocument();
    expect(screen.getByText("胜率")).toBeInTheDocument();
    expect(screen.getByText("最大回撤")).toBeInTheDocument();
    expect(screen.getByText("当前交易计划")).toBeInTheDocument();
    expect(screen.getByText("风险等级")).toBeInTheDocument();
  });

  it("renders dashboard values from local tradepilot_data", () => {
    importTradePilotData({
      version: "1.0",
      settings: { accountCapital: 12000 },
      plans: [
        {
          id: "active-1",
          symbol: "SOL/USDT",
          side: "long",
          status: "计划中",
          capital: 12000,
          riskPercent: 2,
          maxLoss: 240,
          rewardRiskRatio: 2.5,
          tradeGrade: "B",
          createdAt: "2026-06-05T11:00:00+08:00",
          openTime: null,
          closeTime: null,
          finalProfit: null,
          finalResult: null
        },
        {
          id: "win-today",
          symbol: "BTC/USDT",
          side: "long",
          status: "已止盈",
          capital: 12000,
          riskPercent: 1.5,
          maxLoss: 180,
          rewardRiskRatio: 2,
          tradeGrade: "B",
          createdAt: "2026-06-04T10:00:00+08:00",
          closeTime: "2026-06-05T09:30:00+08:00",
          finalProfit: 300,
          finalResult: "win"
        },
        {
          id: "loss-week",
          symbol: "ETH/USDT",
          side: "short",
          status: "已止损",
          capital: 12000,
          riskPercent: 1,
          maxLoss: 120,
          rewardRiskRatio: 1.2,
          tradeGrade: "C",
          createdAt: "2026-06-03T11:00:00+08:00",
          closeTime: "2026-06-03T15:00:00+08:00",
          finalProfit: -120,
          finalResult: "loss"
        }
      ],
      history: [],
      statistics: {}
    });

    render(<Dashboard />);

    expect(screen.getByText("$12,000.00")).toBeInTheDocument();
    expect(screen.getAllByText("+$300.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("+$180.00")).toBeInTheDocument();
    expect(screen.getByText("50.0%")).toBeInTheDocument();
    expect(screen.getAllByText("Risk Normal").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("2 records")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "最近交易记录" })).toBeInTheDocument();
    expect(screen.getByText("BTC/USDT")).toBeInTheDocument();
    expect(screen.getByText("ETH/USDT")).toBeInTheDocument();
    expect(screen.queryByText("SOL/USDT")).not.toBeInTheDocument();
    expect(screen.getByText("R:R 2.00")).toBeInTheDocument();
    expect(screen.getByText("已止盈")).toBeInTheDocument();
    expect(screen.getByText("已止损")).toBeInTheDocument();
  });

  it("shows an empty recent trade state when no local history exists", () => {
    render(<Dashboard />);

    expect(screen.getByText("0 records")).toBeInTheDocument();
    expect(screen.getByText(/暂无历史交易记录/)).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import Dashboard from "./Dashboard";

describe("Dashboard", () => {
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

  it("renders recent trade records with symbol, side, pnl, rr, and status", () => {
    render(<Dashboard />);

    expect(screen.getByRole("heading", { name: "最近交易记录" })).toBeInTheDocument();
    expect(screen.getByText("BTC/USDT")).toBeInTheDocument();
    expect(screen.getByText("ETH/USDT")).toBeInTheDocument();
    expect(screen.getByText("SOL/USDT")).toBeInTheDocument();
    expect(screen.getByText("R:R 2.4")).toBeInTheDocument();
    expect(screen.getAllByText("已复盘")).toHaveLength(2);
  });
});

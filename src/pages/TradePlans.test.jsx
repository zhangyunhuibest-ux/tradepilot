import { fireEvent, render, screen, within } from "@testing-library/react";
import TradePlans from "./TradePlans";
import { STORAGE_KEYS } from "../utils/storage";

function getStoredPlans() {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEYS.appData)).plans;
}

function getStoredData() {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEYS.appData));
}

function getPlanCard(symbol) {
  return screen.getByRole("heading", { name: symbol }).closest("article");
}

describe("TradePlans", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders lifecycle sections and statistics panel", () => {
    render(<TradePlans />);

    expect(screen.getByRole("heading", { name: "交易计划" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "交易统计" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "当前进行中交易" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "历史交易" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "BTC/USDT" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ETH/USDT" })).toBeInTheDocument();
    expect(screen.getByText("胜率")).toBeInTheDocument();
    expect(screen.getAllByText("交易评分").length).toBeGreaterThan(0);
    expect(screen.getAllByText("A").length).toBeGreaterThan(0);
  });

  it("moves a plan to open status and records openTime", () => {
    render(<TradePlans />);

    fireEvent.click(within(getPlanCard("BTC/USDT")).getByRole("button", { name: "已开仓" }));

    const btcPlan = getStoredPlans().find((plan) => plan.symbol === "BTC/USDT");
    expect(btcPlan.status).toBe("已开仓");
    expect(btcPlan.openTime).toEqual(expect.any(String));
    expect(getStoredData().history).toEqual(expect.any(Array));
  });

  it("archives stopped plans and records final loss", () => {
    render(<TradePlans />);

    fireEvent.click(within(getPlanCard("BTC/USDT")).getByRole("button", { name: "已止损" }));

    const btcPlan = getStoredPlans().find((plan) => plan.symbol === "BTC/USDT");
    expect(btcPlan.status).toBe("已止损");
    expect(btcPlan.closeTime).toEqual(expect.any(String));
    expect(btcPlan.finalResult).toBe("loss");
    expect(btcPlan.finalProfit).toBeLessThan(0);
    expect(getStoredData().history.some((plan) => plan.symbol === "BTC/USDT")).toBe(true);
    expect(getStoredData().statistics.totalTrades).toBeGreaterThan(0);
  });

  it("edits final profit for manual close plans", () => {
    render(<TradePlans />);

    fireEvent.click(within(getPlanCard("BTC/USDT")).getByRole("button", { name: "手动平仓" }));
    fireEvent.click(within(getPlanCard("BTC/USDT")).getByRole("button", { name: "编辑 BTC/USDT" }));
    fireEvent.change(screen.getByLabelText("编辑最终盈亏"), {
      target: { value: "125" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    const btcPlan = getStoredPlans().find((plan) => plan.symbol === "BTC/USDT");
    expect(btcPlan.finalProfit).toBe(125);
    expect(btcPlan.finalResult).toBe("win");
  });

  it("persists added manual trade plans and reloads them", () => {
    const { unmount } = render(<TradePlans />);

    fireEvent.click(screen.getByRole("button", { name: "新增交易计划" }));
    fireEvent.change(screen.getByLabelText("新增币种"), {
      target: { value: "DOGE/USDT" }
    });
    fireEvent.change(screen.getByLabelText("新增开仓价"), {
      target: { value: "0.18" }
    });
    fireEvent.change(screen.getByLabelText("新增止损价"), {
      target: { value: "0.16" }
    });
    fireEvent.change(screen.getByLabelText("新增止盈价"), {
      target: { value: "0.24" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存新增计划" }));

    expect(getStoredPlans().some((plan) => plan.symbol === "DOGE/USDT")).toBe(true);
    expect(getStoredPlans().find((plan) => plan.symbol === "DOGE/USDT")).toMatchObject({
      tradeGrade: expect.any(String),
      tradeScore: expect.any(Number),
      riskTags: expect.any(Array),
      review: null,
      actualEntryPrice: null,
      actualExitPrice: null,
      fee: null,
      slippage: null,
      notes: "",
      screenshots: []
    });

    unmount();
    render(<TradePlans />);

    expect(screen.getByRole("heading", { name: "DOGE/USDT" })).toBeInTheDocument();
  });

  it("syncs deletions to localStorage", () => {
    render(<TradePlans />);

    fireEvent.click(within(getPlanCard("ETH/USDT")).getByRole("button", { name: "删除 ETH/USDT" }));

    expect(getStoredPlans().some((plan) => plan.symbol === "ETH/USDT")).toBe(false);
  });
});

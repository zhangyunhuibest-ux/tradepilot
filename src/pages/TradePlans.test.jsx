import { fireEvent, render, screen, within } from "@testing-library/react";
import TradePlans from "./TradePlans";
import { STORAGE_KEYS } from "../utils/storage";

describe("TradePlans", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders mock trade plans in a responsive table", () => {
    render(<TradePlans />);

    const table = screen.getByRole("table", { name: "交易计划表格" });
    expect(screen.getByRole("heading", { name: "交易计划" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "币种" })).toBeInTheDocument();
    expect(within(table).getByText("BTC/USDT")).toBeInTheDocument();
    expect(within(table).getByText("SOL/USDT")).toBeInTheDocument();
    expect(within(table).getByDisplayValue("计划中")).toBeInTheDocument();
  });

  it("updates a plan status", () => {
    render(<TradePlans />);

    const table = screen.getByRole("table", { name: "交易计划表格" });
    const btcRow = within(table).getByRole("row", { name: /BTC\/USDT/ });
    fireEvent.change(within(btcRow).getByLabelText("修改 BTC/USDT 状态"), {
      target: { value: "已完成" }
    });

    expect(within(btcRow).getByDisplayValue("已完成")).toBeInTheDocument();
  });

  it("edits entry price for a plan", () => {
    render(<TradePlans />);

    const table = screen.getByRole("table", { name: "交易计划表格" });
    fireEvent.click(within(table).getByRole("button", { name: "编辑 BTC/USDT" }));
    fireEvent.change(screen.getByLabelText("编辑开仓价"), {
      target: { value: "51200" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    const btcRow = within(table).getByRole("row", { name: /BTC\/USDT/ });
    expect(within(btcRow).getByText("51,200")).toBeInTheDocument();
  });

  it("deletes a plan", () => {
    render(<TradePlans />);

    const table = screen.getByRole("table", { name: "交易计划表格" });
    fireEvent.click(within(table).getByRole("button", { name: "删除 ETH/USDT" }));

    expect(within(table).queryByText("ETH/USDT")).not.toBeInTheDocument();
  });

  it("persists added trade plans and reloads them from localStorage", () => {
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
    fireEvent.change(screen.getByLabelText("新增盈亏比"), {
      target: { value: "3" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存新增计划" }));

    const storedPlans = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.tradePlans));
    expect(storedPlans.some((plan) => plan.symbol === "DOGE/USDT")).toBe(true);

    unmount();
    render(<TradePlans />);

    const table = screen.getByRole("table", { name: "交易计划表格" });
    expect(within(table).getByText("DOGE/USDT")).toBeInTheDocument();
  });

  it("syncs deletions to localStorage", () => {
    render(<TradePlans />);

    const table = screen.getByRole("table", { name: "交易计划表格" });
    fireEvent.click(within(table).getByRole("button", { name: "删除 ETH/USDT" }));

    const storedPlans = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.tradePlans));
    expect(storedPlans.some((plan) => plan.symbol === "ETH/USDT")).toBe(false);
  });
});

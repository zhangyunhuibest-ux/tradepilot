import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import DataManagement from "./DataManagement";
import { STORAGE_KEYS, importTradePilotData } from "../utils/storage";

describe("DataManagement", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders JSON data management actions", () => {
    render(<DataManagement />);

    expect(screen.getByRole("heading", { name: "数据管理" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出 JSON" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出 Excel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导入 JSON" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "清空数据" })).toBeInTheDocument();
  });

  it("exports tradepilot data as an Excel-readable file", () => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn()
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn()
    });

    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:excel");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    importTradePilotData({
      plans: [
        {
          symbol: "BTC/USDT",
          side: "long",
          status: "计划中",
          entryPrice: 50000,
          stopLossPrice: 49000,
          takeProfitPrice: 53000,
          rewardRiskRatio: 3,
          tradeScore: 95,
          tradeGrade: "A"
        }
      ]
    });

    render(<DataManagement />);
    fireEvent.click(screen.getByRole("button", { name: "导出 Excel" }));

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:excel");
    expect(screen.getByText("数据已导出为 Excel")).toBeInTheDocument();
  });

  it("clears unified local data after confirmation", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    importTradePilotData({ plans: [{ id: "plan-to-clear" }] });

    render(<DataManagement />);
    fireEvent.click(screen.getByRole("button", { name: "清空数据" }));

    expect(window.localStorage.getItem(STORAGE_KEYS.appData)).toBeNull();
    expect(screen.getByText("本地数据已清空")).toBeInTheDocument();
  });

  it("imports a selected JSON file into tradepilot_data", async () => {
    render(<DataManagement />);

    const file = new File(
      [JSON.stringify({ version: "1.0", plans: [{ id: "imported-file-plan" }] })],
      "tradepilot-data.json",
      { type: "application/json" }
    );

    fireEvent.change(screen.getByLabelText("导入 JSON"), { target: { files: [file] } });

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.appData)).plans).toEqual([
        { id: "imported-file-plan" }
      ]);
    });
    expect(screen.getByText("数据导入成功")).toBeInTheDocument();
  });
});

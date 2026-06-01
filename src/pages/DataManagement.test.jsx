import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import DataManagement from "./DataManagement";
import { STORAGE_KEYS, importTradePilotData } from "../utils/storage";

describe("DataManagement", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders JSON data management actions", () => {
    render(<DataManagement />);

    expect(screen.getByRole("heading", { name: "数据管理" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出 JSON" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导入 JSON" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "清空数据" })).toBeInTheDocument();
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

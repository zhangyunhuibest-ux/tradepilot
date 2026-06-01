import { Database, Download, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import {
  clearTradePilotData,
  exportTradePilotData,
  importTradePilotData
} from "../utils/storage";

function ActionCard({ icon, title, description, children }) {
  return (
    <article className="rounded-lg border border-line/80 bg-panel/85 p-5 shadow-trading">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-profit/10 p-2 text-profit">{icon}</div>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </article>
  );
}

export default function DataManagement() {
  const [statusMessage, setStatusMessage] = useState("");
  const fileInputRef = useRef(null);

  function exportJson() {
    const blob = new Blob([exportTradePilotData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `tradepilot-data-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage("数据已导出为 JSON");
  }

  function importJson(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        importTradePilotData(String(reader.result || ""));
        setStatusMessage("数据导入成功");
      } catch {
        setStatusMessage("JSON 导入失败，请检查文件格式");
      } finally {
        event.target.value = "";
      }
    };

    reader.onerror = () => {
      setStatusMessage("JSON 导入失败，请检查文件格式");
      event.target.value = "";
    };

    reader.readAsText(file);
  }

  function clearData() {
    if (!window.confirm("确认清空 TradePilot 本地数据？此操作不可撤销。")) {
      return;
    }

    clearTradePilotData();
    setStatusMessage("本地数据已清空");
  }

  return (
    <main className="min-h-screen px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <section className="rounded-lg border border-line/80 bg-panel/85 p-5 shadow-trading">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-profit/10 p-2 text-profit">
              <Database aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-profit">
                Local Data Layer
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal text-white">
                数据管理
              </h1>
              <p className="mt-2 text-sm text-muted">
                统一管理 tradepilot_data，本地导入导出交易计划、历史记录与设置。
              </p>
            </div>
          </div>
          {statusMessage ? (
            <p className="mt-4 rounded-lg border border-profit/30 bg-profit/10 px-4 py-3 text-sm text-profit">
              {statusMessage}
            </p>
          ) : null}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ActionCard
            icon={<Download aria-hidden="true" className="h-5 w-5" />}
            title="导出 JSON"
            description="将当前本地数据导出为 JSON 文件，便于备份或迁移。"
          >
            <button
              className="w-full rounded-lg bg-profit px-4 py-3 font-semibold text-ink transition hover:bg-profit/90"
              type="button"
              onClick={exportJson}
            >
              导出 JSON
            </button>
          </ActionCard>

          <ActionCard
            icon={<Upload aria-hidden="true" className="h-5 w-5" />}
            title="导入 JSON"
            description="从备份文件恢复 TradePilot 数据，会覆盖当前本地数据。"
          >
            <input
              ref={fileInputRef}
              aria-label="导入 JSON"
              className="sr-only"
              type="file"
              accept="application/json,.json"
              onChange={importJson}
            />
            <button
              className="w-full rounded-lg border border-line bg-ink/70 px-4 py-3 font-semibold text-slate-200 transition hover:bg-panelSoft hover:text-white"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              导入 JSON
            </button>
          </ActionCard>

          <ActionCard
            icon={<Trash2 aria-hidden="true" className="h-5 w-5" />}
            title="清空数据"
            description="删除浏览器中的 TradePilot 本地数据，适合重新开始或测试。"
          >
            <button
              className="w-full rounded-lg border border-loss/40 bg-loss/10 px-4 py-3 font-semibold text-loss transition hover:bg-loss/15"
              type="button"
              onClick={clearData}
            >
              清空数据
            </button>
          </ActionCard>
        </section>
      </div>
    </main>
  );
}

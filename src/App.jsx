import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import PositionCalculator from "./pages/PositionCalculator";
import TradePlans from "./pages/TradePlans";

const navItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "calculator", label: "开仓计算器" },
  { id: "plans", label: "交易计划" }
];

export default function App() {
  const [activePage, setActivePage] = useState("calculator");

  return (
    <div className="min-h-screen text-slate-100">
      <nav className="sticky top-0 z-20 border-b border-line/80 bg-ink/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-profit">
              TradePilot
            </p>
            <p className="mt-1 text-sm text-muted">Personal Crypto Risk Control</p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-line bg-panel/80 p-1">
            {navItems.map((item) => {
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-profit text-ink"
                      : "text-slate-300 hover:bg-panelSoft hover:text-white"
                  }`}
                  type="button"
                  onClick={() => setActivePage(item.id)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {activePage === "dashboard" ? <Dashboard /> : null}
      {activePage === "calculator" ? <PositionCalculator /> : null}
      {activePage === "plans" ? <TradePlans /> : null}
    </div>
  );
}

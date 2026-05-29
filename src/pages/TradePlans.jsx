import { Plus, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getStorageItem, setStorageItem, STORAGE_KEYS } from "../utils/storage";

const planStatuses = ["计划中", "已完成", "已取消", "已盈利", "已亏损"];

const mockPlans = [
  {
    id: "plan-btc",
    time: "2026-05-29 10:30",
    symbol: "BTC/USDT",
    side: "做多",
    entryPrice: 50800,
    stopLossPrice: 49600,
    takeProfitPrice: 54400,
    rewardRiskRatio: 3,
    status: "计划中"
  },
  {
    id: "plan-eth",
    time: "2026-05-28 21:15",
    symbol: "ETH/USDT",
    side: "做空",
    entryPrice: 3840,
    stopLossPrice: 3920,
    takeProfitPrice: 3600,
    rewardRiskRatio: 3,
    status: "已盈利"
  },
  {
    id: "plan-sol",
    time: "2026-05-27 16:45",
    symbol: "SOL/USDT",
    side: "做多",
    entryPrice: 168,
    stopLossPrice: 158,
    takeProfitPrice: 190,
    rewardRiskRatio: 2.2,
    status: "已完成"
  },
  {
    id: "plan-avax",
    time: "2026-05-26 09:20",
    symbol: "AVAX/USDT",
    side: "做空",
    entryPrice: 41.2,
    stopLossPrice: 43,
    takeProfitPrice: 37.4,
    rewardRiskRatio: 2.1,
    status: "已取消"
  },
  {
    id: "plan-link",
    time: "2026-05-25 23:05",
    symbol: "LINK/USDT",
    side: "做多",
    entryPrice: 18.6,
    stopLossPrice: 17.8,
    takeProfitPrice: 20.1,
    rewardRiskRatio: 1.88,
    status: "已亏损"
  }
];

const statusStyles = {
  计划中: "border-warning/30 bg-warning/10 text-warning",
  已完成: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  已取消: "border-muted/30 bg-muted/10 text-muted",
  已盈利: "border-profit/30 bg-profit/10 text-profit",
  已亏损: "border-loss/30 bg-loss/10 text-loss"
};

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 2
  }).format(value);
}

function getCurrentMinute() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function useStoredTradePlans() {
  const [plans, setPlans] = useState(() =>
    getStorageItem(STORAGE_KEYS.tradePlans, mockPlans)
  );

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.tradePlans, plans);
  }, [plans]);

  return [plans, setPlans];
}

function StatusSelect({ plan, onChange }) {
  return (
    <select
      aria-label={`修改 ${plan.symbol} 状态`}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium outline-none ${statusStyles[plan.status]}`}
      value={plan.status}
      onChange={(event) => onChange(plan.id, event.target.value)}
    >
      {planStatuses.map((status) => (
        <option key={status} className="bg-ink text-slate-100" value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

function EditModal({ plan, onClose, onSave }) {
  const [draft, setDraft] = useState({
    entryPrice: String(plan.entryPrice),
    stopLossPrice: String(plan.stopLossPrice),
    takeProfitPrice: String(plan.takeProfitPrice),
    rewardRiskRatio: String(plan.rewardRiskRatio)
  });

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function savePlan() {
    onSave(plan.id, {
      entryPrice: Number(draft.entryPrice),
      stopLossPrice: Number(draft.stopLossPrice),
      takeProfitPrice: Number(draft.takeProfitPrice),
      rewardRiskRatio: Number(draft.rewardRiskRatio)
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/70 p-4 sm:items-center sm:justify-center">
      <section className="w-full rounded-lg border border-line bg-panel p-5 shadow-trading sm:max-w-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">{plan.symbol}</p>
            <h2 className="mt-1 text-xl font-semibold text-white">编辑交易计划</h2>
          </div>
          <button
            aria-label="关闭编辑"
            className="rounded-md p-2 text-muted transition hover:bg-panelSoft hover:text-white"
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            ["entryPrice", "编辑开仓价"],
            ["stopLossPrice", "编辑止损价"],
            ["takeProfitPrice", "编辑止盈价"],
            ["rewardRiskRatio", "编辑盈亏比"]
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-sm font-medium text-slate-300">{label}</span>
              <input
                className="mt-2 w-full rounded-lg border border-line bg-ink/70 px-3 py-3 text-white outline-none focus:border-profit/70"
                inputMode="decimal"
                type="number"
                value={draft[key]}
                onChange={(event) => updateDraft(key, event.target.value)}
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="rounded-lg border border-line px-4 py-2.5 font-medium text-slate-300 transition hover:bg-panelSoft hover:text-white"
            type="button"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="rounded-lg bg-profit px-4 py-2.5 font-semibold text-ink transition hover:bg-profit/90"
            type="button"
            onClick={savePlan}
          >
            保存修改
          </button>
        </div>
      </section>
    </div>
  );
}

function PlanFormModal({ onClose, onSave }) {
  const [draft, setDraft] = useState({
    symbol: "BTC/USDT",
    side: "做多",
    entryPrice: "50000",
    stopLossPrice: "49000",
    takeProfitPrice: "53000",
    rewardRiskRatio: "3"
  });

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function saveNewPlan() {
    onSave({
      id: `plan-${Date.now()}`,
      time: getCurrentMinute(),
      symbol: draft.symbol.trim().toUpperCase() || "BTC/USDT",
      side: draft.side,
      entryPrice: Number(draft.entryPrice),
      stopLossPrice: Number(draft.stopLossPrice),
      takeProfitPrice: Number(draft.takeProfitPrice),
      rewardRiskRatio: Number(draft.rewardRiskRatio),
      status: "计划中"
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/70 p-4 sm:items-center sm:justify-center">
      <section className="w-full rounded-lg border border-line bg-panel p-5 shadow-trading sm:max-w-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">New Trade Plan</p>
            <h2 className="mt-1 text-xl font-semibold text-white">新增交易计划</h2>
          </div>
          <button
            aria-label="关闭新增"
            className="rounded-md p-2 text-muted transition hover:bg-panelSoft hover:text-white"
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-300">新增币种</span>
            <input
              className="mt-2 w-full rounded-lg border border-line bg-ink/70 px-3 py-3 text-white outline-none focus:border-profit/70"
              value={draft.symbol}
              onChange={(event) => updateDraft("symbol", event.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-300">新增方向</span>
            <select
              className="mt-2 w-full rounded-lg border border-line bg-ink/70 px-3 py-3 text-white outline-none focus:border-profit/70"
              value={draft.side}
              onChange={(event) => updateDraft("side", event.target.value)}
            >
              <option>做多</option>
              <option>做空</option>
            </select>
          </label>
          {[
            ["entryPrice", "新增开仓价"],
            ["stopLossPrice", "新增止损价"],
            ["takeProfitPrice", "新增止盈价"],
            ["rewardRiskRatio", "新增盈亏比"]
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-sm font-medium text-slate-300">{label}</span>
              <input
                className="mt-2 w-full rounded-lg border border-line bg-ink/70 px-3 py-3 text-white outline-none focus:border-profit/70"
                inputMode="decimal"
                type="number"
                value={draft[key]}
                onChange={(event) => updateDraft(key, event.target.value)}
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="rounded-lg border border-line px-4 py-2.5 font-medium text-slate-300 transition hover:bg-panelSoft hover:text-white"
            type="button"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="rounded-lg bg-profit px-4 py-2.5 font-semibold text-ink transition hover:bg-profit/90"
            type="button"
            onClick={saveNewPlan}
          >
            保存新增计划
          </button>
        </div>
      </section>
    </div>
  );
}

function MobilePlanCard({ plan, onEdit, onDelete, onStatusChange }) {
  return (
    <article className="rounded-lg border border-line bg-panel/85 p-4 shadow-trading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{plan.symbol}</p>
          <p className="mt-1 text-sm text-muted">{plan.time}</p>
        </div>
        <StatusSelect plan={plan} onChange={onStatusChange} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <p>
          <span className="block text-muted">方向</span>
          <span className={plan.side === "做多" ? "text-profit" : "text-loss"}>
            {plan.side}
          </span>
        </p>
        <p>
          <span className="block text-muted">盈亏比</span>
          <span className="text-white">{plan.rewardRiskRatio.toFixed(2)} R</span>
        </p>
        <p>
          <span className="block text-muted">开仓价</span>
          <span className="text-white">{formatPrice(plan.entryPrice)}</span>
        </p>
        <p>
          <span className="block text-muted">止损价</span>
          <span className="text-loss">{formatPrice(plan.stopLossPrice)}</span>
        </p>
        <p>
          <span className="block text-muted">止盈价</span>
          <span className="text-profit">{formatPrice(plan.takeProfitPrice)}</span>
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          aria-label={`编辑 ${plan.symbol}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium text-slate-300 hover:bg-panelSoft hover:text-white"
          type="button"
          onClick={() => onEdit(plan)}
        >
          <Pencil aria-hidden="true" className="h-4 w-4" />
          编辑
        </button>
        <button
          aria-label={`删除 ${plan.symbol}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-loss/30 px-3 py-2 text-sm font-medium text-loss hover:bg-loss/10"
          type="button"
          onClick={() => onDelete(plan.id)}
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          删除
        </button>
      </div>
    </article>
  );
}

export default function TradePlans() {
  const [plans, setPlans] = useStoredTradePlans();
  const [editingPlan, setEditingPlan] = useState(null);
  const [isAddingPlan, setIsAddingPlan] = useState(false);

  function updateStatus(planId, status) {
    setPlans((currentPlans) =>
      currentPlans.map((plan) => (plan.id === planId ? { ...plan, status } : plan))
    );
  }

  function deletePlan(planId) {
    setPlans((currentPlans) => currentPlans.filter((plan) => plan.id !== planId));
  }

  function savePlan(planId, changes) {
    setPlans((currentPlans) =>
      currentPlans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              ...changes
            }
          : plan
      )
    );
    setEditingPlan(null);
  }

  function addPlan(plan) {
    setPlans((currentPlans) => [plan, ...currentPlans]);
    setIsAddingPlan(false);
  }

  return (
    <main className="min-h-screen px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rounded-lg border border-line/80 bg-panel/85 p-5 shadow-trading">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-profit">
            Trade Plan Board
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal text-white">
                交易计划
              </h1>
              <p className="mt-2 text-sm text-muted">
                管理开仓前计划、执行状态和关键价格位。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-fit rounded-full border border-line bg-ink/70 px-3 py-1.5 text-sm text-slate-300">
                {plans.length} plans
              </span>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-profit px-4 py-2.5 font-semibold text-ink transition hover:bg-profit/90"
                type="button"
                onClick={() => setIsAddingPlan(true)}
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                新增交易计划
              </button>
            </div>
          </div>
        </header>

        <section className="mt-5 hidden overflow-hidden rounded-lg border border-line bg-panel/85 shadow-trading md:block">
          <div className="overflow-x-auto">
            <table
              aria-label="交易计划表格"
              className="w-full min-w-[980px] border-collapse text-left"
            >
              <thead className="bg-ink/80 text-sm text-muted">
                <tr>
                  {[
                    "时间",
                    "币种",
                    "方向",
                    "开仓价",
                    "止损价",
                    "止盈价",
                    "盈亏比",
                    "状态",
                    "操作"
                  ].map((header) => (
                    <th key={header} className="px-4 py-3 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-panelSoft/45">
                    <td className="px-4 py-4 text-sm text-slate-300">{plan.time}</td>
                    <td className="px-4 py-4 font-semibold text-white">{plan.symbol}</td>
                    <td
                      className={`px-4 py-4 font-medium ${
                        plan.side === "做多" ? "text-profit" : "text-loss"
                      }`}
                    >
                      {plan.side}
                    </td>
                    <td className="px-4 py-4 text-slate-200">
                      {formatPrice(plan.entryPrice)}
                    </td>
                    <td className="px-4 py-4 text-loss">
                      {formatPrice(plan.stopLossPrice)}
                    </td>
                    <td className="px-4 py-4 text-profit">
                      {formatPrice(plan.takeProfitPrice)}
                    </td>
                    <td className="px-4 py-4 text-slate-200">
                      {plan.rewardRiskRatio.toFixed(2)} R
                    </td>
                    <td className="px-4 py-4">
                      <StatusSelect plan={plan} onChange={updateStatus} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          aria-label={`编辑 ${plan.symbol}`}
                          className="rounded-md border border-line p-2 text-slate-300 transition hover:bg-panelSoft hover:text-white"
                          type="button"
                          onClick={() => setEditingPlan(plan)}
                        >
                          <Pencil aria-hidden="true" className="h-4 w-4" />
                        </button>
                        <button
                          aria-label={`删除 ${plan.symbol}`}
                          className="rounded-md border border-loss/30 p-2 text-loss transition hover:bg-loss/10"
                          type="button"
                          onClick={() => deletePlan(plan.id)}
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-1 gap-4 md:hidden">
          {plans.map((plan) => (
            <MobilePlanCard
              key={plan.id}
              plan={plan}
              onDelete={deletePlan}
              onEdit={setEditingPlan}
              onStatusChange={updateStatus}
            />
          ))}
        </section>
      </div>

      {editingPlan ? (
        <EditModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSave={savePlan}
        />
      ) : null}
      {isAddingPlan ? (
        <PlanFormModal onClose={() => setIsAddingPlan(false)} onSave={addPlan} />
      ) : null}
    </main>
  );
}

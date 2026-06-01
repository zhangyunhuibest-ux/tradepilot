import { BarChart3, Pencil, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  PLAN_STATUSES,
  activeStatuses,
  createPlan,
  historyStatuses,
  recalculatePlan,
  updatePlanStatus
} from "../domain/planManager";
import { calculateStatistics } from "../domain/statisticsManager";
import { useTradePlans } from "../hooks/useTradePlans";

const statusStyles = {
  计划中: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  已开仓: "border-warning/30 bg-warning/10 text-warning",
  已止盈: "border-profit/30 bg-profit/10 text-profit",
  已止损: "border-loss/30 bg-loss/10 text-loss",
  手动平仓: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  已取消: "border-muted/30 bg-muted/10 text-muted"
};

const gradeStyles = {
  A: "border-profit/30 bg-profit/10 text-profit",
  B: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  C: "border-warning/30 bg-warning/10 text-warning",
  D: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  F: "border-loss/30 bg-loss/10 text-loss"
};

const numberFields = [
  ["capital", "本金"],
  ["riskPercent", "风险比例"],
  ["entryPrice", "开仓价"],
  ["stopLossPrice", "止损价"],
  ["takeProfitPrice", "止盈价"],
  ["leverage", "杠杆"]
];

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Math.abs(value || 0) >= 100 ? 0 : 4
  }).format(value || 0);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
}

function formatTime(value) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function sideLabel(side) {
  return side === "short" ? "做空" : "做多";
}

function StatisticsPanel({ statistics }) {
  const cards = [
    ["总交易次数", statistics.totalTrades],
    ["胜率", `${statistics.winRate.toFixed(1)}%`],
    ["总盈利", formatCurrency(statistics.totalProfit), "profit"],
    ["总亏损", formatCurrency(statistics.totalLoss), "loss"],
    ["净收益", formatCurrency(statistics.netProfit), statistics.netProfit >= 0 ? "profit" : "loss"],
    ["平均盈亏比", `${statistics.averageRewardRiskRatio.toFixed(2)} R`],
    ["最大连续亏损", statistics.maxConsecutiveLosses, "loss"],
    ["最大连续盈利", statistics.maxConsecutiveWins, "profit"]
  ];

  return (
    <section className="rounded-lg border border-line/80 bg-panel/85 p-5 shadow-trading">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-profit/10 p-2 text-profit">
          <BarChart3 aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-profit">
            Trading Performance
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">交易统计</h2>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([label, value, tone]) => (
          <article key={label} className="rounded-lg border border-line bg-ink/70 p-4">
            <p className="text-xs text-muted">{label}</p>
            <p
              className={`mt-2 text-xl font-semibold ${
                tone === "profit"
                  ? "text-profit"
                  : tone === "loss"
                    ? "text-loss"
                    : "text-white"
              }`}
            >
              {value}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StatusActions({ plan, onStatusChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PLAN_STATUSES.map((status) => {
        const isActive = plan.status === status;
        return (
          <button
            key={status}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              isActive ? statusStyles[status] : "border-line bg-ink/60 text-muted hover:text-white"
            }`}
            type="button"
            onClick={() => onStatusChange(plan.id, status)}
          >
            {status}
          </button>
        );
      })}
    </div>
  );
}

function PlanSummary({ plan, muted = false }) {
  return (
    <div className={`grid grid-cols-2 gap-3 text-sm ${muted ? "text-slate-400" : ""}`}>
      <p>
        <span className="block text-muted">交易评分</span>
        <span className="font-semibold text-white">{plan.tradeScore}</span>
        <span className={`ml-2 rounded-full border px-2 py-0.5 text-xs ${gradeStyles[plan.tradeGrade]}`}>
          {plan.tradeGrade}
        </span>
      </p>
      <p>
        <span className="block text-muted">方向</span>
        <span className={plan.side === "long" ? "text-profit" : "text-loss"}>
          {sideLabel(plan.side)}
        </span>
      </p>
      <p>
        <span className="block text-muted">盈亏比</span>
        <span>{plan.rewardRiskRatio.toFixed(2)} R</span>
      </p>
      <p>
        <span className="block text-muted">开仓价</span>
        <span>{formatPrice(plan.entryPrice)}</span>
      </p>
      <p>
        <span className="block text-muted">止损价</span>
        <span className="text-loss">{formatPrice(plan.stopLossPrice)}</span>
      </p>
      <p>
        <span className="block text-muted">止盈价</span>
        <span className="text-profit">{formatPrice(plan.takeProfitPrice)}</span>
      </p>
      <p>
        <span className="block text-muted">最终盈亏</span>
        <span className={(plan.finalProfit || 0) >= 0 ? "text-profit" : "text-loss"}>
          {plan.finalProfit === null ? "--" : formatCurrency(plan.finalProfit)}
        </span>
      </p>
      <div className="col-span-2">
        <span className="block text-muted">风险标签</span>
        <div className="mt-1 flex flex-wrap gap-2">
          {(plan.riskTags || []).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-line bg-ink/60 px-2 py-0.5 text-xs text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, muted = false, onEdit, onDelete, onStatusChange }) {
  return (
    <article
      className={`rounded-lg border p-4 shadow-trading ${
        muted
          ? "border-line/60 bg-panel/45 opacity-75"
          : "border-profit/30 bg-panel/85"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">{plan.symbol}</h3>
            <span className={`rounded-full border px-2.5 py-1 text-xs ${statusStyles[plan.status]}`}>
              {plan.status}
            </span>
            <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">
              {plan.source}
            </span>
            <span className={`rounded-full border px-2.5 py-1 text-xs ${gradeStyles[plan.tradeGrade]}`}>
              {plan.tradeGrade} · {plan.tradeScore}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">创建 {formatTime(plan.createdAt)}</p>
          {plan.openTime ? <p className="text-xs text-muted">开仓 {formatTime(plan.openTime)}</p> : null}
          {plan.closeTime ? <p className="text-xs text-muted">结束 {formatTime(plan.closeTime)}</p> : null}
        </div>
        <div className="flex gap-2">
          <button
            aria-label={`编辑 ${plan.symbol}`}
            className="rounded-md border border-line p-2 text-muted hover:bg-panelSoft hover:text-white"
            type="button"
            onClick={() => onEdit(plan)}
          >
            <Pencil aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            aria-label={`删除 ${plan.symbol}`}
            className="rounded-md border border-loss/30 p-2 text-loss hover:bg-loss/10"
            type="button"
            onClick={() => onDelete(plan.id)}
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-4">
        <PlanSummary plan={plan} muted={muted} />
      </div>
      <div className="mt-4 border-t border-line/70 pt-4">
        <StatusActions plan={plan} onStatusChange={onStatusChange} />
      </div>
    </article>
  );
}

function EditModal({ plan, onClose, onSave }) {
  const [draft, setDraft] = useState({
    entryPrice: String(plan.entryPrice),
    stopLossPrice: String(plan.stopLossPrice),
    takeProfitPrice: String(plan.takeProfitPrice),
    leverage: String(plan.leverage),
    finalProfit: String(plan.finalProfit ?? "")
  });

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function savePlan() {
    onSave(plan.id, {
      entryPrice: Number(draft.entryPrice),
      stopLossPrice: Number(draft.stopLossPrice),
      takeProfitPrice: Number(draft.takeProfitPrice),
      leverage: Number(draft.leverage),
      finalProfit: draft.finalProfit === "" ? null : Number(draft.finalProfit)
    });
  }

  return (
    <Modal title="编辑交易计划" eyebrow={plan.symbol} onClose={onClose}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          ["entryPrice", "编辑开仓价"],
          ["stopLossPrice", "编辑止损价"],
          ["takeProfitPrice", "编辑止盈价"],
          ["leverage", "编辑杠杆"],
          ["finalProfit", "编辑最终盈亏"]
        ].map(([key, label]) => (
          <Field key={key} label={label}>
            <input
              className="mt-2 w-full rounded-lg border border-line bg-ink/70 px-3 py-3 text-white outline-none focus:border-profit/70"
              inputMode="decimal"
              type="number"
              value={draft[key]}
              onChange={(event) => updateDraft(key, event.target.value)}
            />
          </Field>
        ))}
      </div>
      <ModalActions onClose={onClose} onSave={savePlan} saveLabel="保存修改" />
    </Modal>
  );
}

function PlanFormModal({ onClose, onSave }) {
  const [draft, setDraft] = useState({
    symbol: "BTC/USDT",
    side: "long",
    capital: "10000",
    riskPercent: "2",
    entryPrice: "50000",
    stopLossPrice: "49000",
    takeProfitPrice: "53000",
    leverage: "5"
  });

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function saveNewPlan() {
    onSave(
      createPlan({
        source: "manual",
        symbol: draft.symbol,
        side: draft.side,
        capital: Number(draft.capital),
        riskPercent: Number(draft.riskPercent),
        entryPrice: Number(draft.entryPrice),
        stopLossPrice: Number(draft.stopLossPrice),
        takeProfitPrice: Number(draft.takeProfitPrice),
        leverage: Number(draft.leverage)
      })
    );
  }

  return (
    <Modal title="新增交易计划" eyebrow="New Trade Plan" onClose={onClose}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="新增币种">
          <input
            className="mt-2 w-full rounded-lg border border-line bg-ink/70 px-3 py-3 text-white outline-none focus:border-profit/70"
            value={draft.symbol}
            onChange={(event) => updateDraft("symbol", event.target.value)}
          />
        </Field>
        <Field label="新增方向">
          <select
            className="mt-2 w-full rounded-lg border border-line bg-ink/70 px-3 py-3 text-white outline-none focus:border-profit/70"
            value={draft.side}
            onChange={(event) => updateDraft("side", event.target.value)}
          >
            <option value="long">做多</option>
            <option value="short">做空</option>
          </select>
        </Field>
        {numberFields.map(([key, label]) => (
          <Field key={key} label={`新增${label}`}>
            <input
              className="mt-2 w-full rounded-lg border border-line bg-ink/70 px-3 py-3 text-white outline-none focus:border-profit/70"
              inputMode="decimal"
              type="number"
              value={draft[key]}
              onChange={(event) => updateDraft(key, event.target.value)}
            />
          </Field>
        ))}
      </div>
      <ModalActions onClose={onClose} onSave={saveNewPlan} saveLabel="保存新增计划" />
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, eyebrow, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/70 p-4 sm:items-center sm:justify-center">
      <section className="w-full rounded-lg border border-line bg-panel p-5 shadow-trading sm:max-w-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">{eyebrow}</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
          </div>
          <button
            aria-label="关闭弹窗"
            className="rounded-md p-2 text-muted transition hover:bg-panelSoft hover:text-white"
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}

function ModalActions({ onClose, onSave, saveLabel }) {
  return (
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
        onClick={onSave}
      >
        {saveLabel}
      </button>
    </div>
  );
}

export default function TradePlans() {
  const [plans, setPlans] = useTradePlans();
  const [editingPlan, setEditingPlan] = useState(null);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const statistics = useMemo(() => calculateStatistics(plans), [plans]);
  const activePlans = plans.filter((plan) => activeStatuses.includes(plan.status));
  const historyPlans = plans.filter((plan) => historyStatuses.includes(plan.status));

  function changeStatus(planId, status) {
    setPlans((current) =>
      current.map((plan) => (plan.id === planId ? updatePlanStatus(plan, status) : plan))
    );
  }

  function savePlan(planId, updates) {
    setPlans((current) =>
      current.map((plan) => {
        if (plan.id !== planId) {
          return plan;
        }

        const nextPlan = recalculatePlan(plan, {
          entryPrice: updates.entryPrice,
          stopLossPrice: updates.stopLossPrice,
          takeProfitPrice: updates.takeProfitPrice,
          leverage: updates.leverage
        });

        return {
          ...nextPlan,
          finalProfit: updates.finalProfit,
          finalResult:
            updates.finalProfit === null || updates.finalProfit === undefined
              ? plan.finalResult
              : updates.finalProfit > 0
                ? "win"
                : updates.finalProfit < 0
                  ? "loss"
                  : "breakeven"
        };
      })
    );
    setEditingPlan(null);
  }

  function addPlan(plan) {
    setPlans((current) => [plan, ...current]);
    setIsAddingPlan(false);
  }

  function deletePlan(planId) {
    setPlans((current) => current.filter((plan) => plan.id !== planId));
  }

  return (
    <main className="min-h-screen px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <section className="flex flex-col gap-4 rounded-lg border border-line/80 bg-panel/85 p-5 shadow-trading sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-profit">
              Trade Lifecycle
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-white">
              交易计划
            </h1>
            <p className="mt-2 text-sm text-muted">
              从计划、开仓、止盈止损到历史复盘，统一管理所有交易计划。
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-profit px-4 py-3 font-semibold text-ink hover:bg-profit/90"
            type="button"
            onClick={() => setIsAddingPlan(true)}
          >
            <Plus aria-hidden="true" className="h-5 w-5" />
            新增交易计划
          </button>
        </section>

        <StatisticsPanel statistics={statistics} />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">当前进行中交易</h2>
          {activePlans.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {activePlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onEdit={setEditingPlan}
                  onDelete={deletePlan}
                  onStatusChange={changeStatus}
                />
              ))}
            </div>
          ) : (
            <EmptyState label="暂无进行中的交易计划" />
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">历史交易</h2>
          {historyPlans.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {historyPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  muted
                  onEdit={setEditingPlan}
                  onDelete={deletePlan}
                  onStatusChange={changeStatus}
                />
              ))}
            </div>
          ) : (
            <EmptyState label="暂无历史交易" />
          )}
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

function EmptyState({ label }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-panel/50 p-8 text-center text-muted">
      {label}
    </div>
  );
}

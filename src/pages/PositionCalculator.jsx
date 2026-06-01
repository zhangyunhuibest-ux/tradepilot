import {
  Calculator,
  Check,
  ChevronDown,
  ClipboardPlus,
  Search,
  ShieldCheck,
  ShieldAlert,
  Target,
  TrendingUp,
  Wallet,
  Wifi,
  WifiOff,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createCalculatorPlan, addPlanToStorage } from "../domain/planManager";
import { calculateRisk } from "../domain/riskCalculator";
import { scoreTradeQuality } from "../domain/scoreEngine";
import { useLivePrice } from "../hooks/useLivePrice";

const initialForm = {
  symbol: "BTC/USDT",
  side: "long",
  capital: "10000",
  riskPercent: "2",
  entryPrice: "50000",
  stopLossPrice: "49000",
  takeProfitPrice: "53000",
  leverage: "5"
};

const numberFields = [
  { key: "capital", label: "本金", suffix: "USDT", step: "100" },
  { key: "riskPercent", label: "风险比例", suffix: "%", step: "0.1" },
  { key: "entryPrice", label: "开仓价", suffix: "USDT", step: "0.01" },
  { key: "stopLossPrice", label: "止损价", suffix: "USDT", step: "0.01" },
  { key: "takeProfitPrice", label: "止盈价", suffix: "USDT", step: "0.01" },
  { key: "leverage", label: "杠杆", suffix: "x", step: "1" }
];

const cryptoSymbols = [
  { symbol: "BTC/USDT", name: "Bitcoin" },
  { symbol: "ETH/USDT", name: "Ethereum" },
  { symbol: "SOL/USDT", name: "Solana" },
  { symbol: "BNB/USDT", name: "BNB" },
  { symbol: "XRP/USDT", name: "XRP" },
  { symbol: "DOGE/USDT", name: "Dogecoin" },
  { symbol: "ADA/USDT", name: "Cardano" },
  { symbol: "AVAX/USDT", name: "Avalanche" },
  { symbol: "LINK/USDT", name: "Chainlink" },
  { symbol: "DOT/USDT", name: "Polkadot" },
  { symbol: "TRX/USDT", name: "TRON" },
  { symbol: "TON/USDT", name: "Toncoin" },
  { symbol: "MATIC/USDT", name: "Polygon" },
  { symbol: "NEAR/USDT", name: "NEAR Protocol" },
  { symbol: "APT/USDT", name: "Aptos" },
  { symbol: "ARB/USDT", name: "Arbitrum" },
  { symbol: "OP/USDT", name: "Optimism" },
  { symbol: "SUI/USDT", name: "Sui" },
  { symbol: "INJ/USDT", name: "Injective" },
  { symbol: "ATOM/USDT", name: "Cosmos" },
  { symbol: "LTC/USDT", name: "Litecoin" },
  { symbol: "BCH/USDT", name: "Bitcoin Cash" },
  { symbol: "UNI/USDT", name: "Uniswap" },
  { symbol: "AAVE/USDT", name: "Aave" },
  { symbol: "FIL/USDT", name: "Filecoin" },
  { symbol: "ETC/USDT", name: "Ethereum Classic" },
  { symbol: "SEI/USDT", name: "Sei" },
  { symbol: "WIF/USDT", name: "dogwifhat" },
  { symbol: "PEPE/USDT", name: "Pepe" },
  { symbol: "ORDI/USDT", name: "Ordinals" }
];

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculatePosition({
  side,
  capital,
  riskPercent,
  entryPrice,
  stopLossPrice,
  takeProfitPrice,
  leverage
}) {
  const input = {
    side,
    capital,
    riskPercent,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    leverage
  };
  const risk = calculateRisk(input);
  const score = scoreTradeQuality({ ...input, ...risk });

  return {
    ...risk,
    ...score
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
}

function formatPrice(value) {
  if (!value) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: value >= 1 ? 2 : 6,
    maximumFractionDigits: value >= 1 ? 2 : 8
  }).format(value);
}

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value || 0);
}

function LivePriceCard({ symbol, priceState }) {
  const hasError = Boolean(priceState.error);
  const statusLabel = hasError
    ? "价格获取失败"
    : priceState.isLoading
      ? "价格同步中"
      : "实时价格";
  const updatedTime = priceState.updatedAt
    ? new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }).format(new Date(priceState.updatedAt))
    : "--";
  const Icon = hasError ? WifiOff : Wifi;

  return (
    <section className="rounded-lg border border-profit/20 bg-ink/80 p-4 shadow-trading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-md p-2 ${
              hasError ? "bg-loss/10 text-loss" : "bg-profit/10 text-profit"
            }`}
          >
            <Icon aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-profit">
              Live Market Price
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-normal text-white">
              {symbol}
            </h2>
          </div>
        </div>

        <div className="sm:text-right">
          <p
            className={`text-2xl font-semibold tracking-normal ${
              hasError ? "text-loss" : "text-profit"
            }`}
          >
            {hasError ? "价格获取失败" : `$${formatPrice(priceState.price)}`}
          </p>
          <p className="mt-1 text-xs text-muted">
            {statusLabel} · {priceState.source} · 更新 {updatedTime}
          </p>
        </div>
      </div>
    </section>
  );
}

function InputField({ field, value, onChange }) {
  const inputId = `calculator-${field.key}`;

  return (
    <div className="block">
      <label className="text-sm font-medium text-slate-300" htmlFor={inputId}>
        {field.label}
      </label>
      <div className="mt-2 flex items-center overflow-hidden rounded-lg border border-line bg-ink/70 focus-within:border-profit/70">
        <input
          id={inputId}
          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-white outline-none placeholder:text-muted"
          inputMode="decimal"
          min="0"
          step={field.step}
          type="number"
          value={value}
          onChange={(event) => onChange(field.key, event.target.value)}
        />
        {value !== "" ? (
          <button
            aria-label={`清空${field.label}`}
            className="border-l border-line px-2.5 py-3 text-muted transition hover:bg-panelSoft hover:text-white"
            type="button"
            onClick={() => onChange(field.key, "")}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
        <span className="border-l border-line px-3 text-sm text-muted">{field.suffix}</span>
      </div>
    </div>
  );
}

function SymbolSelect({ value, onChange }) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  const filteredSymbols = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return cryptoSymbols;
    }

    return cryptoSymbols.filter((item) => {
      const searchable = `${item.symbol} ${item.name}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [query]);

  function selectSymbol(symbol) {
    setQuery(symbol);
    setIsOpen(false);
    onChange(symbol);
  }

  function clearSymbol() {
    setQuery("");
    setIsOpen(true);
    onChange("");
  }

  return (
    <div className="relative">
      <label className="text-sm font-medium text-slate-300" htmlFor="calculator-symbol">
        币种
      </label>
      <div className="relative mt-2">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
        />
        <input
          id="calculator-symbol"
          aria-autocomplete="list"
          aria-controls="symbol-options"
          aria-expanded={isOpen}
          className="w-full rounded-lg border border-line bg-ink/70 py-3 pl-10 pr-20 text-base text-white outline-none placeholder:text-muted focus:border-profit/70"
          placeholder="搜索币种，例如 BTC / Solana"
          role="combobox"
          type="text"
          value={query}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query ? (
          <button
            aria-label="清空币种"
            className="absolute right-11 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted transition hover:bg-panelSoft hover:text-white"
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearSymbol}
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        ) : null}
        <button
          aria-label="展开币种列表"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted transition hover:bg-panelSoft hover:text-white"
          type="button"
          onClick={() => setIsOpen((current) => !current)}
        >
          <ChevronDown aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      {isOpen ? (
        <div
          id="symbol-options"
          className="mt-2 max-h-56 w-full overflow-y-auto rounded-lg border border-line bg-ink shadow-trading"
          role="listbox"
        >
          {filteredSymbols.length > 0 ? (
            filteredSymbols.map((item) => {
              const isSelected = item.symbol === value;

              return (
                <button
                  key={item.symbol}
                  className="flex w-full items-center justify-between gap-3 border-b border-line/60 px-3 py-3 text-left last:border-b-0 hover:bg-panelSoft"
                  role="option"
                  type="button"
                  aria-selected={isSelected}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectSymbol(item.symbol);
                  }}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    selectSymbol(item.symbol);
                  }}
                  onClick={() => selectSymbol(item.symbol)}
                >
                  <span>
                    <span className="block font-semibold text-slate-50">
                      {item.symbol}
                    </span>
                    <span className="block text-sm text-muted">{item.name}</span>
                  </span>
                  {isSelected ? (
                    <Check aria-hidden="true" className="h-5 w-5 text-profit" />
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-4 text-sm text-muted">
              未找到匹配币种，可尝试输入 BTC、ETH、SOL。
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ResultCard({ label, value, helper, tone = "neutral", icon: Icon }) {
  const toneClass = {
    neutral: "text-slate-50",
    profit: "text-profit",
    risk: "text-loss",
    warning: "text-warning"
  }[tone];
  const iconClass = {
    neutral: "bg-slate-400/10 text-slate-300",
    profit: "bg-profit/10 text-profit",
    risk: "bg-loss/10 text-loss",
    warning: "bg-warning/10 text-warning"
  }[tone];

  return (
    <article className="rounded-lg border border-line/80 bg-panelSoft/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className={`mt-2 text-2xl font-semibold tracking-normal ${toneClass}`}>
            {value}
          </p>
        </div>
        <div className={`rounded-md p-2 ${iconClass}`}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">{helper}</p>
    </article>
  );
}

function formatPercent(value) {
  return `${((value || 0) * 100).toFixed(1)}%`;
}

function LiquidationRiskCard({ calculation }) {
  const levelTone = {
    非常安全: "border-profit/30 bg-profit/10 text-profit",
    安全: "border-sky-400/30 bg-sky-400/10 text-sky-300",
    偏危险: "border-warning/30 bg-warning/10 text-warning",
    高风险: "border-loss/30 bg-loss/10 text-loss"
  }[calculation.liquidationRiskLevel];

  return (
    <section className="mt-5 rounded-lg border border-line/80 bg-ink/80 p-4 shadow-trading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-warning">
            Liquidation Risk
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">爆仓风险分析</h3>
          <p className="mt-1 text-xs text-muted">
            当前爆仓价为简化估算，实际以交易所规则为准
          </p>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1.5 text-sm font-semibold ${levelTone}`}>
          {calculation.liquidationRiskLevel}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {[
          ["估算爆仓价", formatCurrency(calculation.estimatedLiquidationPrice)],
          ["爆仓安全空间", formatPercent(calculation.liquidationSafetySpace / 100)],
          ["风险等级", calculation.liquidationRiskLevel],
          ["风险提示", calculation.liquidationRiskWarning]
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-line bg-panel/60 p-3">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const gradeTone = {
  A: "border-profit/30 bg-profit/10 text-profit",
  B: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  C: "border-warning/30 bg-warning/10 text-warning",
  D: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  F: "border-loss/30 bg-loss/10 text-loss"
};

function TradeQualityCard({ calculation }) {
  return (
    <section className="mt-5 rounded-lg border border-line/80 bg-ink/80 p-4 shadow-trading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-profit">
            Trade Quality
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">交易质量评分</h3>
          <p className="mt-1 text-xs text-muted">
            根据盈亏比、风险比例、爆仓安全空间、止损距离和杠杆生成。
          </p>
        </div>
        <div className={`flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${gradeTone[calculation.tradeGrade]}`}>
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          {calculation.tradeGrade}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[0.8fr_1.2fr] gap-3">
        <div className="rounded-md border border-line bg-panel/60 p-4">
          <p className="text-xs text-muted">总分</p>
          <p className="mt-2 text-4xl font-semibold text-white">{calculation.tradeScore}</p>
          <p className="mt-1 text-xs text-muted">/ 100</p>
        </div>
        <div className="rounded-md border border-line bg-panel/60 p-4">
          <p className="text-xs text-muted">风险建议</p>
          <p className="mt-2 text-sm text-slate-200">{calculation.scoreAdvice}</p>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-line bg-panel/60 p-4">
        <p className="text-xs text-muted">风险原因</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {calculation.scoreReasons.map((reason) => (
            <span
              key={reason}
              className="rounded-full border border-line bg-ink/70 px-2.5 py-1 text-xs text-slate-300"
            >
              {reason}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function PositionCalculator() {
  const [form, setForm] = useState(initialForm);
  const [shouldSyncEntryPrice, setShouldSyncEntryPrice] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const livePrice = useLivePrice(form.symbol);

  useEffect(() => {
    if (!shouldSyncEntryPrice || !livePrice.price) {
      return;
    }

    setForm((current) => ({
      ...current,
      entryPrice: String(livePrice.price)
    }));
  }, [livePrice.price, shouldSyncEntryPrice]);

  const calculation = useMemo(
    () =>
      calculatePosition({
        side: form.side,
        capital: toNumber(form.capital),
        riskPercent: toNumber(form.riskPercent),
        entryPrice: toNumber(form.entryPrice),
        stopLossPrice: toNumber(form.stopLossPrice),
        takeProfitPrice: toNumber(form.takeProfitPrice),
        leverage: toNumber(form.leverage)
      }),
    [form]
  );

  function updateField(key, value) {
    if (key === "entryPrice") {
      setShouldSyncEntryPrice(false);
    }

    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateSymbol(symbol) {
    setShouldSyncEntryPrice(true);
    updateField("symbol", symbol);
  }

  function addToTradePlans() {
    if (!calculation.isValid) {
      setToastMessage("请先检查止损方向");
      return;
    }

    if (
      ["D", "F"].includes(calculation.tradeGrade) &&
      !window.confirm(`当前交易评分为 ${calculation.tradeGrade}，风险较高。确认添加到交易计划吗？`)
    ) {
      return;
    }

    const plan = createCalculatorPlan({
      symbol: form.symbol,
      side: form.side,
      capital: toNumber(form.capital),
      riskPercent: toNumber(form.riskPercent),
      entryPrice: toNumber(form.entryPrice),
      stopLossPrice: toNumber(form.stopLossPrice),
      takeProfitPrice: toNumber(form.takeProfitPrice),
      leverage: toNumber(form.leverage)
    });

    addPlanToStorage(plan);
    setToastMessage("已添加到交易计划");
  }

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToastMessage(""), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const baseAsset = form.symbol.split("/")[0] || "COIN";
  const resultCards = [
    {
      label: "最大亏损金额",
      value: formatCurrency(calculation.maxLoss),
      helper: "本金 × 风险比例",
      tone: "risk",
      icon: ShieldAlert
    },
    {
      label: "单位风险",
      value: formatCurrency(calculation.unitRisk),
      helper: form.side === "long" ? "开仓价 - 止损价" : "止损价 - 开仓价",
      tone: "warning",
      icon: Target
    },
    {
      label: "建议买入数量",
      value: `${formatNumber(calculation.quantity, 6)} ${baseAsset}`,
      helper: "最大亏损 ÷ 单位风险",
      tone: "neutral",
      icon: Calculator
    },
    {
      label: "仓位价值",
      value: formatCurrency(calculation.positionValue),
      helper: "数量 × 开仓价",
      tone: "neutral",
      icon: Wallet
    },
    {
      label: "所需保证金",
      value: formatCurrency(calculation.margin),
      helper: "仓位价值 ÷ 杠杆",
      tone: "warning",
      icon: Wallet
    },
    {
      label: "预期盈利",
      value: formatCurrency(calculation.expectedProfit),
      helper: form.side === "long" ? "数量 × (止盈价 - 开仓价)" : "数量 × (开仓价 - 止盈价)",
      tone: "profit",
      icon: TrendingUp
    },
    {
      label: "盈亏比",
      value: `${formatNumber(calculation.rewardRiskRatio, 2)} R`,
      helper: "预期盈利 ÷ 最大亏损",
      tone: calculation.rewardRiskRatio >= 2 ? "profit" : "warning",
      icon: TrendingUp
    }
  ];

  return (
    <main className="min-h-screen px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-lg border border-line/80 bg-panel/85 p-5 shadow-trading backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-profit">
                Position Risk Calculator
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal text-white">
                开仓计算器
              </h1>
              <p className="mt-2 text-sm text-muted">
                输入计划价格与风险参数，开仓前快速校准仓位和盈亏比。
              </p>
            </div>
          </div>

          <div className="mt-5">
            <LivePriceCard symbol={form.symbol} priceState={livePrice} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4">
            <SymbolSelect
              value={form.symbol}
              onChange={updateSymbol}
            />

            <fieldset>
              <legend className="text-sm font-medium text-slate-300">方向</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-line bg-ink/70 p-1">
                {[
                  { value: "long", label: "做多" },
                  { value: "short", label: "做空" }
                ].map((option) => (
                  <button
                    key={option.value}
                    className={`rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                      form.side === option.value
                        ? option.value === "long"
                          ? "bg-profit text-ink"
                          : "bg-loss text-white"
                        : "text-slate-300 hover:bg-panelSoft"
                    }`}
                    type="button"
                    onClick={() => updateField("side", option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {numberFields.map((field) => (
                <InputField
                  key={field.key}
                  field={field}
                  value={form[field.key]}
                  onChange={updateField}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-line/80 bg-panel/85 p-5 shadow-trading backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-warning">
                Risk Output
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white">
                计算结果
              </h2>
            </div>
            <div
              className={`w-fit rounded-full border px-3 py-1.5 text-sm font-medium ${
                calculation.isValid
                  ? "border-profit/25 bg-profit/10 text-profit"
                  : "border-loss/25 bg-loss/10 text-loss"
              }`}
            >
              {calculation.isValid ? "参数有效" : "检查止损方向"}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {resultCards.map((card) => (
              <ResultCard key={card.label} {...card} />
            ))}
          </div>

          <LiquidationRiskCard calculation={calculation} />
          <TradeQualityCard calculation={calculation} />

          <button
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-profit px-4 py-3 font-semibold text-ink transition hover:bg-profit/90 disabled:cursor-not-allowed disabled:bg-muted"
            type="button"
            disabled={!calculation.isValid}
            onClick={addToTradePlans}
          >
            <ClipboardPlus aria-hidden="true" className="h-5 w-5" />
            添加到交易计划
          </button>
        </section>
      </div>
      {toastMessage ? (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-profit/30 bg-ink px-4 py-3 text-sm font-medium text-profit shadow-trading">
          {toastMessage}
        </div>
      ) : null}
    </main>
  );
}

import {
  Activity,
  BarChart3,
  ClipboardList,
  LineChart,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp
} from "lucide-react";

const stats = [
  {
    label: "账户本金",
    value: "$25,000",
    helper: "本地记录资金快照",
    tone: "neutral",
    icon: BarChart3
  },
  {
    label: "单笔风险比例",
    value: "1.5%",
    helper: "建议控制在 1%-2%",
    tone: "warning",
    icon: Target
  },
  {
    label: "今日盈亏",
    value: "+$428",
    helper: "+1.71% / 2 笔交易",
    tone: "profit",
    icon: TrendingUp
  },
  {
    label: "本周盈亏",
    value: "+$1,280",
    helper: "连续 3 天净值增长",
    tone: "profit",
    icon: LineChart
  },
  {
    label: "胜率",
    value: "62.5%",
    helper: "最近 24 笔样本",
    tone: "profit",
    icon: Activity
  },
  {
    label: "最大回撤",
    value: "-4.8%",
    helper: "低于预警阈值 8%",
    tone: "loss",
    icon: TrendingDown
  },
  {
    label: "当前交易计划",
    value: "5",
    helper: "2 个等待触发",
    tone: "neutral",
    icon: ClipboardList
  },
  {
    label: "风险等级",
    value: "Risk Normal",
    helper: "仓位暴露处于可控区间",
    tone: "safe",
    icon: ShieldCheck
  }
];

const recentTrades = [
  {
    symbol: "BTC/USDT",
    side: "Long",
    pnl: "+$320",
    rr: "R:R 2.4",
    status: "已复盘",
    tone: "profit"
  },
  {
    symbol: "ETH/USDT",
    side: "Short",
    pnl: "-$115",
    rr: "R:R 0.8",
    status: "待复盘",
    tone: "loss"
  },
  {
    symbol: "SOL/USDT",
    side: "Long",
    pnl: "+$223",
    rr: "R:R 1.9",
    status: "已复盘",
    tone: "profit"
  }
];

const toneStyles = {
  neutral: {
    value: "text-slate-50",
    badge: "border-slate-500/30 bg-slate-400/10 text-slate-200",
    icon: "bg-slate-400/10 text-slate-300"
  },
  profit: {
    value: "text-profit",
    badge: "border-profit/25 bg-profit/10 text-profit",
    icon: "bg-profit/10 text-profit"
  },
  loss: {
    value: "text-loss",
    badge: "border-loss/25 bg-loss/10 text-loss",
    icon: "bg-loss/10 text-loss"
  },
  warning: {
    value: "text-warning",
    badge: "border-warning/25 bg-warning/10 text-warning",
    icon: "bg-warning/10 text-warning"
  },
  safe: {
    value: "text-profit",
    badge: "border-profit/25 bg-profit/10 text-profit",
    icon: "bg-profit/10 text-profit"
  }
};

function StatCard({ stat }) {
  const Icon = stat.icon;
  const styles = toneStyles[stat.tone];

  return (
    <article className="rounded-lg border border-line/80 bg-panel/85 p-5 shadow-trading backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{stat.label}</p>
          <p className={`mt-3 text-3xl font-semibold tracking-normal ${styles.value}`}>
            {stat.value}
          </p>
        </div>
        <div className={`rounded-md p-2.5 ${styles.icon}`}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-400">{stat.helper}</p>
    </article>
  );
}

function RecentTradeItem({ trade }) {
  const styles = toneStyles[trade.tone];

  return (
    <li className="rounded-lg border border-line/70 bg-panelSoft/55 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-50">{trade.symbol}</p>
            <span className="rounded border border-line px-2 py-0.5 text-xs text-slate-300">
              {trade.side}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">{trade.rr}</p>
        </div>
        <div className="text-right">
          <p className={`font-semibold ${styles.value}`}>{trade.pnl}</p>
          <span
            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles.badge}`}
          >
            {trade.status}
          </span>
        </div>
      </div>
    </li>
  );
}

export default function Dashboard() {
  return (
    <main className="min-h-screen px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-lg border border-line/80 bg-panel/80 p-5 shadow-trading backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-profit">
                Personal Crypto Risk Control
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-white">
                TradePilot
              </h1>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-full border border-profit/25 bg-profit/10 px-3 py-2 text-sm font-medium text-profit">
              <span className="h-2 w-2 rounded-full bg-profit shadow-[0_0_16px_rgba(31,209,135,0.85)]" />
              Risk Normal
            </div>
          </div>
        </header>

        <section
          aria-label="交易风控指标"
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </section>

        <section className="rounded-lg border border-line/80 bg-panel/85 p-5 shadow-trading backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-normal text-white">
                最近交易记录
              </h2>
              <p className="mt-1 text-sm text-muted">
                最近执行的计划与复盘状态，后续将接入本地交易日志。
              </p>
            </div>
            <span className="text-sm text-slate-400">3 records</span>
          </div>

          <ul className="mt-5 grid grid-cols-1 gap-3">
            {recentTrades.map((trade) => (
              <RecentTradeItem key={`${trade.symbol}-${trade.side}`} trade={trade} />
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

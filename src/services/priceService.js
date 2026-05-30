const BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/price";

export function toBinanceSymbol(symbol) {
  return symbol.replace("/", "").toUpperCase();
}

export async function fetchLivePrice(symbol, { signal } = {}) {
  const binanceSymbol = toBinanceSymbol(symbol);
  const response = await fetch(`${BINANCE_TICKER_URL}?symbol=${binanceSymbol}`, {
    signal
  });

  if (!response.ok) {
    throw new Error("价格获取失败");
  }

  const data = await response.json();
  const price = Number(data.price);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("价格获取失败");
  }

  return {
    price,
    source: "Binance",
    symbol: data.symbol || binanceSymbol,
    updatedAt: new Date().toISOString()
  };
}

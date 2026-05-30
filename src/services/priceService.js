const BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/price";
const BINANCE_VISION_TICKER_URL = "https://data-api.binance.vision/api/v3/ticker/price";
const COINGECKO_SIMPLE_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price";

const coinGeckoIdsByAsset = {
  AAVE: "aave",
  ADA: "cardano",
  APT: "aptos",
  ARB: "arbitrum",
  ATOM: "cosmos",
  AVAX: "avalanche-2",
  BCH: "bitcoin-cash",
  BNB: "binancecoin",
  BTC: "bitcoin",
  DOGE: "dogecoin",
  DOT: "polkadot",
  ETC: "ethereum-classic",
  ETH: "ethereum",
  FIL: "filecoin",
  INJ: "injective-protocol",
  LINK: "chainlink",
  LTC: "litecoin",
  MATIC: "matic-network",
  NEAR: "near",
  OP: "optimism",
  ORDI: "ordinals",
  PEPE: "pepe",
  SEI: "sei-network",
  SOL: "solana",
  SUI: "sui",
  TON: "the-open-network",
  TRX: "tron",
  UNI: "uniswap",
  WIF: "dogwifcoin",
  XRP: "ripple"
};

export function toBinanceSymbol(symbol) {
  return symbol.replace("/", "").toUpperCase();
}

export function getBaseAsset(symbol) {
  return symbol.split("/")[0]?.toUpperCase() || symbol.toUpperCase();
}

async function fetchBinancePrice(symbol, { signal, url = BINANCE_TICKER_URL } = {}) {
  const binanceSymbol = toBinanceSymbol(symbol);
  const response = await fetch(`${url}?symbol=${binanceSymbol}`, {
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

async function fetchCoinGeckoPrice(symbol, { signal } = {}) {
  const baseAsset = getBaseAsset(symbol);
  const coinId = coinGeckoIdsByAsset[baseAsset];

  if (!coinId) {
    throw new Error("价格获取失败");
  }

  const query = new URLSearchParams({
    ids: coinId,
    vs_currencies: "usd"
  });
  const response = await fetch(`${COINGECKO_SIMPLE_PRICE_URL}?${query}`, {
    signal
  });

  if (!response.ok) {
    throw new Error("价格获取失败");
  }

  const data = await response.json();
  const price = Number(data[coinId]?.usd);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("价格获取失败");
  }

  return {
    price,
    source: "CoinGecko",
    symbol,
    updatedAt: new Date().toISOString()
  };
}

export async function fetchLivePrice(symbol, { signal } = {}) {
  const priceSources = [
    () => fetchBinancePrice(symbol, { signal }),
    () => fetchBinancePrice(symbol, { signal, url: BINANCE_VISION_TICKER_URL }),
    () => fetchCoinGeckoPrice(symbol, { signal })
  ];

  for (const fetchPrice of priceSources) {
    try {
      return await fetchPrice();
    } catch (error) {
      if (error.name === "AbortError") {
        throw error;
      }
    }
  }

  throw new Error("价格获取失败");
}

import { useEffect, useState } from "react";
import { fetchLivePrice } from "../services/priceService";

const REFRESH_INTERVAL_MS = 5000;

export function useLivePrice(symbol) {
  const [state, setState] = useState({
    price: null,
    source: "Binance",
    updatedAt: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;
    let activeController = null;

    async function loadPrice({ showLoading = false } = {}) {
      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;

      if (showLoading) {
        setState((current) => ({ ...current, isLoading: true, error: null }));
      }

      try {
        const nextPrice = await fetchLivePrice(symbol, {
          signal: controller.signal
        });

        if (!isMounted) {
          return;
        }

        setState({
          ...nextPrice,
          isLoading: false,
          error: null
        });
      } catch (error) {
        if (!isMounted || error.name === "AbortError") {
          return;
        }

        setState((current) => ({
          ...current,
          isLoading: false,
          error: "价格获取失败"
        }));
      }
    }

    loadPrice({ showLoading: true });
    const intervalId = window.setInterval(() => loadPrice(), REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      activeController?.abort();
      window.clearInterval(intervalId);
    };
  }, [symbol]);

  return state;
}

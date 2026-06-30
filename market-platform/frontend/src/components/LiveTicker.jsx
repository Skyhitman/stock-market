import React from 'react';
import { useMarketData } from '../context/MarketDataContext';

export default function LiveTicker() {
  const { movers } = useMarketData();
  const items = [...(movers?.gainers || []), ...(movers?.losers || [])].slice(0, 20);

  if (items.length === 0) return null;

  const tickerContent = items.map((s, i) => {
    const isUp = (s.return_pct || s.change_pct || 0) >= 0;
    const pct = (s.return_pct || s.change_pct || 0).toFixed(2);
    const ticker = (s.ticker || '').replace('.NS', '');
    return (
      <span key={i} className="flex items-center gap-2 px-6 whitespace-nowrap">
        <span className="text-xs font-bold text-slate-300">{ticker}</span>
        <span className={`text-xs font-mono font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {isUp ? '▲' : '▼'} {pct}%
        </span>
      </span>
    );
  });

  return (
    <div className="w-full overflow-hidden border-b border-slate-800/30 bg-slate-950/60 backdrop-blur-sm">
      <div className="ticker-scroll py-2">
        {tickerContent}
        {tickerContent}
      </div>
    </div>
  );
}

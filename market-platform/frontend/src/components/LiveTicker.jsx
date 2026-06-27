import React, { useEffect, useState } from 'react';
import { fetchMarketMovers } from '../api/client';

export default function LiveTicker() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchMarketMovers()
      .then(data => {
        const all = [...(data.gainers || []), ...(data.losers || [])];
        setItems(all.slice(0, 20));
      })
      .catch(() => {});
    const interval = setInterval(() => {
      fetchMarketMovers()
        .then(data => {
          const all = [...(data.gainers || []), ...(data.losers || [])];
          setItems(all.slice(0, 20));
        })
        .catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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

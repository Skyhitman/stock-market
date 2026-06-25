import React, { useEffect, useState } from 'react';
import { Loader2, TrendingUp, TrendingDown, Flame, Skull } from 'lucide-react';
import { fetchMarketMovers } from '../api/client';

export default function TopMovers({ lastRefresh }) {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchMarketMovers();
        setGainers(data.gainers || []);
        setLosers(data.losers || []);
      } catch (err) {
        console.error('Failed to fetch movers data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-slate-500 text-sm tracking-wide">Scanning all NSE stocks for today's top movers…</p>
      </div>
    );
  }

  const formatVol = (v) => {
    if (!v) return '0';
    if (v >= 10000000) return (v / 10000000).toFixed(2) + ' Cr';
    if (v >= 100000) return (v / 100000).toFixed(2) + ' L';
    if (v >= 1000) return (v / 1000).toFixed(1) + 'k';
    return String(v);
  };

  const MoverCard = ({ stock, rank, isGainer }) => {
    const borderColor = isGainer ? 'border-emerald-500/40' : 'border-red-500/40';
    const pctColor = isGainer ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10';
    const icon = isGainer ? <TrendingUp size={16} /> : <TrendingDown size={16} />;

    return (
      <div className={`glass-panel p-5 border-l-2 ${borderColor} hover:-translate-y-0.5 transition-all duration-200`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl font-black text-slate-700">{rank}</span>
            <div>
              <h3 className="text-base font-bold text-white">{stock.name || stock.ticker}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{stock.ticker}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">{stock.sector}</span>
              </div>
            </div>
          </div>
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold ${pctColor}`}>
            {icon}
            {isGainer ? '+' : ''}{Number(stock.return_pct).toFixed(2)}%
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800/50">
          <div>
            <span className="text-[10px] text-slate-600 uppercase font-bold block">LTP</span>
            <span className="text-white text-sm font-mono font-medium">₹{Number(stock.close).toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-600 uppercase font-bold block">Open</span>
            <span className="text-slate-300 text-sm font-mono">₹{Number(stock.open).toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-600 uppercase font-bold block">Day High / Day Low</span>
            <span className="text-emerald-400 text-sm font-mono">₹{Number(stock.high).toFixed(0)}</span>
            <span className="text-slate-600 text-sm"> / </span>
            <span className="text-red-400 text-sm font-mono">₹{Number(stock.low).toFixed(0)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-600 uppercase font-bold block">Volume</span>
            <span className="text-slate-300 text-sm font-mono">{formatVol(stock.volume)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <span className="w-1 h-8 bg-blue-500 rounded-full inline-block" />
          Today's Top Movers
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Top 10 gainers & losers across all NSE-listed securities · Auto-refreshes every 5 min</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gainers */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Flame size={20} className="text-emerald-400" />
            <h2 className="text-lg font-bold text-emerald-400">Top Gainers</h2>
            <span className="text-xs text-slate-600 ml-1">10 stocks with highest returns today</span>
          </div>
          <div className="space-y-3">
            {gainers.slice(0, 10).map((s, i) => (
              <MoverCard key={s.ticker + i} stock={s} rank={i + 1} isGainer={true} />
            ))}
            {gainers.length === 0 && <p className="text-slate-600 text-sm italic">No gainers data available</p>}
          </div>
        </div>

        {/* Losers */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Skull size={20} className="text-red-400" />
            <h2 className="text-lg font-bold text-red-400">Top Losers</h2>
            <span className="text-xs text-slate-600 ml-1">10 stocks with steepest declines today</span>
          </div>
          <div className="space-y-3">
            {losers.slice(0, 10).map((s, i) => (
              <MoverCard key={s.ticker + i} stock={s} rank={i + 1} isGainer={false} />
            ))}
            {losers.length === 0 && <p className="text-slate-600 text-sm italic">No losers data available</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
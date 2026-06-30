import React, { useState } from 'react';
import { Search, ArrowUpDown, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketData } from '../context/MarketDataContext';
import GlassCard from '../components/GlassCard';
import { HoloLoader, StatusIndicator } from '../components/HUDElements';

export default function MarketScreener() {
  const { screener: stocks, loading } = useMarketData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortKey, setSortKey] = useState('return_pct');
  const [sortDir, setSortDir] = useState('desc');

  if (loading && (!stocks || stocks.length === 0)) return <HoloLoader />;

  const gainersCount = stocks.filter(s => s.return_pct > 0).length;
  const losersCount = stocks.filter(s => s.return_pct < 0).length;
  const overbought = stocks.filter(s => s.rsi >= 65).length;
  const oversold = stocks.filter(s => s.rsi <= 35).length;

  const filtered = stocks.filter(s => {
    if (search && !s.ticker.toLowerCase().includes(search.toLowerCase()) && !s.sector.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'gainers') return s.return_pct > 0;
    if (filter === 'losers') return s.return_pct < 0;
    if (filter === 'overbought') return s.rsi >= 65;
    if (filter === 'oversold') return s.rsi <= 35;
    return true;
  }).sort((a, b) => {
    let aVal = a[sortKey] || 0;
    let bVal = b[sortKey] || 0;
    if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortHeader = ({ label, sortKey: key }) => (
    <th className="p-3 text-right cursor-pointer group" onClick={() => handleSort(key)}>
      <div className="flex items-center justify-end gap-1 hover:text-cyan-400 transition-colors">
        {label}
        <ArrowUpDown size={12} className={`transition-opacity ${sortKey === key ? 'opacity-100 text-cyan-400' : 'opacity-30 group-hover:opacity-100'}`} />
      </div>
    </th>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="w-1 h-8 rounded-full" style={{ background: 'var(--neon-cyan)', boxShadow: '0 0 10px var(--neon-cyan)' }} />
          Data Vault
        </h1>
        <p className="text-slate-500 mt-1 text-sm ml-4">Comprehensive market data, indicators, and live screening</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Advancing', val: gainersCount, color: 'text-emerald-400', glow: 'green' },
          { label: 'Declining', val: losersCount, color: 'text-red-400', glow: 'red' },
          { label: 'Overbought', val: overbought, color: 'text-amber-400', glow: 'cyan' },
          { label: 'Oversold', val: oversold, color: 'text-blue-400', glow: 'purple' },
        ].map((stat, i) => (
          <GlassCard key={i} delay={i * 0.1} glow={stat.glow}>
            <p className="text-[9px] text-cyan-500/60 font-bold uppercase tracking-[0.2em] mb-1">{stat.label}</p>
            <h2 className={`text-3xl font-bold font-mono ${stat.color}`}>{stat.val}</h2>
          </GlassCard>
        ))}
      </div>

      <GlassCard delay={0.4} hover={false} glow="cyan">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative z-10">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/50" size={18} />
            <input type="text" placeholder="Search ticker or sector..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900 transition-all text-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {['all', 'gainers', 'losers', 'overbought', 'oversold'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${filter === f ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.15)]' : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-800'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-[9px] text-cyan-500/40 uppercase tracking-[0.2em] font-bold" style={{ borderBottom: '1px solid rgba(0, 240, 255, 0.06)' }}>
              <tr>
                <th className="p-3 cursor-pointer group" onClick={() => handleSort('ticker')}>
                  <div className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                    Asset <ArrowUpDown size={12} className={`transition-opacity ${sortKey === 'ticker' ? 'opacity-100 text-cyan-400' : 'opacity-30 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th className="p-3">Sector</th>
                <SortHeader label="Price" sortKey="close" />
                <SortHeader label="Change %" sortKey="return_pct" />
                <SortHeader label="RSI (14)" sortKey="rsi" />
                <SortHeader label="MACD" sortKey="macd" />
                <SortHeader label="Vol (M)" sortKey="volume" />
                <SortHeader label="ATR" sortKey="atr" />
                <SortHeader label="Volatility" sortKey="volatility" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <motion.tr key={s.ticker} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.5) }}
                  className="transition-colors hover:bg-slate-800/40" style={{ borderBottom: '1px solid rgba(100, 116, 139, 0.05)' }}>
                  <td className="p-3 font-bold text-white font-mono">{s.ticker.replace('.NS', '')}</td>
                  <td className="p-3 text-slate-400 text-xs">{s.sector}</td>
                  <td className="p-3 text-right font-mono text-slate-300">₹{s.close?.toFixed(2)}</td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${s.return_pct >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {s.return_pct >= 0 ? '+' : ''}{s.return_pct?.toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className={`font-mono font-bold ${s.rsi >= 65 ? 'text-amber-400' : s.rsi <= 35 ? 'text-blue-400' : 'text-slate-400'}`}>
                      {s.rsi?.toFixed(1) || 'N/A'}
                    </span>
                  </td>
                  <td className={`p-3 text-right font-mono font-bold ${s.macd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {s.macd > 0 ? '+' : ''}{s.macd?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-400">{s.volume ? (s.volume / 1000000).toFixed(2) : 'N/A'}</td>
                  <td className="p-3 text-right font-mono text-slate-400">{s.atr?.toFixed(2) || 'N/A'}</td>
                  <td className="p-3 text-right font-mono text-slate-400">{s.volatility ? (s.volatility * 100).toFixed(1) + '%' : 'N/A'}</td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-500">No assets match your search/filter criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
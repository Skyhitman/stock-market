import React, { useEffect, useState } from 'react';
import { Loader2, Search, ArrowUpDown } from 'lucide-react';
import { fetchScreener } from '../api/client';

export default function MarketScreener({ lastRefresh }) {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortKey, setSortKey] = useState('return_pct');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    fetchScreener()
      .then(data => { setStocks(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [lastRefresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  const gainersCount = stocks.filter(s => s.return_pct > 0).length;
  const losersCount = stocks.filter(s => s.return_pct < 0).length;
  const overbought = stocks.filter(s => s.rsi >= 65).length;
  const oversold = stocks.filter(s => s.rsi <= 35).length;

  let filtered = stocks.filter(s => {
    const matchSearch = s.ticker.toLowerCase().includes(search.toLowerCase()) ||
                        (s.sector || '').toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'gainers') return s.return_pct >= 1.5;
    if (filter === 'losers') return s.return_pct <= -1.5;
    if (filter === 'overbought') return s.rsi >= 65;
    if (filter === 'oversold') return s.rsi <= 35;
    return true;
  });

  filtered.sort((a, b) => {
    const av = a[sortKey] || 0;
    const bv = b[sortKey] || 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const formatVol = (v) => {
    if (!v) return '0';
    if (v >= 10000000) return (v / 10000000).toFixed(2) + ' Cr';
    if (v >= 100000) return (v / 100000).toFixed(2) + ' L';
    return v.toLocaleString();
  };

  const filters = [
    { key: 'all', label: 'All Assets' },
    { key: 'gainers', label: 'Gainers (≥ 1.5%)' },
    { key: 'losers', label: 'Losers (≤ -1.5%)' },
    { key: 'overbought', label: 'Overbought (RSI ≥ 65)' },
    { key: 'oversold', label: 'Oversold (RSI ≤ 35)' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <span className="w-1 h-8 bg-blue-500 rounded-full inline-block" />
          Market Screener
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Multi-column live ranking with dynamic filters</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-panel p-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Seeded</p>
          <span className="text-2xl font-bold text-white">{stocks.length} Stocks</span>
        </div>
        <div className="glass-panel p-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Gainers Today</p>
          <span className="text-2xl font-bold text-emerald-400">{gainersCount}</span>
        </div>
        <div className="glass-panel p-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Losers Today</p>
          <span className="text-2xl font-bold text-red-400">{losersCount}</span>
        </div>
        <div className="glass-panel p-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">RSI Overbought</p>
          <span className="text-2xl font-bold text-amber-400">{overbought}</span>
        </div>
        <div className="glass-panel p-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">RSI Oversold</p>
          <span className="text-2xl font-bold text-blue-400">{oversold}</span>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search symbol or sector..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-60"
          />
        </div>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-slate-700/50">
              <tr>
                <th className="p-3">Ticker</th>
                <th className="p-3 cursor-pointer" onClick={() => handleSort('close')}>
                  <span className="flex items-center gap-1">Last Price <ArrowUpDown size={12} /></span>
                </th>
                <th className="p-3 cursor-pointer" onClick={() => handleSort('return_pct')}>
                  <span className="flex items-center gap-1">Return (24H) <ArrowUpDown size={12} /></span>
                </th>
                <th className="p-3">Open</th>
                <th className="p-3">High</th>
                <th className="p-3">Low</th>
                <th className="p-3">Volume</th>
                <th className="p-3 cursor-pointer" onClick={() => handleSort('rsi')}>
                  <span className="flex items-center gap-1">RSI (14) <ArrowUpDown size={12} /></span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {filtered.map(s => (
                <tr key={s.ticker} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-white">{s.ticker}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{s.sector}</div>
                  </td>
                  <td className="p-3 font-mono text-white">₹{Number(s.close).toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`font-mono font-bold ${s.return_pct > 0 ? 'text-emerald-400' : s.return_pct < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {s.return_pct > 0 ? '+' : ''}{Number(s.return_pct).toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-300">₹{Number(s.open).toFixed(2)}</td>
                  <td className="p-3 font-mono text-emerald-400">₹{Number(s.high).toFixed(2)}</td>
                  <td className="p-3 font-mono text-red-400">₹{Number(s.low).toFixed(2)}</td>
                  <td className="p-3 font-mono text-slate-300">{formatVol(s.volume)}</td>
                  <td className="p-3 font-mono text-slate-300">{Number(s.rsi).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
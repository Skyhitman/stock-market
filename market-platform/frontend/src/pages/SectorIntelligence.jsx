import React, { useEffect, useState } from 'react';
import { Loader2, TrendingUp, TrendingDown, RotateCw, Bookmark } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { fetchSectorRankings, fetchSectorHistory } from '../api/client';

const SECTOR_COLORS = {
  Banking: '#3b82f6',
  Pharma: '#10b981',
  IT: '#f59e0b',
  Energy: '#ef4444',
};

export default function SectorIntelligence({ lastRefresh }) {
  const [sectors, setSectors] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchSectorRankings(), fetchSectorHistory(30)])
      .then(([rankData, histData]) => {
        setSectors(rankData);
        setHistory(histData);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, [lastRefresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  const sorted = [...sectors].sort((a, b) => (b.strength_score || b.score || 0) - (a.strength_score || a.score || 0));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <span className="w-1 h-8 bg-blue-500 rounded-full inline-block" />
          Sector Intelligence
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Live rotation signals, strength matrix calculations, and leaders</p>
      </div>

      {/* 4 Sector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sorted.map((sec, i) => {
          const score = Math.round(sec.strength_score || sec.score || 0);
          const momentum = sec.momentum || 0;
          const isTop = i < 2;
          const borderColor = isTop ? 'border-emerald-500/40' : 'border-red-500/40';
          const rotation = momentum > 0 ? 'Rotating In' : momentum < 0 ? 'Rotating Out' : 'Hold';
          const rotColor = momentum > 0 ? 'text-emerald-400' : momentum < 0 ? 'text-red-400' : 'text-yellow-400';
          const rotIcon = momentum > 0 ? <TrendingUp size={12} /> : momentum < 0 ? <TrendingDown size={12} /> : <RotateCw size={12} />;

          return (
            <div key={sec.sector} className={`glass-panel p-5 border-t-2 ${borderColor}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sector</p>
                  <h2 className="text-xl font-bold text-white">{sec.sector}</h2>
                </div>
                <span className="text-sm text-slate-400">Score: <span className="font-bold text-white">{score}</span></span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Momentum</p>
                  <span className={`flex items-center gap-1 text-sm font-bold ${momentum >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {momentum >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {momentum >= 0 ? '+' : ''}{(momentum * 100).toFixed(2)}%
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Rotation Signal</p>
                  <span className={`flex items-center gap-1 text-sm font-bold ${rotColor}`}>
                    {rotIcon}
                    {rotation}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sector Leader</p>
                  <span className="text-sm font-bold text-white">{sec.leader || 'N/A'}</span>
                </div>
                <Bookmark size={16} className="text-slate-600 hover:text-blue-400 cursor-pointer transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 30-Day Relative Strength Chart */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <RotateCw size={18} className="text-blue-400" />
          30-Day Relative Strength (vs Nifty 50)
        </h3>
        <p className="text-xs text-slate-500 mb-2">Values above 1.0 = outperforming Nifty · Below 1.0 = underperforming</p>
        <div className="h-96 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis
                stroke="#475569"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(v) => v.toFixed(2)}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: '#fff', fontSize: 12, padding: '10px 14px' }}
                labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
                formatter={(value, name) => [value.toFixed(4), name]}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              {/* Reference line at 1.0 (Nifty baseline) */}
              {Object.entries(SECTOR_COLORS).map(([name, color]) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
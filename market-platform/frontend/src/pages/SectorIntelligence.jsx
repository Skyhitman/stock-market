import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { fetchSectorRankings, fetchSectorHistory } from '../api/client';
import GlassCard from '../components/GlassCard';
import { HoloLoader, StatusIndicator } from '../components/HUDElements';

const SECTOR_COLORS = {
  Banking: '#3b82f6',
  Pharma: '#10b981',
  IT: '#f59e0b',
  Energy: '#ef4444',
  FMCG: '#a855f7',
  Auto: '#ec4899',
  Metals: '#00f0ff'
};

export default function SectorIntelligence({ lastRefresh }) {
  const [sectors, setSectors] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchSectorRankings(), fetchSectorHistory(30)])
      .then(([rankData, histData]) => {
        setSectors(rankData);
        setHistory(histData.length > 0 ? histData : []);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, [lastRefresh]);

  if (loading) return <HoloLoader />;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="w-1 h-8 rounded-full" style={{ background: 'var(--neon-green)', boxShadow: '0 0 10px var(--neon-green)' }} />
          Sector Hub
        </h1>
        <p className="text-slate-500 mt-1 text-sm ml-4">Live sector strength, momentum, and capital rotation</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {sectors.map((s, i) => {
            const score = s.strength_score || 0;
            const glow = score >= 60 ? 'green' : score >= 40 ? 'cyan' : 'red';
            const colorClass = score >= 60 ? 'text-emerald-400' : score >= 40 ? 'text-cyan-400' : 'text-red-400';
            return (
              <GlassCard key={s.sector} delay={i * 0.1} glow={glow}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{s.sector}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>
                        {score >= 60 ? 'Leading' : score >= 40 ? 'Neutral' : 'Lagging'}
                      </span>
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg border ${score >= 50 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'}`}>
                    {score >= 50 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[9px] uppercase tracking-wider text-slate-500 mb-1 font-bold">
                      <span>Strength Score</span>
                      <span className={`font-mono ${colorClass}`}>{score.toFixed(1)} / 100</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${score >= 60 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : score >= 40 ? 'bg-cyan-500 shadow-[0_0_8px_rgba(0,240,255,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                      <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Momentum</p>
                      <p className={`text-xs font-bold font-mono ${s.momentum >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {s.momentum > 0 ? '+' : ''}{(s.momentum || 0).toFixed(2)}%
                      </p>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                      <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Rotation</p>
                      <p className={`text-xs font-bold font-mono ${s.rotation === 'Rotating In' ? 'text-emerald-400' : s.rotation === 'Rotating Out' ? 'text-red-400' : 'text-slate-300'}`}>
                        {s.rotation || 'Hold'}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <GlassCard delay={0.4} hover={false} glow="cyan" className="h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">30-Day Capital Rotation</h3>
                <p className="text-[10px] text-cyan-500/40 mt-1 uppercase tracking-wider">Historical strength scores over time</p>
              </div>
              <StatusIndicator label="HISTORICAL" color="cyan" />
            </div>
            
            {history.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 240, 255, 0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="#1e293b" tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={d => d.substring(5)} axisLine={false} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} stroke="#1e293b" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(0, 240, 255, 0.15)',
                        borderRadius: '12px',
                        color: '#fff',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 0 20px rgba(0, 240, 255, 0.05)',
                      }}
                      labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                    {Object.keys(history[0] || {}).filter(k => k !== 'date').map((sector, i) => (
                      <Line
                        key={sector}
                        type="monotone"
                        dataKey={sector}
                        stroke={SECTOR_COLORS[sector] || '#94a3b8'}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, fill: SECTOR_COLORS[sector], stroke: '#0f172a', strokeWidth: 2 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500 italic">Not enough historical data collected yet.</div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Shield, Heart, Zap, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { useMarketData } from '../context/MarketDataContext';
import GlassCard from '../components/GlassCard';
import HoloGlobe from '../components/HoloGlobe';
import { HoloLoader, StatusIndicator, DataReadout } from '../components/HUDElements';

export default function Overview() {
  const { summary, sectorRankings, opportunityRankings, loading, error } = useMarketData();

  if (loading && !summary) return <HoloLoader />;

  const sectors = (sectorRankings || []).map(s => ({ name: s.sector, score: Math.round(s.strength_score || s.score || 0) }));
  const topStocks = (opportunityRankings || []).slice(0, 4);

  if (error && !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle size={48} className="text-red-500 neon-glow-red" />
        <span className="text-red-400 font-semibold text-sm">{error}</span>
      </div>
    );
  }

  const sentimentColor = summary?.market_sentiment === 'Bullish' ? 'text-emerald-400 neon-glow-green' : summary?.market_sentiment === 'Bearish' ? 'text-red-400 neon-glow-red' : 'text-yellow-400';

  const chartColors = ['#00f0ff', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="w-1 h-8 rounded-full" style={{ background: 'var(--neon-cyan)', boxShadow: '0 0 10px var(--neon-cyan)' }} />
          Command Center
        </h1>
        <p className="text-slate-500 mt-1 text-sm ml-4">Real-time market intelligence • Indian Stock Market (NSE)</p>
      </motion.div>

      {/* Globe + Metric Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Left metrics */}
        <div className="space-y-4">
          <GlassCard delay={0.1} glow="green">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] text-cyan-500/60 font-bold uppercase tracking-[0.2em] mb-2">Best Performing Sector</p>
                <h2 className="text-2xl font-bold text-white">{summary?.top_sector || 'N/A'}</h2>
                <span className="mt-2 inline-block px-3 py-1 rounded-lg text-xs font-bold"
                  style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  Score: {summary?.top_sector_score || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                <Shield className="text-emerald-400" size={20} />
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.2} glow="red">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] text-cyan-500/60 font-bold uppercase tracking-[0.2em] mb-2">Worst Performing Sector</p>
                <h2 className="text-2xl font-bold text-white">{summary?.weakest_sector || 'N/A'}</h2>
                <span className="mt-2 inline-block px-3 py-1 rounded-lg text-xs font-bold"
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                  Score: {summary?.weakest_sector_score || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                <AlertTriangle className="text-red-400" size={20} />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Center Globe */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col items-center justify-center"
        >
          <HoloGlobe size={280} />
          <div className="flex items-center gap-4 mt-2">
            <StatusIndicator label="GLOBAL MARKETS" color="cyan" />
          </div>
        </motion.div>

        {/* Right metrics */}
        <div className="space-y-4">
          <GlassCard delay={0.3} glow="purple">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] text-cyan-500/60 font-bold uppercase tracking-[0.2em] mb-2">Market Mood</p>
                <h2 className={`text-2xl font-bold ${sentimentColor}`}>{summary?.market_sentiment || 'Neutral'}</h2>
                <span className="mt-2 inline-block px-3 py-1 rounded-lg text-xs font-bold"
                  style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  {summary?.bullish_ratio || 0}% Stocks Green
                </span>
              </div>
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                <TrendingUp className="text-purple-400" size={20} />
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.4} glow="blue">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] text-cyan-500/60 font-bold uppercase tracking-[0.2em] mb-2">News Mood</p>
                <h2 className={`text-2xl font-bold ${summary?.news_mood === 'Positive' ? 'text-emerald-400' : summary?.news_mood === 'Negative' ? 'text-red-400' : 'text-slate-300'}`}>
                  {summary?.news_mood || 'Neutral'}
                </h2>
                <span className={`mt-2 inline-block px-3 py-1 rounded-lg text-xs font-bold`}
                  style={{
                    background: summary?.news_mood === 'Positive' ? 'rgba(16,185,129,0.1)' : summary?.news_mood === 'Negative' ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)',
                    color: summary?.news_mood === 'Positive' ? '#10b981' : summary?.news_mood === 'Negative' ? '#ef4444' : '#94a3b8',
                    border: `1px solid ${summary?.news_mood === 'Positive' ? 'rgba(16,185,129,0.15)' : summary?.news_mood === 'Negative' ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.15)'}`,
                  }}>
                  Score: {typeof summary?.news_score === 'number' ? summary.news_score.toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.1)' }}>
                <Heart className="text-pink-400" size={20} />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Bottom Row: Chart + Best Stocks */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sector Strength Chart */}
        <GlassCard className="lg:col-span-3 p-6" delay={0.5} glow="cyan" hover={false}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Sector Strength Analysis</h3>
              <p className="text-[10px] text-cyan-500/40 mt-1 uppercase tracking-wider">Higher score = sector is performing better (out of 100)</p>
            </div>
            <StatusIndicator label="LIVE SCORES" color="cyan" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectors} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 240, 255, 0.03)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#1e293b" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="#1e293b" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  cursor={{ fill: 'rgba(0, 240, 255, 0.02)' }}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(0, 240, 255, 0.15)',
                    borderRadius: '12px',
                    color: '#fff',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 0 20px rgba(0, 240, 255, 0.05)',
                  }}
                  formatter={(value) => [`Strength Score: ${value}`, '']}
                />
                <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={28}>
                  {sectors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Best Stocks */}
        <GlassCard className="lg:col-span-2 p-6" delay={0.6} glow="purple" hover={false}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Top Opportunities</h3>
              <p className="text-[10px] text-cyan-500/40 mt-1 uppercase tracking-wider">Highest buy signal scores</p>
            </div>
            <Zap size={18} className="text-yellow-400" style={{ filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))' }} />
          </div>
          <div className="space-y-3">
            {topStocks.map((stock, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="flex items-center justify-between p-3 rounded-xl transition-all duration-300 group cursor-pointer"
                style={{
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(100, 116, 139, 0.08)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.12)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)';
                  e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.08)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-cyan-500/40 font-bold text-xs font-mono">#{i + 1}</span>
                  <div>
                    <div className="font-bold text-white text-sm">{stock.ticker}</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">{stock.sector}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-lg font-bold font-mono ${stock.score >= 60 ? 'text-emerald-400' : stock.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}
                    style={{ textShadow: stock.score >= 60 ? '0 0 8px rgba(16,185,129,0.3)' : 'none' }}>
                    {Math.round(stock.score)}
                  </span>
                  <span className="text-[8px] text-slate-600 uppercase tracking-wider">Score</span>
                </div>
              </motion.div>
            ))}
            {topStocks.length === 0 && <p className="text-slate-500 text-sm italic text-center py-4">No opportunities detected yet.</p>}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
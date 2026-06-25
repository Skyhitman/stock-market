import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Loader2, Shield, Heart, Zap, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { fetchMarketSummary, fetchSectorRankings, fetchOpportunityRankings } from '../api/client';

const REFRESH_INTERVAL = 5 * 60 * 1000;

export default function Overview({ lastRefresh }) {
  const [summary, setSummary] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [topStocks, setTopStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const [summaryData, sectorData, oppData] = await Promise.all([
        fetchMarketSummary(),
        fetchSectorRankings(),
        fetchOpportunityRankings(),
      ]);
      setSummary(summaryData);
      setSectors(sectorData.map(s => ({ name: s.sector, score: Math.round(s.strength_score || s.score || 0) })));
      setTopStocks(oppData.slice(0, 4));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setError('Data is loading... The initial seed takes 1-2 minutes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 animate-fade-in">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-slate-400 text-sm tracking-wider">Compiling live NSE metrics & sector momentum…</p>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-red-400 gap-3">
        <AlertTriangle size={48} className="text-red-500 mb-2" />
        <span className="font-semibold">{error}</span>
      </div>
    );
  }

  const sentimentColor = summary?.market_sentiment === 'Bullish' ? 'text-emerald-400' : summary?.market_sentiment === 'Bearish' ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <span className="w-1 h-8 bg-blue-500 rounded-full inline-block" />
          Market Overview
        </h1>
        <p className="text-slate-500 mt-1 text-sm">A quick snapshot of how the Indian stock market is doing right now</p>
      </div>

      {/* 4 Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Best Performing Sector */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Best Performing Sector</p>
              <h2 className="text-2xl font-bold text-white">{summary?.top_sector || 'N/A'}</h2>
              <span className="mt-2 inline-block px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/15 text-emerald-400">
                Score: {summary?.top_sector_score || 0}
              </span>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Shield className="text-emerald-400" size={20} />
            </div>
          </div>
        </div>

        {/* Worst Performing Sector */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Worst Performing Sector</p>
              <h2 className="text-2xl font-bold text-white">{summary?.weakest_sector || 'N/A'}</h2>
              <span className="mt-2 inline-block px-2.5 py-1 rounded text-xs font-bold bg-red-500/15 text-red-400">
                Score: {summary?.weakest_sector_score || 0}
              </span>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="text-red-400" size={20} />
            </div>
          </div>
        </div>

        {/* Market Mood */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Market Mood</p>
              <h2 className={`text-2xl font-bold ${sentimentColor}`}>{summary?.market_sentiment || 'Neutral'}</h2>
              <span className="mt-2 inline-block px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/15 text-emerald-400">
                {summary?.bullish_ratio || 0}% Stocks Green
              </span>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <TrendingUp className="text-yellow-400" size={20} />
            </div>
          </div>
        </div>

        {/* News Mood */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">News Mood</p>
              <h2 className={`text-2xl font-bold ${summary?.news_mood === 'Positive' ? 'text-emerald-400' : summary?.news_mood === 'Negative' ? 'text-red-400' : 'text-slate-300'}`}>
                {summary?.news_mood || 'Neutral'}
              </h2>
              <span className={`mt-2 inline-block px-2.5 py-1 rounded text-xs font-bold ${summary?.news_mood === 'Positive' ? 'bg-emerald-500/15 text-emerald-400' : summary?.news_mood === 'Negative' ? 'bg-red-500/15 text-red-400' : 'bg-slate-500/15 text-slate-400'}`}>
                Score: {typeof summary?.news_score === 'number' ? summary.news_score.toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="p-2 bg-pink-500/10 rounded-lg">
              <Heart className="text-pink-400" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Chart + Best Stocks */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sector Strength Chart */}
        <div className="lg:col-span-3 glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Which Sectors Are Doing Well?</h3>
              <p className="text-xs text-slate-500 mt-1">Higher score = sector is performing better (out of 100)</p>
            </div>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Live Scores</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectors} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => [`Strength Score: ${value}`, '']}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={28}>
                  {sectors.map((entry, index) => {
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best Stocks Right Now */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Best Stocks Right Now</h3>
              <p className="text-xs text-slate-500 mt-1">Stocks with the highest buy signal scores</p>
            </div>
            <Zap size={18} className="text-yellow-400" />
          </div>
          <div className="space-y-3">
            {topStocks.map((stock, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-bold text-sm">#{i + 1}</span>
                  <div>
                    <div className="font-bold text-white text-sm">{stock.ticker}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{stock.sector}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-lg font-bold ${stock.score >= 60 ? 'text-emerald-400' : stock.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {Math.round(stock.score)}
                  </span>
                  <span className="text-[9px] text-slate-600 uppercase tracking-wider">Score</span>
                </div>
              </div>
            ))}
            {topStocks.length === 0 && <p className="text-slate-500 text-sm italic">No opportunities detected yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
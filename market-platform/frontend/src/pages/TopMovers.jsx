import React, { useEffect, useState } from 'react';
import { Flame, Skull, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchMarketMovers } from '../api/client';
import GlassCard from '../components/GlassCard';
import { HoloLoader, StatusIndicator } from '../components/HUDElements';

export default function TopMovers({ lastRefresh }) {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketMovers()
      .then(data => { setGainers(data.gainers || []); setLosers(data.losers || []); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [lastRefresh]);

  if (loading) return <HoloLoader />;

  const StockCard = ({ stock, isGainer, index }) => (
    <GlassCard delay={index * 0.05} glow={isGainer ? 'green' : 'red'}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isGainer ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <span className={`text-xs font-bold font-mono ${isGainer ? 'text-emerald-400' : 'text-red-400'}`}>#{index + 1}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-mono">{stock.ticker.replace('.NS', '')}</h3>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">{stock.sector}</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 justify-end text-lg font-bold font-mono ${isGainer ? 'text-emerald-400 neon-glow-green' : 'text-red-400 neon-glow-red'}`}>
            {isGainer ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {isGainer ? '+' : ''}{stock.return_pct.toFixed(2)}%
          </div>
          <span className="text-xs text-slate-400 font-mono">₹{stock.close.toFixed(2)}</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800/50">
        <div>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-1">High</p>
          <p className="text-xs text-emerald-400 font-mono">₹{stock.high ? stock.high.toFixed(2) : 'N/A'}</p>
        </div>
        <div>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-1">Low</p>
          <p className="text-xs text-red-400 font-mono">₹{stock.low ? stock.low.toFixed(2) : 'N/A'}</p>
        </div>
        <div>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-1">Volume</p>
          <p className="text-xs text-slate-300 font-mono">{stock.volume ? (stock.volume / 1000000).toFixed(2) + 'M' : 'N/A'}</p>
        </div>
        <div>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-1">RSI / Vol</p>
          <p className="text-xs text-slate-300 font-mono">
            {stock.rsi ? stock.rsi.toFixed(0) : 'N/A'} / {stock.volatility ? (stock.volatility * 100).toFixed(0) + '%' : 'N/A'}
          </p>
        </div>
      </div>
    </GlassCard>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="w-1 h-8 rounded-full" style={{ background: 'var(--neon-pink)', boxShadow: '0 0 10px var(--neon-pink)' }} />
          Movers Deck
        </h1>
        <p className="text-slate-500 mt-1 text-sm ml-4">Extreme market volatility and momentum trackers</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <Flame className="text-emerald-400" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Top Gainers</h2>
              <p className="text-[10px] text-emerald-500/60 uppercase tracking-widest font-bold">Highest upside momentum</p>
            </div>
          </div>
          <div className="space-y-4">
            {gainers.slice(0, 10).map((s, i) => <StockCard key={s.ticker} stock={s} isGainer={true} index={i} />)}
            {gainers.length === 0 && <p className="text-slate-500 italic text-sm">No gainers recorded today.</p>}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <Skull className="text-red-400" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Top Losers</h2>
              <p className="text-[10px] text-red-500/60 uppercase tracking-widest font-bold">Severe downside momentum</p>
            </div>
          </div>
          <div className="space-y-4">
            {losers.slice(0, 10).map((s, i) => <StockCard key={s.ticker} stock={s} isGainer={false} index={i} />)}
            {losers.length === 0 && <p className="text-slate-500 italic text-sm">No losers recorded today.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
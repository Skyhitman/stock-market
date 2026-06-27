import React, { useEffect, useState } from 'react';
import { Zap, Sparkles, TrendingUp, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchOpportunityRankings } from '../api/client';
import GlassCard from '../components/GlassCard';
import { HoloLoader, StatusIndicator } from '../components/HUDElements';

export default function OpportunityEngine({ lastRefresh }) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchOpportunityRankings()
      .then(data => {
        setOpportunities(data);
        if (data.length > 0) setSelected(data[0]);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, [lastRefresh]);

  if (loading) return <HoloLoader />;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="w-1 h-8 rounded-full" style={{ background: 'var(--neon-yellow)', boxShadow: '0 0 10px var(--neon-yellow)' }} />
          Opportunity Engine
        </h1>
        <p className="text-slate-500 mt-1 text-sm ml-4">Algorithmic scoring combining momentum, RSI, MACD, and Sector Strength</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto pr-2">
          {opportunities.map((opp, i) => (
            <div key={opp.ticker} onClick={() => setSelected(opp)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${selected?.ticker === opp.ticker ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-slate-800/50 bg-slate-900/40 hover:bg-slate-800/60'}`}
              style={{ boxShadow: selected?.ticker === opp.ticker ? '0 0 20px rgba(245,158,11,0.1)' : 'none' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-white text-lg font-mono">{opp.ticker.replace('.NS', '')}</span>
                <span className={`text-lg font-bold font-mono ${opp.score >= 60 ? 'text-emerald-400' : opp.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {opp.score.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                <span>{opp.sector}</span>
                <span>Signal Score</span>
              </div>
            </div>
          ))}
          {opportunities.length === 0 && <p className="text-slate-500 text-sm italic">No opportunities detected.</p>}
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div key={selected.ticker} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}>
                <GlassCard hover={false} glow={selected.score >= 60 ? 'green' : selected.score >= 40 ? 'cyan' : 'red'}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-4xl font-bold text-white font-mono">{selected.ticker.replace('.NS', '')}</h2>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-slate-800 border border-slate-700 text-slate-300">
                          {selected.sector}
                        </span>
                        <StatusIndicator label={selected.score >= 60 ? 'STRONG BUY' : selected.score >= 40 ? 'ACCUMULATE' : 'WEAK'} color={selected.score >= 60 ? 'green' : selected.score >= 40 ? 'cyan' : 'red'} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-cyan-500/60 font-bold uppercase tracking-[0.2em] mb-1">Final Score</p>
                      <div className={`text-5xl font-bold font-mono ${selected.score >= 60 ? 'text-emerald-400 neon-glow-green' : selected.score >= 40 ? 'text-yellow-400' : 'text-red-400 neon-glow-red'}`}>
                        {selected.score.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-3 flex items-center gap-2"><TrendingUp size={12} className="text-cyan-400"/> Component Scores</p>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-400">Momentum</span>
                          <span className="text-xs font-mono font-bold text-slate-200">{(selected.momentum_weight || 0).toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-400">Relative Strength</span>
                          <span className="text-xs font-mono font-bold text-slate-200">{(selected.rs_weight || 0).toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-400">Sector / Volume</span>
                          <span className="text-xs font-mono font-bold text-slate-200">{(selected.sector_weight || 0).toFixed(1)} / {(selected.volume_weight || 0).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-3 flex items-center gap-2"><Sparkles size={12} className="text-purple-400"/> Rationale</p>
                      <ul className="space-y-2">
                        {(() => {
                          if (!selected.explanation_json) return <li className="text-xs text-slate-500">No specific rationale provided.</li>;
                          try {
                            const parsed = JSON.parse(selected.explanation_json);
                            const reasons = parsed.reasons || parsed.factors || [];
                            if (reasons.length === 0) return <li className="text-xs text-slate-500">No specific rationale provided.</li>;
                            return reasons.map((r, idx) => {
                              const rationaleText = typeof r === 'string' ? r : (r.feature ? `${r.feature.toUpperCase()} has ${r.impact} impact on forecast` : JSON.stringify(r));
                              return (
                                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                  <span className="text-cyan-400 font-bold mt-0.5">›</span> {rationaleText}
                                </li>
                              );
                            });
                          } catch (e) {
                            return <li className="text-xs text-slate-500">No specific rationale provided.</li>;
                          }
                        })()}
                      </ul>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
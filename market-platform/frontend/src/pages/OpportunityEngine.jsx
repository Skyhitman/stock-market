import React, { useEffect, useState } from 'react';
import { Loader2, Zap, Sparkles, TrendingUp, BarChart2 } from 'lucide-react';
import { fetchOpportunityRankings } from '../api/client';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  const parseExplanation = (jsonStr) => {
    try {
      if (typeof jsonStr === 'object') return jsonStr;
      return JSON.parse(jsonStr);
    } catch {
      return {};
    }
  };

  const getReasons = (opp) => {
    const exp = parseExplanation(opp.explanation_json);
    if (exp.reasons && Array.isArray(exp.reasons)) return exp.reasons.slice(0, 3);
    // Generate from available data
    const reasons = [];
    if (opp.sector) reasons.push(`Strong absolute performance: +${(Number(opp.momentum_weight || 0)).toFixed(2)}% today`);
    if (opp.rs_weight) reasons.push(`Outperforming Nifty by ${(Number(opp.rs_weight || 0)).toFixed(1)}%`);
    if (opp.volume_weight) reasons.push(`High volume detected (${(Number(opp.volume_weight || 0)).toFixed(1)}x avg)`);
    return reasons.length > 0 ? reasons : ['Strong sector momentum', 'Good relative strength', 'Healthy volume activity'];
  };

  const getWeights = (opp) => {
    const exp = parseExplanation(opp.explanation_json);
    return {
      sector: Number(opp.sector_weight || exp.weights?.sector_strength || 0).toFixed(1),
      rs: Number(opp.rs_weight || exp.weights?.relative_strength || 0).toFixed(1),
      daily: Number(opp.momentum_weight || exp.weights?.momentum || 0).toFixed(1),
      momentum: Number(exp.weights?.momentum || opp.momentum_weight || 0).toFixed(1),
      volume: Number(opp.volume_weight || exp.weights?.volume || 0).toFixed(1),
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <span className="w-1 h-8 bg-blue-500 rounded-full inline-block" />
          Opportunity Engine
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Stocks ranked from best to worst based on sector performance, price trend, and trading activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Ranked List */}
        <div className="lg:col-span-3 space-y-3">
          {opportunities.slice(0, 20).map((opp, idx) => {
            const score = Math.round(opp.score);
            const isSelected = selected?.ticker === opp.ticker;
            const barWidth = Math.max(5, score);
            const barColor = score >= 60 ? 'from-blue-500 to-emerald-500' : score >= 40 ? 'from-blue-500 to-yellow-500' : 'from-blue-500 to-red-500';

            return (
              <div
                key={opp.ticker}
                onClick={() => setSelected(opp)}
                className={`glass-panel p-4 cursor-pointer transition-all duration-200 hover:bg-slate-800/50 ${
                  isSelected ? 'ring-1 ring-blue-500/40 bg-slate-800/40' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <span className="text-[10px] text-slate-600 uppercase font-bold block">Rank</span>
                      <span className="text-xl font-black text-slate-500">#{idx + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{opp.ticker}</h3>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{opp.sector}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xl font-black ${score >= 60 ? 'text-emerald-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {score}
                    </span>
                    <span className="text-[10px] text-slate-600 uppercase tracking-wider">Rating</span>
                    <span className="text-slate-700">›</span>
                  </div>
                </div>
                {/* Score bar */}
                <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Detail Panel */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="glass-panel p-6 sticky top-24">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Detailed Analysis</p>
                  <h2 className="text-2xl font-black text-white mt-1">{selected.ticker}</h2>
                </div>
                <div className="text-right">
                  <span className={`text-3xl font-black ${Math.round(selected.score) >= 60 ? 'text-emerald-400' : Math.round(selected.score) >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {Math.round(selected.score)}
                  </span>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Rating Score</p>
                </div>
              </div>

              {/* Breakout Drivers */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  Breakout Drivers
                </h4>
                <div className="space-y-2">
                  {getReasons(selected).map((reason, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Zap size={14} className="text-amber-400 mt-0.5 shrink-0" />
                      <span className="text-slate-300">{typeof reason === 'object' ? JSON.stringify(reason) : String(reason)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Factor Breakdown */}
              <div className="pt-4 border-t border-slate-800/50">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <BarChart2 size={14} className="text-blue-400" />
                  Factor Breakdown
                </h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(getWeights(selected)).map(([key, val]) => {
                    const labels = { sector: 'Sector Strength', rs: 'Relative Strength', daily: "Today's Return", momentum: 'Momentum', volume: 'Volume Activity' };
                    return (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-slate-400">{labels[key] || key}</span>
                        <span className="font-mono font-bold text-emerald-400">{val} pts</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 text-center text-slate-500 text-sm">
              Click a stock on the left to see detailed analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
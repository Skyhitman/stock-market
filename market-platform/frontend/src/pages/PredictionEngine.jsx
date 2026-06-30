import React, { useEffect, useState } from 'react';
import { BrainCircuit, AlertTriangle, Sparkles, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketData } from '../context/MarketDataContext';
import GlassCard from '../components/GlassCard';
import { HoloLoader, StatusIndicator } from '../components/HUDElements';

export default function PredictionEngine() {
  const { predictions, sectorPredictions: sectorPreds, stocksOverview: overviewData, loading } = useMarketData();
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [activeTab, setActiveTab] = useState('stock');
  const [availableStocks, setAvailableStocks] = useState([]);

  useEffect(() => {
    let tickers = [...(predictions || []).map(p => p.ticker)];
    if (overviewData) {
      overviewData.forEach(s => { if (!tickers.includes(s.ticker)) tickers.push(s.ticker); });
    }
    setAvailableStocks(tickers);
    if (predictions && predictions.length > 0 && !selectedTicker) {
      setSelectedTicker(predictions[0].ticker);
    }
  }, [predictions, overviewData, selectedTicker]);

  if (loading && (!predictions || predictions.length === 0)) return <HoloLoader />;

  const selectedPred = (predictions || []).find(p => p.ticker === selectedTicker);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="w-1 h-8 rounded-full" style={{ background: 'var(--neon-purple)', boxShadow: '0 0 10px var(--neon-purple)' }} />
          AI Prediction Core
        </h1>
        <p className="text-slate-500 mt-1 text-sm ml-4">Next-day market movement forecasts powered by XGBoost</p>
      </motion.div>

      <div className="flex gap-4 border-b border-slate-800/50 pb-2">
        <button onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 text-sm font-bold transition-colors relative ${activeTab === 'stock' ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}>
          Stock Predictions
          {activeTab === 'stock' && <motion.div layoutId="tabLine" className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-purple-500" style={{ boxShadow: '0 0 8px rgba(168,85,247,0.5)' }} />}
        </button>
        <button onClick={() => setActiveTab('sector')}
          className={`px-4 py-2 text-sm font-bold transition-colors relative ${activeTab === 'sector' ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}>
          Sector Predictions
          {activeTab === 'sector' && <motion.div layoutId="tabLine" className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-purple-500" style={{ boxShadow: '0 0 8px rgba(168,85,247,0.5)' }} />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {activeTab === 'stock' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto pr-2">
                <GlassCard hover={false} className="p-3 mb-4 sticky top-0 z-10 backdrop-blur-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusIndicator label="AI ENGINE ACTIVE" color="purple" />
                  </div>
                  <select value={selectedTicker || ''} onChange={e => setSelectedTicker(e.target.value)}
                    className="neon-input w-full cursor-pointer">
                    {availableStocks.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </GlassCard>

                <div className="space-y-3">
                  {predictions.map(p => (
                    <div key={p.ticker} onClick={() => setSelectedTicker(p.ticker)}
                      className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedTicker === p.ticker ? 'border-purple-500/50 bg-purple-500/10' : 'border-slate-800/50 bg-slate-900/40 hover:bg-slate-800/60'}`}
                      style={{ boxShadow: selectedTicker === p.ticker ? '0 0 20px rgba(168,85,247,0.1)' : 'none' }}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-white text-lg">{p.ticker}</span>
                        {p.direction === 'Bullish' ? <TrendingUp className="text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" size={18} /> : <TrendingDown className="text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" size={18} />}
                      </div>
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-wider">
                        <span className="text-slate-500">Confidence</span>
                        <span className={`font-bold font-mono ${p.confidence > 70.0 ? 'text-purple-400' : 'text-slate-400'}`}>{p.confidence.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                {!selectedPred ? (
                  <GlassCard hover={false} className="h-64 flex flex-col items-center justify-center">
                    <BrainCircuit size={48} className="text-slate-600 mb-4 animate-pulse" />
                    <p className="text-slate-400">Select a stock to view AI analysis</p>
                  </GlassCard>
                ) : (
                  <>
                    <GlassCard glow={selectedPred.direction === 'Bullish' ? 'green' : 'red'}>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h2 className="text-3xl font-bold text-white mb-2">{selectedPred.ticker}</h2>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-cyan-500/60 font-bold uppercase tracking-[0.2em]">Next Day Forecast</span>
                            <div className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-2 ${selectedPred.direction === 'Bullish' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'}`}>
                              {selectedPred.direction === 'Bullish' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                              {selectedPred.direction === 'Bullish' ? 'BULLISH (UP)' : 'BEARISH (DOWN)'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Model Confidence</p>
                          <span className="text-3xl font-bold text-white font-mono neon-glow-purple">
                            {selectedPred.confidence.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-950/50 rounded-xl p-5 border border-slate-800/50">
                        <h4 className="text-[10px] text-cyan-500/60 font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <Sparkles size={12} className="text-purple-400" /> Key Drivers (SHAP Values)
                        </h4>
                        {selectedPred.top_factors && selectedPred.top_factors.length > 0 ? (
                          <div className="space-y-4">
                            {selectedPred.top_factors.sort((a,b) => Math.abs(b.shap) - Math.abs(a.shap)).slice(0, 5).map((factorObj, i) => {
                              const feature = factorObj.feature;
                              const impact = factorObj.shap;
                              const isPositive = impact > 0;
                              const maxImpact = Math.max(...selectedPred.top_factors.map(f => Math.abs(f.shap)));
                              const width = Math.max(5, (Math.abs(impact) / maxImpact) * 100);
                              return (
                                <div key={i} className="relative">
                                  <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-slate-300 font-mono text-[10px]">{feature.toUpperCase()}</span>
                                    <span className={`font-mono text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {isPositive ? '+' : ''}{impact.toFixed(4)}
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden flex">
                                    <div className="h-full flex-1">
                                      {!isPositive && <div className="h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] float-right rounded-full" style={{ width: `${width}%` }} />}
                                    </div>
                                    <div className="w-[1px] h-full bg-slate-600/50 z-10" />
                                    <div className="h-full flex-1">
                                      {isPositive && <div className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] rounded-full" style={{ width: `${width}%` }} />}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No feature attribution data available.</p>
                        )}
                      </div>
                    </GlassCard>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sectorPreds.map((sector, i) => (
                <GlassCard key={i} delay={i * 0.1} glow={sector.bullish_ratio > 50 ? 'green' : 'red'}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-white">{sector.sector}</h3>
                    <div className={`p-2 rounded-lg border ${sector.bullish_ratio > 50 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'}`}>
                      {sector.bullish_ratio > 50 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[9px] uppercase tracking-wider text-slate-500 mb-1 font-bold">
                        <span>Bullish Ratio</span>
                        <span className="text-white font-mono">{(sector.bullish_ratio).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" style={{ width: `${sector.bullish_ratio}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800/50">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Avg Confidence</p>
                        <p className="text-sm font-bold text-purple-400 font-mono">{(sector.confidence).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Total Signals</p>
                        <p className="text-sm font-bold text-white font-mono">{sector.total_stocks}</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
              {sectorPreds.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500">
                  No sector prediction data available yet.
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
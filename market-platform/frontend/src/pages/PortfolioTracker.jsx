import React, { useEffect, useState } from 'react';
import { Briefcase, Plus, Trash2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPortfolio, addPortfolioItem, removePortfolioItem, fetchScreener } from '../api/client';
import GlassCard from '../components/GlassCard';
import { HoloLoader } from '../components/HUDElements';

export default function PortfolioTracker({ lastRefresh }) {
  const [portfolio, setPortfolio] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true); // full-screen loader, first load only
  const [saving, setSaving] = useState(false);                 // inline spinner for add/remove
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [availableStocks, setAvailableStocks] = useState([]);

  // Silent refresh — never shows full-screen loader (used after add/remove)
  const refreshPortfolio = async () => {
    try {
      const data = await fetchPortfolio();
      setPortfolio(data || []);
      setError('');
    } catch (err) {
      console.error('Portfolio refresh error:', err);
      setError(err.message || 'Failed to load portfolio.');
    }
  };

  // Initial load — shows full-screen loader only when portfolio is empty
  const loadData = async () => {
    setError('');
    try {
      const data = await fetchPortfolio();
      setPortfolio(data || []);
    } catch (err) {
      console.error('Portfolio load error:', err);
      setError(err.message || 'Failed to load portfolio. Please log in and try again.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchScreener().then(data => {
      setAvailableStocks(data.map(s => ({ 
        ticker: s.ticker, 
        displayTicker: s.ticker.replace('.NS', ''), 
        price: s.close || 0 
      })));
    }).catch(console.error);
  }, [lastRefresh]);

  const handleTickerChange = (val) => {
    setTicker(val);
    const stock = availableStocks.find(s => s.ticker === val);
    if (stock && stock.price > 0) setBuyPrice(stock.price.toFixed(2));
    else setBuyPrice('');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!ticker || !quantity || !buyPrice) return;
    setSaving(true);
    try {
      await addPortfolioItem({ 
        ticker: ticker.toUpperCase(), 
        quantity: parseFloat(quantity), 
        buy_price: parseFloat(buyPrice) 
      });
      setTicker(''); 
      setQuantity(''); 
      setBuyPrice(''); 
      setShowAddForm(false);
      await refreshPortfolio();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to add portfolio item');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (t) => { 
    setSaving(true); 
    try {
      await removePortfolioItem(t); 
      await refreshPortfolio(); 
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to remove portfolio item');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) return <HoloLoader />;

  const totalValue = portfolio.reduce((acc, p) => acc + (p.current_price * p.quantity), 0);
  const totalCost = portfolio.reduce((acc, p) => acc + (p.buy_price * p.quantity), 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  if (error && portfolio.length === 0) return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="w-1 h-8 rounded-full" style={{ background: 'var(--neon-cyan)', boxShadow: '0 0 10px var(--neon-cyan)' }} />
          Portfolio Room
        </h1>
        <p className="text-slate-500 mt-1 text-sm ml-4">Manage holdings and track performance</p>
      </motion.div>
      <div className="p-5 rounded-xl flex items-center gap-3 text-red-400 text-sm font-medium"
        style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
        <TrendingDown size={18} />
        {error}
        <button onClick={loadData} className="ml-auto neon-btn text-xs" style={{ borderColor: 'rgba(239,68,68,0.2)', color: '#f87171' }}>Retry</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="w-1 h-8 rounded-full" style={{ background: 'var(--neon-cyan)', boxShadow: '0 0 10px var(--neon-cyan)' }} />
          Portfolio Room
        </h1>
        <p className="text-slate-500 mt-1 text-sm ml-4">Manage holdings and track performance</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard delay={0.1} glow="cyan">
          <p className="text-[9px] text-cyan-500/60 font-bold uppercase tracking-[0.2em] mb-1">Total Value</p>
          <h2 className="text-3xl font-bold text-white font-mono tracking-tight">
            ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
        </GlassCard>

        <GlassCard delay={0.2} glow={totalPnl >= 0 ? 'green' : 'red'}>
          <p className="text-[9px] text-cyan-500/60 font-bold uppercase tracking-[0.2em] mb-1">Total P&L</p>
          <div className="flex items-center gap-3">
            <h2 className={`text-3xl font-bold font-mono tracking-tight ${totalPnl >= 0 ? 'text-emerald-400 neon-glow-green' : 'text-red-400 neon-glow-red'}`}>
              {totalPnl >= 0 ? '+' : ''}₹{Math.abs(totalPnl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
              style={{
                background: totalPnl >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${totalPnl >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
              }}>
              {totalPnl >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Holdings Table */}
      <GlassCard delay={0.3} hover={false} glow="purple">
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Holdings
            {saving && <RefreshCw size={13} className="animate-spin text-cyan-400" />}
          </h2>
          <button onClick={() => setShowAddForm(!showAddForm)} disabled={saving} className="neon-btn flex items-center gap-2" style={{ opacity: saving ? 0.5 : 1 }}>
            <Plus size={15} /> Add Holding
          </button>
        </div>

        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAdd}
              className="mb-6 p-4 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end overflow-hidden"
              style={{ background: 'rgba(0, 240, 255, 0.02)', border: '1px solid rgba(0, 240, 255, 0.08)' }}
            >
              <div>
                <label className="block text-[9px] font-bold text-cyan-500/60 uppercase tracking-[0.2em] mb-1">Asset (Ticker)</label>
                <select value={ticker} onChange={e => handleTickerChange(e.target.value)}
                  className="neon-input w-full cursor-pointer" required>
                  <option value="" disabled>Select a stock</option>
                  {availableStocks.map(s => <option key={s.ticker} value={s.ticker}>{s.displayTicker}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-cyan-500/60 uppercase tracking-[0.2em] mb-1">Quantity</label>
                <input type="number" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)}
                  className="neon-input w-full" placeholder="100" required />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-cyan-500/60 uppercase tracking-[0.2em] mb-1">Buy Price</label>
                <input type="number" step="0.01" value={buyPrice} onChange={e => setBuyPrice(e.target.value)}
                  className="neon-input w-full" placeholder="3500.50" required />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="neon-btn flex-1 flex items-center justify-center gap-1.5" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)', color: '#10b981', opacity: saving ? 0.6 : 1 }}>
                  {saving ? <><RefreshCw size={12} className="animate-spin" /> Saving…</> : 'Save'}
                </button>
                <button type="button" disabled={saving} onClick={() => setShowAddForm(false)} className="neon-btn flex-1" style={{ borderColor: 'rgba(100,116,139,0.2)', color: '#94a3b8', opacity: saving ? 0.5 : 1 }}>Cancel</button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[9px] text-cyan-500/40 uppercase tracking-[0.2em] font-bold"
              style={{ borderBottom: '1px solid rgba(0, 240, 255, 0.06)' }}>
              <tr>
                <th className="p-3">Asset</th>
                <th className="p-3 text-right">QTY</th>
                <th className="p-3 text-right">Buy Price</th>
                <th className="p-3 text-right">Current Price</th>
                <th className="p-3 text-right">Return (%)</th>
                <th className="p-3 text-right">Current Value</th>
                <th className="p-3 text-center w-12"></th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((p, i) => {
                const cv = p.current_price * p.quantity;
                return (
                  <motion.tr key={p.ticker}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="transition-all duration-300"
                    style={{ borderBottom: '1px solid rgba(100, 116, 139, 0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="p-3"><div className="font-bold text-white">{p.ticker.replace('.NS', '')}</div></td>
                    <td className="p-3 text-right text-slate-300 font-mono">{p.quantity}</td>
                    <td className="p-3 text-right font-mono text-slate-500">₹{p.buy_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono text-slate-300">₹{p.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right">
                      <span className={`font-mono font-bold ${p.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                        style={{ textShadow: p.pnl >= 0 ? '0 0 6px rgba(16,185,129,0.3)' : '0 0 6px rgba(239,68,68,0.3)' }}>
                        {p.pnl >= 0 ? '+' : ''}{p.pnl_pct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-white font-bold">
                      ₹{cv.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleRemove(p.ticker)}
                        className="text-slate-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/5">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
              {portfolio.length === 0 && !showAddForm && (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <Briefcase size={32} className="text-slate-600" />
                      <p>Your portfolio is empty. Click "Add Holding" to start tracking.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
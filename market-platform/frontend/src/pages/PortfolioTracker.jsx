import React, { useEffect, useState } from 'react';
import { Loader2, Briefcase, Plus, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { fetchPortfolio, addPortfolioItem, removePortfolioItem, fetchScreener } from '../api/client';

export default function PortfolioTracker({ lastRefresh }) {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [availableStocks, setAvailableStocks] = useState([]);

  const loadData = async () => {
    try {
      const data = await fetchPortfolio();
      setPortfolio(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchScreener().then(data => {
      setAvailableStocks(data.map(s => ({
        ticker: s.ticker.replace('.NS', ''),
        price: s.close || 0
      })));
    }).catch(console.error);
  }, [lastRefresh]);

  const handleTickerChange = (val) => {
    setTicker(val);
    const stock = availableStocks.find(s => s.ticker === val);
    if (stock && stock.price > 0) {
      setBuyPrice(stock.price.toFixed(2));
    } else {
      setBuyPrice('');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!ticker || !quantity || !buyPrice) return;
    
    setLoading(true);
    await addPortfolioItem({
      ticker: ticker.toUpperCase(),
      quantity: parseFloat(quantity),
      buy_price: parseFloat(buyPrice)
    });
    setTicker('');
    setQuantity('');
    setBuyPrice('');
    setShowAddForm(false);
    await loadData();
  };

  const handleRemove = async (t) => {
    setLoading(true);
    await removePortfolioItem(t);
    await loadData();
  };

  if (loading && portfolio.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  const totalValue = portfolio.reduce((acc, p) => acc + (p.current_price * p.quantity), 0);
  const totalCost = portfolio.reduce((acc, p) => acc + (p.buy_price * p.quantity), 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <span className="w-1 h-8 bg-blue-500 rounded-full inline-block" />
          My Portfolio Tracker
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your holdings and track performance against market leaders</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-6 flex flex-col justify-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Value</p>
          <h2 className="text-4xl font-bold text-white tracking-tight">
            ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
        </div>
        
        <div className="glass-panel p-6 flex flex-col justify-center relative overflow-hidden">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total P&L</p>
          <div className="flex items-center gap-3">
            <h2 className={`text-4xl font-bold tracking-tight ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalPnl >= 0 ? '+' : ''}₹{Math.abs(totalPnl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <span className={`px-2 py-1 rounded-md text-sm font-bold ${totalPnl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {totalPnl >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">Holdings</h2>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            <Plus size={16} />
            Add Holding
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAdd} className="mb-6 bg-slate-800/40 p-4 rounded-lg border border-slate-700/50 grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-fade-in">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Asset (Ticker)</label>
              <select 
                value={ticker}
                onChange={e => handleTickerChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white outline-none focus:border-blue-500 transition-colors text-sm appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>Select a stock</option>
                {availableStocks.map(s => (
                  <option key={s.ticker} value={s.ticker}>{s.ticker}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Quantity</label>
              <input 
                type="number" 
                step="0.01"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white outline-none focus:border-blue-500 transition-colors text-sm"
                placeholder="100"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Buy Price</label>
              <input 
                type="number" 
                step="0.01"
                value={buyPrice}
                onChange={e => setBuyPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white outline-none focus:border-blue-500 transition-colors text-sm"
                placeholder="3500.50"
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded transition-colors text-sm">
                Save
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 px-4 rounded transition-colors text-sm">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-400 uppercase tracking-wider font-bold border-b border-slate-700/50">
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
            <tbody className="divide-y divide-slate-800/30">
              {portfolio.map((p) => {
                const cv = p.current_price * p.quantity;
                return (
                  <tr key={p.ticker} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white text-base">{p.ticker.replace('.NS', '')}</div>
                    </td>
                    <td className="p-3 text-right text-slate-300 font-mono">{p.quantity}</td>
                    <td className="p-3 text-right font-mono text-slate-400">₹{p.buy_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono text-slate-300">₹{p.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right">
                      <span className={`font-mono font-bold ${p.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {p.pnl >= 0 ? '+' : ''}{p.pnl_pct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-white font-bold">
                      ₹{cv.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleRemove(p.ticker)} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Remove Asset">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
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
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Play, LineChart as LineChartIcon, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { runBacktest } from '../api/client';

export default function Backtesting() {
  const [ticker, setTicker] = useState('RELIANCE.NS');
  const [days, setDays] = useState(30);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRun = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await runBacktest(ticker, parseInt(days));
      setResults(data);
    } catch (err) {
      console.error(err);
      setError('Failed to run backtest. Ensure the ticker is valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <LineChartIcon className="text-rose-400" size={32} />
          Strategy Backtesting
        </h1>
        <p className="text-slate-400 mt-2">Test algorithmic trading strategies against historical NSE data.</p>
      </div>

      <div className="glass-panel p-6">
        <form onSubmit={handleRun} className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ticker</label>
            <input 
              type="text" 
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Lookback (Days)</label>
            <select 
              value={days}
              onChange={e => setDays(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-white outline-none focus:border-blue-500 transition-colors"
            >
              <option value={30}>30 Days</option>
              <option value={90}>90 Days</option>
              <option value={180}>180 Days (6 Months)</option>
              <option value={365}>1 Year</option>
            </select>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
            {loading ? 'Running...' : 'Run Backtest'}
          </button>
        </form>
      </div>

      {error && (
        <div className="glass-panel p-4 text-red-400 border border-red-500/20 bg-red-500/10">
          {error}
        </div>
      )}

      {results && !loading && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-5">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Return</p>
              <div className={`text-2xl font-bold font-mono ${results.total_return_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {results.total_return_pct >= 0 ? '+' : ''}{results.total_return_pct.toFixed(2)}%
              </div>
            </div>
            <div className="glass-panel p-5">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Win Rate</p>
              <div className="text-2xl font-bold font-mono text-blue-400">
                {results.win_rate.toFixed(1)}%
              </div>
            </div>
            <div className="glass-panel p-5">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Trades</p>
              <div className="text-2xl font-bold font-mono text-white">
                {results.total_trades}
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold mb-6">Equity Curve</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={results.equity_curve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={2} dot={false} name="Portfolio Value" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold mb-4">Trade Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-3 rounded-tl-lg">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">Shares</th>
                    <th className="p-3 text-right rounded-tr-lg">Cost/Proceeds</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {results.trades.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="p-3 text-slate-400">{t.date}</td>
                      <td className={`p-3 font-bold ${t.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.type}</td>
                      <td className="p-3 text-right font-mono text-white">₹{t.price.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-slate-300">{t.shares}</td>
                      <td className="p-3 text-right font-mono text-slate-400">
                        {t.type === 'BUY' ? '-' : '+'}₹{Math.abs(t.value).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {results.trades.length === 0 && (
                    <tr><td colSpan="5" className="p-4 text-center text-slate-500">No trades executed during this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
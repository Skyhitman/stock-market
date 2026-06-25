import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Activity, Briefcase, TrendingUp, DollarSign, PieChart, Link2, Zap, Cpu, Bell } from 'lucide-react';
import MarketOverview from './pages/Overview';
import SectorIntelligence from './pages/SectorIntelligence';
import RelationshipDiscovery from './pages/RelationshipDiscovery';
import OpportunityEngine from './pages/OpportunityEngine';
import PredictionEngine from './pages/PredictionEngine';
import MarketScreener from './pages/MarketScreener';
import TopMovers from './pages/TopMovers';
import PortfolioTracker from './pages/PortfolioTracker';
import { fetchMarketSummary, fetchAlerts } from './api/client';

const SidebarLink = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
        isActive
          ? 'bg-blue-500/15 text-white font-semibold border-l-2 border-blue-500'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
      }`
    }
  >
    <Icon size={18} />
    <span>{label}</span>
  </NavLink>
);

export default function App() {
  const [showNotifs, setShowNotifs] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [marketInfo, setMarketInfo] = useState(null);

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchSummary = () => {
      fetchMarketSummary().then(data => setMarketInfo(data)).catch(err => console.error(err));
      fetchAlerts().then(data => setAlerts(data)).catch(err => console.error(err));
    };
    fetchSummary();
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      fetchSummary();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (d) => {
    if (!d) return '';
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  
  const formatDateString = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateTimeString = (dtStr) => {
    if (!dtStr) return '';
    const d = new Date(dtStr);
    const datePart = d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    const timePart = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    return `${datePart}, ${timePart}`;
  };

  return (
    <Router>
      <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden relative">
        {/* Sidebar */}
        <nav className="w-56 flex-shrink-0 border-r border-slate-800/60 bg-slate-900/70 backdrop-blur-xl relative z-10 flex flex-col">
          {/* Logo */}
          <div className="p-5 border-b border-slate-800/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Activity className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-tight leading-tight uppercase">SK Market</h1>
              <h1 className="text-sm font-extrabold text-white tracking-tight leading-tight uppercase">Analysis</h1>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">Intelligence Platform</p>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <SidebarLink to="/" icon={Activity} label="Market Overview" />
            <SidebarLink to="/portfolio" icon={Briefcase} label="Portfolio Tracker" />
            <SidebarLink to="/movers" icon={TrendingUp} label="Top Movers" />
            <SidebarLink to="/screener" icon={DollarSign} label="Stock Data" />
            <SidebarLink to="/sectors" icon={PieChart} label="Sectors" />
            <SidebarLink to="/relationships" icon={Link2} label="Stock Connections" />
            <SidebarLink to="/opportunity" icon={Zap} label="Best Picks" />
            <SidebarLink to="/predict" icon={Cpu} label="AI Predictions" />
          </div>

          {/* NSE Live Footer */}
          <div className="p-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
              <span className="font-bold text-emerald-400">NSE LIVE</span>
            </span>
            <span className="text-slate-600">IST Timezone</span>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto relative z-10">
          {/* Top Bar */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-8 py-3 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/30">
            {/* Status Pills */}
            <div className="flex items-center gap-3">
              {marketInfo?.data_date && (
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-300">Trading Date: {marketInfo.data_date}</span>
                </div>
              )}
              {marketInfo?.last_updated && (
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-300">Last Updated: {formatDateTimeString(marketInfo.last_updated)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Activity size={12} className="text-emerald-500" />
                Live Refresh: {formatTime(lastRefresh)}
              </span>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
                >
                  <Bell size={20} className="text-slate-400" />
                  {alerts.length > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                      {alerts.length}
                    </div>
                  )}
                </button>
                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-72 glass-panel p-4 space-y-3 shadow-2xl max-h-96 overflow-y-auto">
                    <h4 className="text-sm font-bold text-white mb-3">Live Notifications</h4>
                    {alerts.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No recent alerts.</p>
                    ) : (
                      alerts.map(alert => {
                        let colorClass = 'border-blue-500';
                        if (alert.level === 'SUCCESS') colorClass = 'border-emerald-500';
                        if (alert.level === 'WARN') colorClass = 'border-amber-500';
                        if (alert.level === 'ERROR') colorClass = 'border-red-500';
                        
                        return (
                          <div key={alert.id} className={`text-xs text-slate-400 p-2.5 rounded bg-slate-800/50 border-l-2 ${colorClass}`}>
                            {alert.message}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 max-w-[1600px] mx-auto min-h-full">
            <Routes>
              <Route path="/" element={<MarketOverview lastRefresh={lastRefresh} />} />
              <Route path="/sectors" element={<SectorIntelligence lastRefresh={lastRefresh} />} />
              <Route path="/movers" element={<TopMovers lastRefresh={lastRefresh} />} />
              <Route path="/opportunity" element={<OpportunityEngine lastRefresh={lastRefresh} />} />
              <Route path="/predict" element={<PredictionEngine lastRefresh={lastRefresh} />} />
              <Route path="/relationships" element={<RelationshipDiscovery lastRefresh={lastRefresh} />} />
              <Route path="/screener" element={<MarketScreener lastRefresh={lastRefresh} />} />
              <Route path="/portfolio" element={<PortfolioTracker lastRefresh={lastRefresh} />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}
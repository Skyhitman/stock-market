import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Activity, Bell } from 'lucide-react';
import NavSidebar from './components/NavSidebar';
import ParticleField from './components/ParticleField';
import LiveTicker from './components/LiveTicker';
import PageTransition from './components/PageTransition';
import { StatusIndicator } from './components/HUDElements';
import { fetchMarketSummary, fetchAlerts } from './api/client';
import { useMouseParallax } from './hooks/useMouseParallax';

// Pages
import MarketOverview from './pages/Overview';
import SectorIntelligence from './pages/SectorIntelligence';
import RelationshipDiscovery from './pages/RelationshipDiscovery';
import OpportunityEngine from './pages/OpportunityEngine';
import PredictionEngine from './pages/PredictionEngine';
import MarketScreener from './pages/MarketScreener';
import TopMovers from './pages/TopMovers';
import PortfolioTracker from './pages/PortfolioTracker';

function AnimatedRoutes({ lastRefresh }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <PageTransition key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<MarketOverview lastRefresh={lastRefresh} />} />
          <Route path="/sectors" element={<SectorIntelligence lastRefresh={lastRefresh} />} />
          <Route path="/movers" element={<TopMovers lastRefresh={lastRefresh} />} />
          <Route path="/opportunity" element={<OpportunityEngine lastRefresh={lastRefresh} />} />
          <Route path="/predict" element={<PredictionEngine lastRefresh={lastRefresh} />} />
          <Route path="/relationships" element={<RelationshipDiscovery lastRefresh={lastRefresh} />} />
          <Route path="/screener" element={<MarketScreener lastRefresh={lastRefresh} />} />
          <Route path="/portfolio" element={<PortfolioTracker lastRefresh={lastRefresh} />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
  );
}

export default function App() {
  const [showNotifs, setShowNotifs] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [marketInfo, setMarketInfo] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const { parallaxStyle, rotateStyle } = useMouseParallax(0.015);

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

  const formatDateTimeString = (dtStr) => {
    if (!dtStr) return '';
    const d = new Date(dtStr);
    const datePart = d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    const timePart = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    return `${datePart}, ${timePart}`;
  };

  return (
    <Router>
      <div className="flex h-screen text-slate-200 font-sans overflow-hidden relative">
        {/* Layer 0: Particle Background */}
        <div style={parallaxStyle} className="absolute inset-0 z-0">
          <ParticleField />
        </div>

        {/* Layer 1: Grid overlay */}
        <div className="fixed inset-0 grid-overlay pointer-events-none z-[1]" style={parallaxStyle} />

        {/* Ambient glow blobs */}
        <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none z-[1]"
          style={{ background: 'radial-gradient(circle, rgba(0, 240, 255, 0.03) 0%, transparent 70%)', ...parallaxStyle }} />
        <div className="fixed bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none z-[1]"
          style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.03) 0%, transparent 70%)', ...parallaxStyle }} />

        {/* Layer 2: Sidebar */}
        <NavSidebar />

        {/* Layer 3: Main Content */}
        <main className="flex-1 overflow-hidden relative z-10 flex flex-col">
          {/* Live Ticker */}
          <LiveTicker />

          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-2.5 relative z-20"
            style={{
              background: 'linear-gradient(90deg, rgba(2, 6, 23, 0.8), rgba(15, 23, 42, 0.6))',
              borderBottom: '1px solid rgba(0, 240, 255, 0.04)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Status Pills */}
            <div className="flex items-center gap-3">
              {marketInfo?.data_date && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(0, 240, 255, 0.08)',
                  }}
                >
                  <div className="status-dot-live" style={{ width: 6, height: 6 }} />
                  <span className="text-[10px] font-bold text-slate-300 tracking-wide">
                    Trading: {marketInfo.data_date}
                  </span>
                </div>
              )}
              {marketInfo?.last_updated && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(100, 116, 139, 0.08)',
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 tracking-wide">
                    Updated: {formatDateTimeString(marketInfo.last_updated)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500 tracking-wide">
                <Activity size={11} className="text-cyan-500" />
                Refresh: {formatTime(lastRefresh)}
              </span>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2 rounded-xl transition-all duration-300"
                  style={{
                    background: showNotifs ? 'rgba(0, 240, 255, 0.05)' : 'transparent',
                    border: `1px solid ${showNotifs ? 'rgba(0, 240, 255, 0.15)' : 'transparent'}`,
                  }}
                >
                  <Bell size={18} className="text-slate-400" />
                  {alerts.length > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                      style={{ boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)' }}
                    >
                      {alerts.length}
                    </div>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 glass-card-3d p-4 space-y-3 z-50"
                    style={{
                      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 240, 255, 0.05)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">Notifications</h4>
                      <StatusIndicator label="LIVE" color="green" />
                    </div>
                    {alerts.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4 text-center">No recent alerts.</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {alerts.map(alert => {
                          let borderCol = 'rgba(59, 130, 246, 0.4)';
                          if (alert.level === 'SUCCESS') borderCol = 'rgba(16, 185, 129, 0.4)';
                          if (alert.level === 'WARN') borderCol = 'rgba(245, 158, 11, 0.4)';
                          if (alert.level === 'ERROR') borderCol = 'rgba(239, 68, 68, 0.4)';

                          return (
                            <div key={alert.id} className="text-xs text-slate-400 p-3 rounded-xl"
                              style={{
                                background: 'rgba(15, 23, 42, 0.5)',
                                borderLeft: `2px solid ${borderCol}`,
                              }}
                            >
                              {alert.message}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 overflow-auto p-6 max-w-[1600px] mx-auto w-full">
            <AnimatedRoutes lastRefresh={lastRefresh} />
          </div>

          {/* Bottom HUD Bar */}
          <div className="flex items-center justify-between px-6 py-1.5 text-[9px]"
            style={{
              background: 'linear-gradient(90deg, rgba(2, 6, 23, 0.8), rgba(15, 23, 42, 0.6))',
              borderTop: '1px solid rgba(0, 240, 255, 0.04)',
            }}
          >
            <div className="flex items-center gap-4">
              <StatusIndicator label="SYSTEM ONLINE" color="green" />
              <span className="text-slate-600 font-mono">v3.0</span>
            </div>
            <div className="flex items-center gap-4 text-slate-600 font-mono">
              <span>NSE:NIFTY50</span>
              <span>•</span>
              <span>LATENCY: 12ms</span>
              <span>•</span>
              <span>STREAMS: ACTIVE</span>
            </div>
          </div>
        </main>

        {/* Floating data stream numbers */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="data-stream-number"
            style={{
              left: `${10 + Math.random() * 80}%`,
              animationDelay: `${i * 1.2}s`,
              animationDuration: `${6 + Math.random() * 6}s`,
            }}
          >
            {(Math.random() * 9999).toFixed(2)}
          </div>
        ))}
      </div>
    </Router>
  );
}
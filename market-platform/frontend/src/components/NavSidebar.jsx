import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Briefcase, TrendingUp, DollarSign, PieChart, Link2, Zap, Cpu } from 'lucide-react';

const navItems = [
  { to: '/', icon: Activity, label: 'Market Overview', room: 'Command Center' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio', room: 'Portfolio Room' },
  { to: '/movers', icon: TrendingUp, label: 'Top Movers', room: 'Movers Deck' },
  { to: '/screener', icon: DollarSign, label: 'Stock Data', room: 'Data Vault' },
  { to: '/sectors', icon: PieChart, label: 'Sectors', room: 'Sector Hub' },
  { to: '/relationships', icon: Link2, label: 'Connections', room: 'Neural Net' },
  { to: '/opportunity', icon: Zap, label: 'Best Picks', room: 'Opportunity Engine' },
  { to: '/predict', icon: Cpu, label: 'AI Predictions', room: 'AI Core' },
];

function SidebarLink({ to, icon: Icon, label, room, index }) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05, duration: 0.4 }}
          className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 relative overflow-hidden ${
            isActive
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {/* Active background glow */}
          {isActive && (
            <motion.div
              layoutId="activeNav"
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(168, 85, 247, 0.05))',
                border: '1px solid rgba(0, 240, 255, 0.15)',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.05), inset 0 0 20px rgba(0, 240, 255, 0.02)',
              }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}

          {/* Hover bg */}
          {!isActive && (
            <div className="absolute inset-0 rounded-xl bg-slate-800/0 group-hover:bg-slate-800/30 transition-colors duration-300" />
          )}

          {/* Active left bar */}
          {isActive && (
            <motion.div
              layoutId="activeBar"
              className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full"
              style={{
                background: 'var(--neon-cyan)',
                boxShadow: '0 0 8px var(--neon-cyan)',
              }}
            />
          )}

          <Icon size={17} className={`relative z-10 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`} />
          <div className="relative z-10 flex flex-col">
            <span className={`font-semibold ${isActive ? 'text-white' : ''}`}>{label}</span>
            {isActive && <span className="text-[8px] text-cyan-500/50 uppercase tracking-[0.2em] mt-0.5">{room}</span>}
          </div>
        </motion.div>
      )}
    </NavLink>
  );
}

export default function NavSidebar() {
  return (
    <nav className="w-60 flex-shrink-0 relative z-10 flex flex-col h-screen"
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 0.95) 100%)',
        borderRight: '1px solid rgba(0, 240, 255, 0.06)',
        backdropFilter: 'blur(30px)',
      }}
    >
      {/* Logo */}
      <div className="p-5 flex items-center gap-3 holo-shimmer"
        style={{ borderBottom: '1px solid rgba(0, 240, 255, 0.06)' }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center relative"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(168, 85, 247, 0.15))',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)',
          }}
        >
          <Activity className="text-cyan-400" size={20} />
        </div>
        <div>
          <h1 className="text-sm font-extrabold text-white tracking-tight leading-tight uppercase neon-glow-cyan">
            SK Market
          </h1>
          <h1 className="text-sm font-extrabold text-white tracking-tight leading-tight uppercase">
            Analysis
          </h1>
          <p className="text-[8px] text-cyan-500/40 uppercase tracking-[0.3em]">Intelligence Platform</p>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item, i) => (
          <SidebarLink key={item.to} {...item} index={i} />
        ))}
      </div>

      {/* NSE Live Footer */}
      <div className="p-4 flex items-center justify-between text-xs"
        style={{ borderTop: '1px solid rgba(0, 240, 255, 0.06)' }}
      >
        <span className="flex items-center gap-2">
          <div className="status-dot-live" />
          <span className="font-bold text-emerald-400 text-[10px] uppercase tracking-wider">NSE Live</span>
        </span>
        <span className="text-slate-600 text-[10px]">IST</span>
      </div>
    </nav>
  );
}

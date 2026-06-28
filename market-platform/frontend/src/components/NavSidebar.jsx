import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Briefcase, TrendingUp, DollarSign, PieChart, Link2, Zap, Cpu, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

function SidebarLink({ to, icon: Icon, label, room, index, onClick }) {
  return (
    <NavLink to={to} onClick={onClick}>
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

export default function NavSidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Backdrop overlay on mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <nav className={`w-60 flex-shrink-0 flex flex-col h-screen fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
        style={{
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)',
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
              SK Share
            </h1>
            <h1 className="text-sm font-extrabold text-white tracking-tight leading-tight uppercase">
              Market
            </h1>
            <p className="text-[8px] text-cyan-500/40 uppercase tracking-[0.3em]">Analysis Platform</p>
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item, i) => (
            <SidebarLink key={item.to} {...item} index={i} onClick={onClose} />
          ))}
          {user?.is_admin && (
            <SidebarLink 
              to="/admin" 
              icon={Shield} 
              label="Admin Panel" 
              room="Control Room" 
              index={navItems.length} 
              onClick={onClose}
            />
          )}
        </div>

        {/* Profile Info and Logout */}
        <div className="p-4 space-y-3" style={{ borderTop: '1px solid rgba(0, 240, 255, 0.06)' }}>
          <div className="flex items-center gap-3">
            {user?.picture ? (
              <img src={user.picture} alt="" className="w-8 h-8 rounded-full border border-slate-700/60" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs uppercase border border-slate-700">
                {user?.name?.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-white block truncate">{user?.name}</span>
              <span className="text-[9px] text-slate-500 block truncate">{user?.email || 'Guest Visitor'}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-900/60 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-xs font-semibold text-slate-400 hover:text-rose-400 transition-all duration-300 cursor-pointer"
          >
            <LogOut size={12} />
            Sign Out
          </button>
        </div>
      </nav>
    </>
  );
}

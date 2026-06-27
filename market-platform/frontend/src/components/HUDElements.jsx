import React from 'react';

export function HUDCorners() {
  return (
    <>
      <div className="hud-corner hud-corner--tl" />
      <div className="hud-corner hud-corner--tr" />
      <div className="hud-corner hud-corner--bl" />
      <div className="hud-corner hud-corner--br" />
    </>
  );
}

export function ScanLineOverlay() {
  return <div className="scan-line absolute inset-0 pointer-events-none z-[1]" />;
}

export function StatusIndicator({ label = 'SYSTEM ONLINE', color = 'cyan' }) {
  const colors = {
    cyan: { dot: 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]', text: 'text-cyan-400' },
    green: { dot: 'bg-emerald-400 shadow-[0_0_8px_#10b981]', text: 'text-emerald-400' },
    red: { dot: 'bg-red-400 shadow-[0_0_8px_#ef4444]', text: 'text-red-400' },
    purple: { dot: 'bg-purple-400 shadow-[0_0_8px_#a855f7]', text: 'text-purple-400' },
  };
  const c = colors[color] || colors.cyan;

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full animate-pulse ${c.dot}`} />
      <span className={`text-[10px] font-bold uppercase tracking-widest ${c.text}`}>{label}</span>
    </div>
  );
}

export function DataReadout({ label, value, unit = '' }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">{label}</span>
      <span className="text-lg font-bold text-white font-mono">
        {value}<span className="text-xs text-slate-500 ml-1">{unit}</span>
      </span>
    </div>
  );
}

export function HoloLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-2 border-2 border-purple-500/30 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
        <div className="absolute inset-4 border-2 border-cyan-500/50 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#00f0ff]" />
        </div>
      </div>
      <p className="text-xs text-cyan-400/60 uppercase tracking-[0.3em] font-bold">Loading Data Stream</p>
    </div>
  );
}

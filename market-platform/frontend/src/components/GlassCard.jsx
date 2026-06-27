import React from 'react';
import { motion } from 'framer-motion';
import { useTiltEffect } from '../hooks/useTiltEffect';

export default function GlassCard({ children, className = '', delay = 0, hover = true, glow = 'cyan', onClick }) {
  const { ref, style, handleMouseMove, handleMouseLeave } = useTiltEffect(10);

  const glowColors = {
    cyan: 'rgba(0, 240, 255, 0.15)',
    purple: 'rgba(168, 85, 247, 0.15)',
    green: 'rgba(16, 185, 129, 0.15)',
    red: 'rgba(239, 68, 68, 0.15)',
    blue: 'rgba(59, 130, 246, 0.15)',
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={hover ? { y: -6, transition: { duration: 0.3 } } : {}}
      onMouseMove={hover ? handleMouseMove : undefined}
      onMouseLeave={hover ? handleMouseLeave : undefined}
      onClick={onClick}
      style={hover ? style : {}}
      className={`glass-card-3d relative p-5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* HUD Corners */}
      <div className="hud-corner hud-corner--tl" />
      <div className="hud-corner hud-corner--tr" />
      <div className="hud-corner hud-corner--bl" />
      <div className="hud-corner hud-corner--br" />

      {/* Content */}
      <div className="relative z-[2]">{children}</div>

      {/* Subtle glow bg */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-30"
        style={{ background: glowColors[glow] || glowColors.cyan }}
      />
    </motion.div>
  );
}

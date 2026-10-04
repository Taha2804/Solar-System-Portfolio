import React, { useState } from 'react';
import { Briefcase, Compass, Minimize2, Maximize2 } from 'lucide-react';
import { PERSONAL_INFO } from '../data/portfolioData';

interface CentralProfileCardProps {
  onExploreSystem: () => void;
  onOpenRecruiterMode: () => void;
}

export const CentralProfileCard: React.FC<CentralProfileCardProps> = ({
  onExploreSystem,
  onOpenRecruiterMode,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <aside
        className="fixed z-20 pointer-events-none select-none left-1/2 bottom-20 sm:bottom-22 -translate-x-1/2 w-fit transition-all duration-300 animate-in fade-in"
        aria-label="HELIOS-1 Identity HUD Compact"
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="pointer-events-auto rounded-full bg-[#030712]/90 backdrop-blur-xl border border-cyan-400/40 px-4 py-2 flex items-center gap-3 shadow-[0_10px_35px_rgba(0,0,0,0.85),0_0_18px_rgba(0,229,255,0.25)] hover:border-cyan-300 transition-all hover:scale-105 active:scale-95 group"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00e5ff]" />
          <div className="flex items-center gap-2 text-xs font-mono text-left">
            <span className="text-white font-bold tracking-wide">{PERSONAL_INFO.name.toUpperCase()}</span>
            <span className="text-slate-400 hidden sm:inline">· Full Stack &amp; Cybersecurity</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-300 font-bold bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-400/30 flex items-center gap-1">
            <Maximize2 className="w-3 h-3" />
            <span>EXPAND</span>
          </span>
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="fixed z-20 pointer-events-none select-none left-1/2 bottom-20 sm:bottom-22 -translate-x-1/2 w-[94vw] max-w-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
      aria-label="HELIOS-1 Identity Mission HUD"
    >
      <div className="pointer-events-auto rounded-2xl bg-[#030712]/85 backdrop-blur-xl border border-cyan-400/35 p-3.5 sm:p-4 shadow-[0_12px_45px_rgba(0,0,0,0.9),0_0_24px_rgba(0,229,255,0.15)] relative overflow-hidden group">
        {/* Subtle cybernetic corner reticle brackets */}
        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400/70" />
        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400/70" />
        <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400/70" />
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400/70" />

        {/* Top telemetry status line */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px] font-mono">
          <div className="flex items-center gap-2 text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00e5ff]" />
            <span className="font-bold tracking-widest uppercase">HELIOS-1 // IDENTITY HUD</span>
            <span className="text-slate-600 hidden sm:inline">::</span>
            <span className="text-slate-400 hidden sm:inline">ORIGIN [SOL]</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-400/30 font-semibold hidden sm:inline">
              ONLINE
            </span>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Minimize HUD to view solar system"
              aria-label="Minimize HUD"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Primary Typographic Header: Name & Role */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-2">
          <div>
            <h1 className="text-lg sm:text-xl font-['Space_Grotesk'] font-extrabold text-white tracking-tight leading-snug">
              {PERSONAL_INFO.name.toUpperCase()}
            </h1>
            <p className="text-xs font-mono text-cyan-300 font-medium">
              Cybersecurity Analyst &amp; Full Stack Developer
            </p>
          </div>

          {/* Quick Credential Badges */}
          <div className="flex items-center gap-1.5 pt-1 sm:pt-0">
            <span className="px-2 py-0.5 rounded bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold">
              CEH v12
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-400/15 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono font-bold">
              CHFI
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-400/15 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold">
              CCNA
            </span>
          </div>
        </div>

        {/* Short High-Value Description (1 sentence) */}
        <p className="text-[11px] sm:text-xs font-mono text-slate-300 mt-1.5 line-clamp-1 text-ellipsis">
          Specialized in penetration testing, threat hunting &amp; cloud-scale systems operations.
        </p>

        {/* Primary Two-Button Action Row */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10">
          <button
            onClick={onOpenRecruiterMode}
            className="flex-1 py-1.5 sm:py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/50 font-mono text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_14px_rgba(245,158,11,0.2)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-300" />
            <span className="truncate">MISSION CONTROL // RECRUITER</span>
          </button>

          <button
            onClick={onExploreSystem}
            className="flex-1 py-1.5 sm:py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 font-mono text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_14px_rgba(0,229,255,0.2)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-300" />
            <span className="truncate">START ORBIT EXPLORATION</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

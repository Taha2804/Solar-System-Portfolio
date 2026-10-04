import React, { useState, useEffect } from 'react';
import { Compass, Briefcase, ChevronRight, ShieldCheck, Cpu, Sparkles } from 'lucide-react';
import { PERSONAL_INFO } from '../data/portfolioData';

interface LandingScreenProps {
  onExploreUniverse: () => void;
  onViewProfile: () => void;
  isExitingToUniverse?: boolean;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onExploreUniverse,
  onViewProfile,
  isExitingToUniverse = false,
}) => {
  const [bootPhase, setBootPhase] = useState<'BOOT' | 'ONLINE' | 'READY'>('BOOT');

  // Short 1s cinematic boot sequence on first load
  useEffect(() => {
    // Check session storage to see if already booted in this session
    const hasBooted = typeof window !== 'undefined' && sessionStorage.getItem('helios_booted');
    if (hasBooted) {
      setBootPhase('READY');
      return;
    }

    const t1 = setTimeout(() => {
      setBootPhase('ONLINE');
    }, 450);

    const t2 = setTimeout(() => {
      setBootPhase('READY');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('helios_booted', 'true');
      }
    }, 950);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-40 flex flex-col items-center justify-between p-4 sm:p-8 select-none transition-all duration-700 ease-out overflow-y-auto ${
        isExitingToUniverse
          ? 'opacity-0 scale-105 pointer-events-none blur-sm'
          : 'opacity-100 scale-100 pointer-events-auto'
      }`}
      aria-label="HELIOS-1 Mission Experience Selection Gateway"
    >
      {/* Top Telemetry Header Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2 sm:py-3 border-b border-white/10 text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00e5ff]" />
          <span className="font-bold tracking-widest uppercase">HELIOS-1 // MISSION CONTROL</span>
          <span className="text-slate-600 hidden sm:inline">::</span>
          <span className="text-slate-400 hidden sm:inline">RECONNAISSANCE GATEWAY</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="hidden sm:inline">DEFENSE SYSTEM:</span>
          <span
            className={`font-mono font-semibold px-2 py-0.5 rounded border text-[10px] ${
              bootPhase === 'BOOT'
                ? 'text-amber-400 border-amber-400/30 bg-amber-500/10 animate-pulse'
                : 'text-emerald-400 border-emerald-400/30 bg-emerald-500/10'
            }`}
          >
            {bootPhase === 'BOOT' ? 'INITIALIZING...' : 'SYSTEM ONLINE'}
          </span>
        </div>
      </header>

      {/* Center Cinematic Mission Control Console */}
      <main className="w-full max-w-4xl my-auto py-6 sm:py-10 flex flex-col items-center text-center">
        {/* Subtle Cybernetic HUD Bracket Container */}
        <div className="relative w-full p-6 sm:p-10 rounded-3xl bg-[#030712]/75 backdrop-blur-2xl border border-cyan-400/25 shadow-[0_20px_70px_rgba(0,0,0,0.9),0_0_35px_rgba(0,229,255,0.1)] overflow-hidden">
          {/* Corner Reticle Brackets */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

          {/* Subtitle / Subsystem Tag */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 tracking-widest uppercase">
              PORTFOLIO ARCHITECTURE // VER 3.8
            </span>
          </div>

          {/* Primary Typographic Focus: Name */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-['Space_Grotesk'] font-extrabold text-white tracking-tight leading-none uppercase">
            {PERSONAL_INFO.name}
          </h1>

          {/* Professional Role */}
          <p className="mt-3 sm:mt-4 text-base sm:text-xl font-mono text-cyan-300 font-semibold tracking-wide">
            Cybersecurity Analyst &amp; Full Stack Developer
          </p>

          {/* Key Credentials Row */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-4 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              CEH v12
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-cyan-400/15 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold shadow-[0_0_12px_rgba(0,229,255,0.2)]">
              CHFI
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-400/15 border border-emerald-400/40 text-emerald-300 text-xs font-mono font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              CCNA
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-slate-300 text-xs font-mono">
              PUNE, IN
            </span>
          </div>

          {/* Section Prompt */}
          <div className="mt-8 sm:mt-10 mb-4 sm:mb-6 flex items-center justify-center gap-3">
            <div className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent to-cyan-400/50" />
            <span className="font-mono text-xs sm:text-sm font-bold tracking-widest text-slate-300 uppercase">
              SELECT YOUR EXPERIENCE
            </span>
            <div className="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent to-cyan-400/50" />
          </div>

          {/* The Two Distinct Experience Paths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full text-left">
            {/* PATH A: EXPLORE UNIVERSE (Cyan / Blue / 3D Exploration) */}
            <div
              role="button"
              tabIndex={0}
              onClick={onExploreUniverse}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onExploreUniverse();
                }
              }}
              className="group relative p-5 sm:p-6 rounded-2xl bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-400/40 hover:border-cyan-300 transition-all duration-300 cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_0_30px_rgba(0,229,255,0.3)] hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 group-hover:scale-110 transition-transform">
                    <Compass className="w-6 h-6 text-cyan-400" />
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300/80 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-400/20 uppercase tracking-wider font-semibold">
                    3D ASTRODYNAMICS
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-['Space_Grotesk'] font-bold text-white group-hover:text-cyan-200 transition-colors">
                  EXPLORE UNIVERSE
                </h2>
                <p className="text-xs sm:text-sm font-mono text-cyan-400 mt-1">
                  Interactive 3D Solar System
                </p>

                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  Orbit the 9 planetary stations in real 3D space. Inspect penetration testing arsenal, codebases, and systems telemetry via interactive interplanetary travel.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-cyan-400/20 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-300 group-hover:text-white transition-colors">
                  ENTER 3D UNIVERSE
                </span>
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-400 group-hover:text-black transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* PATH B: VIEW MY PROFILE (Amber / Gold / Professional Dossier) */}
            <div
              role="button"
              tabIndex={0}
              onClick={onViewProfile}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onViewProfile();
                }
              }}
              className="group relative p-5 sm:p-6 rounded-2xl bg-amber-950/25 hover:bg-amber-900/35 border border-amber-400/40 hover:border-amber-300 transition-all duration-300 cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-[10px] font-mono text-amber-300/90 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-400/30 uppercase tracking-wider font-bold animate-pulse">
                    RECOMMENDED FOR RECRUITERS
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-['Space_Grotesk'] font-bold text-white group-hover:text-amber-200 transition-colors">
                  VIEW MY PROFILE
                </h2>
                <p className="text-xs sm:text-sm font-mono text-amber-400 mt-1">
                  Recruiter &amp; Assessment Dossier
                </p>

                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  Immediate, structured overview of core competencies, employment history, verified credentials, defense lab metrics, resume, GitHub, and contact channels.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-amber-400/20 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-300 group-hover:text-white transition-colors">
                  ACCESS PROFILE DOSSIER
                </span>
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-black transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer System Telemetry Status */}
      <footer className="w-full max-w-5xl flex items-center justify-between py-2 sm:py-3 border-t border-white/10 text-[11px] font-mono text-slate-400">
        <div>
          <span>HELIOS HELIOCENTRIC PORTFOLIO</span>
          <span className="text-slate-600 mx-2">·</span>
          <span className="text-slate-500 hidden sm:inline">TAHA ALIASGAR BADAMI</span>
        </div>
        <div className="flex items-center gap-2 text-cyan-400">
          <Sparkles className="w-3 h-3 text-cyan-400 animate-spin-slow" />
          <span>3D PERSPECTIVE PERSISTENT</span>
        </div>
      </footer>
    </div>
  );
};

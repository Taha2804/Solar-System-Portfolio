import React from 'react';
import { Volume2, VolumeX, Compass, Briefcase } from 'lucide-react';
import { CelestialBody } from '../types/portfolio';
import { PERSONAL_INFO } from '../data/portfolioData';
import { ViewMode } from './CelestialCanvas';

interface TopNavProps {
  currentPlanet: CelestialBody;
  viewMode: ViewMode;
  targetPlanet: CelestialBody | null;
  isAudioOn: boolean;
  onToggleAudio: () => void;
  onReturnToSol: () => void;
  onReturnToHome?: () => void;
  onOpenRecruiterMode: () => void;
  isRecruiterModeOpen?: boolean;
}

export const TopNav: React.FC<TopNavProps> = React.memo(({
  currentPlanet,
  viewMode,
  targetPlanet,
  isAudioOn,
  onToggleAudio,
  onReturnToSol,
  onReturnToHome,
  onOpenRecruiterMode,
  isRecruiterModeOpen,
}) => {
  const activePlanet = targetPlanet || currentPlanet;
  const isFlying =
    viewMode === 'FLYING_TO_PLANET' ||
    viewMode === 'FLYING_TO_SOLAR' ||
    viewMode === 'PLANET_TRANSITION';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-2.5 sm:px-8 py-2 sm:py-3 flex items-center justify-between pointer-events-auto bg-black/60 backdrop-blur-xl border-b border-white/10 select-none overflow-x-hidden">
      {/* Left: System Identity & Live Coordinates */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full cosmic-glass-pill text-[11px] sm:text-xs font-mono text-slate-300">
          {onReturnToHome ? (
            <button
              onClick={onReturnToHome}
              className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors group"
              title="Return to HELIOS-1 Experience Selection Screen"
            >
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00e5ff]" />
              <span className="text-white group-hover:text-cyan-200 font-bold tracking-widest uppercase text-[10px] sm:text-xs">
                HELIOS-1<span className="hidden sm:inline"> // HOME</span>
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00e5ff]" />
              <span className="text-white font-bold tracking-widest uppercase text-[10px] sm:text-xs">
                HELIOS-1
              </span>
            </div>
          )}
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-amber-400 font-mono font-medium hidden sm:inline">
            {viewMode === 'PLANET_TRANSITION'
              ? `INTERPLANETARY WARP: ${activePlanet.name.toUpperCase()} [${activePlanet.au.toFixed(2)} AU]`
              : isFlying && viewMode === 'FLYING_TO_PLANET'
              ? `APPROACHING: ${activePlanet.name.toUpperCase()} [${activePlanet.au.toFixed(2)} AU]`
              : isFlying && viewMode === 'FLYING_TO_SOLAR'
              ? 'RETREAT VECTOR: SOL ORIGIN [0.00 AU]'
              : `SOLAR COORD: ${currentPlanet.au.toFixed(2)} AU (${currentPlanet.short})`}
          </span>
        </div>
      </div>

      {/* Center: Live Orbital Region / Flight Telemetry Badge (Desktop only) */}
      <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-full cosmic-glass-pill border border-cyan-400/30 text-xs font-mono">
        <div
          className={`w-2 h-2 rounded-full ${
            isFlying ? 'bg-cyan-400 animate-ping' : 'bg-amber-400 animate-pulse'
          }`}
        />
        <span className="text-slate-300">
          {viewMode === 'PLANET_TRANSITION'
            ? 'INTERPLANETARY VECTOR:'
            : viewMode === 'FLYING_TO_PLANET'
            ? '3D CAMERA VECTOR:'
            : viewMode === 'FLYING_TO_SOLAR'
            ? 'CAMERA VECTOR:'
            : 'CURRENT REGION:'}
        </span>
        <span className="text-cyan-400 font-bold tracking-wider">
          {viewMode === 'PLANET_TRANSITION'
            ? `DIRECT TRANSIT -> ${activePlanet.name.toUpperCase()}`
            : viewMode === 'FLYING_TO_PLANET'
            ? `RAPID TRANSIT -> ${activePlanet.name.toUpperCase()}`
            : viewMode === 'FLYING_TO_SOLAR'
            ? 'RETREATING TO SOL SYSTEM'
            : currentPlanet.id === 0
            ? 'ORIGIN [SOL]'
            : `${currentPlanet.name.toUpperCase()} [${currentPlanet.au.toFixed(2)} AU]`}
        </span>
        <span className="text-slate-500">::</span>
        <span className={isFlying ? 'text-cyan-300 animate-pulse' : 'text-emerald-400'}>
          {isFlying ? 'PARTICLE VELOCITY PEAK' : 'ALL 9 PLANETARY NODES ONLINE'}
        </span>
      </div>

      {/* Right: Audio FX & Direct Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Recruiter Mode / Mission Control Button */}
        <button
          onClick={onOpenRecruiterMode}
          className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full transition-all text-[11px] sm:text-xs flex items-center gap-1 font-mono font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:scale-105 active:scale-95 ${
            isRecruiterModeOpen
              ? 'bg-amber-400 text-black border border-amber-300'
              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50'
          }`}
          title="Open Recruiter Assessment Dossier (Hotkey: R)"
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap hidden sm:inline">RECRUITER MODE</span>
          <span className="whitespace-nowrap sm:hidden">RECRUITER</span>
        </button>

        {/* Hyperspace Audio Synth Toggle (Icon-only on mobile, label on desktop) */}
        <button
          onClick={onToggleAudio}
          className={`p-1.5 sm:px-3 sm:py-1.5 rounded-full cosmic-glass-pill transition-all text-xs flex items-center gap-1.5 border shadow-[0_0_12px_rgba(0,229,255,0.15)] ${
            isAudioOn ? 'text-cyan-400 border-cyan-400/40 hover:text-white' : 'text-slate-400 border-white/10 hover:text-slate-200'
          }`}
          title="Toggle Space Engine Audio FX"
          aria-label={isAudioOn ? 'Mute Audio' : 'Unmute Audio'}
        >
          {isAudioOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="font-mono text-[10px] sm:text-[11px] font-semibold whitespace-nowrap hidden sm:inline">
            {isAudioOn ? 'AUDIO: ON' : 'AUDIO: OFF'}
          </span>
        </button>

        {/* Solar Origin Reset Button (Desktop only; on mobile, inside planet view, the dossier header has its own compact SOL button) */}
        <div className="hidden sm:block">
          {viewMode !== 'SOLAR_SYSTEM' ? (
            <button
              onClick={onReturnToSol}
              className="px-3.5 py-1.5 rounded-full bg-amber-400/20 hover:bg-amber-400/35 text-amber-300 border border-amber-400/50 transition-all text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_14px_rgba(255,176,32,0.3)] hover:scale-105 active:scale-95"
              title="Return camera back to Solar System origin"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span className="whitespace-nowrap">SOL ORIGIN</span>
            </button>
          ) : (
            <button
              onClick={onReturnToSol}
              className="px-3.5 py-1.5 rounded-full bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/40 transition-all text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,176,32,0.2)]"
              title="Centered at Sol origin"
            >
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="whitespace-nowrap">SOL ORIGIN</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
});

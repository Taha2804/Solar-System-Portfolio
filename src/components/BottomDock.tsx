import React from 'react';
import { CelestialBody } from '../types/portfolio';

interface BottomDockProps {
  planets: CelestialBody[];
  currentPlanetId: number;
  onSelectPlanet: (id: number) => void;
}

export const BottomDock: React.FC<BottomDockProps> = React.memo(({
  planets,
  currentPlanetId,
  onSelectPlanet,
}) => {
  return (
    <nav
      className="fixed bottom-2 sm:bottom-5 left-0 right-0 z-50 px-2 sm:px-6 flex justify-center pointer-events-auto select-none"
      aria-label="Celestial Dock Navigation"
    >
      <div className="max-w-4xl w-full cosmic-glass rounded-2xl p-1.5 sm:px-3 sm:py-2 flex items-center justify-between gap-1 shadow-[0_15px_45px_rgba(0,0,0,0.9)] border border-cyan-400/30">
        <div className="flex items-center justify-between w-full overflow-x-auto no-scrollbar gap-1 py-0.5">
          {planets.map((planet) => {
            const isActive = planet.id === currentPlanetId;

            return (
              <button
                key={planet.id}
                onClick={() => onSelectPlanet(planet.id)}
                className={`flex-1 min-w-[50px] sm:min-w-[66px] min-h-[44px] py-1 px-1 sm:px-2 rounded-xl flex flex-col items-center justify-center transition-all duration-200 group ${
                  isActive
                    ? 'bg-cyan-400/25 border border-cyan-400/70 shadow-[0_0_15px_rgba(0,229,255,0.45)] scale-105'
                    : 'hover:bg-white/10 opacity-75 hover:opacity-100'
                }`}
                title={`Warp to ${planet.name}: ${planet.role}`}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center mb-1 transition-transform group-hover:scale-125"
                  style={{
                    backgroundColor: planet.color,
                    boxShadow: `0 0 10px ${planet.color}`,
                  }}
                >
                  {planet.id === 0 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>

                <span
                  className={`text-[9px] sm:text-[10px] font-mono font-bold tracking-tight whitespace-nowrap ${
                    isActive ? 'text-cyan-300' : 'text-white'
                  }`}
                >
                  {planet.short}
                </span>

                <span className="text-[8px] font-mono text-slate-400 hidden md:block whitespace-nowrap">
                  {planet.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});

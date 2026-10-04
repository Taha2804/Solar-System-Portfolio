import React, { useMemo, useRef, useState, useCallback } from 'react';
import { CelestialBody, ProjectedPlanetPosition } from '../types/portfolio';

interface PlanetNodesLayerProps {
  planets: CelestialBody[];
  positions: { [id: number]: ProjectedPlanetPosition };
  currentPlanetId: number;
  onSelectPlanet: (id: number) => void;
}

interface CandidateSlot {
  name: 'above' | 'below' | 'right' | 'left' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  x: number;
  y: number;
  stemStartX: number;
  stemStartY: number;
  stemEndX: number;
  stemEndY: number;
  distancePenalty: number;
}

interface PlacedBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
  planetId: number;
}

export const PlanetNodesLayer: React.FC<PlanetNodesLayerProps> = ({
  planets,
  positions,
  currentPlanetId,
  onSelectPlanet,
}) => {
  const [hoveredPlanetId, setHoveredPlanetId] = useState<number | null>(null);
  const slotHistoryRef = useRef<Record<number, string>>({});
  const pointerStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent, id: number) => {
    e.stopPropagation();
    const dist = Math.hypot(
      e.clientX - pointerStartPosRef.current.x,
      e.clientY - pointerStartPosRef.current.y
    );
    // If movement < 8px, it is a deliberate tap/click -> trigger selection
    if (dist < 8) {
      onSelectPlanet(id);
    }
  };

  const handlePointerEnter = useCallback((id: number) => {
    setHoveredPlanetId(id);
  }, []);

  const handlePointerLeave = useCallback((id: number) => {
    setHoveredPlanetId((curr) => (curr === id ? null : curr));
  }, []);

  // Viewport dimensions
  const viewWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const isMobile = viewWidth < 768;

  // Snug label dimensions
  const labelW = isMobile ? 74 : 96;
  const labelH = isMobile ? 22 : 26;

  // Safe boundaries (clearing TopNav & BottomDock)
  const minX = 10;
  const maxX = viewWidth - 10;
  const minY = isMobile ? 52 : 62;
  const maxY = viewHeight - (isMobile ? 72 : 82);

  // System center for outward radial orientation
  const sunPos = positions[0] || { x: viewWidth * 0.5, y: viewHeight * 0.5 };

  // Domain subtitles
  const domainSummary: Record<number, string> = {
    1: 'Arsenal',
    2: 'Security',
    3: 'Systems',
    4: 'Full-Stack',
    5: 'AI Research',
    6: 'CNNs',
    7: 'Milestones',
    8: 'Labs',
    9: 'Dispatch',
  };

  // Robust Collision Resolution Solver prioritizing tight proximity (above / sides / below)
  const placements = useMemo(() => {
    const placedBoxes: PlacedBox[] = [];
    const results: Record<
      number,
      {
        slotName: string;
        labelX: number;
        labelY: number;
        stemStartX: number;
        stemStartY: number;
        stemEndX: number;
        stemEndY: number;
        depthScale: number;
        depthOpacity: number;
        isFar: boolean;
        camDist: number;
        zNorm: number;
      }
    > = {};

    // Sort planets by distance to camera (foreground planets place first to claim optimal slots)
    const activePlanets = planets.filter((p) => p.id > 0 && positions[p.id]);
    activePlanets.sort((a, b) => {
      const distA = positions[a.id].distToCamera || 1800;
      const distB = positions[b.id].distToCamera || 1800;
      return distA - distB;
    });

    // Dynamic Z-Depth bounds across all active planets in view
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const p of activePlanets) {
      const pPos = positions[p.id];
      const zVal = pPos.zDepth !== undefined ? pPos.zDepth : (pPos.distToCamera || 1800);
      if (zVal < minZ) minZ = zVal;
      if (zVal > maxZ) maxZ = zVal;
    }
    const zRange = Math.max(1, maxZ - minZ);

    for (const planet of activePlanets) {
      const pos = positions[planet.id];
      const pr = pos.radius2D || (isMobile ? 12 : 16);
      // Tight 4-6px gap: labels hug planet sphere snugly without floating far away
      const gap = isMobile ? 4 : 6;

      // Z-depth along camera axis: 0.0 = closest to camera (foreground), 1.0 = furthest away (deep background)
      const currentZ = pos.zDepth !== undefined ? pos.zDepth : (pos.distToCamera || 1800);
      const zNorm = Math.max(0, Math.min(1.0, (currentZ - minZ) / zRange));

      // Z-depth aware scaling:
      // Foreground planets receive full scale (1.04x) for prominence and readability
      // Background planets further along the Z-axis receive a slight, tasteful scale reduction down to 0.76x
      const depthScale = 1.04 - zNorm * 0.28;

      // Z-depth aware opacity fading:
      // Foreground planets receive full opacity (0.98)
      // Background planets further along the Z-axis receive lower opacity down to 0.62, giving realistic atmospheric depth
      const depthOpacity = 0.98 - zNorm * 0.36;
      const isFar = zNorm > 0.58;

      // Radial vector from Sun to planet (outward direction)
      const radX = pos.x - sunPos.x;
      const radY = pos.y - sunPos.y;
      const radLen = Math.hypot(radX, radY) || 1;
      const normRadX = radX / radLen;
      const normRadY = radY / radLen;

      // Candidate slots closely hugging the planet perimeter
      const candidates: CandidateSlot[] = [
        // 1. Above
        {
          name: 'above',
          x: pos.x,
          y: pos.y - pr - gap - labelH * 0.5,
          stemStartX: pos.x,
          stemStartY: pos.y - pr,
          stemEndX: pos.x,
          stemEndY: pos.y - pr - gap,
          distancePenalty: 0,
        },
        // 2. Below
        {
          name: 'below',
          x: pos.x,
          y: pos.y + pr + gap + labelH * 0.5,
          stemStartX: pos.x,
          stemStartY: pos.y + pr,
          stemEndX: pos.x,
          stemEndY: pos.y + pr + gap,
          distancePenalty: 0,
        },
        // 3. Right Side
        {
          name: 'right',
          x: pos.x + pr + gap + labelW * 0.5,
          y: pos.y,
          stemStartX: pos.x + pr,
          stemStartY: pos.y,
          stemEndX: pos.x + pr + gap,
          stemEndY: pos.y,
          distancePenalty: 2,
        },
        // 4. Left Side
        {
          name: 'left',
          x: pos.x - pr - gap - labelW * 0.5,
          y: pos.y,
          stemStartX: pos.x - pr,
          stemStartY: pos.y,
          stemEndX: pos.x - pr - gap,
          stemEndY: pos.y,
          distancePenalty: 2,
        },
        // 5. Diagonal Top-Right
        {
          name: 'top-right',
          x: pos.x + (pr + gap) * 0.72 + labelW * 0.38,
          y: pos.y - (pr + gap) * 0.72 - labelH * 0.38,
          stemStartX: pos.x + pr * 0.7,
          stemStartY: pos.y - pr * 0.7,
          stemEndX: pos.x + (pr + gap) * 0.7,
          stemEndY: pos.y - (pr + gap) * 0.7,
          distancePenalty: 8,
        },
        // 6. Diagonal Top-Left
        {
          name: 'top-left',
          x: pos.x - (pr + gap) * 0.72 - labelW * 0.38,
          y: pos.y - (pr + gap) * 0.72 - labelH * 0.38,
          stemStartX: pos.x - pr * 0.7,
          stemStartY: pos.y - pr * 0.7,
          stemEndX: pos.x - (pr + gap) * 0.7,
          stemEndY: pos.y - (pr + gap) * 0.7,
          distancePenalty: 8,
        },
        // 7. Diagonal Bottom-Right
        {
          name: 'bottom-right',
          x: pos.x + (pr + gap) * 0.72 + labelW * 0.38,
          y: pos.y + (pr + gap) * 0.72 + labelH * 0.38,
          stemStartX: pos.x + pr * 0.7,
          stemStartY: pos.y + pr * 0.7,
          stemEndX: pos.x + (pr + gap) * 0.7,
          stemEndY: pos.y + (pr + gap) * 0.7,
          distancePenalty: 8,
        },
        // 8. Diagonal Bottom-Left
        {
          name: 'bottom-left',
          x: pos.x - (pr + gap) * 0.72 - labelW * 0.38,
          y: pos.y + (pr + gap) * 0.72 + labelH * 0.38,
          stemStartX: pos.x - pr * 0.7,
          stemStartY: pos.y + pr * 0.7,
          stemEndX: pos.x - (pr + gap) * 0.7,
          stemEndY: pos.y + (pr + gap) * 0.7,
          distancePenalty: 8,
        },
      ];

      const lastSlotName = slotHistoryRef.current[planet.id];
      let bestCandidate = candidates[0];
      let bestScore = Infinity;

      for (const cand of candidates) {
        const left = cand.x - labelW * 0.5;
        const right = cand.x + labelW * 0.5;
        const top = cand.y - labelH * 0.5;
        const bottom = cand.y + labelH * 0.5;

        let score = cand.distancePenalty;

        // 1. Viewport boundary penalty
        if (left < minX) score += (minX - left) * 60 + 5000;
        if (right > maxX) score += (right - maxX) * 60 + 5000;
        if (top < minY) score += (minY - top) * 60 + 5000;
        if (bottom > maxY) score += (bottom - maxY) * 60 + 5000;

        // 2. Planet sphere occlusion penalty (never cover another planet's 3D sphere)
        for (const other of activePlanets) {
          if (other.id === planet.id) continue;
          const otherPos = positions[other.id];
          const otherR = otherPos.radius2D || 14;
          const distToOther = Math.hypot(cand.x - otherPos.x, cand.y - otherPos.y);
          const safeDist = otherR + Math.max(labelW, labelH) * 0.42;
          if (distToOther < safeDist) {
            score += (safeDist - distToOther) * 200 + 12000;
          }
        }

        // 3. Label-to-Label overlap penalty (strictly avoids overlaps)
        for (const placed of placedBoxes) {
          const overlapX = Math.max(0, Math.min(right, placed.right) - Math.max(left, placed.left));
          const overlapY = Math.max(0, Math.min(bottom, placed.bottom) - Math.max(top, placed.top));
          if (overlapX > 0 && overlapY > 0) {
            score += overlapX * overlapY * 25 + 18000;
          }
        }

        // 4. Outward radial direction alignment
        const dirX = (cand.x - pos.x) / (Math.hypot(cand.x - pos.x, cand.y - pos.y) || 1);
        const dirY = (cand.y - pos.y) / (Math.hypot(cand.x - pos.x, cand.y - pos.y) || 1);
        const cosAngle = normRadX * dirX + normRadY * dirY;
        // Pushes labels outward towards open space
        score += Math.max(0, (1.0 - cosAngle) * 50);

        // 5. Stability hysteresis (loyalty bonus prevents rapid flip-flopping)
        if (cand.name === lastSlotName) {
          score -= 35;
        }

        if (score < bestScore) {
          bestScore = score;
          bestCandidate = cand;
        }
      }

      slotHistoryRef.current[planet.id] = bestCandidate.name;

      let finalX = Math.max(minX + labelW * 0.5, Math.min(maxX - labelW * 0.5, bestCandidate.x));
      let finalY = Math.max(minY + labelH * 0.5, Math.min(maxY - labelH * 0.5, bestCandidate.y));

      // Fail-safe non-overlap separation: if still intersecting another box, nudge outward
      for (const placed of placedBoxes) {
        const left = finalX - labelW * 0.5;
        const right = finalX + labelW * 0.5;
        const top = finalY - labelH * 0.5;
        const bottom = finalY + labelH * 0.5;

        const overlapX = Math.min(right, placed.right) - Math.max(left, placed.left);
        const overlapY = Math.min(bottom, placed.bottom) - Math.max(top, placed.top);

        if (overlapX > 0 && overlapY > 0) {
          // Resolve overlap along axis of smallest penetration
          if (overlapX < overlapY) {
            if (finalX > (placed.left + placed.right) * 0.5) {
              finalX = Math.min(maxX - labelW * 0.5, placed.right + labelW * 0.5 + 4);
            } else {
              finalX = Math.max(minX + labelW * 0.5, placed.left - labelW * 0.5 - 4);
            }
          } else {
            if (finalY > (placed.top + placed.bottom) * 0.5) {
              finalY = Math.min(maxY - labelH * 0.5, placed.bottom + labelH * 0.5 + 4);
            } else {
              finalY = Math.max(minY + labelH * 0.5, placed.top - labelH * 0.5 - 4);
            }
          }
        }
      }

      placedBoxes.push({
        left: finalX - labelW * 0.5,
        right: finalX + labelW * 0.5,
        top: finalY - labelH * 0.5,
        bottom: finalY + labelH * 0.5,
        planetId: planet.id,
      });

      results[planet.id] = {
        slotName: bestCandidate.name,
        labelX: finalX,
        labelY: finalY,
        stemStartX: bestCandidate.stemStartX,
        stemStartY: bestCandidate.stemStartY,
        stemEndX: finalX,
        stemEndY: finalY,
        depthScale,
        depthOpacity,
        isFar,
        camDist: currentZ,
        zNorm,
      };
    }

    return results;
  }, [planets, positions, isMobile, labelW, labelH, minX, maxX, minY, maxY, sunPos.x, sunPos.y]);

  return (
    <div className="fixed inset-0 z-30 pointer-events-none select-none" aria-label="Interactive Planetary System">
      {/* Subtle Micro-Stems (Active or Hovered only - keeps space pristine) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        {planets.map((planet) => {
          if (planet.id === 0) return null;
          const place = placements[planet.id];
          const pos = positions[planet.id];
          if (!place || !pos) return null;

          const isHovered = hoveredPlanetId === planet.id;
          const isActive = currentPlanetId === planet.id;
          if (!isHovered && !isActive) return null;

          return (
            <line
              key={`stem-${planet.id}`}
              x1={place.stemStartX}
              y1={place.stemStartY}
              x2={place.stemEndX}
              y2={place.stemEndY}
              stroke={planet.color}
              strokeWidth={1.5}
              strokeOpacity={0.85}
            />
          );
        })}
      </svg>

      {/* Interactive Planet Targets & GPU-Accelerated Zero-Lag Labels */}
      {planets.map((planet) => {
        if (planet.id === 0) return null;
        const pos = positions[planet.id];
        const place = placements[planet.id];
        if (!pos || !place) return null;

        const isActive = planet.id === currentPlanetId;
        const isHovered = hoveredPlanetId === planet.id;
        const screenR = pos.radius2D || (isMobile ? 12 : 16);
        const hitSize = Math.max(44, Math.round(screenR * 2.2));

        // Depth-based zIndex layering ensures foreground planets physically layer on top of background planets
        const zIndex = isActive ? 100 : isHovered ? 95 : Math.round(1000 - place.zNorm * 800);

        // Effective scale & opacity with subtle depth fading and hover bloom
        const currentScale = isHovered || isActive ? place.depthScale * 1.08 : place.depthScale;
        const currentOpacity = isHovered || isActive ? 1.0 : place.depthOpacity;

        return (
          <React.Fragment key={planet.id}>
            {/* 1. PRIMARY INTERACTIVE TARGET: 3D Planet Sphere (GPU translate3d with zero lag) */}
            <div
              role="button"
              tabIndex={0}
              aria-label={`Inspect ${planet.name}: ${planet.role}`}
              onPointerDown={handlePointerDown}
              onPointerUp={(e) => handlePointerUp(e, planet.id)}
              onPointerEnter={() => handlePointerEnter(planet.id)}
              onPointerLeave={() => handlePointerLeave(planet.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPlanet(planet.id);
                }
              }}
              className="absolute top-0 left-0 pointer-events-auto cursor-pointer group"
              style={{
                width: `${hitSize}px`,
                height: `${hitSize}px`,
                transform: `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`,
                willChange: 'transform',
                zIndex,
              }}
            >
              {/* Subtle Cybernetic Targeting Ring on Hover/Active */}
              <div
                className={`absolute inset-0 rounded-full border border-dashed pointer-events-none animate-spin-slow transition-all duration-200 ${
                  isHovered || isActive ? 'opacity-100 scale-105' : 'opacity-0 scale-95'
                }`}
                style={{
                  borderColor: planet.color,
                  boxShadow: `0 0 16px ${planet.color}60`,
                }}
              />

              {/* Corner reticle brackets on hover/active */}
              <div
                className={`absolute -inset-1 pointer-events-none transition-opacity duration-200 ${
                  isHovered || isActive ? 'opacity-90' : 'opacity-0'
                }`}
                style={{ borderColor: planet.color }}
              >
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2" style={{ borderColor: planet.color }} />
                <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2" style={{ borderColor: planet.color }} />
                <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2" style={{ borderColor: planet.color }} />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2" style={{ borderColor: planet.color }} />
              </div>
            </div>

            {/* 2. PLANET-FIRST COMPACT INTEGRATED LABEL (GPU translate3d with zero lag & Z-depth fading) */}
            <div
              role="button"
              tabIndex={0}
              onPointerDown={handlePointerDown}
              onPointerUp={(e) => handlePointerUp(e, planet.id)}
              onPointerEnter={() => handlePointerEnter(planet.id)}
              onPointerLeave={() => handlePointerLeave(planet.id)}
              className="absolute top-0 left-0 pointer-events-auto cursor-pointer"
              style={{
                transform: `translate3d(${place.labelX}px, ${place.labelY}px, 0) translate(-50%, -50%) scale(${currentScale})`,
                willChange: 'transform',
                opacity: currentOpacity,
                zIndex: zIndex + 1,
              }}
            >
              <div
                className={`px-2 py-0.5 rounded-full backdrop-blur-md border text-center flex items-center gap-1.5 transition-colors duration-150 ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-950/75 shadow-[0_0_16px_rgba(0,229,255,0.45)] ring-1 ring-cyan-400/50'
                    : isHovered
                    ? 'border-cyan-400/80 bg-[#030712]/95 shadow-[0_0_14px_rgba(0,229,255,0.4)]'
                    : 'border-white/15 bg-[#030712]/80 shadow-[0_2px_8px_rgba(0,0,0,0.85)] hover:border-white/30'
                }`}
              >
                {/* Planet signature color pulse dot */}
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
                  style={{
                    backgroundColor: planet.color,
                    boxShadow: `0 0 6px ${planet.color}`,
                  }}
                />

                {/* Planet Name */}
                <span className="font-['Space_Grotesk'] font-bold text-[10px] sm:text-[11px] text-white tracking-wide uppercase leading-tight whitespace-nowrap">
                  {planet.name}
                </span>

                {/* Subtle Domain Tag / Badge */}
                {(!place.isFar || isHovered || isActive) && (
                  <span
                    className="text-[9px] font-mono font-bold tracking-tight whitespace-nowrap opacity-90"
                    style={{ color: planet.color }}
                  >
                    · {domainSummary[planet.id] || planet.badge}
                  </span>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

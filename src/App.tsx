import React, { useState, useEffect, useCallback } from 'react';
import { CelestialCanvas, ViewMode } from './components/CelestialCanvas';
import { PlanetNodesLayer } from './components/PlanetNodesLayer';
import { TopNav } from './components/TopNav';
import { PlanetImmersiveView } from './components/PlanetImmersiveView';
import { BottomDock } from './components/BottomDock';
import { LandingScreen } from './components/LandingScreen';
import { RecruiterModeModal } from './components/RecruiterModeModal';
import { CELESTIAL_BODIES, getAdjacentPlanets } from './data/portfolioData';
import { CelestialBody, ProjectedPlanetPosition } from './types/portfolio';
import {
  playWarpSound,
  playClickSound,
  setAudioEnabled,
} from './utils/audio';

export type AppExperience = 'LANDING' | 'SOLAR_SYSTEM';

export default function App() {
  const [experience, setExperience] = useState<AppExperience>('LANDING');
  const [isExitingToUniverse, setIsExitingToUniverse] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('SOLAR_SYSTEM');
  const [currentPlanetId, setCurrentPlanetId] = useState<number>(0);
  const [targetPlanetId, setTargetPlanetId] = useState<number | null>(null);
  const [planetPositions, setPlanetPositions] = useState<{ [id: number]: ProjectedPlanetPosition }>({});
  const [isAudioOn, setIsAudioOn] = useState<boolean>(true);
  const [isRecruiterModeOpen, setIsRecruiterModeOpen] = useState<boolean>(false);
  const [resetCameraCount, setResetCameraCount] = useState<number>(0);

  const currentPlanet =
    CELESTIAL_BODIES.find((p) => p.id === currentPlanetId) || CELESTIAL_BODIES[0];

  const targetPlanet =
    targetPlanetId !== null
      ? CELESTIAL_BODIES.find((p) => p.id === targetPlanetId) || null
      : null;

  const handleToggleAudio = () => {
    const newState = !isAudioOn;
    setIsAudioOn(newState);
    setAudioEnabled(newState);
    if (newState) {
      playClickSound();
    }
  };

  // Transition from Landing Screen into the 3D Solar System
  const handleStartUniverseExploration = useCallback(() => {
    setIsExitingToUniverse(true);
    playWarpSound();
    setTimeout(() => {
      setExperience('SOLAR_SYSTEM');
      setViewMode('SOLAR_SYSTEM');
      setIsExitingToUniverse(false);
      setResetCameraCount((c) => c + 1);
    }, 650);
  }, []);

  // Transition directly into Recruiter Mode
  const handleOpenRecruiterFromLanding = useCallback(() => {
    playClickSound();
    setIsRecruiterModeOpen(true);
  }, []);

  // Return to the initial Landing / Mission-Select screen
  const handleReturnToHome = useCallback(() => {
    playClickSound();
    setIsRecruiterModeOpen(false);
    setViewMode('SOLAR_SYSTEM');
    setCurrentPlanetId(0);
    setTargetPlanetId(null);
    setExperience('LANDING');
    setResetCameraCount((c) => c + 1);
  }, []);

  const handleReturnToSolar = useCallback(() => {
    if (viewMode === 'SOLAR_SYSTEM') {
      // In solar system view: smoothly reset user camera to default perspective framing
      setResetCameraCount((c) => c + 1);
      return;
    }
    if (viewMode === 'FLYING_TO_PLANET' || viewMode === 'FLYING_TO_SOLAR') return;
    playWarpSound();
    setTargetPlanetId(0);
    setViewMode('FLYING_TO_SOLAR');
  }, [viewMode]);

  const handleSelectPlanet = useCallback(
    (planetId: number) => {
      if (viewMode === 'FLYING_TO_PLANET' || viewMode === 'FLYING_TO_SOLAR') return;

      if (planetId === 0) {
        handleReturnToSolar();
        return;
      }

      if (planetId === currentPlanetId && viewMode === 'PLANET_IMMERSIVE') {
        return;
      }

      const target = CELESTIAL_BODIES.find((p) => p.id === planetId);
      if (!target) return;

      setTargetPlanetId(planetId);
      setViewMode('FLYING_TO_PLANET');
      playWarpSound();
    },
    [viewMode, currentPlanetId, handleReturnToSolar]
  );

  const handleFlightComplete = useCallback(
    (completedMode: ViewMode, finalPlanetId: number) => {
      if (
        completedMode === 'FLYING_TO_PLANET' ||
        completedMode === 'PLANET_TRANSITION' ||
        completedMode === 'PLANET_IMMERSIVE'
      ) {
        setCurrentPlanetId(finalPlanetId);
        setViewMode('PLANET_IMMERSIVE');
        setTargetPlanetId(null);
      } else if (completedMode === 'FLYING_TO_SOLAR' || completedMode === 'SOLAR_SYSTEM') {
        setCurrentPlanetId(0);
        setViewMode('SOLAR_SYSTEM');
        setTargetPlanetId(null);
      }
    },
    []
  );

  const handleNavigatePlanet = useCallback(
    (direction: number) => {
      // Guard against multiple simultaneous transitions
      if (
        viewMode === 'FLYING_TO_PLANET' ||
        viewMode === 'FLYING_TO_SOLAR' ||
        viewMode === 'PLANET_TRANSITION'
      ) {
        return;
      }

      if (currentPlanetId === 0) {
        handleSelectPlanet(1);
        return;
      }

      const { prev, next } = getAdjacentPlanets(currentPlanetId);
      const destinationPlanet = direction > 0 ? next : prev;

      setTargetPlanetId(destinationPlanet.id);
      setViewMode('PLANET_TRANSITION');
      playWarpSound();
    },
    [currentPlanetId, viewMode, handleSelectPlanet]
  );

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        setIsRecruiterModeOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (isRecruiterModeOpen) {
          setIsRecruiterModeOpen(false);
        } else if (experience === 'SOLAR_SYSTEM' && viewMode !== 'SOLAR_SYSTEM') {
          handleReturnToSolar();
        } else if (experience === 'SOLAR_SYSTEM' && viewMode === 'SOLAR_SYSTEM') {
          handleReturnToHome();
        }
      } else if (e.key === 'ArrowRight') {
        if (viewMode === 'PLANET_IMMERSIVE') {
          handleNavigatePlanet(1);
        } else if (viewMode === 'SOLAR_SYSTEM' && experience === 'SOLAR_SYSTEM') {
          handleSelectPlanet(1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (viewMode === 'PLANET_IMMERSIVE') {
          handleNavigatePlanet(-1);
        } else if (viewMode === 'SOLAR_SYSTEM' && experience === 'SOLAR_SYSTEM') {
          handleSelectPlanet(CELESTIAL_BODIES.length - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    viewMode,
    isRecruiterModeOpen,
    experience,
    handleNavigatePlanet,
    handleSelectPlanet,
    handleReturnToSolar,
    handleReturnToHome,
  ]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#02040a] text-slate-100 font-sans select-none">
      {/* 3D Depth-Based Starfield and Continuous Planetary Flight Canvas */}
      <CelestialCanvas
        planets={CELESTIAL_BODIES}
        currentPlanetId={currentPlanetId}
        viewMode={viewMode}
        targetPlanetId={targetPlanetId}
        isAudioOn={isAudioOn}
        onUpdatePlanetPositions={setPlanetPositions}
        onFlightComplete={handleFlightComplete}
        onSelectPlanet={handleSelectPlanet}
        resetCameraSignal={resetCameraCount}
      />

      {/* ============================================================ */}
      {/* 1. DEDICATED INITIAL ENTRY / LANDING SCREEN                 */}
      {/* ============================================================ */}
      {experience === 'LANDING' && (
        <LandingScreen
          onExploreUniverse={handleStartUniverseExploration}
          onViewProfile={handleOpenRecruiterFromLanding}
          isExitingToUniverse={isExitingToUniverse}
        />
      )}

      {/* ============================================================ */}
      {/* 2. SOLAR SYSTEM & EXPLORATION ENVIRONMENT                   */}
      {/* ============================================================ */}
      {experience === 'SOLAR_SYSTEM' && (
        <>
          {/* Top Cybernetic Helios Telemetry Navigation with live vectors & persistent Home button */}
          <TopNav
            currentPlanet={currentPlanet}
            viewMode={viewMode}
            targetPlanet={targetPlanet}
            isAudioOn={isAudioOn}
            onToggleAudio={handleToggleAudio}
            onReturnToSol={handleReturnToSolar}
            onReturnToHome={handleReturnToHome}
            onOpenRecruiterMode={() => setIsRecruiterModeOpen(true)}
            isRecruiterModeOpen={isRecruiterModeOpen}
          />

          {/* SOLAR SYSTEM STATE ELEMENTS (Unmounted in planet view) */}
          {viewMode === 'SOLAR_SYSTEM' && (
            <>
              {/* Pure 3D space: Old central profile card removed as requested */}

              {/* Interactive Dynamic Non-Colliding Planet Nodes */}
              <PlanetNodesLayer
                planets={CELESTIAL_BODIES}
                positions={planetPositions}
                currentPlanetId={currentPlanetId}
                onSelectPlanet={handleSelectPlanet}
              />

              {/* Bottom Solar System Navigation Dock */}
              <BottomDock
                planets={CELESTIAL_BODIES}
                currentPlanetId={currentPlanetId}
                onSelectPlanet={handleSelectPlanet}
              />
            </>
          )}

          {/* PLANET IMMERSIVE & DIRECT INTERPLANETARY TRANSITION STATE */}
          {(viewMode === 'PLANET_IMMERSIVE' || viewMode === 'PLANET_TRANSITION') && currentPlanetId > 0 && (
            <PlanetImmersiveView
              planet={currentPlanet}
              targetPlanet={targetPlanet}
              onReturnToSolar={handleReturnToSolar}
              onNavigatePlanet={handleNavigatePlanet}
              onDirectJump={handleSelectPlanet}
              isTransitioning={viewMode === 'PLANET_TRANSITION'}
            />
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* 3. RECRUITER MODE / MISSION CONTROL RAPID ASSESSMENT MODAL  */}
      {/* ============================================================ */}
      <RecruiterModeModal
        isOpen={isRecruiterModeOpen}
        onClose={() => setIsRecruiterModeOpen(false)}
        onReturnToHome={handleReturnToHome}
        onJumpToPlanet={(planetId) => {
          setIsRecruiterModeOpen(false);
          setExperience('SOLAR_SYSTEM');
          handleSelectPlanet(planetId);
        }}
      />
    </div>
  );
}

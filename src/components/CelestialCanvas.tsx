import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CelestialBody, ProjectedPlanetPosition } from '../types/portfolio';
import { updateAmbientSoundscape, stopAmbientSoundscape, isAudioEnabled, playScanChirp } from '../utils/audio';
import { createPlanetTexture, createRingTexture, createPlanetBumpMap } from '../utils/planetTextures';

export type ViewMode =
  | 'SOLAR_SYSTEM'
  | 'FLYING_TO_PLANET'
  | 'PLANET_IMMERSIVE'
  | 'FLYING_TO_SOLAR'
  | 'PLANET_TRANSITION';

interface CelestialCanvasProps {
  planets: CelestialBody[];
  currentPlanetId: number;
  viewMode: ViewMode;
  targetPlanetId: number | null;
  isAudioOn?: boolean;
  onUpdatePlanetPositions: (positions: { [id: number]: ProjectedPlanetPosition }) => void;
  onFlightComplete: (completedMode: ViewMode, finalPlanetId: number) => void;
  onSelectPlanet?: (id: number) => void;
  resetCameraSignal?: number;
}

interface PulseScan {
  id: number;
  startTime: number;
  duration: number;
  cx: number;
  cy: number;
  startR: number;
  color: string;
}

// Polar axial tilts in radians for realistic planetary orientations
const PLANET_AXIAL_TILTS: Record<number, number> = {
  0: 0.12,
  1: 0.01,
  2: 3.09, // Retrograde rotation
  3: 0.41, // Earth 23.5 deg
  4: 0.44, // Mars 25.2 deg
  5: 0.05,
  6: 0.47, // Saturn 26.7 deg
  7: 1.71, // Uranus 97.8 deg
  8: 0.50,
  9: 2.13,
};

// Intrinsic axial rotation speeds (radians per second)
const PLANET_ROTATION_SPEEDS: Record<number, number> = {
  0: 0.08,
  1: 0.12,
  2: -0.06,
  3: 0.35,
  4: 0.32,
  5: 0.55,
  6: 0.48,
  7: -0.28,
  8: 0.30,
  9: 0.15,
};

// Balanced orbital radii scaling factors in 3D world units (compact & 100% visible)
const PLANET_ORBIT_RADII: Record<number, number> = {
  0: 0,
  1: 105,
  2: 155,
  3: 215,
  4: 280,
  5: 360,
  6: 450,
  7: 540,
  8: 630,
  9: 715,
};

/**
 * Calculates optimal default camera parameters to frame the entire solar system
 * with perspective depth across both desktop and mobile viewports.
 * Uses a controlled ~29° elevation angle so the orbital plane appears as a cinematic
 * ellipse with clear depth separation (distant background vs close foreground).
 */
function getSolarDefaultParameters(width: number, height: number): {
  distance: number;
  elevationRad: number;
  azimuthRad: number;
} {
  const aspect = Math.max(0.35, width / Math.max(1, height));
  const maxOrbitRadius = 715; // Pluto outer boundary
  const bufferMargin = 100; // Room for labels, rings & HUD
  const totalSceneRadius = maxOrbitRadius + bufferMargin;

  // Vertical FOV = 45 degrees
  const halfFovRad = THREE.MathUtils.degToRad(22.5);
  const tanHalfFov = Math.tan(halfFovRad);

  // Cinematic vantage elevation:
  // Desktop: ~29° creates a true 3D perspective where the orbital plane recedes into depth as an ellipse
  // Mobile portrait: ~34° gives optimal elliptical perspective while keeping outer orbits nicely in frame
  const elevationDeg = aspect < 1.0 ? 34 : 29;
  const elevationRad = THREE.MathUtils.degToRad(elevationDeg);
  const azimuthRad = 0;

  const sinElev = Math.sin(elevationRad);

  // Compute required distance for both vertical and horizontal constraints in perspective
  const requiredDistH = (totalSceneRadius * 1.16) / (tanHalfFov * Math.max(0.55, aspect));
  const requiredDistV = (totalSceneRadius * (sinElev * 1.35 + 0.38)) / tanHalfFov;

  const distance = Math.max(requiredDistH, requiredDistV);

  return { distance, elevationRad, azimuthRad };
}

function getSolarCameraPosition(width: number, height: number): THREE.Vector3 {
  const { distance, elevationRad, azimuthRad } = getSolarDefaultParameters(width, height);
  const cosElev = Math.cos(elevationRad);
  return new THREE.Vector3(
    distance * cosElev * Math.sin(azimuthRad),
    distance * Math.sin(elevationRad),
    distance * cosElev * Math.cos(azimuthRad)
  );
}

export const CelestialCanvas: React.FC<CelestialCanvasProps> = React.memo(({
  planets,
  currentPlanetId,
  viewMode,
  targetPlanetId,
  isAudioOn,
  onUpdatePlanetPositions,
  onFlightComplete,
  onSelectPlanet,
  resetCameraSignal,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // References to keep animation loop in sync without restarting
  const viewModeRef = useRef<ViewMode>(viewMode);
  viewModeRef.current = viewMode;

  const currentPlanetIdRef = useRef<number>(currentPlanetId);
  currentPlanetIdRef.current = currentPlanetId;

  const targetPlanetIdRef = useRef<number | null>(targetPlanetId);
  targetPlanetIdRef.current = targetPlanetId;

  const onUpdatePositionsRef = useRef(onUpdatePlanetPositions);
  onUpdatePositionsRef.current = onUpdatePlanetPositions;

  const onFlightCompleteRef = useRef(onFlightComplete);
  onFlightCompleteRef.current = onFlightComplete;

  const onSelectPlanetRef = useRef(onSelectPlanet);
  onSelectPlanetRef.current = onSelectPlanet;

  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);

  // Persistent User-Controlled Solar Camera Orbit State (Spherical coordinates around Sun)
  const orbitCamRef = useRef({
    azimuth: 0,
    elevation: THREE.MathUtils.degToRad(29),
    distance: 1950,
    targetAzimuth: 0,
    targetElevation: THREE.MathUtils.degToRad(29),
    targetDistance: 1950,
    velocityAzimuth: 0,
    velocityElevation: 0,
    minDistance: 450,
    maxDistance: 4200,
    minElevation: THREE.MathUtils.degToRad(12),
    maxElevation: THREE.MathUtils.degToRad(64),
    isInitialized: false,
    isDragging: false,
  });

  // Mouse / Touch Parallax Target
  const mouseRef = useRef({ x: 0, y: 0, currentX: 0, currentY: 0 });

  // Animation timeline state
  const animStateRef = useRef({
    transitionT: 0, // 0 = Solar System, 1 = Planet Immersive
    fromPlanetId: 0,
    toPlanetId: 0,
    flightStartTime: 0,
    flightDuration: 1850, // ms for cinematic flight
    isFlying: false,
    flightDirection: 1, // 1 = forward to planet, -1 = return to sol
    flightType: 'SOLAR_TO_PLANET' as 'SOLAR_TO_PLANET' | 'PLANET_TO_SOLAR' | 'PLANET_TO_PLANET',
    velocityFactor: 0, // 0.0 at cruise, 1.0 at peak warp
    startCamPos: new THREE.Vector3(0, 920, 1720),
    startLookAt: new THREE.Vector3(0, 0, 0),
  });

  // Pulse scans and telemetry refs
  const pulseScansRef = useRef<PulseScan[]>([]);
  const lastScanTimeRef = useRef<number>(0);
  const approachScanTriggeredRef = useRef<boolean>(false);

  // Flight trigger updates
  useEffect(() => {
    const s = animStateRef.current;

    if (viewMode === 'FLYING_TO_PLANET' && targetPlanetId !== null) {
      s.isFlying = true;
      s.flightStartTime = performance.now();
      s.flightDuration = 1850;
      s.flightDirection = 1;
      s.flightType = 'SOLAR_TO_PLANET';
      s.fromPlanetId = currentPlanetId;
      s.toPlanetId = targetPlanetId;
      approachScanTriggeredRef.current = false;
    } else if (viewMode === 'PLANET_TRANSITION' && targetPlanetId !== null) {
      s.isFlying = true;
      s.flightStartTime = performance.now();
      s.flightDuration = 1800;
      s.flightDirection = 1;
      s.flightType = 'PLANET_TO_PLANET';
      s.fromPlanetId = currentPlanetId;
      s.toPlanetId = targetPlanetId;
      approachScanTriggeredRef.current = false;
      pulseScansRef.current = [];
    } else if (viewMode === 'FLYING_TO_SOLAR') {
      s.isFlying = true;
      s.flightStartTime = performance.now();
      s.flightDuration = 1650;
      s.flightDirection = -1;
      s.flightType = 'PLANET_TO_SOLAR';
      s.fromPlanetId = currentPlanetId;
      s.toPlanetId = 0;
      approachScanTriggeredRef.current = false;
      pulseScansRef.current = [];
    } else if (viewMode === 'SOLAR_SYSTEM') {
      s.transitionT = 0;
      s.isFlying = false;
      s.velocityFactor = 0;
      s.flightType = 'SOLAR_TO_PLANET';
      approachScanTriggeredRef.current = false;
      pulseScansRef.current = [];
    } else if (viewMode === 'PLANET_IMMERSIVE') {
      s.transitionT = 1;
      s.isFlying = false;
      s.velocityFactor = 0;
      s.flightType = 'SOLAR_TO_PLANET';
    }
  }, [viewMode, targetPlanetId, currentPlanetId]);

  // Main Three.js Lifecycle & Animation
  useEffect(() => {
    const container = containerRef.current;
    const hudCanvas = hudCanvasRef.current;
    if (!container || !hudCanvas) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    hudCanvas.width = width;
    hudCanvas.height = height;
    const hudCtx = hudCanvas.getContext('2d');

    // 1. THREE.JS SCENE SETUP
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02040a, 0.00018);

    // 2. CAMERA SETUP
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 20000);
    const defaults = getSolarDefaultParameters(width, height);

    if (!orbitCamRef.current.isInitialized) {
      orbitCamRef.current.isInitialized = true;
      orbitCamRef.current.azimuth = defaults.azimuthRad;
      orbitCamRef.current.targetAzimuth = defaults.azimuthRad;
      orbitCamRef.current.elevation = defaults.elevationRad;
      orbitCamRef.current.targetElevation = defaults.elevationRad;
      orbitCamRef.current.distance = defaults.distance;
      orbitCamRef.current.targetDistance = defaults.distance;
      orbitCamRef.current.minDistance = Math.max(380, defaults.distance * 0.35);
      orbitCamRef.current.maxDistance = Math.min(4200, defaults.distance * 2.2);
    }

    const initialSolarCamPos = getSolarCameraPosition(width, height);
    camera.position.copy(initialSolarCamPos);
    camera.lookAt(0, 0, 0);

    // 3. RENDERER SETUP (With Graceful Fallback)
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setWebGlSupported(false);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.className = 'absolute inset-0 w-full h-full';
    container.appendChild(renderer.domElement);

    // 4. REAL LIGHTING SYSTEM
    // Central Primary Light Source: The Sun at (0, 0, 0)
    const sunPointLight = new THREE.PointLight(0xfff8ee, 4.8, 14000, 0.35);
    sunPointLight.position.set(0, 0, 0);
    scene.add(sunPointLight);

    // Deep Space Ambient / Galactic Fill Light (gives dark side realistic subtle depth without washing out contrast)
    const ambientLight = new THREE.AmbientLight(0x0a1428, 0.35);
    scene.add(ambientLight);

    // Secondary Galactic Rim Light for photorealistic limb illumination
    const galacticRimLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
    galacticRimLight.position.set(-900, 600, -900);
    scene.add(galacticRimLight);

    // 5. SUN MESH (Central Origin)
    const sunRadius = 46;
    const sunGeo = new THREE.SphereGeometry(sunRadius, 48, 48);
    const sunTexture = createPlanetTexture(0);
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTexture,
      color: 0xffe082,
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);

    // Glowing Atmospheric Corona Shell around Sun
    const coronaGeo = new THREE.SphereGeometry(sunRadius * 1.35, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xff9800,
      transparent: true,
      opacity: 0.35,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    scene.add(coronaMesh);

    // Outer faint corona glow
    const outerCoronaGeo = new THREE.SphereGeometry(sunRadius * 2.2, 32, 32);
    const outerCoronaMat = new THREE.MeshBasicMaterial({
      color: 0xff5722,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Mesh(outerCoronaGeo, outerCoronaMat));

    // 6. 3D PLANETS CREATION & ORBIT PATHS
    interface Planet3DObject {
      id: number;
      orbitR: number;
      period: number;
      baseRadius: number;
      group: THREE.Group;
      mesh: THREE.Mesh;
      ringMesh?: THREE.Mesh;
      atmosphereMesh?: THREE.Mesh;
      currentWorldPos: THREE.Vector3;
    }

    const planetObjects: Planet3DObject[] = [];
    const orbitLinesGroup = new THREE.Group();
    scene.add(orbitLinesGroup);

    // Texture cache to prevent redundant re-allocations
    const textureCache = new Map<number, THREE.CanvasTexture>();

    // PBR Surface Configuration per Celestial Body
    const planetMaterialConfigs: Record<
      number,
      { roughness: number; metalness: number; bumpScale: number }
    > = {
      1: { roughness: 0.85, metalness: 0.12, bumpScale: 0.08 }, // Mercury: rugged cratered basalt
      2: { roughness: 0.32, metalness: 0.05, bumpScale: 0.02 }, // Venus: dense reflective clouds
      3: { roughness: 0.38, metalness: 0.16, bumpScale: 0.05 }, // Earth: ocean specular + continent relief
      4: { roughness: 0.82, metalness: 0.10, bumpScale: 0.09 }, // Mars: canyon & crater terrain
      5: { roughness: 0.58, metalness: 0.04, bumpScale: 0.03 }, // Jupiter: gas bands
      6: { roughness: 0.54, metalness: 0.04, bumpScale: 0.02 }, // Saturn: creamy bands
      7: { roughness: 0.44, metalness: 0.06, bumpScale: 0.02 }, // Uranus: cyan methane haze
      8: { roughness: 0.40, metalness: 0.08, bumpScale: 0.03 }, // Neptune: deep azure storms
      9: { roughness: 0.88, metalness: 0.06, bumpScale: 0.07 }, // Pluto: icy nitrogen plains
    };

    for (let i = 1; i < planets.length; i++) {
      const p = planets[i];
      const orbitR = PLANET_ORBIT_RADII[p.id] || 300 + i * 140;
      const planetRadius = Math.max(9, p.radius * 1.35);

      // A. Orbital Circle Path
      const orbitCurve = new THREE.EllipseCurve(0, 0, orbitR, orbitR, 0, Math.PI * 2, false, 0);
      const points = orbitCurve.getPoints(160);
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(
        points.map((pt) => new THREE.Vector3(pt.x, 0, pt.y))
      );
      const orbitMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(p.color).multiplyScalar(0.40),
        transparent: true,
        opacity: 0.22,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitLinesGroup.add(orbitLine);

      // B. Planet Mesh Group
      const pGroup = new THREE.Group();
      scene.add(pGroup);

      // Geometry & Procedural Surface Texture + Bump Relief Map
      let pTex = textureCache.get(p.id);
      if (!pTex) {
        pTex = createPlanetTexture(p.id);
        textureCache.set(p.id, pTex);
      }

      const pBump = createPlanetBumpMap(p.id);
      const matCfg = planetMaterialConfigs[p.id] || { roughness: 0.65, metalness: 0.1, bumpScale: 0.04 };

      const pGeo = new THREE.SphereGeometry(planetRadius, 64, 64);
      const pMat = new THREE.MeshStandardMaterial({
        map: pTex,
        bumpMap: pBump,
        bumpScale: matCfg.bumpScale,
        roughness: matCfg.roughness,
        metalness: matCfg.metalness,
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.rotation.z = PLANET_AXIAL_TILTS[p.id] || 0.15;
      pGroup.add(pMesh);

      // C. Atmospheric Limb Glow Shell
      const atmoRadius = planetRadius * (p.id === 3 || p.id === 2 ? 1.08 : 1.05);
      const atmoGeo = new THREE.SphereGeometry(atmoRadius, 48, 48);
      const atmoMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(p.color),
        transparent: true,
        opacity: p.id === 3 ? 0.30 : p.id === 2 ? 0.35 : 0.20,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      });
      const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
      pGroup.add(atmoMesh);

      // D. Genuine 3D Planetary Rings
      let ringMesh: THREE.Mesh | undefined;
      if (p.hasRing) {
        if (p.ringType === 'saturn') {
          const rGeo = new THREE.RingGeometry(planetRadius * 1.35, planetRadius * 2.5, 64);
          const rTex = createRingTexture('saturn');
          // Rotate geometry so ring lies flat along equator
          rGeo.rotateX(Math.PI / 2);
          const rMat = new THREE.MeshStandardMaterial({
            map: rTex,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.92,
            roughness: 0.5,
          });
          ringMesh = new THREE.Mesh(rGeo, rMat);
          ringMesh.rotation.z = PLANET_AXIAL_TILTS[p.id] || 0.47;
          pGroup.add(ringMesh);
        } else if (p.ringType === 'uranus') {
          const rGeo = new THREE.RingGeometry(planetRadius * 1.3, planetRadius * 1.85, 64);
          const rTex = createRingTexture('uranus');
          rGeo.rotateX(Math.PI / 2);
          const rMat = new THREE.MeshStandardMaterial({
            map: rTex,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.75,
          });
          ringMesh = new THREE.Mesh(rGeo, rMat);
          ringMesh.rotation.z = PLANET_AXIAL_TILTS[p.id] || 1.71;
          pGroup.add(ringMesh);
        } else if (p.ringType === 'earth') {
          // Subtle cybernetic orbital telemetry halo
          const rGeo = new THREE.RingGeometry(planetRadius * 1.25, planetRadius * 1.3, 48);
          rGeo.rotateX(Math.PI / 2);
          const rMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.35,
          });
          ringMesh = new THREE.Mesh(rGeo, rMat);
          pGroup.add(ringMesh);
        }
      }

      planetObjects.push({
        id: p.id,
        orbitR,
        period: p.period || 30,
        baseRadius: planetRadius,
        group: pGroup,
        mesh: pMesh,
        ringMesh,
        atmosphereMesh: atmoMesh,
        currentWorldPos: new THREE.Vector3(),
      });
    }

    // 7. REAL 3D STARFIELD WITH 3D ACCELERATION
    const STAR_COUNT = 1600;
    const starPositions = new Float32Array(STAR_COUNT * 3);
    const starColors = new Float32Array(STAR_COUNT * 3);
    const starSizes = new Float32Array(STAR_COUNT);
    const baseStarZ = new Float32Array(STAR_COUNT);

    const starColorPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xa5f3fc),
      new THREE.Color(0x38bdf8),
      new THREE.Color(0xfde68a),
      new THREE.Color(0xfbcfe8),
    ];

    for (let i = 0; i < STAR_COUNT; i++) {
      const idx = i * 3;
      // Cylinder distribution along camera flight corridor
      const radius = 200 + Math.random() * 3200;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = (Math.random() - 0.5) * 2600;
      const z = (Math.random() - 0.5) * 5500;

      starPositions[idx] = x;
      starPositions[idx + 1] = y;
      starPositions[idx + 2] = z;
      baseStarZ[i] = z;

      const c = starColorPalette[Math.floor(Math.random() * starColorPalette.length)];
      starColors[idx] = c.r;
      starColors[idx + 1] = c.g;
      starColors[idx + 2] = c.b;

      starSizes[i] = 1.2 + Math.random() * 2.8;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    // Star point shader material supporting depth and dynamic velocity streaks
    const starCanvas = document.createElement('canvas');
    starCanvas.width = 32;
    starCanvas.height = 32;
    const sCtx = starCanvas.getContext('2d');
    if (sCtx) {
      const g = sCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.35, 'rgba(255, 255, 255, 0.85)');
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      sCtx.fillStyle = g;
      sCtx.beginPath();
      sCtx.arc(16, 16, 16, 0, Math.PI * 2);
      sCtx.fill();
    }
    const starPointTexture = new THREE.CanvasTexture(starCanvas);

    const starMat = new THREE.PointsMaterial({
      size: 4.5,
      vertexColors: true,
      map: starPointTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 8. INTERACTIVE 3D ORBIT CAMERA CONTROLLER (DESKTOP DRAG/WHEEL + MOBILE SWIPE/PINCH)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    let isPointerDown = false;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let hasDraggedSignificantly = false;

    // Mobile 2-finger pinch state
    let isPinching = false;
    let initialPinchDist = 0;
    let pinchStartDistance = 0;

    const DRAG_THRESHOLD = 7; // pixels to distinguish click/tap from camera drag

    const handlePointerDown = (e: PointerEvent) => {
      if (viewModeRef.current !== 'SOLAR_SYSTEM' && animStateRef.current.transitionT > 0.05) return;

      const targetElem = e.target as HTMLElement;
      if (
        targetElem &&
        (targetElem.closest('button') ||
          targetElem.closest('a') ||
          targetElem.closest('[role="button"]') ||
          targetElem.closest('[role="dialog"]') ||
          targetElem.closest('.planet-label-card'))
      ) {
        return;
      }

      isPointerDown = true;
      hasDraggedSignificantly = false;
      orbitCamRef.current.isDragging = false;
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;

      orbitCamRef.current.velocityAzimuth = 0;
      orbitCamRef.current.velocityElevation = 0;
    };

    const handlePointerMove = (e: PointerEvent) => {
      // Always update subtle mouse parallax
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      mouseRef.current.x = (e.clientX - halfW) / halfW;
      mouseRef.current.y = (e.clientY - halfH) / halfH;

      if (!isPointerDown || isPinching) return;

      const deltaX = e.clientX - lastPointerX;
      const deltaY = e.clientY - lastPointerY;
      const distFromStart = Math.hypot(e.clientX - pointerStartX, e.clientY - pointerStartY);

      if (distFromStart > DRAG_THRESHOLD) {
        hasDraggedSignificantly = true;
        orbitCamRef.current.isDragging = true;
      }

      if (hasDraggedSignificantly) {
        const cam = orbitCamRef.current;
        const sensitivity = 0.0035;
        cam.targetAzimuth -= deltaX * sensitivity;
        cam.targetElevation += deltaY * sensitivity;
        cam.targetElevation = Math.max(cam.minElevation, Math.min(cam.maxElevation, cam.targetElevation));

        // Release momentum tracking
        cam.velocityAzimuth = -deltaX * sensitivity * 0.35;
        cam.velocityElevation = deltaY * sensitivity * 0.35;
      }

      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      orbitCamRef.current.isDragging = false;

      // Direct 3D raycast hit detection only if user clicked/tapped without dragging
      if (!hasDraggedSignificantly && viewModeRef.current === 'SOLAR_SYSTEM') {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);
        const meshesToTest = planetObjects.map((p) => p.mesh);
        const intersects = raycaster.intersectObjects(meshesToTest);

        if (intersects.length > 0) {
          const hitMesh = intersects[0].object as THREE.Mesh;
          const hitObj = planetObjects.find((p) => p.mesh === hitMesh);
          if (hitObj && onSelectPlanetRef.current) {
            onSelectPlanetRef.current(hitObj.id);
          }
        }
      }
    };

    // Desktop Mouse Wheel Zoom
    const handleWheel = (e: WheelEvent) => {
      if (viewModeRef.current !== 'SOLAR_SYSTEM' && animStateRef.current.transitionT > 0.05) return;

      const targetElem = e.target as HTMLElement;
      if (targetElem && targetElem.closest('.overflow-y-auto')) return;

      e.preventDefault();
      const cam = orbitCamRef.current;
      const zoomFactor = Math.pow(1.0014, e.deltaY);
      cam.targetDistance = Math.max(cam.minDistance, Math.min(cam.maxDistance, cam.targetDistance * zoomFactor));
    };

    // Mobile Pinch-to-Zoom Handlers
    const handleTouchStart = (e: TouchEvent) => {
      if (viewModeRef.current !== 'SOLAR_SYSTEM' && animStateRef.current.transitionT > 0.05) return;

      if (e.touches.length === 2) {
        isPinching = true;
        hasDraggedSignificantly = true;
        orbitCamRef.current.isDragging = true;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.hypot(dx, dy) || 1;
        pinchStartDistance = orbitCamRef.current.targetDistance;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (viewModeRef.current !== 'SOLAR_SYSTEM' && animStateRef.current.transitionT > 0.05) return;

      if (e.touches.length === 2 && isPinching) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentPinchDist = Math.hypot(dx, dy) || 1;
        const pinchScale = initialPinchDist / currentPinchDist;

        const cam = orbitCamRef.current;
        cam.targetDistance = Math.max(
          cam.minDistance,
          Math.min(cam.maxDistance, pinchStartDistance * pinchScale)
        );
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinching = false;
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    // Quartic ease for smooth acceleration curve
    function customFlightEase(p: number): number {
      const cp = Math.max(0, Math.min(1, p));
      return cp * cp * (2 - cp) * (2 - cp);
    }

    function customVelocityScale(p: number): number {
      const cp = Math.max(0, Math.min(1, p));
      return 16 * cp * cp * (1 - cp) * (1 - cp);
    }

    // 9. ANIMATION LOOP
    let animId: number;
    let lastTime = performance.now();

    const currentLookAt = new THREE.Vector3(0, 0, 0);

    const render = (now: number) => {
      const dt = Math.min(0.08, (now - lastTime) * 0.001);
      lastTime = now;
      const sec = now * 0.001;

      const anim = animStateRef.current;
      const isMobile = width < 1024;

      // Smooth mouse parallax easing
      mouseRef.current.currentX += (mouseRef.current.x - mouseRef.current.currentX) * 0.06;
      mouseRef.current.currentY += (mouseRef.current.y - mouseRef.current.currentY) * 0.06;
      const mouseParallaxX = mouseRef.current.currentX * 70;
      const mouseParallaxY = -mouseRef.current.currentY * 45;

      // Sun pulse & slow rotation
      sunMesh.rotation.y += dt * 0.12;
      coronaMesh.rotation.y -= dt * 0.06;
      const sunPulse = 1.0 + Math.sin(sec * 2.2) * 0.035;
      sunMesh.scale.set(sunPulse, sunPulse, sunPulse);

      // Rotate each planet around Sun (orbital motion) & around its own axis
      const projected2DCoords: { [id: number]: ProjectedPlanetPosition } = {};

      for (let i = 0; i < planetObjects.length; i++) {
        const pObj = planetObjects[i];
        const rotSpeed = PLANET_ROTATION_SPEEDS[pObj.id] || 0.25;

        // Axial Rotation (smooth & continuous in all states)
        pObj.mesh.rotation.y += dt * rotSpeed;
        if (pObj.ringMesh) {
          pObj.ringMesh.rotation.z += dt * 0.02;
        }

        // Orbital Revolution in X-Z Plane with realistic 3D inclination
        const orbitalSpeed = (Math.PI * 2) / (pObj.period * 1.8);
        const orbitalAngle = sec * orbitalSpeed * 0.35 + pObj.id * 1.15;
        const px = Math.cos(orbitalAngle) * pObj.orbitR;
        const pz = Math.sin(orbitalAngle) * pObj.orbitR;
        // Distinct subtle 3D orbital inclination per planet (Pluto highest, Earth near zero)
        const inclinationAmps: Record<number, number> = {
          1: 14, 2: 7, 3: 2, 4: 6, 5: 4, 6: 6, 7: 3, 8: 5, 9: 22,
        };
        const py = Math.sin(orbitalAngle + pObj.id * 0.7) * (inclinationAmps[pObj.id] || 5);

        pObj.group.position.set(px, py, pz);
        pObj.currentWorldPos.set(px, py, pz);

        // Project 3D coordinate to 2D screen pixels for labels/HUD
        const screenVec = pObj.currentWorldPos.clone();
        screenVec.project(camera);
        const sx = (screenVec.x * 0.5 + 0.5) * width;
        const sy = (-(screenVec.y * 0.5) + 0.5) * height;

        const distToCam = camera.position.distanceTo(pObj.currentWorldPos);
        const vFovRad = THREE.MathUtils.degToRad(camera.fov);
        const screenR = (pObj.baseRadius / (distToCam * Math.tan(vFovRad / 2))) * (height * 0.5);

        // Distance along the camera view Z-axis (Z-depth)
        const camViewPos = pObj.currentWorldPos.clone().applyMatrix4(camera.matrixWorldInverse);
        const zDepth = -camViewPos.z;

        projected2DCoords[pObj.id] = {
          x: sx,
          y: sy,
          radius2D: Math.max(10, Math.round(screenR)),
          distToCamera: distToCam,
          zDepth,
          worldZ: pz,
        };
      }

      // Projected position for Sun (origin 0,0,0)
      const sunWorldPos = new THREE.Vector3(0, 0, 0);
      const sunScreenVec = sunWorldPos.clone().project(camera);
      const sunSx = (sunScreenVec.x * 0.5 + 0.5) * width;
      const sunSy = (-(sunScreenVec.y * 0.5) + 0.5) * height;
      const sunDistToCam = camera.position.distanceTo(sunWorldPos);
      const vFovRad = THREE.MathUtils.degToRad(camera.fov);
      const sunScreenR = (sunRadius / (sunDistToCam * Math.tan(vFovRad / 2))) * (height * 0.5);
      const sunCamViewPos = sunWorldPos.clone().applyMatrix4(camera.matrixWorldInverse);
      const sunZDepth = -sunCamViewPos.z;

      projected2DCoords[0] = {
        x: sunSx,
        y: sunSy,
        radius2D: Math.max(16, Math.round(sunScreenR)),
        distToCamera: sunDistToCam,
        zDepth: sunZDepth,
        worldZ: 0,
      };

      // Emit positions for React layer
      if (anim.transitionT < 0.95) {
        onUpdatePositionsRef.current(projected2DCoords);
      }

      // Flight Animation Interpolation
      if (anim.isFlying) {
        const elapsed = now - anim.flightStartTime;
        const progress = Math.min(1.0, elapsed / anim.flightDuration);

        const easedT = customFlightEase(progress);
        const vScale = customVelocityScale(progress);
        anim.velocityFactor = vScale;

        if (anim.flightDirection === 1) {
          anim.transitionT = easedT;
        } else {
          anim.transitionT = 1.0 - easedT;
        }

        if (progress >= 1.0) {
          anim.isFlying = false;
          anim.velocityFactor = 0;
          anim.transitionT = anim.flightDirection === 1 ? 1.0 : 0.0;
          const completedMode: ViewMode =
            anim.flightType === 'PLANET_TO_PLANET'
              ? 'PLANET_IMMERSIVE'
              : anim.flightDirection === 1
              ? 'FLYING_TO_PLANET'
              : 'FLYING_TO_SOLAR';
          const destinationId = anim.toPlanetId;
          onFlightCompleteRef.current(completedMode, destinationId);
        }
      }

      const t = anim.transitionT; // 0 = solar system, 1 = planet immersive
      const activePlanetId =
        anim.isFlying
          ? (anim.flightDirection === 1 ? anim.toPlanetId : anim.fromPlanetId)
          : (currentPlanetIdRef.current || 0);

      const targetPlanetObj = planetObjects.find((p) => p.id === activePlanetId);

interface MobilePlanetBackgroundConfig {
  distMultiplier: number;
  shiftRightRatio: number;
  shiftUpRatio: number;
  elevationRatio: number;
}

const MOBILE_PLANET_CONFIGS: Record<number, MobilePlanetBackgroundConfig> = {
  // Mercury (1): Arsenal - rocky sunlit sphere in upper zone
  1: {
    distMultiplier: 2.8,
    shiftRightRatio: -0.06,
    shiftUpRatio: -0.24,
    elevationRatio: 0.22,
  },
  // Venus (2): Certifications - golden dense atmosphere
  2: {
    distMultiplier: 2.85,
    shiftRightRatio: 0.06,
    shiftUpRatio: -0.24,
    elevationRatio: 0.24,
  },
  // Earth (3): Experience - blue atmospheric rim & glowing clouds in upper-right
  3: {
    distMultiplier: 2.9,
    shiftRightRatio: -0.10,
    shiftUpRatio: -0.24,
    elevationRatio: 0.20,
  },
  // Mars (4): Projects - reddish atmospheric curve & dusty terminator in upper-right
  4: {
    distMultiplier: 2.8,
    shiftRightRatio: -0.08,
    shiftUpRatio: -0.25,
    elevationRatio: 0.22,
  },
  // Jupiter (5): Research - massive gas giant sphere & atmospheric bands in upper-left
  5: {
    distMultiplier: 3.3,
    shiftRightRatio: 0.10,
    shiftUpRatio: -0.22,
    elevationRatio: 0.18,
  },
  // Saturn (6): Achievements & CTF - dramatic rings crossing viewport and extending beyond edges!
  6: {
    distMultiplier: 3.8,
    shiftRightRatio: -0.04,
    shiftUpRatio: -0.22,
    elevationRatio: 0.28,
  },
  // Uranus (7): Languages - cyan/blue sphere with ring system in upper-left
  7: {
    distMultiplier: 3.3,
    shiftRightRatio: 0.08,
    shiftUpRatio: -0.24,
    elevationRatio: 0.22,
  },
  // Neptune (8): About - deep oceanic blue atmosphere in upper-right
  8: {
    distMultiplier: 2.9,
    shiftRightRatio: -0.07,
    shiftUpRatio: -0.24,
    elevationRatio: 0.20,
  },
  // Pluto (9): Comms - icy spherical body with subtle haze centered upper zone
  9: {
    distMultiplier: 2.5,
    shiftRightRatio: 0.0,
    shiftUpRatio: -0.24,
    elevationRatio: 0.20,
  },
};

      // Reusable 3D Immersive Camera Framing (Places planet in the LEFT 28%–32% zone on desktop, and upper hero zone on mobile)
      const calculateImmersivePose = (
        pObj: Planet3DObject,
        screenW: number,
        screenH: number
      ) => {
        const aspect = Math.max(0.35, screenW / Math.max(1, screenH));
        const isMobileScreen = aspect < 1.0 || screenW < 1024;
        const pPos = pObj.currentWorldPos;
        const pRadius = pObj.baseRadius;
        const pId = pObj.id;

        const isSaturn = pId === 6;
        const isUranus = pId === 7;
        const ringScale = isSaturn ? 1.4 : isUranus ? 1.2 : 1.0;

        const mobileCfg = MOBILE_PLANET_CONFIGS[pId] || {
          distMultiplier: 2.9,
          shiftRightRatio: 0.0,
          shiftUpRatio: -0.24,
          elevationRatio: 0.20,
        };

        const baseDist = Math.max(
          32,
          pRadius * (isMobileScreen ? mobileCfg.distMultiplier : 3.65 * ringScale)
        );

        // Vector from origin (Sun) to planet
        const radialDir = pPos.lengthSq() > 0.001
          ? new THREE.Vector3(pPos.x, 0, pPos.z).normalize()
          : new THREE.Vector3(0, 0, 1);
        const tangentDir = new THREE.Vector3(-radialDir.z, 0, radialDir.x);
        const upDir = new THREE.Vector3(0, 1, 0);

        // Sunward oblique viewing angle to showcase illuminated day side and terminator
        const viewDir = new THREE.Vector3()
          .addScaledVector(radialDir, 0.65)
          .addScaledVector(tangentDir, 0.75)
          .normalize();

        const elevationRatio = isMobileScreen
          ? mobileCfg.elevationRatio
          : isSaturn
          ? 0.30
          : 0.20;

        const camPos = pPos.clone().add(
          new THREE.Vector3()
            .addScaledVector(viewDir, baseDist)
            .addScaledVector(upDir, baseDist * elevationRatio)
        );

        const camToP = new THREE.Vector3().subVectors(pPos, camPos).normalize();
        const camRight = new THREE.Vector3().crossVectors(camToP, upDir).normalize();
        const camLocalUp = new THREE.Vector3().crossVectors(camRight, camToP).normalize();

        let lookAt: THREE.Vector3;

        if (!isMobileScreen) {
          // DESKTOP: Shift lookAt to the RIGHT of the planet by ~0.42 * halfWidth
          // This places the planet in the LEFT 28%–32% of the screen!
          const halfFovRad = THREE.MathUtils.degToRad(22.5);
          const tanH = Math.tan(halfFovRad) * aspect;
          const shiftRightDist = baseDist * tanH * 0.42;

          lookAt = pPos.clone()
            .addScaledVector(camRight, shiftRightDist)
            .addScaledVector(upDir, -pRadius * 0.06);
        } else {
          // MOBILE: Cinematic Hero Zone Background Framing
          // Planet rises into the upper open cosmic aperture (top-[0] to top-[20vh])
          // and extends beyond and around the floating dossier!
          const halfFovRad = THREE.MathUtils.degToRad(22.5);
          const tanH = Math.tan(halfFovRad) * aspect;
          const tanV = Math.tan(halfFovRad);

          const shiftRightDist = baseDist * tanH * mobileCfg.shiftRightRatio;
          const shiftUpDist = baseDist * tanV * mobileCfg.shiftUpRatio;

          lookAt = pPos.clone()
            .addScaledVector(camRight, shiftRightDist)
            .addScaledVector(upDir, shiftUpDist);
        }

        return { cameraPosition: camPos, lookAtTarget: lookAt };
      };

      // CAMERA POSITIONING & CINEMATIC FLIGHT
      let desiredCamPos: THREE.Vector3;
      let desiredLookAt: THREE.Vector3;

      if (anim.isFlying && anim.flightType === 'PLANET_TO_PLANET') {
        const fromPlanetObj = planetObjects.find((p) => p.id === anim.fromPlanetId);
        const toPlanetObj = planetObjects.find((p) => p.id === anim.toPlanetId);

        const fallbackObj: Planet3DObject = {
          id: 0,
          orbitR: 0,
          period: 0,
          baseRadius: 20,
          group: new THREE.Group(),
          mesh: new THREE.Mesh(),
          currentWorldPos: new THREE.Vector3(0, 0, 0),
        };

        const fromPose = calculateImmersivePose(fromPlanetObj || fallbackObj, width, height);
        const toPose = calculateImmersivePose(toPlanetObj || fallbackObj, width, height);

        const fromCamPos = fromPose.cameraPosition;
        const toCamPos = toPose.cameraPosition;
        const fromLookAt = fromPose.lookAtTarget;
        const toLookAt = toPose.lookAtTarget;

        // Interplanetary flight trajectory (Quadratic Bezier with deep space arc lift)
        const flightP = anim.transitionT; // 0.0 -> 1.0 eased
        const dist = fromCamPos.distanceTo(toCamPos);
        const midPoint = new THREE.Vector3().lerpVectors(fromCamPos, toCamPos, 0.5);
        // Cinematic arc lift: pulls back into space during peak cruise
        const arcLift = Math.max(120, Math.min(380, dist * 0.35));
        midPoint.y += arcLift;

        const oneMinusP = 1.0 - flightP;
        desiredCamPos = new THREE.Vector3()
          .addScaledVector(fromCamPos, oneMinusP * oneMinusP)
          .addScaledVector(midPoint, 2 * oneMinusP * flightP)
          .addScaledVector(toCamPos, flightP * flightP);

        // LookAt transitions smoothly from departing planet to arriving planet
        desiredLookAt = new THREE.Vector3().lerpVectors(fromLookAt, toLookAt, flightP);

        // Mouse Parallax in flight
        desiredCamPos.add(new THREE.Vector3(mouseParallaxX * 0.35, mouseParallaxY * 0.35, 0));
        desiredLookAt.add(new THREE.Vector3(mouseParallaxX * 0.1, mouseParallaxY * 0.1, 0));
      } else {
        const fallbackObj: Planet3DObject = {
          id: 0,
          orbitR: 0,
          period: 0,
          baseRadius: 20,
          group: new THREE.Group(),
          mesh: new THREE.Mesh(),
          currentWorldPos: new THREE.Vector3(0, 0, 0),
        };

        const immPose = calculateImmersivePose(targetPlanetObj || fallbackObj, width, height);
        const destinationCamPos = immPose.cameraPosition;
        const destinationLookAt = immPose.lookAtTarget;

        // Orbit camera update (smooth damping and release momentum)
        const cam = orbitCamRef.current;
        const damping = 0.09;
        cam.azimuth += (cam.targetAzimuth - cam.azimuth) * damping;
        cam.elevation += (cam.targetElevation - cam.elevation) * damping;
        cam.distance += (cam.targetDistance - cam.distance) * damping;

        if (!isPointerDown && !isPinching) {
          cam.targetAzimuth += cam.velocityAzimuth;
          cam.targetElevation += cam.velocityElevation;
          cam.velocityAzimuth *= 0.92;
          cam.velocityElevation *= 0.92;
          cam.targetElevation = Math.max(cam.minElevation, Math.min(cam.maxElevation, cam.targetElevation));
        }

        // Spherical to Cartesian coordinates around target (0,0,0)
        const cosElev = Math.cos(cam.elevation);
        const sinElev = Math.sin(cam.elevation);
        const solarCamX = cam.distance * cosElev * Math.sin(cam.azimuth);
        const solarCamY = cam.distance * sinElev;
        const solarCamZ = cam.distance * cosElev * Math.cos(cam.azimuth);
        const baseSolarCamPos = new THREE.Vector3(solarCamX, solarCamY, solarCamZ);

        // Add subtle mouse parallax
        const solarCamPosWithParallax = baseSolarCamPos.clone().add(
          new THREE.Vector3(mouseParallaxX * 0.4, mouseParallaxY * 0.4, 0)
        );

        // Smooth camera interpolation based on flight progress
        desiredCamPos = new THREE.Vector3().lerpVectors(
          solarCamPosWithParallax,
          destinationCamPos,
          t
        );

        desiredLookAt = new THREE.Vector3().lerpVectors(
          new THREE.Vector3(mouseParallaxX * 0.1, mouseParallaxY * 0.1, 0),
          destinationLookAt,
          t
        );
      }

      // Procedural variable camera shake during high-speed warp burn
      let shakeX = 0;
      let shakeY = 0;
      if (anim.isFlying && anim.velocityFactor > 0.01) {
        const shakeAmp = anim.velocityFactor * (isMobile ? 2.2 : 3.8);
        const tSec = now * 0.001;
        shakeX =
          (Math.sin(tSec * 43.1) * 0.52 +
            Math.sin(tSec * 73.9) * 0.32 +
            Math.sin(tSec * 19.3) * 0.16) *
          shakeAmp;
        shakeY =
          (Math.cos(tSec * 37.3) * 0.52 +
            Math.sin(tSec * 67.7) * 0.32 +
            Math.cos(tSec * 23.9) * 0.16) *
          shakeAmp;

        desiredCamPos.x += shakeX;
        desiredCamPos.y += shakeY;
      }

      camera.position.copy(desiredCamPos);
      currentLookAt.lerp(desiredLookAt, 0.15);
      camera.lookAt(currentLookAt);

      // Dynamic FOV expands with velocity for forward surge effect
      camera.fov = 45 + anim.velocityFactor * 14;
      camera.updateProjectionMatrix();

      // STARFIELD PARTICLE SIMULATION (Real 3D Z-Movement & Recycling)
      const positions = starGeo.attributes.position.array as Float32Array;
      const speed = anim.isFlying ? 380 + anim.velocityFactor * 2200 : 15;

      for (let i = 0; i < STAR_COUNT; i++) {
        const zIdx = i * 3 + 2;
        positions[zIdx] += speed * dt;

        // If star passes behind the camera, recycle far in the distance
        if (positions[zIdx] > camera.position.z + 200) {
          positions[zIdx] -= 5500;
        }
      }
      starGeo.attributes.position.needsUpdate = true;

      // Orbit lines fade out as camera flies deep into planetary orbit
      orbitLinesGroup.children.forEach((line) => {
        const mat = (line as THREE.Line).material as THREE.LineBasicMaterial;
        mat.opacity = Math.max(0, (1 - t * 2.5) * 0.32);
      });

      // 10. RENDER 3D SCENE
      renderer.render(scene, camera);

      // 11. 2D COCKPIT HUD & RADIAL PULSE SCANS OVERLAY
      if (hudCtx) {
        hudCtx.clearRect(0, 0, width, height);

        const targetDataPlanet = planets.find((p) => p.id === activePlanetId);
        const targetScreenPos = projected2DCoords[activePlanetId] || { x: width * 0.5, y: height * 0.5 };

        // Proximity calculation in screen radius
        const targetScreenR = targetPlanetObj
          ? Math.max(14, (targetPlanetObj.baseRadius / camera.position.distanceTo(targetPlanetObj.currentWorldPos)) * height * 1.1)
          : 20;

        // Target Tracking HUD in FLYING_TO_PLANET state
        if (anim.isFlying && anim.flightDirection === 1 && targetDataPlanet) {
          renderFlightHUD(
            hudCtx,
            targetDataPlanet,
            targetScreenPos.x,
            targetScreenPos.y,
            targetScreenR,
            t,
            anim.velocityFactor,
            width,
            height,
            shakeX * 0.25,
            shakeY * 0.25
          );

          // Trigger active sensor pulse scan during approach (t >= 0.68)
          if (t >= 0.68 && !approachScanTriggeredRef.current) {
            approachScanTriggeredRef.current = true;
            pulseScansRef.current.push({
              id: now,
              startTime: now,
              duration: 2500,
              cx: targetScreenPos.x,
              cy: targetScreenPos.y,
              startR: targetScreenR,
              color: targetDataPlanet.color || '#00e5ff',
            });
            playScanChirp();
          }
        }

        // Periodic sensor telemetry pulse scan in PLANET_IMMERSIVE state
        if (viewModeRef.current === 'PLANET_IMMERSIVE' && t >= 0.98 && targetDataPlanet) {
          if (now - lastScanTimeRef.current > 7200) {
            lastScanTimeRef.current = now;
            pulseScansRef.current.push({
              id: now,
              startTime: now,
              duration: 2600,
              cx: targetScreenPos.x,
              cy: targetScreenPos.y,
              startR: targetScreenR,
              color: targetDataPlanet.color || '#00e5ff',
            });
            playScanChirp();
          }
        }

        // Render Radial Pulse Scans
        if (pulseScansRef.current.length > 0) {
          renderRadialPulseScans(hudCtx, pulseScansRef.current, now, width, height);
        }
      }

      // 12. PROCEDURAL AMBIENT SOUNDSCAPE UPDATES
      updateAmbientSoundscape({
        planetId: activePlanetId,
        viewMode: anim.isFlying
          ? (anim.flightDirection === 1 ? 'FLYING_TO_PLANET' : 'FLYING_TO_SOLAR')
          : viewModeRef.current,
        velocityFactor: anim.velocityFactor,
        proximity: t,
        enabled: isAudioEnabled(),
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    // Resize Handler
    const handleResize = () => {
      if (!container || !hudCanvas) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      hudCanvas.width = width;
      hudCanvas.height = height;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);

      const defaults = getSolarDefaultParameters(width, height);
      orbitCamRef.current.minDistance = Math.max(380, defaults.distance * 0.35);
      orbitCamRef.current.maxDistance = Math.min(4200, defaults.distance * 2.2);
    };

    window.addEventListener('resize', handleResize);

    // CLEANUP DISPOSAL
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);

      stopAmbientSoundscape();

      // Dispose Three.js objects
      renderer.dispose();
      sunGeo.dispose();
      sunMat.dispose();
      coronaGeo.dispose();
      coronaMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      orbitLinesGroup.clear();

      planetObjects.forEach((p) => {
        p.mesh.geometry.dispose();
        if (Array.isArray(p.mesh.material)) {
          p.mesh.material.forEach((m) => m.dispose());
        } else {
          p.mesh.material.dispose();
        }
        if (p.ringMesh) {
          p.ringMesh.geometry.dispose();
          (p.ringMesh.material as THREE.Material).dispose();
        }
        if (p.atmosphereMesh) {
          p.atmosphereMesh.geometry.dispose();
          (p.atmosphereMesh.material as THREE.Material).dispose();
        }
      });

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [planets]);

  // Handle camera reset signal (e.g. from SOL ORIGIN home button)
  const lastResetSignalRef = useRef<number | undefined>(resetCameraSignal);
  useEffect(() => {
    if (resetCameraSignal !== undefined && resetCameraSignal !== lastResetSignalRef.current) {
      lastResetSignalRef.current = resetCameraSignal;
      const cam = orbitCamRef.current;
      const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const height = typeof window !== 'undefined' ? window.innerHeight : 800;
      const defaults = getSolarDefaultParameters(width, height);
      cam.targetAzimuth = defaults.azimuthRad;
      cam.targetElevation = defaults.elevationRad;
      cam.targetDistance = defaults.distance;
      cam.velocityAzimuth = 0;
      cam.velocityElevation = 0;
    }
  }, [resetCameraSignal]);

  // Subtle Reactive Cockpit Heads-Up Display (HUD) overlay
  function renderFlightHUD(
    ctx: CanvasRenderingContext2D,
    planet: CelestialBody,
    px: number,
    py: number,
    radius: number,
    t: number,
    vScale: number,
    width: number,
    height: number,
    shakeX: number = 0,
    shakeY: number = 0
  ) {
    let alpha = 1.0;
    if (t < 0.15) {
      alpha = Math.max(0, t / 0.15);
    } else if (t > 0.82) {
      alpha = Math.max(0, (1.0 - t) / 0.18);
    }

    if (alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    // 1. Target Tracking Brackets around 3D Planet
    const bracketPad = radius + Math.min(24, Math.max(10, radius * 0.2));
    const armLen = Math.min(22, Math.max(10, bracketPad * 0.35));

    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.4;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 8;

    // Top-Left corner
    ctx.beginPath();
    ctx.moveTo(px - bracketPad, py - bracketPad + armLen);
    ctx.lineTo(px - bracketPad, py - bracketPad);
    ctx.lineTo(px - bracketPad + armLen, py - bracketPad);
    ctx.stroke();

    // Top-Right corner
    ctx.beginPath();
    ctx.moveTo(px + bracketPad - armLen, py - bracketPad);
    ctx.lineTo(px + bracketPad, py - bracketPad);
    ctx.lineTo(px + bracketPad, py - bracketPad + armLen);
    ctx.stroke();

    // Bottom-Left corner
    ctx.beginPath();
    ctx.moveTo(px - bracketPad, py + bracketPad - armLen);
    ctx.lineTo(px - bracketPad, py + bracketPad);
    ctx.lineTo(px - bracketPad + armLen, py + bracketPad);
    ctx.stroke();

    // Bottom-Right corner
    ctx.beginPath();
    ctx.moveTo(px + bracketPad - armLen, py + bracketPad);
    ctx.lineTo(px + bracketPad, py + bracketPad);
    ctx.lineTo(px + bracketPad, py + bracketPad - armLen);
    ctx.stroke();

    // Target Label beside target reticle
    ctx.shadowBlur = 0;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(`TGT // ${planet.name.toUpperCase()}`, px + bracketPad + 8, py - 4);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText(`LOCK: ${(99.2 + vScale * 0.7).toFixed(1)}%`, px + bracketPad + 8, py + 10);

    // 2. Cockpit Horizon Attitude Ticks
    const cx = width / 2 + shakeX;
    const cy = height * 0.5 + shakeY;

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 240, cy);
    ctx.lineTo(cx - 140, cy);
    ctx.moveTo(cx - 240, cy - 6);
    ctx.lineTo(cx - 240, cy + 6);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 140, cy);
    ctx.lineTo(cx + 240, cy);
    ctx.moveTo(cx + 240, cy - 6);
    ctx.lineTo(cx + 240, cy + 6);
    ctx.stroke();

    // 3. Reactive Velocity & Proximity Cockpit HUD Panel
    const hudW = Math.min(440, width - 40);
    const hudH = 58;
    const hudX = cx - hudW / 2;
    const hudY = height - 120 + shakeY;

    // HUD Glass Backdrop
    ctx.fillStyle = 'rgba(2, 6, 18, 0.65)';
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 12);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Current Velocity Readout (Climbs from 0.05c to 0.98c)
    const velocityC = (0.05 + vScale * 0.93).toFixed(2);
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(`WARP VELOCITY: ${velocityC} c`, hudX + 16, hudY + 22);

    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(`VECTOR: ORBITAL CAPTURE [${planet.name.toUpperCase()}]`, hudX + 16, hudY + 34);

    // Kinetic Velocity Segment Meter
    const meterX = hudX + 16;
    const meterY = hudY + 42;
    const segCount = 10;
    const segW = 12;
    const segH = 4;
    const activeSegs = Math.round(vScale * segCount);

    for (let i = 0; i < segCount; i++) {
      ctx.fillStyle = i < activeSegs ? '#00e5ff' : 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(meterX + i * (segW + 2), meterY, segW, segH);
    }

    // Dynamic Proximity to Target Readout
    const remainingAU = Math.max(0.01, (1.0 - t) * planet.au).toFixed(2);
    const rangePercent = Math.max(0, Math.round((1.0 - t) * 100));

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#34d399';
    ctx.textAlign = 'right';
    ctx.fillText(`PROXIMITY: ${remainingAU} AU`, hudX + hudW - 16, hudY + 36);

    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`RANGE: ${rangePercent}% REMAINING`, hudX + hudW - 16, hudY + 47);
    ctx.textAlign = 'left';

    ctx.restore();
  }

  // Radial Active Sensor Pulse Scan
  function renderRadialPulseScans(
    ctx: CanvasRenderingContext2D,
    scans: PulseScan[],
    now: number,
    width: number,
    height: number
  ) {
    const maxReach = Math.max(width, height) * 1.35;

    for (let idx = scans.length - 1; idx >= 0; idx--) {
      const scan = scans[idx];
      const elapsed = now - scan.startTime;
      const p = elapsed / scan.duration;

      if (p >= 1.0) {
        scans.splice(idx, 1);
        continue;
      }

      const easedP = 1.0 - Math.pow(1.0 - p, 2.2);
      const R = scan.startR + easedP * (maxReach - scan.startR);
      const alpha = Math.max(0, (1.0 - p) * 0.85);

      if (alpha <= 0.005) continue;

      ctx.save();

      // Soft Radar Glow Band
      const bandWidth = Math.min(36, R * 0.22);
      const ringGrad = ctx.createRadialGradient(
        scan.cx,
        scan.cy,
        Math.max(0, R - bandWidth),
        scan.cx,
        scan.cy,
        R
      );
      ringGrad.addColorStop(0, 'rgba(0, 229, 255, 0)');
      ringGrad.addColorStop(0.7, 'rgba(0, 229, 255, 0.08)');
      ringGrad.addColorStop(1, 'rgba(0, 229, 255, 0.26)');

      ctx.fillStyle = ringGrad;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(scan.cx, scan.cy, R, 0, Math.PI * 2);
      ctx.arc(scan.cx, scan.cy, Math.max(0, R - bandWidth), 0, Math.PI * 2, true);
      ctx.fill();

      // Primary High-Intensity Wavefront Ring
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(scan.cx, scan.cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Trailing Micro-Ripples
      const rippleCount = 4;
      const rippleSpacing = Math.min(14, Math.max(7, R * 0.035));

      for (let r = 1; r <= rippleCount; r++) {
        const trailR = R - r * rippleSpacing;
        if (trailR <= scan.startR) continue;

        const rippleAlpha = alpha * Math.pow(0.72, r);
        ctx.globalAlpha = rippleAlpha;
        ctx.strokeStyle = r % 2 === 0 ? '#38bdf8' : '#00e5ff';
        ctx.lineWidth = r === 1 ? 1.1 : 0.8;

        if (r % 2 === 1) {
          ctx.setLineDash([6, 8]);
        } else {
          ctx.setLineDash([2, 5]);
        }

        ctx.beginPath();
        ctx.arc(scan.cx, scan.cy, trailR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Radar Crosshair Calibration Pings
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;

      for (const angle of [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75]) {
        const tx = scan.cx + Math.cos(angle) * R;
        const ty = scan.cy + Math.sin(angle) * R;
        ctx.beginPath();
        ctx.moveTo(tx - 5, ty);
        ctx.lineTo(tx + 5, ty);
        ctx.moveTo(tx, ty - 5);
        ctx.lineTo(tx, ty + 5);
        ctx.stroke();
      }

      // Active Telemetry Readout
      if (R > scan.startR + 45 && R < Math.max(width, height) * 0.92) {
        const labelAngle = -Math.PI * 0.18;
        const lx = scan.cx + Math.cos(labelAngle) * (R + 10);
        const ly = scan.cy + Math.sin(labelAngle) * (R + 10);

        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#00e5ff';
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillText(`PULSE SCAN // R: ${(R * 12).toFixed(0)}m`, lx, ly);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fillText(`SENSOR TELEMETRY: ACTIVE`, lx, ly + 11);
      }

      ctx.restore();
    }
  }

  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden select-none">
      {/* 3D WebGL Canvas Layer */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 2D Cockpit HUD & Radial Scan Overlay Canvas */}
      <canvas
        ref={hudCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* CRT Scanline Texture Layer */}
      <div className="absolute inset-0 scanlines opacity-20 pointer-events-none z-10" aria-hidden="true" />

      {/* Graceful Professional Fallback when WebGL is unavailable */}
      {!webGlSupported && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-[#02040a]/95 text-center">
          <div className="max-w-md p-6 rounded-3xl cosmic-glass border border-cyan-400/40 space-y-4 shadow-[0_0_40px_rgba(0,229,255,0.2)]">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse mx-auto" />
            <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">
              3D Planetary Spaceport Standby
            </h2>
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              Hardware 3D acceleration is currently unavailable in this browser session. The full professional dossier, technical projects, certifications, and contact channels remain fully accessible below.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => onSelectPlanet && onSelectPlanet(1)}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 text-xs font-mono font-bold transition-all"
              >
                OPEN TECHNICAL ARSENAL // MERCURY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

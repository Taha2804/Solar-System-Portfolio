/**
 * Web Audio API synthesizer for the Hyperdrive warp speed effects and sci-fi telemetry sounds.
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export function isAudioEnabled(): boolean {
  return soundEnabled;
}

export function setAudioEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

export function playWarpSound(): void {
  if (!soundEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Sci-fi rising pitch then stabilizing hyperdrive warp hum
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(820, now + 0.6);
    osc.frequency.exponentialRampToValueAtTime(160, now + 1.25);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 1.28);
  } catch {
    // Graceful fallback if AudioContext is prevented by browser policy
  }
}

export function playClickSound(): void {
  if (!soundEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // Ignore audio failures
  }
}

export function playScanChirp(): void {
  if (!soundEnabled) return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // High-frequency active radar sensor chirp
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1420, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  } catch {
    // Ignore audio failures
  }
}

// ============================================================================
// PROCEDURAL AMBIENT SOUNDSCAPE ENGINE
// ============================================================================

interface SoundscapeNodes {
  ctx: AudioContext;
  masterGain: GainNode;
  rootOsc: OscillatorNode;
  harmonicOsc: OscillatorNode;
  subOsc: OscillatorNode;
  filter: BiquadFilterNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
}

let ambientNodes: SoundscapeNodes | null = null;

// Unique planetary fundamental resonance frequencies (Hz)
const PLANETARY_RESONANCES: Record<number, { root: number; q: number; desc: string }> = {
  0: { root: 42, q: 2.0, desc: 'Sol Solar Flare Drone' },
  1: { root: 74, q: 3.5, desc: 'Mercury Crystalline Heat Drone' },
  2: { root: 50, q: 2.2, desc: 'Venus Dense Atmosphere Hum' },
  3: { root: 55, q: 2.8, desc: 'Earth Life Magnetosphere' },
  4: { root: 63, q: 4.2, desc: 'Mars Hollow Basalt Wind' },
  5: { root: 36, q: 1.8, desc: 'Jupiter Jovian Giant Sub-Bass' },
  6: { root: 46, q: 3.8, desc: 'Saturn Ring Resonance Chime' },
  7: { root: 58, q: 3.0, desc: 'Uranus Icy Methane Shimmer' },
  8: { root: 44, q: 2.6, desc: 'Neptune Deep Storm Pressure' },
  9: { root: 82, q: 4.5, desc: 'Pluto Kuiper Belt Whisper' },
};

function getOrCreateAmbientNodes(): SoundscapeNodes | null {
  if (ambientNodes) return ambientNodes;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const ctx = audioCtx;
    const now = ctx.currentTime;

    // Master volume for ambient soundscape (subtle background mix)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);

    // Warm resonant lowpass filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, now);
    filter.Q.setValueAtTime(2.5, now);

    // Slow LFO for organic planetary breathing/pulsing
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.18, now); // ~5.5s cycle

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(35, now); // Filter wobble width in Hz
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Oscillator 1: Root fundamental tone
    const rootOsc = ctx.createOscillator();
    rootOsc.type = 'sine';
    rootOsc.frequency.setValueAtTime(55, now);

    // Oscillator 2: Fifth harmonic / shimmering overtone
    const harmonicOsc = ctx.createOscillator();
    harmonicOsc.type = 'triangle';
    harmonicOsc.frequency.setValueAtTime(82.5, now);

    // Oscillator 3: Deep sub-harmonic presence
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(27.5, now);

    // Sub-mix gains
    const rootGain = ctx.createGain();
    rootGain.gain.setValueAtTime(0.42, now);
    const harmonicGain = ctx.createGain();
    harmonicGain.gain.setValueAtTime(0.24, now);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.38, now);

    rootOsc.connect(rootGain);
    harmonicOsc.connect(harmonicGain);
    subOsc.connect(subGain);

    rootGain.connect(filter);
    harmonicGain.connect(filter);
    subGain.connect(filter);

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Start continuous oscillators
    rootOsc.start(now);
    harmonicOsc.start(now);
    subOsc.start(now);
    lfo.start(now);

    ambientNodes = {
      ctx,
      masterGain,
      rootOsc,
      harmonicOsc,
      subOsc,
      filter,
      lfo,
      lfoGain,
    };

    return ambientNodes;
  } catch {
    return null;
  }
}

export interface SoundscapeParams {
  planetId: number;
  viewMode: string;
  velocityFactor: number; // 0.0 (cruise) to 1.0 (peak warp)
  proximity: number;      // 0.0 (deep space/solar) to 1.0 (full planet immersive)
  enabled: boolean;
}

/**
 * Real-time soundscape modulation that responds to flight velocity,
 * Doppler pitch shifts, and planetary proximity.
 */
export function updateAmbientSoundscape({
  planetId,
  viewMode,
  velocityFactor,
  proximity,
  enabled,
}: SoundscapeParams): void {
  if (!enabled || !soundEnabled) {
    if (ambientNodes) {
      try {
        const now = ambientNodes.ctx.currentTime;
        ambientNodes.masterGain.gain.setTargetAtTime(0.0001, now, 0.08);
      } catch {
        // ignore
      }
    }
    return;
  }

  const nodes = getOrCreateAmbientNodes();
  if (!nodes) return;

  try {
    const now = nodes.ctx.currentTime;
    if (nodes.ctx.state === 'suspended') {
      nodes.ctx.resume();
    }

    const planetAudio = PLANETARY_RESONANCES[planetId] || PLANETARY_RESONANCES[3];

    // 1. Calculate Intensity (Master Volume)
    // Subtle, organic presence: 0 in pure Solar System, ramps during transit, settles at 0.055 in orbit
    let targetVolume = 0.0;

    if (viewMode === 'PLANET_IMMERSIVE') {
      targetVolume = 0.052;
    } else if (viewMode === 'FLYING_TO_PLANET') {
      // Intensity rises with velocity burn + proximity approach
      targetVolume = 0.015 + velocityFactor * 0.045 + proximity * 0.025;
    } else if (viewMode === 'FLYING_TO_SOLAR') {
      // Intensity softens as ship leaves planet
      targetVolume = Math.max(0.0001, proximity * 0.04);
    } else {
      // SOLAR_SYSTEM mode: subtle cosmic background hum if at sol
      targetVolume = 0.012;
    }

    nodes.masterGain.gain.setTargetAtTime(targetVolume, now, 0.07);

    // 2. Pitch Modulation (Doppler shift during warp + gravitational compression near planet)
    // Base root frequency for target planet
    const baseRoot = planetAudio.root;
    // Doppler pitch rise during high-speed travel (up to +28Hz at peak warp)
    const dopplerPitchShift = velocityFactor * 28;
    // Gravitational pitch settling: higher register during interplanetary transit, settles into planet's core tone
    const proximityTuning = (1.0 - proximity) * 10;

    const currentRoot = baseRoot + dopplerPitchShift + proximityTuning;

    nodes.rootOsc.frequency.setTargetAtTime(currentRoot, now, 0.05);
    nodes.harmonicOsc.frequency.setTargetAtTime(currentRoot * 1.5, now, 0.05);
    nodes.subOsc.frequency.setTargetAtTime(currentRoot * 0.5, now, 0.05);

    // 3. Timbre / Filter Cutoff Modulation
    // Filter opens up during high-speed flight (hiss/rushing space medium),
    // then warms into a velvety atmospheric resonant lowpass in close planetary proximity
    const baseCutoff = 220 + baseRoot * 1.8;
    const speedCutoffBoost = velocityFactor * 850; // Opens up to ~1100Hz at max speed
    const proximityWarmth = proximity * 60;

    const currentCutoff = baseCutoff + speedCutoffBoost - proximityWarmth * 0.5;

    nodes.filter.frequency.setTargetAtTime(Math.max(120, currentCutoff), now, 0.06);
    nodes.filter.Q.setTargetAtTime(planetAudio.q, now, 0.1);
  } catch {
    // Ignore audio update errors
  }
}

export function stopAmbientSoundscape(): void {
  if (ambientNodes) {
    try {
      const now = ambientNodes.ctx.currentTime;
      ambientNodes.masterGain.gain.setTargetAtTime(0.0001, now, 0.05);
    } catch {
      // ignore
    }
  }
}

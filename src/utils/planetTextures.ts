import * as THREE from 'three';

/**
 * Procedural texture generator for genuine 3D celestial bodies.
 * Creates high-fidelity, photorealistic surface maps offline without external assets.
 */

// Simple pseudo-random hash generator for deterministic procedural detail
function pseudoNoise(x: number, y: number, seed: number = 42): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453123;
  return n - Math.floor(n);
}

export function createPlanetTexture(planetId: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallbackCanvas = document.createElement('canvas');
    return new THREE.CanvasTexture(fallbackCanvas);
  }

  const w = canvas.width;
  const h = canvas.height;

  switch (planetId) {
    case 0: {
      // SUN (Sol): Radiant turbulent photosphere with convective granulations
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#ff9100');
      grad.addColorStop(0.5, '#ffb300');
      grad.addColorStop(1, '#ff6d00');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Convective granulation noise cells
      for (let y = 0; y < h; y += 4) {
        for (let x = 0; x < w; x += 4) {
          const n = pseudoNoise(x * 0.05, y * 0.05, 11);
          if (n > 0.45) {
            ctx.fillStyle = `rgba(255, 235, 150, ${((n - 0.45) * 0.9).toFixed(2)})`;
            ctx.fillRect(x, y, 4, 4);
          } else {
            ctx.fillStyle = `rgba(216, 67, 21, ${(0.45 - n).toFixed(2)})`;
            ctx.fillRect(x, y, 4, 4);
          }
        }
      }
      break;
    }

    case 1: {
      // MERCURY: Desolate, heavily cratered gray-orange basalt regolith
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(0, 0, w, h);

      // Surface color variance
      for (let y = 0; y < h; y += 8) {
        for (let x = 0; x < w; x += 8) {
          const n = pseudoNoise(x * 0.02, y * 0.02, 1);
          ctx.fillStyle = n > 0.5 ? 'rgba(156, 163, 175, 0.4)' : 'rgba(75, 85, 99, 0.5)';
          ctx.fillRect(x, y, 8, 8);
        }
      }

      // Impact Craters
      for (let c = 0; c < 120; c++) {
        const cx = pseudoNoise(c, 1, 99) * w;
        const cy = pseudoNoise(c, 2, 88) * h;
        const cr = 4 + pseudoNoise(c, 3, 77) * 22;

        ctx.strokeStyle = 'rgba(229, 231, 235, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(31, 41, 55, 0.8)';
        ctx.beginPath();
        ctx.arc(cx, cy, cr * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 2: {
      // VENUS: Dense, swirling sulfuric acid cloud bands (pale cream, amber, and gold)
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.3, '#fde047');
      grad.addColorStop(0.7, '#eab308');
      grad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Atmospheric cloud shear waves
      for (let y = 0; y < h; y += 3) {
        const wave = Math.sin(y * 0.08) * 40 + Math.cos(y * 0.03) * 60;
        ctx.fillStyle = y % 6 === 0 ? 'rgba(255, 255, 255, 0.22)' : 'rgba(180, 83, 9, 0.15)';
        ctx.fillRect(wave % 100, y, w, 3);
      }
      break;
    }

    case 3: {
      // EARTH: Deep azure oceans, green/brown continental landmasses, polar ice
      ctx.fillStyle = '#0f386e'; // Deep ocean blue
      ctx.fillRect(0, 0, w, h);

      // Continental landmasses
      for (let y = 0; y < h; y += 6) {
        for (let x = 0; x < w; x += 6) {
          const n1 = pseudoNoise(x * 0.007, y * 0.007, 42);
          const n2 = pseudoNoise(x * 0.02, y * 0.02, 101);
          const land = n1 * 0.7 + n2 * 0.3;

          // Polar ice caps
          if (y < h * 0.12 || y > h * 0.88) {
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(x, y, 6, 6);
          } else if (land > 0.52) {
            // Continents: Forests and mountains
            ctx.fillStyle = land > 0.65 ? '#15803d' : '#854d0e';
            ctx.fillRect(x, y, 6, 6);
          } else if (land > 0.48) {
            // Shallow coastlines / continental shelves
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(x, y, 6, 6);
          }
        }
      }

      // Dynamic swirling cloud systems
      for (let y = 0; y < h; y += 4) {
        for (let x = 0; x < w; x += 4) {
          const c = pseudoNoise(x * 0.015, y * 0.015, 333);
          if (c > 0.62) {
            ctx.fillStyle = `rgba(255, 255, 255, ${((c - 0.62) * 2.2).toFixed(2)})`;
            ctx.fillRect(x, y, 4, 4);
          }
        }
      }
      break;
    }

    case 4: {
      // MARS: Rich iron-oxide rust-red surface, dark volcanic plains, polar cap
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(0, 0, w, h);

      for (let y = 0; y < h; y += 6) {
        for (let x = 0; x < w; x += 6) {
          const n = pseudoNoise(x * 0.012, y * 0.012, 77);
          if (n > 0.58) {
            // Dark basalt volcanic regions (Syrtis Major / Valles Marineris)
            ctx.fillStyle = '#450a0a';
            ctx.fillRect(x, y, 6, 6);
          } else if (n < 0.38) {
            // Lighter desert sands
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(x, y, 6, 6);
          }
        }
      }

      // North & South Polar Ice Caps
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, 12, 140, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h - 12, 110, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 5: {
      // JUPITER: Giant gas bands (belts and zones), turbulence waves, Great Red Spot
      const bands = [
        '#d97706', '#fde68a', '#b45309', '#fef3c7', '#92400e', '#fef08a',
        '#78350f', '#fde047', '#b45309', '#fef3c7', '#92400e'
      ];

      for (let i = 0; i < bands.length; i++) {
        const yStart = (i / bands.length) * h;
        const yHeight = h / bands.length + 2;
        ctx.fillStyle = bands[i];
        ctx.fillRect(0, yStart, w, yHeight);
      }

      // Atmospheric turbulence eddies
      for (let y = 0; y < h; y += 4) {
        const shear = Math.sin(y * 0.06) * 35 + Math.cos(y * 0.02) * 50;
        ctx.fillStyle = y % 8 === 0 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(80, 20, 10, 0.2)';
        ctx.fillRect((shear + w) % w, y, 160, 4);
      }

      // The Great Red Spot
      const spotX = w * 0.62;
      const spotY = h * 0.68;
      const spotGrad = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, 55);
      spotGrad.addColorStop(0, '#991b1b');
      spotGrad.addColorStop(0.65, '#dc2626');
      spotGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.ellipse(spotX, spotY, 65, 36, 0.15, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 6: {
      // SATURN: Elegant golden-amber cloud bands and pale equatorial zone
      const saturnBands = [
        '#d97706', '#fef3c7', '#fde68a', '#f59e0b', '#fef08a', '#d97706', '#b45309'
      ];
      for (let i = 0; i < saturnBands.length; i++) {
        const yStart = (i / saturnBands.length) * h;
        ctx.fillStyle = saturnBands[i];
        ctx.fillRect(0, yStart, w, h / saturnBands.length + 2);
      }

      // Soft hazy band blending
      for (let y = 0; y < h; y += 2) {
        ctx.fillStyle = y % 4 === 0 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(180, 120, 30, 0.1)';
        ctx.fillRect(0, y, w, 2);
      }
      break;
    }

    case 7: {
      // URANUS: Cyan-aquamarine ice giant with smooth, serene methane haze
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#a5f3fc');
      grad.addColorStop(0.3, '#38bdf8');
      grad.addColorStop(0.7, '#0284c7');
      grad.addColorStop(1, '#0e7490');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      for (let y = 0; y < h; y += 8) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.fillRect(0, y, w, 3);
      }
      break;
    }

    case 8: {
      // NEPTUNE: Deep azure supersonic storm atmosphere with bright methane cirrus streaks
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1d4ed8');
      grad.addColorStop(0.4, '#2563eb');
      grad.addColorStop(0.8, '#1e40af');
      grad.addColorStop(1, '#172554');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Great Dark Spot (Storm vortex)
      const stormX = w * 0.38;
      const stormY = h * 0.45;
      const stormGrad = ctx.createRadialGradient(stormX, stormY, 0, stormX, stormY, 40);
      stormGrad.addColorStop(0, '#0c1a45');
      stormGrad.addColorStop(0.8, '#1e3a8a');
      stormGrad.addColorStop(1, 'rgba(30, 58, 138, 0)');
      ctx.fillStyle = stormGrad;
      ctx.beginPath();
      ctx.ellipse(stormX, stormY, 48, 26, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Bright white cirrus cloud bands (Scooter storm)
      for (let i = 0; i < 20; i++) {
        const cx = (i * 55) % w;
        const cy = h * 0.42 + Math.sin(i) * 15;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.fillRect(cx, cy, 40 + (i % 3) * 15, 3);
      }
      break;
    }

    case 9: {
      // PLUTO: Mottled brownish-tan nitrogen/methane ice with Tombaugh Regio heart
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 0, w, h);

      for (let y = 0; y < h; y += 6) {
        for (let x = 0; x < w; x += 6) {
          const n = pseudoNoise(x * 0.015, y * 0.015, 9);
          ctx.fillStyle = n > 0.5 ? '#b45309' : '#451a03';
          ctx.fillRect(x, y, 6, 6);
        }
      }

      // Tombaugh Regio Heart (Bright white/cream nitrogen ice)
      const hx = w * 0.52;
      const hy = h * 0.52;
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(hx - 22, hy - 10, 28, 0, Math.PI * 2);
      ctx.arc(hx + 22, hy - 10, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx - 48, hy - 6);
      ctx.lineTo(hx, hy + 45);
      ctx.lineTo(hx + 48, hy - 6);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates photorealistic procedural grayscale bump / normal surface depth maps
 * for genuine 3D planetary terrain relief and light scatter.
 */
export function createPlanetBumpMap(planetId: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(document.createElement('canvas'));

  const w = canvas.width;
  const h = canvas.height;

  // Base neutral mid-gray (no displacement)
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, w, h);

  switch (planetId) {
    case 1: {
      // Mercury: impact crater rim elevation and crater floor depressions
      for (let c = 0; c < 70; c++) {
        const cx = pseudoNoise(c, 5, 21) * w;
        const cy = pseudoNoise(c, 6, 32) * h;
        const cr = 3 + pseudoNoise(c, 7, 43) * 16;

        // Bright crater rim (height)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.stroke();

        // Dark crater basin (depression)
        ctx.fillStyle = '#202020';
        ctx.beginPath();
        ctx.arc(cx, cy, cr * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 3: {
      // Earth: ocean basins are flat lowlands (dark), continental masses & mountains are elevated (bright)
      ctx.fillStyle = '#303030'; // Ocean floor
      ctx.fillRect(0, 0, w, h);

      for (let y = 0; y < h; y += 4) {
        for (let x = 0; x < w; x += 4) {
          const n1 = pseudoNoise(x * 0.014, y * 0.014, 42);
          const n2 = pseudoNoise(x * 0.04, y * 0.04, 101);
          const land = n1 * 0.7 + n2 * 0.3;

          if (land > 0.48) {
            // Continental shelf / land
            const heightVal = Math.min(255, Math.floor(100 + (land - 0.48) * 320));
            ctx.fillStyle = `rgb(${heightVal}, ${heightVal}, ${heightVal})`;
            ctx.fillRect(x, y, 4, 4);
          }
        }
      }
      break;
    }

    case 4: {
      // Mars: Valles Marineris canyon rift, Olympus Mons peak, cratered southern highlands
      for (let y = 0; y < h; y += 4) {
        for (let x = 0; x < w; x += 4) {
          const n = pseudoNoise(x * 0.02, y * 0.02, 77);
          const v = Math.floor(90 + n * 80);
          ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
          ctx.fillRect(x, y, 4, 4);
        }
      }

      // Olympus Mons shield volcano (bright elevation)
      const grad = ctx.createRadialGradient(w * 0.35, h * 0.42, 0, w * 0.35, h * 0.42, 28);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.7, '#a0a0a0');
      grad.addColorStop(1, '#808080');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(w * 0.35, h * 0.42, 28, 0, Math.PI * 2);
      ctx.fill();

      // Deep canyon rift (Valles Marineris)
      ctx.strokeStyle = '#181818';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.52);
      ctx.bezierCurveTo(w * 0.48, h * 0.54, w * 0.58, h * 0.49, w * 0.68, h * 0.53);
      ctx.stroke();
      break;
    }

    case 5:
    case 6: {
      // Gas giants (Jupiter / Saturn): subtle shear ripples along atmospheric bands
      for (let y = 0; y < h; y += 3) {
        const ripple = Math.sin(y * 0.12) * 20;
        const val = Math.floor(115 + Math.sin(y * 0.08) * 30 + ripple * 0.3);
        ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        ctx.fillRect(0, y, w, 3);
      }
      break;
    }

    default: {
      // Subtle terrain roughness for other rocky/icy bodies
      for (let y = 0; y < h; y += 6) {
        for (let x = 0; x < w; x += 6) {
          const n = pseudoNoise(x * 0.03, y * 0.03, planetId * 17);
          const val = Math.floor(100 + n * 55);
          ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
          ctx.fillRect(x, y, 6, 6);
        }
      }
      break;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates genuine 3D Ring Texture for Saturn and Uranus.
 */
export function createRingTexture(type: 'saturn' | 'uranus'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(document.createElement('canvas'));

  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);

  if (type === 'saturn') {
    // Inner C Ring (faint)
    grad.addColorStop(0.0, 'rgba(160, 130, 80, 0.05)');
    grad.addColorStop(0.2, 'rgba(180, 140, 90, 0.4)');
    // B Ring (brightest)
    grad.addColorStop(0.25, 'rgba(235, 200, 140, 0.85)');
    grad.addColorStop(0.55, 'rgba(215, 175, 120, 0.9)');
    // Cassini Division (dark gap)
    grad.addColorStop(0.58, 'rgba(10, 10, 15, 0.05)');
    grad.addColorStop(0.62, 'rgba(10, 10, 15, 0.05)');
    // A Ring (outer)
    grad.addColorStop(0.65, 'rgba(205, 165, 110, 0.75)');
    grad.addColorStop(0.92, 'rgba(175, 135, 85, 0.6)');
    // Encke Gap and edge
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  } else {
    // Uranus: thin, icy azure ring
    grad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.4, 'rgba(165, 243, 252, 0.2)');
    grad.addColorStop(0.7, 'rgba(165, 243, 252, 0.75)');
    grad.addColorStop(0.85, 'rgba(56, 189, 248, 0.6)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

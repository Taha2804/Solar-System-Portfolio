# 🪐 HELIOS // Taha Badami — Cybersecurity & Systems 3D Portfolio

[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio_API-Procedural-10b981?style=for-the-badge&logo=web-audio-api&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

> **Heliocentric cyber-astrodynamics interactive portfolio for Taha Aliasgar Badami** — Cybersecurity Analyst, Network Security Engineer, and Full Stack Systems Developer.

An immersive, GPU-accelerated web experience bridging aerospace simulation aesthetics with elite cyber-defense engineering telemetry.

---

## 🌌 Overview

**HELIOS** replaces traditional static portfolio grids with an exploratory, full-viewport 3D orrery. Visitors navigate through the solar system, initiating hyperdrive flight trajectories between celestial bodies to explore real-world security operations, penetration testing tools, full-stack software architectures, and verified credentials.

---

## 🚀 Key Features

### 1. 3D Astrodynamics Simulation (`CelestialCanvas`)
- **60 FPS HTML5 Canvas Engine**: Optimized depth-projected starfield with 750+ perspective-projected celestial bodies, dynamic FOV warp expansion, and volumetric multi-layered nebulae clouds.
- **Accurate Planetary Mechanics**: Real-time elliptical orbits computed from orbital semi-major axes and revolution periods.
- **Atmospheric & Surface Rendering**: Procedural craters on Mercury, dense sulfuric storms on Venus, continental clouds on Earth, dust storms on Mars, Great Red Spot turbulence on Jupiter, dynamic Cassini-division rings on Saturn, and cryo-currents on Neptune.

### 2. Continuous Flight Trajectory Engine
- **Non-Linear Camera Inertia**: Smooth quartic acceleration (`p²(2-p)²`) and derivative-driven velocity scaling.
- **Continuous Orbit-to-Surface Zoom**: Smooth camera transit without scene cuts or jarring reload transitions.
- **Bi-Directional Travel**: Forward hyperdrive approach to planetary orbit and reverse retrograde retreat back to Sol.

### 3. Cybernetic Heads-Up Display (HUD)
- **Target Tracking Reticle**: Dynamic 4-bracket corner framing locking onto celestial coordinates with real-time lock confidence metrics.
- **Reactive Velocity Readout**: Real-time velocity climbing dynamically from sub-light departure (`0.05c`) to warp velocity (`0.98c`) with a 10-segment kinetic speed bar.
- **Proximity Telemetry**: Live countdown in astronomical units (`AU`) and remaining orbital range percentage.

### 4. High-Speed Motion Blur & Optical Streaks
- **Velocity Trailing**: Particle streaks dynamically expand along their perspective trajectories during high-velocity burn.
- **Dual-Pass Diffuse Blur**: Translucent outer Doppler cyan halo simulating lens flare, wrapping a white-hot incandescent razor core.
- **Temporal Phosphor Decay**: Canvas persistence clear retains motion trails from prior frames, mimicking analog cathode-ray/optical sensor lag.

### 5. Procedural Camera Shake
- **Velocity-Coupled Stress**: Aerodynamic buffeting and spacetime shear amplitude scaled dynamically with instantaneous travel speed.
- **Multi-Harmonic Synthesis**: Irrational multi-frequency sine wave layering (`43.1Hz`, `73.9Hz`, `19.3Hz`) preventing repeating mechanical jitter.
- **Cockpit Parallax Damping**: Full vibration on external cosmos elements while interior HUD dashboard receives 25% cushioned damping.

### 6. High-Frequency Radial Pulse Scan
- **Active Sensor Surveillance**: Automatically fires when approaching a target planet (`t ≥ 0.68`) and cycles periodically in orbit.
- **Wavefront Echoes**: Primary radiant scanning ring accompanied by 4 high-frequency micro-ripple harmonics with alternating dashed rhythms.
- **Telemetry Readout & Audio Chirp**: Real-time radar crosshair pings and synchronized high-frequency acoustic chirps.

### 7. Procedural Ambient Soundscape (Web Audio API)
- **Zero Audio Assets**: 100% procedurally generated using native Web Audio API oscillators, biquad filters, and low-frequency modulation (LFO).
- **Doppler Shift Modulation**: Acoustic pitch dynamically shifts upward by up to +28Hz at peak transit speeds.
- **Planetary Resonance Tuning**: Unique fundamental frequencies tailored to each body (e.g., 36Hz Jovian sub-bass, 74Hz Mercury crystalline heat tone, 55Hz Earth magnetosphere tone).
- **Mute Sync**: Graceful non-popping exponential volume ramps tied to the global HUD audio toggle.

---

## 🪐 Planetary Station Architecture

| Celestial Body | Portfolio Domain | Focus Areas |
| :--- | :--- | :--- |
| ☀️ **Sol** | **Command & Identity** | Executive summary, security philosophy, clearance status, and core telemetry. |
| ☿️ **Mercury** | **Network Defense & SIEM** | Firewalls, IDS/IPS, Wazuh/Splunk SIEM, zero-trust perimeter configuration. |
| ♀️ **Venus** | **Offensive Security** | Penetration testing, ethical hacking, vulnerability assessments, OWASP Top 10. |
| 🌍 **Earth** | **Full-Stack Systems** | Production web architectures, secure APIs, microservices, cloud deployments. |
| ♂️ **Mars** | **Incident Response** | Threat hunting, digital forensics, containment strategies, kill-chain analysis. |
| ♃ **Jupiter** | **Cloud Security** | AWS/GCP infrastructure, Kubernetes hardening, IAM policies, DevSecOps. |
| ♄ **Saturn** | **Certifications & Compliance** | CompTIA Security+, CEH, ISO 27001, NIST framework alignment, credentials. |
| ♅ **Uranus** | **Timeline & Education** | Academic background, career milestones, continuous learning progression. |
| ♆ **Neptune** | **Secure Comms & Transmissions** | PGP/GPG public keys, encrypted channels, social links, direct transmission portal. |

---

## 🛠️ Tech Stack

- **Framework**: React 19 (Hooks, Context, Functional Architecture)
- **Language**: TypeScript (Strict typing, zero implicit any)
- **Bundler & Tooling**: Vite 8, PostCSS, Bun
- **Styling**: Tailwind CSS v4 (Modern CSS theme variables, zero-pill discipline)
- **Graphics**: HTML5 2D Canvas API (High-performance direct pixel rendering)
- **Audio**: Web Audio API (Synthesizers, Biquad Filters, Gain Envelopes, LFOs)
- **Icons**: Lucide React

---

## ⌨️ Controls & Navigation

- **Mouse / Touch**:
  - Click any orbital planet node or bottom dock item to engage warp transit.
  - Click `RETURN TO SOL` or the top telemetry badge to return to global solar system view.
  - Click `PREV` / `NEXT` orbital vector buttons in planetary immersion to jump to neighboring orbits.
- **Keyboard Shortcuts**:
  - `[ESC]` — Return to Solar System view
  - `[A]` — Toggle procedural audio and telemetry soundscapes
  - `[←]` / `[→]` — Cycle through previous and next planetary stations
  - `[1] - [9]` — Direct warp jump to corresponding celestial body

---

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher) or [Bun](https://bun.sh/)
- `npm` or `bun` package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/badamitaha2804/helios-portfolio.git

# Navigate into the project directory
cd helios-portfolio

# Install dependencies
npm install
```

### Running Locally

```bash
# Start the development server on port 3000
npm run dev
```

Visit `http://localhost:3000` in your web browser.

### Building for Production

```bash
# Run type checks and compile optimized static bundle
npm run build

# Preview the production build locally
npm run preview
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<p align="center">
  <b>HELIOS TELEMETRY SYSTEM</b> // Engineered by <b>Taha Aliasgar Badami</b>
</p>

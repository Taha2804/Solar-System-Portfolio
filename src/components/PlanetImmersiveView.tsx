import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Award,
  Terminal,
  Check,
  ExternalLink,
  Copy,
  Send,
} from 'lucide-react';
import { CelestialBody } from '../types/portfolio';
import {
  PERSONAL_INFO,
  SKILL_CATEGORIES,
  CERTIFICATIONS,
  WORK_EXPERIENCE,
  PROJECTS,
  RESEARCH,
  EDUCATION,
  ACHIEVEMENTS,
  LANGUAGES,
  getAdjacentPlanets,
} from '../data/portfolioData';

interface PlanetImmersiveViewProps {
  planet: CelestialBody;
  targetPlanet?: CelestialBody | null;
  onReturnToSolar: () => void;
  onNavigatePlanet: (direction: number) => void;
  onDirectJump?: (planetId: number) => void;
  isTransitioning?: boolean;
}

export const PlanetImmersiveView: React.FC<PlanetImmersiveViewProps> = ({
  planet,
  targetPlanet,
  onReturnToSolar,
  onNavigatePlanet,
  onDirectJump,
  isTransitioning = false,
}) => {
  const { prev: prevPlanet, next: nextPlanet, currentIndex, totalPlanets } = getAdjacentPlanets(planet.id);
  const destinationPlanet = targetPlanet || planet;
  const [activeSkillCategory, setActiveSkillCategory] = useState<string>('all');
  const [activeProjectTab, setActiveProjectTab] = useState<string>('all');
  const [activeTerminalProject, setActiveTerminalProject] = useState<string>(PROJECTS[0].id);

  // Contact Form State for Pluto
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionSuccess, setTransmissionSuccess] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Responsive display mode detection
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Subtle first-time mobile navigation interaction hint
  const [showSwipeHint, setShowSwipeHint] = useState<boolean>(false);

  useEffect(() => {
    if (!isMobile) return;
    try {
      const shown = sessionStorage.getItem('helios_swipe_hint_shown');
      if (!shown) {
        setShowSwipeHint(true);
        const timer = setTimeout(() => {
          setShowSwipeHint(false);
          sessionStorage.setItem('helios_swipe_hint_shown', 'true');
        }, 3600);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [isMobile]);

  // Transition lock to prevent rapid repeated swipes while cinematic animation is running
  const transitionLockRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isTransitioning) {
      transitionLockRef.current = false;
    } else {
      transitionLockRef.current = true;
    }
  }, [isTransitioning]);

  // Robust Pointer Events Gesture Tracking for Mobile Swipe Navigation
  const gestureStateRef = useRef<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    pointerId: number | null;
    isTracking: boolean;
    gestureLock: 'horizontal' | 'vertical' | null;
    hasNavigated: boolean;
  }>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    pointerId: null,
    isTracking: false,
    gestureLock: null,
    hasNavigated: false,
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isMobile) return;
    if (e.pointerType === 'mouse') return; // Mobile touch/pointer gesture driven
    if (isTransitioning || transitionLockRef.current) return;

    // Do not interfere with text inputs, textareas, selects or interactive form controls
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    gestureStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      pointerId: e.pointerId,
      isTracking: true,
      gestureLock: null,
      hasNavigated: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const state = gestureStateRef.current;
    if (!state.isTracking || state.hasNavigated) return;
    if (e.pointerId !== state.pointerId) return;
    if (isTransitioning || transitionLockRef.current) return;

    state.currentX = e.clientX;
    state.currentY = e.clientY;
    const deltaX = state.currentX - state.startX;
    const deltaY = state.currentY - state.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Initial gesture orientation lock
    if (state.gestureLock === null) {
      // If movement is predominantly vertical (>10px), lock to vertical scroll immediately
      // This guarantees normal vertical reading and scrolling is 100% safe
      if (absY > 10 && absY >= absX) {
        state.gestureLock = 'vertical';
        return;
      }
      // If movement is predominantly horizontal (>14px), lock to horizontal planet navigation
      if (absX > 14 && absX > absY * 1.3) {
        state.gestureLock = 'horizontal';
      }
    }

    // Only process planet navigation if locked to horizontal
    if (state.gestureLock === 'horizontal') {
      const swipeThreshold = 65; // Within recommended 50–80px mobile range

      if (absX > swipeThreshold && absX > absY) {
        state.hasNavigated = true;
        state.isTracking = false;
        transitionLockRef.current = true;

        setShowSwipeHint(false);
        try {
          sessionStorage.setItem('helios_swipe_hint_shown', 'true');
        } catch {}

        if (deltaX < -swipeThreshold) {
          // SWIPE LEFT → Travel to NEXT planet (e.g. Earth -> Mars)
          onNavigatePlanet(1);
        } else if (deltaX > swipeThreshold) {
          // SWIPE RIGHT → Travel to PREVIOUS planet (e.g. Earth -> Venus)
          onNavigatePlanet(-1);
        }
      }
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent) => {
    if (e.pointerId === gestureStateRef.current.pointerId) {
      gestureStateRef.current.isTracking = false;
      gestureStateRef.current.gestureLock = null;
      gestureStateRef.current.pointerId = null;
    }
  };

  // Global window release listener
  useEffect(() => {
    const handleGlobalPointerEnd = () => {
      gestureStateRef.current.isTracking = false;
      gestureStateRef.current.gestureLock = null;
      gestureStateRef.current.pointerId = null;
    };
    window.addEventListener('pointerup', handleGlobalPointerEnd);
    window.addEventListener('pointercancel', handleGlobalPointerEnd);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerEnd);
      window.removeEventListener('pointercancel', handleGlobalPointerEnd);
    };
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleTransmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;

    setIsTransmitting(true);
    setTimeout(() => {
      setIsTransmitting(false);
      setTransmissionSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setTimeout(() => setTransmissionSuccess(false), 5000);
    }, 1200);
  };

  const renderContent = () => {
    switch (planet.id) {
      case 1: {
        // MERCURY: SKILLS
        const filteredCategories =
          activeSkillCategory === 'all'
            ? SKILL_CATEGORIES
            : SKILL_CATEGORIES.filter((c) =>
                c.title.toLowerCase().includes(activeSkillCategory.toLowerCase())
              );

        return (
          <div className="space-y-5">
            <div className="border-b border-white/10 pb-3">
              <span className="text-amber-400 font-mono text-xs uppercase tracking-wider block">
                // TECHNICAL ARSENAL SPECIFICATION
              </span>
              <h3 className="text-xl sm:text-2xl font-['Space_Grotesk'] font-bold text-white">
                Core Competencies & Defense Skills
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Offensive penetration testing (CEH), forensic evidence triage (CHFI), network protocol security (CCNA), and full-stack development with Python and React.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10">
              {[
                { id: 'all', label: 'All Arsenal' },
                { id: 'cybersecurity', label: 'Security Testing' },
                { id: 'tools', label: 'Auditing Tools' },
                { id: 'networking', label: 'Networking' },
                { id: 'software', label: 'Engineering' },
                { id: 'operating', label: 'OS & Labs' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSkillCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                    activeSkillCategory === tab.id
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Skill Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredCategories.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl cosmic-glass-card border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between font-mono text-xs mb-2">
                      <span className="font-bold text-white text-sm">{cat.title}</span>
                      <span className="font-bold" style={{ color: cat.accentColor }}>
                        {cat.percentage}%
                      </span>
                    </div>

                    <div className="w-full bg-black/60 h-1.5 rounded-full mb-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.accentColor,
                          boxShadow: `0 0 8px ${cat.accentColor}`,
                        }}
                      />
                    </div>

                    <p className="text-xs text-slate-300 mb-3 leading-relaxed">{cat.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                    {cat.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded-md bg-black/50 border border-white/10 text-[10px] font-mono text-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Primary Tool Highlights */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10">
              <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block mb-2 font-bold">
                AUDITING & PENETRATION TOOLING ARSENAL
              </span>
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-300">
                  Wireshark
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  Nmap
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300">
                  Metasploit
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  Burp Suite
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300">
                  Nessus & OpenVAS
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  Splunk SIEM
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300">
                  Kali Linux
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300">
                  Python & Sockets
                </span>
              </div>
            </div>
          </div>
        );
      }

      case 2: {
        // VENUS: CERTS
        return (
          <div className="space-y-5">
            <div className="border-b border-white/10 pb-3">
              <span className="text-purple-400 font-mono text-xs uppercase tracking-wider block">
                // ACCREDITATION REGISTRY
              </span>
              <h3 className="text-xl sm:text-2xl font-['Space_Grotesk'] font-bold text-white">
                Industry Certifications & Credentials
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Officially accredited credentials in digital forensics (CHFI), offensive exploitation methodologies (CEH), and enterprise network architecture (CCNA).
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {CERTIFICATIONS.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 rounded-2xl cosmic-glass-card border border-white/10 hover:border-purple-400/50 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-400 shrink-0" />
                      <h4 className="font-['Space_Grotesk'] font-bold text-base sm:text-lg text-white">
                        {cert.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-slate-400">{cert.issuer} · {cert.year}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                        {cert.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {cert.description}
                  </p>

                  <div className="pt-2 border-t border-white/10">
                    <span className="text-[10px] font-mono text-purple-300 uppercase tracking-wider block mb-1.5 font-bold">
                      Verified Applied Competencies:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cert.coreCompetencies.map((comp, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-black/60 border border-purple-400/20 text-[11px] font-mono text-slate-200"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-wrap items-center justify-between font-mono text-xs text-slate-300 gap-2">
              <span>Candidate: <strong className="text-white">{PERSONAL_INFO.name}</strong></span>
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <Check className="w-3.5 h-3.5" /> 100% VERIFIED RECORDS
              </span>
            </div>
          </div>
        );
      }

      case 3: {
        // EARTH: EXPERIENCE
        return (
          <div className="space-y-5">
            <div className="border-b border-white/10 pb-3">
              <span className="text-emerald-400 font-mono text-xs uppercase tracking-wider block">
                // OPERATIONAL DEPLOYMENTS
              </span>
              <h3 className="text-xl sm:text-2xl font-['Space_Grotesk'] font-bold text-white">
                Field Experience & Incident Defense
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Hands-on endpoint defense, network traffic inspection, recurring vulnerability remediation, and SLA-driven L1 alert triage.
              </p>
            </div>

            {WORK_EXPERIENCE.map((exp) => (
              <div
                key={exp.id}
                className="p-5 rounded-2xl cosmic-glass-card border-l-4 border-l-emerald-400 border border-white/10 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="font-['Space_Grotesk'] font-bold text-base sm:text-lg text-white">
                      {exp.title}
                    </h4>
                    <div className="text-xs font-mono text-emerald-400 mt-0.5">
                      {exp.company} · {exp.location}
                    </div>
                  </div>
                  <span className="font-mono text-xs text-slate-300 bg-black/60 px-3 py-1 rounded-full border border-white/10">
                    {exp.period}
                  </span>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
                  {exp.metrics.map((m, mIdx) => (
                    <div key={mIdx} className="p-2 rounded-xl bg-black/60 border border-emerald-400/20">
                      <span className="text-emerald-300 font-bold text-xs sm:text-sm block">
                        {m.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-slate-400 block leading-tight">
                        {m.split(' ').slice(1).join(' ')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Highlights List */}
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  {exp.highlights.map((bullet, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold mt-1">▹</span>
                      <span className="leading-relaxed">{bullet}</span>
                    </li>
                  ))}
                </ul>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/10 font-mono text-[10px]">
                  {exp.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 4: {
        // MARS: PROJECTS
        const filteredProjects =
          activeProjectTab === 'all'
            ? PROJECTS
            : PROJECTS.filter((p) => p.category.toLowerCase().includes(activeProjectTab.toLowerCase()));

        const selectedProject =
          PROJECTS.find((p) => p.id === activeTerminalProject) || PROJECTS[0];

        return (
          <div className="space-y-5">
            <div className="border-b border-white/10 pb-3">
              <span className="text-red-400 font-mono text-xs uppercase tracking-wider block">
                // WARFARE SYSTEMS & ARCHITECTURE
              </span>
              <h3 className="text-xl sm:text-2xl font-['Space_Grotesk'] font-bold text-white">
                Engineered Defense & Full-Stack Projects
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Cryptographically authenticated remote administration tools, touchless gesture recognition, JWT student management portals, and ethical hacking labs.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10">
              {[
                { id: 'all', label: 'All Projects' },
                { id: 'full-stack', label: 'Full-Stack' },
                { id: 'vision', label: 'AI & Vision' },
                { id: 'network', label: 'Systems & Sockets' },
                { id: 'cybersecurity', label: 'PenTest Lab' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveProjectTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                    activeProjectTab === tab.id
                      ? 'bg-red-400/25 text-red-300 border border-red-400/40 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredProjects.map((proj) => (
                <div
                  key={proj.id}
                  className={`p-4 sm:p-5 rounded-2xl cosmic-glass-card border transition-all cursor-pointer ${
                    activeTerminalProject === proj.id
                      ? 'border-red-400 shadow-[0_0_20px_rgba(248,113,113,0.3)] bg-red-950/20'
                      : 'border-white/10 hover:border-red-400/40'
                  }`}
                  onClick={() => setActiveTerminalProject(proj.id)}
                >
                  <div className="flex items-center justify-between font-mono text-[11px] text-red-400 mb-2">
                    <span className="font-bold">{proj.category}</span>
                    <span className="text-slate-400">{proj.period}</span>
                  </div>

                  <h4 className="font-['Space_Grotesk'] font-bold text-base sm:text-lg text-white">
                    {proj.title}
                  </h4>
                  <p className="text-xs font-medium text-slate-300 mt-0.5 mb-2.5">
                    {proj.subtitle}
                  </p>

                  <ul className="space-y-1.5 text-xs text-slate-300 mb-3">
                    {proj.highlights.slice(0, 2).map((h, hIdx) => (
                      <li key={hIdx} className="flex items-start gap-1.5">
                        <span className="text-red-400 font-bold mt-0.5">•</span>
                        <span className="line-clamp-2">{h}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-1 pt-2 border-t border-white/10 font-mono text-[10px]">
                    {proj.techStack.map((tech, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-slate-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 text-right">
                    <button
                      className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTerminalProject(proj.id);
                      }}
                    >
                      <Terminal className="w-3 h-3" /> Inspect Telemetry &gt;
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Terminal Simulator Box */}
            {selectedProject?.terminalPreview && (
              <div className="p-4 rounded-2xl bg-black/90 border border-red-400/40 font-mono text-xs space-y-2 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                <div className="flex items-center justify-between text-[11px] border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-slate-400 ml-2">
                      TERMINAL // {selectedProject.title}
                    </span>
                  </div>
                  <span className="text-red-400">EXEC_STATUS: COMPLETED</span>
                </div>

                <div className="text-slate-400 pt-1">
                  $ <span className="text-white font-bold">{selectedProject.terminalPreview.command}</span>
                </div>

                <div className="space-y-1 pt-1 text-[11px]">
                  {selectedProject.terminalPreview.output.map((line, lIdx) => (
                    <div
                      key={lIdx}
                      className={
                        line.startsWith('[+]')
                          ? 'text-emerald-400'
                          : line.startsWith('[OK]')
                          ? 'text-cyan-300 font-bold'
                          : line.startsWith('[!]')
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      case 5: {
        // JUPITER: EDUCATION & RESEARCH
        return (
          <div className="space-y-5">
            <div className="border-b border-white/10 pb-3">
              <span className="text-sky-400 font-mono text-xs uppercase tracking-wider block">
                // ACADEMIC & RESEARCH MATRIX
              </span>
              <h3 className="text-xl sm:text-2xl font-['Space_Grotesk'] font-bold text-white">
                Academic Foundation & Applied AI Research
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Co-authored deep learning research on deepfake image detection and academic distinction in Computer Applications (8.4/10 CGPA).
              </p>
            </div>

            {/* Research Spotlight Card */}
            <div className="p-5 rounded-2xl cosmic-glass-card border border-sky-400/40 bg-sky-950/20 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-400/20 text-sky-300 border border-sky-400/40 font-bold">
                  APPLIED RESEARCH SPOTLIGHT
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {RESEARCH.accuracy}
                </span>
              </div>

              <h4 className="font-['Space_Grotesk'] font-bold text-lg text-white">
                {RESEARCH.title}
              </h4>
              <p className="text-xs font-mono text-sky-300">
                Role: {RESEARCH.role} · Hardware: {RESEARCH.hardware}
              </p>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {RESEARCH.description}
              </p>

              <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs text-slate-300">
                <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider block font-bold">
                  Key Research Contributions:
                </span>
                {RESEARCH.keyContributions.map((kc, kIdx) => (
                  <div key={kIdx} className="flex items-start gap-2">
                    <span className="text-sky-400 font-bold">▸</span>
                    <span>{kc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Formal Degrees */}
            <div className="space-y-3">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block font-bold">
                Academic Degrees & Record:
              </span>

              {EDUCATION.map((edu, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl cosmic-glass-card border border-white/10 space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h5 className="font-['Space_Grotesk'] font-bold text-base text-white">
                      {edu.degree}
                    </h5>
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-400/10 px-2.5 py-0.5 rounded border border-sky-400/30">
                      {edu.grade}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-slate-400">
                    {edu.institution} · {edu.period}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    {edu.details}
                  </p>

                  {edu.highlights && (
                    <ul className="pt-2 text-xs text-slate-300 space-y-1">
                      {edu.highlights.map((hl, hIdx) => (
                        <li key={hIdx} className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-sky-400" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 6: {
        // SATURN: ACHIEVEMENTS & CTF
        return (
          <div className="space-y-5">
            <div className="border-b border-white/10 pb-3">
              <span className="text-amber-400 font-mono text-xs uppercase tracking-wider block">
                // COMPETITIVE EXPLOITATION & MILESTONES
              </span>
              <h3 className="text-xl sm:text-2xl font-['Space_Grotesk'] font-bold text-white">
                Milestones, HackTheBox & CTF Lab Practice
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Measurable real-world impact across enterprise vulnerability mitigation, rapid SLA resolution, custom security tooling, and repeated exploitation practice.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {ACHIEVEMENTS.map((ach, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl cosmic-glass-card border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between font-mono text-xs mb-2">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 text-[10px]">
                        {ach.tag}
                      </span>
                      <span className="font-bold text-base text-amber-400">
                        {ach.metric}
                      </span>
                    </div>

                    <h4 className="font-['Space_Grotesk'] font-bold text-base text-white mb-1.5">
                      {ach.title}
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {ach.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2 font-mono text-xs">
              <span className="text-amber-400 font-bold block">// CTF & LAB METHODOLOGY HIGHLIGHTS</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
                <div className="p-2 rounded bg-black/50 border border-white/10">
                  <span className="text-white font-bold block">Enumeration</span>
                  Nmap service probes, directory busting, SMB / SNMP enumeration.
                </div>
                <div className="p-2 rounded bg-black/50 border border-white/10">
                  <span className="text-white font-bold block">Privilege Escalation</span>
                  Linux SUID misconfigs, sudo tokens, Windows token impersonation.
                </div>
                <div className="p-2 rounded bg-black/50 border border-white/10">
                  <span className="text-white font-bold block">Lateral Pivoting</span>
                  SSH key re-use, internal routing, port forwarding through tunnels.
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 7: {
        // URANUS: LANGUAGES & DIALECTS
        return (
          <div className="space-y-5">
            <div className="border-b border-white/10 pb-3">
              <span className="text-pink-400 font-mono text-xs uppercase tracking-wider block">
                // DIALECTS & SYNTAX REGISTRY
              </span>
              <h3 className="text-xl sm:text-2xl font-['Space_Grotesk'] font-bold text-white">
                Programming Languages & Protocols
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Versatile polyglot fluency across low-level socket programming, procedural and object-oriented architectures, and network protocols.
              </p>
            </div>

            {/* Programming Dialects */}
            <div className="space-y-3">
              <span className="text-xs font-mono text-pink-400 uppercase tracking-wider block font-bold">
                PROGRAMMING & SCRIPTING DIALECTS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LANGUAGES.programming.map((lang, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl cosmic-glass-card border border-white/10 font-mono text-xs space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-sm">{lang.name}</span>
                      <span className="text-pink-400 font-semibold">{lang.level}</span>
                    </div>
                    <div className="w-full bg-black/60 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-pink-400 h-full rounded-full"
                        style={{ width: `${lang.pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">{lang.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Network Protocols */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-pink-400 uppercase tracking-wider block font-bold">
                NETWORK & TRANSPORT PROTOCOLS
              </span>
              <div className="flex flex-wrap gap-2 font-mono text-xs">
                {LANGUAGES.protocols.map((proto, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg bg-black/60 border border-pink-400/30 text-slate-200"
                  >
                    {proto}
                  </span>
                ))}
              </div>
            </div>

            {/* Spoken Languages */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block font-bold">
                NATURAL HUMAN LANGUAGES
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                {LANGUAGES.spoken.map((sp, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-center">
                    <span className="text-white font-bold block">{sp.language}</span>
                    <span className="text-[10px] text-pink-300 block mt-0.5">{sp.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 8: {
        // NEPTUNE: ABOUT & PHILOSOPHY
        return (
          <div className="space-y-5">
            <div className="border-b border-white/10 pb-3">
              <span className="text-lime-400 font-mono text-xs uppercase tracking-wider block">
                // OPERATOR ETHOS & BACKGROUND
              </span>
              <h3 className="text-xl sm:text-2xl font-['Space_Grotesk'] font-bold text-white">
                The Mind Behind The Security Architecture
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Adversarial mindset, empirical investigation, and commitment to proactive software and network engineering.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-center">
              <div className="p-3 rounded-2xl cosmic-glass-card border border-white/10">
                <span className="text-lime-400 font-bold block text-2xl">8.4</span>
                <span className="text-[10px] text-slate-400 uppercase">BCA CGPA</span>
              </div>
              <div className="p-3 rounded-2xl cosmic-glass-card border border-white/10">
                <span className="text-lime-400 font-bold block text-2xl">3x</span>
                <span className="text-[10px] text-slate-400 uppercase">Certifications</span>
              </div>
              <div className="p-3 rounded-2xl cosmic-glass-card border border-white/10">
                <span className="text-lime-400 font-bold block text-2xl">100+</span>
                <span className="text-[10px] text-slate-400 uppercase">Fleet Endpoints</span>
              </div>
              <div className="p-3 rounded-2xl cosmic-glass-card border border-white/10">
                <span className="text-lime-400 font-bold block text-2xl">99%</span>
                <span className="text-[10px] text-slate-400 uppercase">Fleet Uptime</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl cosmic-glass-card border border-white/10 space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <h4 className="font-['Space_Grotesk'] font-bold text-white text-base">
                Engineering & Threat Philosophy
              </h4>
              <p>
                Based in Pune, India, Taha Badami combines deep curiosity for low-level network behaviors with structured problem-solving. From resolving high-volume enterprise tickets at Olympus Computers to fine-tuning deep learning models for detecting synthetic media, Taha bridges the gap between infrastructure resilience and modern application engineering.
              </p>
              <p>
                Whether conducting vulnerability scans with OpenVAS and Metasploit, building responsive interfaces in React, or automating network tests with Python socket libraries, the focus remains steadfast: clean code, proactive threat reduction, and continuous learning.
              </p>
            </div>
          </div>
        );
      }

      case 9: {
        // PLUTO: CONTACT & ENCRYPTED COMM LINK
        return (
          <div className="space-y-5">
            <div className="border-b border-white/10 pb-3">
              <span className="text-cyan-400 font-mono text-xs uppercase tracking-wider block">
                // ENCRYPTED CONDUIT // PORT 443
              </span>
              <h3 className="text-xl sm:text-2xl font-['Space_Grotesk'] font-bold text-white">
                Establish Direct Communication Link
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Connect directly for roles in cybersecurity analysis, network engineering, or full-stack software development.
              </p>
            </div>

            {/* Quick Contact Chips with Copy Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl cosmic-glass-card border border-white/10 flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">PRIMARY EMAIL</span>
                  <span className="text-white font-bold">{PERSONAL_INFO.email}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(PERSONAL_INFO.email, 'email')}
                  className="p-2 rounded-lg bg-black/60 hover:bg-white/10 text-cyan-400 border border-white/10 transition-colors flex items-center gap-1"
                  title="Copy email to clipboard"
                >
                  {copiedItem === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-3.5 rounded-xl cosmic-glass-card border border-white/10 flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">SECURE PHONE</span>
                  <span className="text-white font-bold">{PERSONAL_INFO.phone}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(PERSONAL_INFO.phone, 'phone')}
                  className="p-2 rounded-lg bg-black/60 hover:bg-white/10 text-cyan-400 border border-white/10 transition-colors flex items-center gap-1"
                  title="Copy phone to clipboard"
                >
                  {copiedItem === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-3.5 rounded-xl cosmic-glass-card border border-white/10 flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">LINKEDIN NETWORK</span>
                  <span className="text-cyan-300 font-bold">{PERSONAL_INFO.linkedinHandle}</span>
                </div>
                <a
                  href={PERSONAL_INFO.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-black/60 hover:bg-cyan-500/20 text-cyan-400 border border-white/10 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-3.5 rounded-xl cosmic-glass-card border border-white/10 flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">GITHUB REPOSITORIES</span>
                  <span className="text-cyan-300 font-bold">{PERSONAL_INFO.githubHandle}</span>
                </div>
                <a
                  href={PERSONAL_INFO.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-black/60 hover:bg-cyan-500/20 text-cyan-400 border border-white/10 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Interactive Transmission Form */}
            <form onSubmit={handleTransmitMessage} className="p-4 sm:p-5 rounded-2xl cosmic-glass-card border border-cyan-400/30 space-y-3.5">
              <span className="text-xs font-mono text-cyan-400 font-bold block uppercase">
                // DISPATCH ENCRYPTED MESSAGE PACKET
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    YOUR CALLSIGN / NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Lead Recruiter / Security Director"
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none font-mono text-xs text-white placeholder-slate-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    COMM FREQUENCY / EMAIL *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. hiring@company.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none font-mono text-xs text-white placeholder-slate-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  TRANSMISSION PAYLOAD *
                </label>
                <textarea
                  rows={3}
                  required
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Enter role requirements, interview inquiry, or collaborative message..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none font-mono text-xs text-white placeholder-slate-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isTransmitting}
                className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 text-slate-950 font-['Space_Grotesk'] font-bold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_30px_rgba(0,229,255,0.7)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isTransmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    <span>ENCRYPTING & ROUTING PACKET...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>TRANSMIT PACKET TO OPERATOR TERMINAL &gt;</span>
                  </>
                )}
              </button>

              {transmissionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>TRANSMISSION CONFIRMED: Encrypted packet delivered to Taha Badami's terminal.</span>
                </div>
              )}
            </form>

            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-wrap items-center justify-between text-xs font-mono text-slate-300 gap-2">
              <span>Location: <strong className="text-white">{PERSONAL_INFO.location}</strong></span>
              <span className="text-cyan-400 font-bold">AVAILABILITY: IMMEDIATE / OPEN TO ROLES</span>
            </div>
          </div>
        );
      }

      default:
        return <p className="text-slate-300 font-mono text-xs">Planetary orbit telemetry nominal.</p>;
    }
  };

  const renderDossierConsole = (isMobileMode: boolean) => (
    <div
      className={`relative rounded-2xl sm:rounded-3xl border border-cyan-400/30 overflow-hidden flex flex-col h-full animate-in fade-in ${
        isMobileMode
          ? 'duration-300 bg-gradient-to-b from-slate-950/75 via-slate-950/88 to-[#02040a]/96 backdrop-blur-xl'
          : 'slide-in-from-right-4 duration-500 cosmic-glass bg-black/75 backdrop-blur-xl shadow-[0_25px_60px_rgba(0,0,0,0.9)]'
      } min-h-0`}
      style={
        isMobileMode
          ? {
              boxShadow: `0 -4px 28px -4px ${planet.color}45, 0 25px 60px rgba(0,0,0,0.9)`,
            }
          : undefined
      }
    >
      {/* Subtle atmospheric ambient glow at top rim of mobile console */}
      {isMobileMode && (
        <div
          className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-[280px] h-[120px] rounded-full blur-[60px] opacity-30"
          style={{ backgroundColor: planet.color }}
        />
      )}

      {/* Console Header Bar */}
      <div className="px-3.5 sm:px-5 py-2.5 sm:py-3.5 border-b border-white/10 flex items-center justify-between bg-black/60 backdrop-blur-xl shrink-0 relative z-10">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div
            className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full shrink-0"
            style={{
              backgroundColor: planet.color,
              boxShadow: `0 0 10px ${planet.color}`,
            }}
          />
          <span className="text-xs font-mono font-bold text-white tracking-wider truncate">
            {planet.name.toUpperCase()} DOSSIER TERMINAL
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-[10px] sm:text-[11px] font-mono text-cyan-400 shrink-0">{planet.badge}</span>
        </div>

        <div className="text-[9px] sm:text-[10px] font-mono text-slate-400 hidden sm:block shrink-0">
          TAHA ALIASGAR BADAMI // PORTFOLIO
        </div>
      </div>

      {/* Scrollable Dossier Content */}
      <div className="p-3.5 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 text-sm text-slate-200 flex-1 min-h-0 overscroll-contain relative z-10 touch-pan-y">
        {isTransitioning ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-14 text-center space-y-4 my-auto min-h-[300px] animate-in fade-in duration-300">
            <div className="relative flex items-center justify-center">
              <div
                className="w-16 h-16 rounded-full border-2 border-dashed animate-spin"
                style={{ borderColor: destinationPlanet.color }}
              />
              <div
                className="absolute w-6 h-6 rounded-full animate-ping opacity-60"
                style={{ backgroundColor: destinationPlanet.color }}
              />
            </div>
            <div>
              <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest">
                INTERPLANETARY WARP VECTOR ENGAGED
              </div>
              <h3 className="text-xl sm:text-2xl font-['Space_Grotesk'] font-extrabold text-white mt-1">
                EN ROUTE: {destinationPlanet.name.toUpperCase()}
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-1">
                APPROACHING {destinationPlanet.name.toUpperCase()} ORBIT · {destinationPlanet.au.toFixed(2)} AU
              </p>
            </div>
          </div>
        ) : (
          renderContent()
        )}
      </div>

      {/* Console Footer Status */}
      <div className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-black/75 backdrop-blur-md border-t border-white/10 flex items-center justify-between text-[11px] sm:text-xs font-mono text-slate-400 shrink-0 relative z-10">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <span className="truncate">IMMERSIVE PLANET TELEMETRY SYNCHRONIZED</span>
        </div>
        <button
          onClick={onReturnToSolar}
          className="text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1 font-bold shrink-0 ml-2"
        >
          <span>SOL ORIGIN</span> &gt;
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-between pointer-events-none select-none">
      {/* ============================================================ */}
      {/* DIRECT MINIMAL PREVIOUS / NEXT PLANET NAVIGATION SYSTEM      */}
      {/* ============================================================ */}

      {/* LEFT EDGE: PREVIOUS PLANET (Accessible on Desktop HUD) */}
      <div className="hidden sm:flex fixed sm:left-5 top-1/2 -translate-y-1/2 z-50 pointer-events-auto select-none">
        <button
          onClick={() => onNavigatePlanet(-1)}
          disabled={isTransitioning}
          className={`group relative flex items-center gap-2 p-2 sm:p-2.5 rounded-2xl cosmic-glass border border-white/15 hover:border-cyan-400/60 hover:bg-cyan-500/15 shadow-[0_8px_30px_rgba(0,0,0,0.85)] transition-all duration-300 min-w-[48px] min-h-[56px] sm:min-w-[54px] sm:min-h-[64px] justify-center ${
            isTransitioning
              ? 'opacity-40 cursor-not-allowed pointer-events-none'
              : 'hover:scale-105 active:scale-95'
          }`}
          aria-label={`Previous Planet: ${prevPlanet.name}`}
          title={`Previous Planet: ${prevPlanet.name} (${prevPlanet.badge})`}
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300 group-hover:text-cyan-300 group-hover:-translate-x-1 transition-all" />

          {/* Contextual destination label revealed on desktop hover */}
          <div className="hidden sm:flex flex-col items-start max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out whitespace-nowrap pl-0 group-hover:pl-1">
            <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
              ← PREV
            </span>
            <span className="text-xs font-['Space_Grotesk'] font-bold text-white tracking-wide">
              {prevPlanet.name.toUpperCase()}
            </span>
          </div>
        </button>
      </div>

      {/* RIGHT EDGE: NEXT PLANET (Accessible on Desktop HUD) */}
      <div className="hidden sm:flex fixed sm:right-5 top-1/2 -translate-y-1/2 z-50 pointer-events-auto select-none">
        <button
          onClick={() => onNavigatePlanet(1)}
          disabled={isTransitioning}
          className={`group relative flex items-center gap-2 p-2 sm:p-2.5 rounded-2xl cosmic-glass border border-white/15 hover:border-cyan-400/60 hover:bg-cyan-500/15 shadow-[0_8px_30px_rgba(0,0,0,0.85)] transition-all duration-300 min-w-[48px] min-h-[56px] sm:min-w-[54px] sm:min-h-[64px] justify-center ${
            isTransitioning
              ? 'opacity-40 cursor-not-allowed pointer-events-none'
              : 'hover:scale-105 active:scale-95'
          }`}
          aria-label={`Next Planet: ${nextPlanet.name}`}
          title={`Next Planet: ${nextPlanet.name} (${nextPlanet.badge})`}
        >
          {/* Contextual destination label revealed on desktop hover */}
          <div className="hidden sm:flex flex-col items-end max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out whitespace-nowrap pr-0 group-hover:pr-1">
            <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
              NEXT →
            </span>
            <span className="text-xs font-['Space_Grotesk'] font-bold text-white tracking-wide">
              {nextPlanet.name.toUpperCase()}
            </span>
          </div>

          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      {/* Top Action Bar: Back to Solar System & Current Planet Indicator */}
      <div className="p-2.5 sm:px-8 sm:py-5 pointer-events-auto flex items-center justify-between gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onReturnToSolar}
          disabled={isTransitioning}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full cosmic-glass hover:bg-amber-400/20 text-amber-300 border border-amber-400/50 transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-mono font-bold shadow-[0_0_20px_rgba(255,176,32,0.35)] hover:scale-105 active:scale-95 group shrink-0 ${
            isTransitioning ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
          }`}
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          <span className="hidden sm:inline">RETURN TO SOLAR SYSTEM</span>
          <span className="sm:hidden">SOLAR SYSTEM</span>
        </button>

        {/* Current Planet Indicator: e.g. "EARTH • 03 / 09" (No Mobile Arrow Buttons) */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full cosmic-glass border border-cyan-400/30 font-mono text-[11px] sm:text-xs text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
          <span
            className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full animate-pulse shrink-0"
            style={{ backgroundColor: planet.color, boxShadow: `0 0 8px ${planet.color}` }}
          />
          <span className="font-bold text-white tracking-wide truncate max-w-[90px] sm:max-w-none">
            {planet.name.toUpperCase()}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-300 font-bold shrink-0">
            0{currentIndex} / 0{totalPlanets}
          </span>
        </div>
      </div>

      {/* Subtle First-Time Mobile Swipe Interaction Hint */}
      {isMobile && showSwipeHint && !isTransitioning && (
        <div className="fixed top-[13.5vh] left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in zoom-in-95 duration-300">
          <div className="px-3.5 py-1 rounded-full cosmic-glass border border-cyan-400/40 text-[10px] font-mono text-cyan-300 tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.25)]">
            <span>← SWIPE TO TRAVERSE →</span>
          </div>
        </div>
      )}

      {/* Upper Open Planet Hero Gesture Surface on Mobile */}
      {isMobile && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
          className="fixed inset-x-0 top-14 h-[18vh] z-20 pointer-events-auto touch-pan-y"
          aria-hidden="true"
        />
      )}

      {/* ============================================================ */}
      {/* CONDITIONAL DOSSIER LAYOUT ENGINE: MOBILE VS DESKTOP         */}
      {/* Mobile: Dedicated fixed/absolute full-screen overlay dossier */}
      {/* Desktop: Side-by-side 2-zone flex composition                */}
      {/* ============================================================ */}
      {isMobile ? (
        /* MOBILE VIEWPORT: CINEMATIC PLANET HERO ZONE + FLOATING DOSSIER */
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
          className="fixed inset-x-2.5 sm:inset-x-4 bottom-2.5 top-[19vh] sm:top-[22vh] z-30 pointer-events-auto overflow-hidden flex flex-col min-h-0 touch-pan-y"
        >
          {renderDossierConsole(true)}
        </div>
      ) : (
        /* DESKTOP VIEWPORT: SIDE-BY-SIDE 2-ZONE COMPOSITION */
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 pb-6 flex flex-row items-stretch justify-between gap-8 pointer-events-none overflow-hidden min-h-0">
          {/* Left Zone: Planet Environmental Telemetry Station */}
          <div className="flex flex-col justify-end w-[42%] pb-2 pointer-events-none">
            <div className="space-y-2.5 bg-black/45 backdrop-blur-xl p-4 rounded-2xl border border-white/10 w-fit max-w-sm shadow-[0_15px_35px_rgba(0,0,0,0.7)] animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full animate-pulse"
                  style={{ backgroundColor: planet.color, boxShadow: `0 0 10px ${planet.color}` }}
                />
                <span className="font-mono text-[11px] text-cyan-300 font-bold tracking-wider uppercase">
                  {planet.name} // ORBITAL STATION
                </span>
              </div>

              <div>
                <h2 className="text-xl font-['Space_Grotesk'] font-extrabold text-white leading-tight">
                  {planet.name}
                </h2>
                <p className="text-[11px] font-mono mt-0.5" style={{ color: planet.color }}>
                  {planet.role}
                </p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                {planet.summary}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 font-mono text-[10px] text-slate-400">
                <span>ORBIT DISTANCE: {planet.au.toFixed(2)} AU</span>
                <span className="text-emerald-400 font-semibold">TERMINATOR: ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Right Zone: Side-by-side Dossier Console (Occupies Right 50-55%) */}
          <div className="w-[54%] xl:w-[50%] ml-auto max-h-[calc(100vh-130px)] h-full flex-1 pointer-events-auto overflow-hidden flex flex-col min-h-0">
            {renderDossierConsole(false)}
          </div>
        </div>
      )}
    </div>
  );
};

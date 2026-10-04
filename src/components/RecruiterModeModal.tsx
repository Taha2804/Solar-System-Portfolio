import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  X,
  User,
  Shield,
  Briefcase,
  FolderGit2,
  Award,
  GraduationCap,
  Trophy,
  FileText,
  Mail,
  Github,
  Linkedin,
  ExternalLink,
  Download,
  Copy,
  Check,
  ChevronRight,
  Cpu,
  Phone,
} from 'lucide-react';
import {
  PERSONAL_INFO,
  SKILL_CATEGORIES,
  CERTIFICATIONS,
  WORK_EXPERIENCE,
  PROJECTS,
  RESEARCH,
  EDUCATION,
  ACHIEVEMENTS,
} from '../data/portfolioData';

interface RecruiterModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToPlanet: (planetId: number) => void;
  onReturnToHome?: () => void;
}

type RecruiterTab =
  | 'overview'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'certifications'
  | 'education'
  | 'achievements'
  | 'resume'
  | 'contact';

export const RecruiterModeModal: React.FC<RecruiterModeModalProps> = ({
  isOpen,
  onClose,
  onJumpToPlanet,
  onReturnToHome,
}) => {
  const [activeTab, setActiveTab] = useState<RecruiterTab>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  const contentScrollRef = useRef<HTMLElement>(null);
  const navScrollRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  // Mouse drag scrolling state for nav bar
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const hasDragged = useRef(false);

  // Check scroll boundary state for subtle edge indicators
  const checkScrollability = useCallback(() => {
    if (navScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navScrollRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  }, []);

  // Reset internal content scroll position immediately upon switching sections
  useLayoutEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0;
      contentScrollRef.current.scrollTo({
        top: 0,
        behavior: 'instant' as ScrollBehavior,
      });
    }
    const frameId = requestAnimationFrame(() => {
      if (contentScrollRef.current) {
        contentScrollRef.current.scrollTop = 0;
      }
    });
    return () => cancelAnimationFrame(frameId);
  }, [activeTab]);

  // Auto-center active section in the horizontal navigation strip
  useEffect(() => {
    if (activeItemRef.current && navScrollRef.current) {
      const container = navScrollRef.current;
      const item = activeItemRef.current;
      const itemLeft = item.offsetLeft;
      const itemWidth = item.offsetWidth;
      const containerWidth = container.offsetWidth;
      container.scrollTo({
        left: itemLeft - containerWidth / 2 + itemWidth / 2,
        behavior: 'smooth',
      });
      const timer = setTimeout(() => {
        checkScrollability();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [activeTab, checkScrollability]);

  // Monitor layout & scroll state for edge fades
  useEffect(() => {
    if (!isOpen) return;

    checkScrollability();
    const frame = requestAnimationFrame(checkScrollability);
    const timer = setTimeout(checkScrollability, 120);

    const navEl = navScrollRef.current;
    if (navEl) {
      navEl.addEventListener('scroll', checkScrollability, { passive: true });
    }
    window.addEventListener('resize', checkScrollability);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      if (navEl) {
        navEl.removeEventListener('scroll', checkScrollability);
      }
      window.removeEventListener('resize', checkScrollability);
    };
  }, [isOpen, checkScrollability]);

  // Global mouse up release for drag scrolling
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (navScrollRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        navScrollRef.current.scrollLeft += e.deltaY;
      } else if (e.deltaX !== 0) {
        navScrollRef.current.scrollLeft += e.deltaX;
      }
      checkScrollability();
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!navScrollRef.current) return;
    setIsDragging(true);
    hasDragged.current = false;
    setStartX(e.pageX - navScrollRef.current.offsetLeft);
    setScrollLeftState(navScrollRef.current.scrollLeft);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !navScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - navScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) {
      hasDragged.current = true;
    }
    navScrollRef.current.scrollLeft = scrollLeftState - walk;
    checkScrollability();
  };

  const onMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const navItems: { id: RecruiterTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: 'About & Overview', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'skills', label: 'Skills & Arsenal', icon: <Shield className="w-3.5 h-3.5" />, badge: 'CEH' },
    { id: 'experience', label: 'Work Experience', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: 'projects', label: 'Key Projects', icon: <FolderGit2 className="w-3.5 h-3.5" />, badge: '4' },
    { id: 'certifications', label: 'Certifications', icon: <Award className="w-3.5 h-3.5" />, badge: '3' },
    { id: 'education', label: 'Education & AI', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'achievements', label: 'Achievements', icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: 'resume', label: 'Resume / CV', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'contact', label: 'Contact', icon: <Mail className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-3 md:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Mission Control Recruiter Dossier"
    >
      {/* 
        FIXED-DIMENSION RECRUITER WORKSPACE:
        Outer window dimensions remain constant across every tab to ensure visual stability.
      */}
      <div className="relative w-full max-w-6xl h-[96vh] md:h-[92vh] max-h-[860px] min-h-[500px] flex flex-col rounded-2xl sm:rounded-3xl bg-[#030712]/95 border border-cyan-400/40 shadow-[0_20px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(0,229,255,0.2)] overflow-hidden">
        
        {/* ============================================================ */}
        {/* ROW 1: RECRUITER HEADER (Identity + Controls ONLY)           */}
        {/* ============================================================ */}
        <div className="shrink-0 flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-white/10 bg-black/85">
          <div className="flex items-start sm:items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-400/15 border border-amber-400/40 text-amber-300 shrink-0 mt-0.5 sm:mt-0">
              <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-['Space_Grotesk'] text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                  MISSION CONTROL //
                </span>
                <span className="hidden sm:inline font-['Space_Grotesk'] text-xs sm:text-sm font-bold text-slate-300 tracking-wide">
                  RECRUITER DOSSIER
                </span>
                <span className="hidden lg:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold shrink-0">
                  CANDIDATE DOSSIER
                </span>
              </div>
              <div className="sm:hidden text-[10px] font-mono font-bold text-amber-400 tracking-wider">
                RECRUITER DOSSIER
              </div>
              <p className="text-[11px] sm:text-xs font-mono text-slate-300 truncate mt-0.5">
                <span className="text-white font-bold">{PERSONAL_INFO.name}</span>
                <span className="hidden md:inline text-slate-500 mx-1.5">·</span>
                <span className="hidden md:inline text-cyan-300">{PERSONAL_INFO.primaryRole}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
            {onReturnToHome && (
              <button
                onClick={onReturnToHome}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 text-xs font-mono font-bold flex items-center gap-1 transition-all active:scale-95"
                title="Return to HELIOS-1 Landing Selection"
              >
                <span className="hidden md:inline">HELIOS-1 // </span>
                <span>HOME</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/40 text-xs font-mono font-bold flex items-center gap-1 transition-all active:scale-95 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
              title="Close Recruiter Mode (ESC)"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden md:inline">EXIT RECRUITER MODE</span>
              <span className="md:hidden">EXIT</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ROW 2: MOBILE HORIZONTAL SECTION NAVIGATION (md:hidden)      */}
        {/* ============================================================ */}
        <nav
          aria-label="Mobile sections navigation"
          className="md:hidden shrink-0 h-11 bg-black/60 border-b border-white/10 relative flex items-center overflow-hidden select-none"
        >
          {/* Subtle Left Overflow Gradient Fade (No Button) */}
          <div
            className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#030712] via-[#030712]/80 to-transparent z-20 transition-opacity duration-200 ${
              canScrollLeft ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
          />

          {/* Draggable, Wheel & Touch-Scrollable Navigation Track */}
          <div
            ref={navScrollRef}
            onWheel={handleWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUpOrLeave}
            onMouseLeave={onMouseUpOrLeave}
            className={`w-full h-full flex items-center gap-1.5 px-3 overflow-x-auto no-scrollbar scroll-smooth ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  ref={isActive ? activeItemRef : null}
                  onClick={() => {
                    if (hasDragged.current) return;
                    setActiveTab(item.id);
                  }}
                  className={`relative h-7 px-2.5 rounded-lg font-mono text-[11px] flex items-center gap-1.5 whitespace-nowrap transition-colors shrink-0 ${
                    isActive
                      ? 'text-cyan-200 font-bold'
                      : 'text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="recruiterMobileActiveTab"
                      className="absolute inset-0 rounded-lg bg-cyan-500/25 border border-cyan-400/60 shadow-[0_0_12px_rgba(0,229,255,0.3)] pointer-events-none z-0"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className={`relative z-10 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {item.icon}
                  </span>
                  <span className="relative z-10">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`relative z-10 ml-0.5 px-1 py-0.2 rounded text-[8px] font-bold ${
                        isActive ? 'bg-cyan-400 text-black' : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Subtle Right Overflow Gradient Fade (No Button) */}
          <div
            className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#030712] via-[#030712]/80 to-transparent z-20 transition-opacity duration-200 ${
              canScrollRight ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
          />
        </nav>

        {/* ============================================================ */}
        {/* MAIN BODY: Desktop Sidebar + Primary Content Viewport       */}
        {/* ============================================================ */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          
          {/* Desktop Left Navigation Sidebar (Compact 220px) */}
          <aside className="hidden md:flex w-52 lg:w-56 border-r border-white/10 bg-black/40 p-2.5 flex-col gap-1 shrink-0 overflow-y-auto">
            <div className="px-2 py-1 text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">
              PORTFOLIO SECTIONS
            </div>

            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative w-full text-left px-2.5 py-2 rounded-lg font-mono text-xs flex items-center justify-between transition-colors ${
                    isActive
                      ? 'text-cyan-200 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="recruiterDesktopActiveTab"
                      className="absolute inset-0 rounded-lg bg-cyan-500/20 border border-cyan-400/60 shadow-[0_0_12px_rgba(0,229,255,0.25)] pointer-events-none z-0"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-2 min-w-0">
                    <span className={isActive ? 'text-cyan-400 shrink-0' : 'text-slate-500 shrink-0'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`relative z-10 ml-1 px-1.5 py-0.2 rounded text-[8px] font-bold shrink-0 ${
                        isActive
                          ? 'bg-cyan-400 text-black font-extrabold shadow-[0_0_8px_rgba(0,229,255,0.4)]'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="mt-auto pt-2 border-t border-white/10 text-[9px] font-mono text-slate-500 px-2 space-y-0.5">
              <div>HOTKEYS: [ESC] Exit · [R] Toggle</div>
            </div>
          </aside>

          {/* Right Primary Content Viewport */}
          <main
            ref={contentScrollRef}
            className="flex-1 min-h-0 h-full overflow-y-auto p-3 sm:p-5 lg:p-6 text-slate-200 font-sans pb-16 sm:pb-12"
          >
            <div key={activeTab} className="space-y-3 sm:space-y-4 animate-in fade-in duration-150">
              
              {/* 1. OVERVIEW / EXECUTIVE SUMMARY */}
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  {/* Compact Executive Summary Card (no duplicate identity text) */}
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-mono text-[10px] uppercase tracking-wider font-bold">
                        // CANDIDATE PROFILE &amp; CORE PROPOSITION
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        AVAILABLE FOR IMMEDIATE HIRE
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      Certified in Ethical Hacking (CEH), Forensics (CHFI), and Cisco Networking (CCNA). Combines enterprise infrastructure support experience (Olympus Computers, 100+ endpoint fleet with 99% SLA) with offensive penetration testing, threat hunting, and full-stack engineering with Python and React. Co-author of published deepfake image detection research using custom CNNs (84% validation accuracy).
                    </p>
                  </div>

                  {/* High-Impact Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] text-slate-400">CREDENTIALS</div>
                      <div className="text-lg font-bold text-amber-400 mt-0.5">3x Certified</div>
                      <div className="text-[11px] text-slate-300">CEH · CHFI · CCNA</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] text-slate-400">ENTERPRISE SUPPORT</div>
                      <div className="text-lg font-bold text-cyan-400 mt-0.5">100+ Workstations</div>
                      <div className="text-[11px] text-slate-300">Olympus Computers · 99% SLA</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] text-slate-400">AI / RESEARCH</div>
                      <div className="text-lg font-bold text-emerald-400 mt-0.5">84% Accuracy</div>
                      <div className="text-[11px] text-slate-300">Deepfake Detection CNN</div>
                    </div>
                  </div>

                  {/* Core Focus Matrix */}
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                      PRIMARY ENGINEERING DOMAINS
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-amber-300 font-bold block">Cybersecurity &amp; PenTest</span>
                        <span className="text-[11px] text-slate-400">Metasploit, Nmap, Wireshark, Burp, Kali</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-cyan-300 font-bold block">Networking &amp; Infrastructure</span>
                        <span className="text-[11px] text-slate-400">CCNA, TCP/IP, Routing, Switching, Sockets</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-emerald-300 font-bold block">Software &amp; Web Systems</span>
                        <span className="text-[11px] text-slate-400">Python, React, TypeScript, Node, REST, JWT</span>
                      </div>
                    </div>
                  </div>

                  {/* 3D Exploration Quick Bridges */}
                  <div>
                    <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                      DIRECT JUMP TO 3D PLANET STATIONS
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                      <button
                        onClick={() => {
                          onClose();
                          onJumpToPlanet(1);
                        }}
                        className="p-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-400/30 text-left transition-all flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-orange-300 font-bold">MERCURY // SKILLS</div>
                          <div className="text-[10px] text-slate-400">Technical Arsenal</div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-orange-400 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => {
                          onClose();
                          onJumpToPlanet(2);
                        }}
                        className="p-2.5 rounded-xl bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-400/30 text-left transition-all flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-fuchsia-300 font-bold">VENUS // CERTS</div>
                          <div className="text-[10px] text-slate-400">Credentials Registry</div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-fuchsia-400 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => {
                          onClose();
                          onJumpToPlanet(4);
                        }}
                        className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 text-left transition-all flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-red-300 font-bold">MARS // PROJECTS</div>
                          <div className="text-[10px] text-slate-400">Defense &amp; Code</div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-red-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. SKILLS */}
              {activeTab === 'skills' && (
                <div className="space-y-3.5">
                  <div className="border-b border-white/10 pb-2 flex items-center justify-between">
                    <div>
                      <span className="text-cyan-400 font-mono text-[10px] uppercase tracking-wider block font-bold">
                        // TECHNICAL COMPETENCY MATRIX
                      </span>
                      <h3 className="text-base sm:text-lg font-['Space_Grotesk'] font-bold text-white">
                        Skills &amp; Arsenal
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-slate-400">
                      {SKILL_CATEGORIES.length} Categories · 40+ Tools
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {SKILL_CATEGORIES.map((cat, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-2 hover:border-cyan-400/40 transition-colors"
                      >
                        <div>
                          <div className="flex items-center justify-between font-mono text-xs mb-1">
                            <span className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: cat.accentColor }}
                              />
                              {cat.title}
                            </span>
                            <span className="font-bold text-[11px]" style={{ color: cat.accentColor }}>
                              {cat.percentage}%
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                            {cat.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1 pt-1.5 border-t border-white/5 font-mono text-[10px]">
                          {cat.skills.map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-slate-300"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. EXPERIENCE */}
              {activeTab === 'experience' && (
                <div className="space-y-3.5">
                  <div className="border-b border-white/10 pb-2">
                    <span className="text-emerald-400 font-mono text-[10px] uppercase tracking-wider block font-bold">
                      // PROFESSIONAL OPERATIONS &amp; HISTORY
                    </span>
                    <h3 className="text-base sm:text-lg font-['Space_Grotesk'] font-bold text-white">
                      Work Experience
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {WORK_EXPERIENCE.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 border-l-4 border-l-emerald-400"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-white">{exp.title}</h4>
                            <div className="text-xs font-mono text-emerald-400">
                              {exp.company} · {exp.location}
                            </div>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-mono text-xs w-fit">
                            {exp.period}
                          </span>
                        </div>

                        {/* Measurable impact metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
                          {exp.metrics.map((m, mIdx) => (
                            <div
                              key={mIdx}
                              className="px-2 py-1.5 rounded-lg bg-black/50 border border-white/5 text-slate-300 text-xs"
                            >
                              <span className="text-emerald-300 font-bold block">{m.split(' ')[0]}</span>
                              <span className="text-[10px] text-slate-400">{m.split(' ').slice(1).join(' ')}</span>
                            </div>
                          ))}
                        </div>

                        {/* Bullet Highlights */}
                        <ul className="space-y-1 text-xs text-slate-300">
                          {exp.highlights.map((h, hIdx) => (
                            <li key={hIdx} className="flex items-start gap-1.5 leading-relaxed">
                              <span className="text-emerald-400 font-bold mt-0.5">▹</span>
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Tech tags */}
                        <div className="flex flex-wrap gap-1 pt-1 font-mono text-[10px]">
                          {exp.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-emerald-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. PROJECTS */}
              {activeTab === 'projects' && (
                <div className="space-y-3.5">
                  <div className="border-b border-white/10 pb-2">
                    <span className="text-red-400 font-mono text-[10px] uppercase tracking-wider block font-bold">
                      // DEPLOYED CODEBASES &amp; SYSTEMS
                    </span>
                    <h3 className="text-base sm:text-lg font-['Space_Grotesk'] font-bold text-white">
                      Featured Engineering Projects
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PROJECTS.map((proj) => (
                      <div
                        key={proj.id}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-3 hover:border-red-400/40 transition-colors"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="px-2 py-0.2 rounded bg-red-500/15 border border-red-400/30 text-red-300 font-bold">
                              {proj.category}
                            </span>
                            <span className="text-slate-400">{proj.period}</span>
                          </div>

                          <h4 className="text-sm sm:text-base font-bold text-white">{proj.title}</h4>
                          <p className="text-xs text-slate-300 leading-snug">{proj.subtitle}</p>

                          <ul className="space-y-1 text-xs text-slate-300 pt-1">
                            {proj.highlights.slice(0, 2).map((h, hIdx) => (
                              <li key={hIdx} className="flex items-start gap-1.5">
                                <span className="text-red-400 font-bold">•</span>
                                <span className="line-clamp-2 leading-relaxed">{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-2 border-t border-white/10 flex flex-wrap gap-1 font-mono text-[10px]">
                          {proj.techStack.map((tech, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-cyan-300"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. CERTIFICATIONS */}
              {activeTab === 'certifications' && (
                <div className="space-y-3.5">
                  <div className="border-b border-white/10 pb-2">
                    <span className="text-purple-400 font-mono text-[10px] uppercase tracking-wider block font-bold">
                      // CREDENTIAL RECORD &amp; ACCREDITATIONS
                    </span>
                    <h3 className="text-base sm:text-lg font-['Space_Grotesk'] font-bold text-white">
                      Verified Industry Certifications
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {CERTIFICATIONS.map((cert) => (
                      <div
                        key={cert.id}
                        className="p-4 rounded-xl bg-white/5 border border-purple-400/30 space-y-2.5 flex flex-col justify-between hover:border-purple-400/60 transition-colors"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                              {cert.status}
                            </span>
                            <span className="text-slate-400">{cert.year}</span>
                          </div>

                          <h4 className="text-sm font-bold text-white">{cert.title}</h4>
                          <div className="text-xs font-mono text-purple-300">{cert.issuer}</div>
                          <p className="text-xs text-slate-300 leading-relaxed">{cert.description}</p>
                        </div>

                        <div className="pt-2 border-t border-white/10 space-y-1.5 font-mono text-[10px]">
                          <div className="text-slate-400">
                            ID: <span className="text-white font-bold">{cert.credentialId || 'VERIFIED'}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {cert.coreCompetencies.map((comp, cIdx) => (
                              <span
                                key={cIdx}
                                className="px-1.5 py-0.5 rounded bg-black/60 text-slate-300 border border-white/5"
                              >
                                {comp}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. EDUCATION & RESEARCH */}
              {activeTab === 'education' && (
                <div className="space-y-3.5">
                  <div className="border-b border-white/10 pb-2">
                    <span className="text-sky-400 font-mono text-[10px] uppercase tracking-wider block font-bold">
                      // ACADEMIC FOUNDATION &amp; APPLIED RESEARCH
                    </span>
                    <h3 className="text-base sm:text-lg font-['Space_Grotesk'] font-bold text-white">
                      Education &amp; AI Research
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Academic Degrees */}
                    <div className="space-y-2.5">
                      {EDUCATION.map((edu, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-sky-400 font-bold uppercase">
                              {idx === 0 ? 'POSTGRADUATE' : 'UNDERGRADUATE DEGREE'}
                            </span>
                            <span className="px-2 py-0.2 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-mono font-bold">
                              {edu.grade}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{edu.degree}</h4>
                          <div className="text-xs font-mono text-slate-400">
                            {edu.institution} · {edu.period}
                          </div>
                          <p className="text-xs text-slate-300 leading-snug">{edu.details}</p>
                        </div>
                      ))}
                    </div>

                    {/* Applied Research Card */}
                    <div className="p-4 rounded-xl bg-white/5 border border-cyan-400/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold">
                          PUBLISHED AI RESEARCH
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {RESEARCH.accuracy} Accuracy
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{RESEARCH.title}</h4>
                      <div className="text-xs font-mono text-cyan-400">
                        {RESEARCH.role} · Hardware: {RESEARCH.hardware}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{RESEARCH.description}</p>
                      <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside pt-1">
                        {RESEARCH.keyContributions.map((c, cIdx) => (
                          <li key={cIdx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. ACHIEVEMENTS */}
              {activeTab === 'achievements' && (
                <div className="space-y-3.5">
                  <div className="border-b border-white/10 pb-2">
                    <span className="text-amber-400 font-mono text-[10px] uppercase tracking-wider block font-bold">
                      // HONORS, METRICS &amp; LAB MILESTONES
                    </span>
                    <h3 className="text-base sm:text-lg font-['Space_Grotesk'] font-bold text-white">
                      Achievements &amp; Metrics
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2.5">
                    {ACHIEVEMENTS.map((ach, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span
                              className="text-[10px] font-bold uppercase"
                              style={{ color: ach.color }}
                            >
                              {ach.tag}
                            </span>
                            <span className="font-bold text-cyan-300">{ach.metric}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-0.5">{ach.title}</h4>
                          <p className="text-xs text-slate-300 leading-snug pt-0.5">{ach.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. RESUME / CV */}
              {activeTab === 'resume' && (
                <div className="space-y-3.5">
                  <div className="border-b border-white/10 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-emerald-400 font-mono text-[10px] uppercase tracking-wider block font-bold">
                        // CURRICULUM VITAE PROFILE
                      </span>
                      <h3 className="text-base sm:text-lg font-['Space_Grotesk'] font-bold text-white">
                        Resume // Taha Badami
                      </h3>
                    </div>

                    <a
                      href="mailto:badamitaha2804@gmail.com?subject=Taha%20Badami%20Resume%20Request"
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] shrink-0 w-fit"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>REQUEST VERIFIED PDF COPY</span>
                    </a>
                  </div>

                  {/* Clean Structured Resume Preview */}
                  <div className="p-4 sm:p-5 rounded-xl bg-black/60 border border-white/15 space-y-4 font-mono text-xs text-slate-300">
                    <div className="border-b border-white/10 pb-3">
                      <div className="text-sm font-bold text-white">{PERSONAL_INFO.name}</div>
                      <div className="text-cyan-400 text-xs mt-0.5">{PERSONAL_INFO.primaryRole}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {PERSONAL_INFO.email} · {PERSONAL_INFO.phone} · {PERSONAL_INFO.location}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-amber-400 font-bold uppercase text-[10px]">
                        [01] PROFESSIONAL SUMMARY
                      </div>
                      <p className="text-slate-300 leading-relaxed font-sans text-xs">
                        {PERSONAL_INFO.bio}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="text-amber-400 font-bold uppercase text-[10px]">
                        [02] ACCREDITED CERTIFICATIONS
                      </div>
                      <div className="space-y-1 text-slate-200">
                        {CERTIFICATIONS.map((c) => (
                          <div key={c.id} className="flex justify-between text-[11px]">
                            <span>• <strong>{c.title}</strong> — {c.issuer}</span>
                            <span className="text-slate-400">{c.year}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-amber-400 font-bold uppercase text-[10px]">
                        [03] WORK EXPERIENCE
                      </div>
                      <div className="space-y-2">
                        {WORK_EXPERIENCE.map((exp) => (
                          <div key={exp.id} className="space-y-0.5">
                            <div className="flex justify-between font-bold text-white text-[11px]">
                              <span>{exp.title} — {exp.company}</span>
                              <span className="text-slate-400 font-normal">{exp.period}</span>
                            </div>
                            <ul className="list-disc list-inside text-slate-300 space-y-0.5 pl-1 font-sans text-xs">
                              {exp.highlights.slice(0, 3).map((h, i) => (
                                <li key={i}>{h}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-amber-400 font-bold uppercase text-[10px]">
                        [04] ACADEMIC RECORD
                      </div>
                      <div className="space-y-1 text-slate-200 text-[11px]">
                        {EDUCATION.map((edu, idx) => (
                          <div key={idx}>
                            <strong>{edu.degree}</strong> — {edu.institution} ({edu.period}) · {edu.grade}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 9. DIRECT CHANNELS & PROFESSIONAL CONTACT */}
              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <div className="border-b border-white/10 pb-2">
                    <span className="text-cyan-400 font-mono text-[10px] uppercase tracking-wider block font-bold">
                      // DIRECT COMMUNICATION &amp; VERIFIED CHANNELS
                    </span>
                    <h3 className="text-base sm:text-lg font-['Space_Grotesk'] font-bold text-white">
                      Professional Contact &amp; Channels
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* 1. Email Card */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5 flex flex-col justify-between hover:border-cyan-400/40 transition-colors">
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-cyan-400" />
                          <span>DIRECT EMAIL DISPATCH</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          Primary inbox for interview scheduling, technical screening, and engineering discussions.
                        </p>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-white/10 text-xs font-mono">
                          <span className="text-cyan-300 font-bold truncate">{PERSONAL_INFO.email}</span>
                          <button
                            onClick={() => handleCopy(PERSONAL_INFO.email, 'email')}
                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 transition-colors flex items-center gap-1 shrink-0 ml-1 text-[10px]"
                          >
                            {copiedKey === 'email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === 'email' ? 'COPIED' : 'COPY'}</span>
                          </button>
                        </div>
                      </div>
                      <a
                        href={`mailto:${PERSONAL_INFO.email}?subject=Interview%20Opportunity%20-%20Taha%20Badami`}
                        className="w-full py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all block text-center"
                      >
                        OPEN IN EMAIL CLIENT
                      </a>
                    </div>

                    {/* 2. Phone Card */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5 flex flex-col justify-between hover:border-amber-400/40 transition-colors">
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-amber-400" />
                          <span>TELEPHONE &amp; VOICE</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          Direct phone contact for screening calls, technical rounds, and rapid coordination.
                        </p>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-white/10 text-xs font-mono">
                          <span className="text-amber-300 font-bold">{PERSONAL_INFO.phone}</span>
                          <button
                            onClick={() => handleCopy(PERSONAL_INFO.phone, 'phone')}
                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 transition-colors flex items-center gap-1 shrink-0 ml-1 text-[10px]"
                          >
                            {copiedKey === 'phone' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === 'phone' ? 'COPIED' : 'COPY'}</span>
                          </button>
                        </div>
                      </div>
                      <a
                        href={`tel:${PERSONAL_INFO.phone}`}
                        className="w-full py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/40 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all block text-center"
                      >
                        CALL DIRECTLY
                      </a>
                    </div>

                    {/* 3. GitHub Card */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5 flex flex-col justify-between hover:border-white/40 transition-colors">
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                          <Github className="w-3.5 h-3.5 text-white" />
                          <span>GITHUB REPOSITORY</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          Source code, penetration testing utilities, security scanners, and full-stack architectures.
                        </p>
                        <div className="p-2 rounded-lg bg-black/60 border border-white/10 text-xs font-mono text-slate-300 truncate">
                          @{PERSONAL_INFO.githubHandle}
                        </div>
                      </div>
                      <a
                        href={PERSONAL_INFO.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                      >
                        <span>OPEN GITHUB PROFILE</span>
                        <ExternalLink className="w-3 h-3 text-slate-300" />
                      </a>
                    </div>

                    {/* 4. LinkedIn Card */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5 flex flex-col justify-between hover:border-blue-400/40 transition-colors">
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                          <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                          <span>LINKEDIN NETWORK</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          Professional background, peer endorsements, industry certifications, and recommendations.
                        </p>
                        <div className="p-2 rounded-lg bg-black/60 border border-white/10 text-xs font-mono text-blue-300 truncate">
                          /{PERSONAL_INFO.linkedinHandle}
                        </div>
                      </div>
                      <a
                        href={PERSONAL_INFO.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/40 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                      >
                        <span>CONNECT ON LINKEDIN</span>
                        <ExternalLink className="w-3 h-3 text-blue-300" />
                      </a>
                    </div>

                    {/* 5. Resume / CV Card */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5 flex flex-col justify-between hover:border-emerald-400/40 transition-colors">
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-emerald-400" />
                          <span>RESUME / CV DOCUMENT</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          Verified candidate dossier covering CEH, CHFI, CCNA, and Olympus Computers 99% SLA support.
                        </p>
                        <div className="flex gap-2 text-xs font-mono">
                          <button
                            onClick={() => setActiveTab('resume')}
                            className="flex-1 py-1 px-2 rounded bg-black/60 border border-white/10 text-emerald-300 hover:text-emerald-200 text-[11px] font-bold"
                          >
                            VIEW RESUME SECTION
                          </button>
                        </div>
                      </div>
                      <a
                        href={`mailto:${PERSONAL_INFO.email}?subject=Taha%20Badami%20Resume%20Request`}
                        className="w-full py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                      >
                        <Download className="w-3 h-3" />
                        <span>REQUEST VERIFIED PDF</span>
                      </a>
                    </div>

                    {/* 6. Base Location & Availability */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-400" />
                          <span>BASE LOCATION &amp; STATUS</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          Current residence base with full flexibility for on-site, hybrid, remote, or relocation.
                        </p>
                        <div className="p-2 rounded-lg bg-black/60 border border-white/10 text-xs font-mono text-slate-200">
                          BASE: <strong className="text-white">{PERSONAL_INFO.location}</strong>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span>AVAILABLE FOR IMMEDIATE HIRE</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* ============================================================ */}
        {/* COMPACT FOOTER STATUS BAR (Height ~30px)                     */}
        {/* ============================================================ */}
        <div className="shrink-0 px-3 sm:px-5 py-1.5 bg-black/85 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">RECRUITER ACCESS NOMINAL</span>
          </div>

          <button
            onClick={onClose}
            className="text-amber-300 hover:text-amber-200 font-bold transition-colors flex items-center gap-1 shrink-0 ml-2"
          >
            <span className="hidden sm:inline">RETURN TO 3D SOLAR EXPLORATION</span>
            <span className="sm:hidden">RETURN TO 3D</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};


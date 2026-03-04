"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  ChevronRight,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lock,
  Scale,
  Users,
  Briefcase,
  Store,
  LayoutDashboard,
  MessageCircle,
  Plus,
  Info,
  Activity,
  Globe,
  Database,
  Search,
  Bell,
  Menu,
  X,
  FileText,
  CreditCard,
  Settings,
  MoreHorizontal,
  Code2,
  GitBranch,
  Terminal,
  Cpu,
  Github,
  Play,
  Copy,
  BookOpen,
  Bug
} from 'lucide-react';
import Link from 'next/link';

/**
 * HOOKS & UTILITIES
 */

// Typing Animation
const useTypewriter = (text: string, speed = 50, delay = 500) => {
  const [displayText, setDisplayText] = useState('');
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay, text]);

  useEffect(() => {
    if (!isStarted) return;
    if (displayText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(text.slice(0, displayText.length + 1));
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [displayText, text, speed, isStarted]);

  return displayText;
};

// Scroll Animation Hook
const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

/**
 * ANIMATION WRAPPER COMPONENT
 * Wraps content to fade in when scrolled into view
 */
const FadeIn = ({ children, delay = 0, className = '' }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/**
 * HIGH-VISIBILITY INTERACTIVE WAVES
 */
/**
 * PARTICLE CONSTELLATION ANIMATION
 */
const ParticleConstellation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const particles: { x: number, y: number, z: number, vx: number, vy: number, vz: number, size: number }[] = [];
    const particleCount = width < 768 ? 50 : 120; // Increased count for better 3D depth

    for (let i = 0; i < particleCount; i++) {
      // Z axis from 0.1 (far) to 2 (near)
      const z = Math.random() * 2 + 0.1;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: z,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        vz: (Math.random() - 0.5) * 0.02,
        size: Math.random() * 1.5 + 0.5
      });
    }

    let rafId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const dxMouse = (mouseX - width / 2) * 0.08;
      const dyMouse = (mouseY - height / 2) * 0.08;

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Bounce Z
        if (p.z < 0.1 || p.z > 2.5) p.vz *= -1;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Apply 3D perspective
        const scale = 1 / p.z;

        // Parallax shift based on Z depth and mouse position
        const px = p.x + dxMouse * p.z;
        const py = p.y + dyMouse * p.z;

        // Opacity based on Z (far away = more transparent)
        const opacity = Math.min(Math.max((2.5 - p.z) * 0.4, 0.1), 0.8);

        ctx.beginPath();
        ctx.fillStyle = `rgba(16, 185, 129, ${opacity})`;
        ctx.arc(px, py, p.size * scale, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];

          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dz = p.z - p2.z;
          // Scale Z distance to prioritize drawing connections on the same focal plane
          const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz * 50);

          if (dist3D < 120) {
            const scale2 = 1 / p2.z;
            const px2 = p2.x + dxMouse * p2.z;
            const py2 = p2.y + dyMouse * p2.z;

            const avgZ = (p.z + p2.z) / 2;
            const connOpacity = Math.max(0, 0.15 - dist3D / 800) * Math.min(1, 1.5 / avgZ);

            ctx.beginPath();
            ctx.strokeStyle = `rgba(16, 185, 129, ${connOpacity})`;
            ctx.lineWidth = 1 * ((scale + scale2) / 2);
            ctx.moveTo(px, py);
            ctx.lineTo(px2, py2);
            ctx.stroke();
          }
        }
      });
      rafId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-[#010101] pointer-events-none">
      <div className="absolute inset-0 opacity-[0.25] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60 pointer-events-auto" />
    </div>
  );
};

/**
 * PREMIUM GLASS CARD
 */
const PremiumCard = ({ children, className = '', highlight = false }: { children: React.ReactNode, className?: string, highlight?: boolean }) => {
  return (
    <div className={`
      relative group bg-[#0a0a0a]/85 backdrop-blur-3xl border border-white/[0.1] rounded-[2rem] p-8 
      transition-all duration-500 hover:border-emerald-500/50 hover:-translate-y-2 h-full
      ${highlight ? 'border-emerald-500/40 shadow-[0_0_60px_rgba(16,185,129,0.1)]' : ''}
      ${className}
    `}>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] duration-700" />
      <div className="relative z-10 flex flex-col h-full">
        {children}
      </div>
    </div>
  );
};

/**
 * FULL DASHBOARD SIMULATION — Browser-chrome Premium Frame
 */
const DashboardSimulation = () => (
  <div className="relative w-full z-20 group" style={{ perspective: '1400px' }}>
    {/* Ambient Glow behind the dashboard */}
    <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl rounded-full z-0 opacity-60" />

    {/* Browser Chrome Wrapper */}
    <div
      className="relative w-full rounded-2xl border border-white/10 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] transition-all duration-700 ease-out group-hover:scale-[1.02] group-hover:shadow-[0_40px_120px_-10px_rgba(16,185,129,0.25)] overflow-hidden z-10"
      style={{ transform: 'rotateX(12deg) scale(0.95)', transformOrigin: 'bottom center', transformStyle: 'preserve-3d' }}
    >
      {/* Browser Top Bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#111] border-b border-white/[0.08] shrink-0">
        {/* Traffic Lights */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>
        {/* URL Bar */}
        <div className="flex-1 max-w-xs mx-auto flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] rounded-md border border-white/[0.06] text-[11px] text-zinc-500 font-mono">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          app.escrowkit.xyz/dashboard
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Search size={12} className="text-zinc-600" />
          <Bell size={12} className="text-zinc-600" />
        </div>
      </div>

      {/* Dashboard App Content */}
      <div className="flex text-xs bg-[#0c0c0c]">
        {/* Sidebar */}
        <div className="w-52 bg-[#111]/90 border-r border-white/[0.05] p-4 flex flex-col gap-5 shrink-0">
          <div className="flex items-center gap-2 px-1">
            <div className="w-6 h-6 bg-emerald-500 rounded-md shrink-0" />
            <span className="font-bold text-white tracking-wider text-[11px] uppercase">EscrowKit</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg font-bold flex items-center gap-2.5">
              <LayoutDashboard size={13} /> Overview
            </div>
            <div className="px-3 py-2 text-zinc-500 flex items-center gap-2.5">
              <FileText size={13} /> Contracts
            </div>
            <div className="px-3 py-2 text-zinc-500 flex items-center gap-2.5">
              <CreditCard size={13} /> Payments
            </div>
            <div className="px-3 py-2 text-zinc-500 flex items-center gap-2.5">
              <Settings size={13} /> Settings
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <div className="h-12 border-b border-white/[0.05] flex items-center justify-between px-5 bg-[#0c0c0c]/80 backdrop-blur-sm shrink-0">
            <span className="text-zinc-400 font-medium text-[11px]">Dashboard / Overview</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 rounded-full border border-white/5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-zinc-400 font-mono text-[10px]">0x8a...42b</span>
              </div>
              <Bell size={12} className="text-zinc-500" />
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="p-5 grid grid-cols-3 gap-4">
            {/* Stat Cards */}
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
              <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1">Total Volume</div>
              <div className="text-xl font-bold text-white">12.5 ETH</div>
              <div className="text-[9px] text-emerald-400 mt-1">↑ +12% this week</div>
            </div>
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
              <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1">Active Deals</div>
              <div className="text-xl font-bold text-emerald-400">8</div>
              <div className="text-[9px] text-zinc-500 mt-1">3 pending approval</div>
            </div>
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
              <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1">Pending</div>
              <div className="text-xl font-bold text-amber-400">2</div>
              <div className="text-[9px] text-zinc-500 mt-1">Requires action</div>
            </div>

            {/* Recent Transactions */}
            <div className="col-span-2 bg-zinc-900/50 rounded-xl border border-white/5 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-white text-[11px]">Recent Transactions</h3>
                <MoreHorizontal size={12} className="text-zinc-500" />
              </div>
              <div className="space-y-2">
                {[{ addr: '0x71...3A9', amt: '+1.2 ETH', time: '2m ago', color: 'text-emerald-400' }, { addr: '0x42...F1B', amt: '-0.5 ETH', time: '1h ago', color: 'text-zinc-400' }, { addr: '0xA3...C4D', amt: '+3.0 ETH', time: '3h ago', color: 'text-emerald-400' }].map((tx, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-500">
                        <ArrowRight size={9} />
                      </div>
                      <div>
                        <div className="text-white font-medium text-[10px]">Milestone Release</div>
                        <div className="text-zinc-600 text-[9px]">{tx.addr} • {tx.time}</div>
                      </div>
                    </div>
                    <div className={`font-mono text-[10px] font-bold ${tx.color}`}>{tx.amt}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Card */}
            <div className="col-span-1 bg-gradient-to-br from-emerald-900/30 to-zinc-900/60 rounded-xl border border-emerald-500/20 p-4 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black shadow-lg shadow-emerald-500/30">
                <Plus size={18} />
              </div>
              <div className="font-bold text-white text-[11px]">New Escrow</div>
              <div className="text-zinc-500 text-[9px] leading-relaxed">Create a milestone-based contract in seconds.</div>
              <button className="bg-emerald-500 text-black font-bold text-[9px] px-3 py-1.5 rounded-lg w-full hover:bg-emerald-400 transition-colors">Start Now</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fade Overlay */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#010101] to-transparent z-30 pointer-events-none" />
    </div>
  </div>
);

/**
 * ISOMETRIC GRAPHIC ELEMENTS
 * Wireframe-style decorative SVGs inspired by technical product illustration style.
 */

// FIG 0.2 — Stacked flat layers with circle cutout
const IsoStackedLayers = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g opacity="0.35">
      {/* Bottom layer */}
      <path d="M100 170L20 130V110L100 150L180 110V130L100 170Z" stroke="currentColor" strokeWidth="1" />
      <path d="M20 110L100 150L180 110L100 70L20 110Z" stroke="currentColor" strokeWidth="1" fill="none" />
      {/* Middle layer */}
      <path d="M100 145L20 105V85L100 125L180 85V105L100 145Z" stroke="currentColor" strokeWidth="1" />
      <path d="M20 85L100 125L180 85L100 45L20 85Z" stroke="currentColor" strokeWidth="1" fill="none" />
      {/* Top flat layer */}
      <path d="M100 115L20 75V60L100 100L180 60V75L100 115Z" stroke="currentColor" strokeWidth="1" />
      <path d="M20 60L100 100L180 60L100 20L20 60Z" stroke="currentColor" strokeWidth="1" fill="none" />
      {/* Circle on top layer */}
      <ellipse cx="100" cy="58" rx="28" ry="16" stroke="currentColor" strokeWidth="0.8" />
      {/* Lines inside circle */}
      {[6, 12, 18, 24].map((y, i) => (
        <line key={i} x1={82} y1={52 + y / 2} x2={118} y2={52 + y / 2} stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      ))}
    </g>
    <text x="10" y="190" fill="currentColor" fontSize="7" fontFamily="monospace" opacity="0.4">FIG 0.2</text>
  </svg>
);

// FIG 0.3 — Isometric cubes cluster
const IsoCubes = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g opacity="0.35">
      {/* Large back cube */}
      <path d="M100 40L140 64V108L100 132L60 108V64L100 40Z" stroke="currentColor" strokeWidth="1" />
      <path d="M100 40V132" stroke="currentColor" strokeWidth="0.5" />
      <path d="M60 64L100 88L140 64" stroke="currentColor" strokeWidth="0.5" />
      {/* Small left cube */}
      <path d="M52 108L80 124V155L52 170L24 155V124L52 108Z" stroke="currentColor" strokeWidth="0.9" />
      <path d="M52 108V170" stroke="currentColor" strokeWidth="0.4" />
      <path d="M24 124L52 140L80 124" stroke="currentColor" strokeWidth="0.4" />
      {/* Small bottom cube */}
      <path d="M148 108L176 124V155L148 170L120 155V124L148 108Z" stroke="currentColor" strokeWidth="0.9" />
      <path d="M148 108V170" stroke="currentColor" strokeWidth="0.4" />
      <path d="M120 124L148 140L176 124" stroke="currentColor" strokeWidth="0.4" />
      {/* Highlight hash marks on top of big cube */}
      <line x1="88" y1="64" x2="100" y2="71" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      <line x1="100" y1="71" x2="112" y2="64" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
    </g>
    <text x="10" y="196" fill="currentColor" fontSize="7" fontFamily="monospace" opacity="0.4">FIG 0.3</text>
  </svg>
);

// FIG 0.4 — Stacked curved card sheets (fan)
const IsoStackedCards = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g opacity="0.35">
      {Array.from({ length: 9 }, (_, i) => {
        const offset = i * 10;
        return (
          <g key={i}>
            <path
              d={`M${50 + offset} ${160 - offset * 0.5}L${50 + offset} ${60 - offset * 0.5}Q${50 + offset + 10} ${50 - offset * 0.5} ${60 + offset} ${55 - offset * 0.5}L${120 + offset} ${25 - offset * 0.5}L${120 + offset} ${125 - offset * 0.5}Q${120 + offset + 5} ${145 - offset * 0.5} ${110 + offset} ${148 - offset * 0.5}Z`}
              stroke="currentColor" strokeWidth={i === 8 ? 1.2 : 0.6}
              opacity={0.3 + i * 0.07}
            />
          </g>
        );
      })}
      {/* Horizontal lines on front card */}
      {[0, 12, 24, 36, 48, 60, 72, 84, 96].map((y, i) => (
        <line key={i} x1="58" y1={75 + y} x2="108" y2={48 + y} stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      ))}
    </g>
    <text x="10" y="196" fill="currentColor" fontSize="7" fontFamily="monospace" opacity="0.4">FIG 0.4</text>
  </svg>
);

/**
 * ANIMATED STEPS COMPONENT
 */
const AnimatedStep = ({ number, title, desc }: { number: string, title: string, desc: string }) => (
  <div className="flex flex-col items-center text-center p-6 rounded-3xl border border-white/5 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-emerald-500/30 transition-all duration-300 group h-full">
    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:border-emerald-500/50 group-hover:shadow-emerald-500/20 transition-all">
      <span className="text-2xl font-black text-zinc-500 group-hover:text-emerald-400 transition-colors">{number}</span>
    </div>
    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors">{title}</h3>
    <p className="text-zinc-400 text-base leading-relaxed max-w-xs">{desc}</p>
  </div>
);


/**
 * MAIN PAGE
 */
export default function App() {
  // const headline = useTypewriter("EscrowKit - The Trustless Marketplace Engine", 45);
  const subheadline = useTypewriter("Secure, milestone-based payments for marketplaces, freelancing, gigs, and rentals.", 35, 2500);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#010101] text-zinc-100 font-sans selection:bg-emerald-500 selection:text-black antialiased overflow-x-hidden">
      <ParticleConstellation />

      {/* Navigation — Fixed so it stays on top regardless of parent overflow */}
      <nav className="fixed top-0 inset-x-0 z-50 h-20 md:h-24 px-4 md:px-16 flex items-center justify-between border-b border-white/[0.08] bg-[#010101]/85 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            {/* Inline SVG Logo - always renders */}
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]">
              <path d="M20 2L4 9v10c0 9.4 6.8 18.2 16 20.4C29.2 37.2 36 28.4 36 19V9L20 2z" fill="#10b981" />
              <text x="20" y="26" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="system-ui, sans-serif">EK</text>
            </svg>
          </div>
          <span className="font-bold text-2xl tracking-tighter text-white">EscrowKit</span>
        </div>
        <div className="hidden lg:flex gap-12 text-xs font-bold uppercase tracking-[0.3em] text-zinc-300">
          <a href="#how" className="hover:text-emerald-400 transition-colors">How It Works</a>
          <a href="#audience" className="hover:text-emerald-400 transition-colors">Who It{"'s"} For</a>
          <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
          <a href="#integrate" className="hover:text-emerald-400 transition-colors">Integrate</a>
          <a href="#open-source" className="hover:text-emerald-400 transition-colors">Open Source</a>
        </div>
        <div className="flex items-center gap-4">
          <Link href="https://github.com/chetanya1998/EscrowKit" target="_blank">
            <button className="flex items-center gap-2 px-3 md:px-6 py-2.5 rounded-full font-bold text-xs tracking-widest uppercase border border-white/20 hover:border-emerald-500/60 hover:bg-emerald-500/10 transition-all text-white bg-white/5">
              <Github size={14} /> <span className="hidden sm:inline">View on GitHub</span>
            </button>
          </Link>
          <button className="lg:hidden p-2 text-white hover:text-emerald-400 transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 pt-24 px-6 lg:hidden flex flex-col gap-8 animate-in slide-in-from-top-10 duration-200">
          <a href="#how" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-white hover:text-emerald-400">How It Works</a>
          <a href="#audience" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-white hover:text-emerald-400">Who It{"'s"} For</a>
          <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-white hover:text-emerald-400">Features</a>
          <a href="#integrate" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-white hover:text-emerald-400">Integrate</a>
          <a href="#open-source" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-white hover:text-emerald-400">Open Source</a>
        </div>
      )}

      {/* Main content offset for fixed nav */}
      <div className="pt-20 md:pt-24">
        {/* Hero Section */}
        <section className="relative z-10 pt-20 pb-16 md:pt-28 md:pb-24 px-6 max-w-6xl mx-auto text-center overflow-visible">
          {/* Isometric decoration — left side */}
          <div className="absolute -left-16 top-24 pointer-events-none hidden xl:block">
            <IsoStackedLayers className="w-56 h-56 text-emerald-400" />
          </div>
          {/* Isometric decoration — right side */}
          <div className="absolute -right-16 top-16 pointer-events-none hidden xl:block">
            <IsoCubes className="w-60 h-60 text-emerald-400" />
          </div>
          <FadeIn delay={100}>
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold tracking-[0.4em] uppercase text-emerald-400 mb-10 backdrop-blur-md shadow-lg shadow-emerald-500/10">
              <Zap size={12} className="fill-emerald-400" /> The Trustless Marketplace Engine
            </div>
          </FadeIn>
          <FadeIn delay={200}>
            <h1 className="font-heading font-bold tracking-tighter mb-6">
              <span className="block text-6xl md:text-8xl lg:text-[7rem] text-emerald-500 mb-3 drop-shadow-[0_0_30px_rgba(16,185,129,0.35)]">EscrowKit</span>
              <span className="block text-2xl md:text-4xl lg:text-5xl text-white font-medium opacity-90">The Trustless Marketplace Engine</span>
            </h1>
          </FadeIn>
          <FadeIn delay={300}>
            <p className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">{subheadline}</p>
          </FadeIn>
          <FadeIn delay={400}>
            <div className="flex items-center justify-center gap-4 mb-10">
              <a href="#get-started" className="bg-emerald-500 text-black h-14 px-12 rounded-full font-bold text-base hover:bg-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all flex items-center gap-3">
                <ArrowRight size={18} /> Get Started — Free
              </a>
            </div>
          </FadeIn>
          <FadeIn delay={500}>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
              {['Non-custodial', 'Milestone-based', 'Dispute-ready', 'Open-source', 'Transparent'].map(item => (
                <div key={item} className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/60 border border-white/5">
                  <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">{item}</span>
                </div>
              ))}
            </div>
          </FadeIn>
          {/* Full-width dashboard preview */}
          <FadeIn delay={600}>
            <div id="dashboard" className="relative w-full max-w-5xl mx-auto">
              <DashboardSimulation />
            </div>
          </FadeIn>
        </section>

        {/* HOW IT WORKS: ANIMATED STEPS */}
        <section id="how" className="relative z-10 py-20 md:py-40 px-6 bg-[#030303]/50 border-t border-white/5 overflow-hidden">
          {/* Decorative ISO graphics */}
          <div className="absolute -right-8 top-12 opacity-60 pointer-events-none hidden lg:block">
            <IsoStackedCards className="w-48 h-48 text-white" />
          </div>
          <div className="absolute -left-4 bottom-20 opacity-50 pointer-events-none hidden lg:block">
            <IsoStackedLayers className="w-40 h-40 text-emerald-500" />
          </div>
          <div className="max-w-6xl mx-auto text-center">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tighter text-white">How it works.</h2>
              <p className="text-zinc-400 text-lg mb-16 leading-relaxed max-w-xl mx-auto">
                A simple four-step process that keeps everyone honest and protected.
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
              <FadeIn delay={100}>
                <AnimatedStep
                  number="01"
                  title="Create an Escrow"
                  desc="Set payer, payee, and optional arbiter. Define milestones with amounts and deadlines or deposit terms."
                />
              </FadeIn>
              <FadeIn delay={200}>
                <AnimatedStep
                  number="02"
                  title="Fund Securely"
                  desc="Buyer funds the escrow once. Funds are locked safely in the smart contract."
                />
              </FadeIn>
              <FadeIn delay={300}>
                <AnimatedStep
                  number="03"
                  title="Deliver & Approve"
                  desc="Provider submits proof of work using a link or file hash. Buyer approves to release funds instantly or opens a dispute."
                />
              </FadeIn>
              <FadeIn delay={400}>
                <AnimatedStep
                  number="04"
                  title="Resolve Disputes"
                  desc="An arbiter or decentralized arbitration decides the outcome. Funds are released or refunded accordingly."
                />
              </FadeIn>
            </div>
          </div>
        </section >

        {/* PROBLEM SECTION */}
        <section className="relative z-10 py-20 md:py-32 px-6 border-t border-white/5 overflow-hidden">
          {/* Decorative ISO graphic */}
          <div className="absolute right-4 bottom-8 opacity-40 pointer-events-none hidden lg:block">
            <IsoCubes className="w-44 h-44 text-emerald-400" />
          </div>
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tighter text-white text-center">Online work fails because trust is missing.</h2>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <FadeIn delay={100}>
                <PremiumCard>
                  <h3 className="text-2xl font-bold text-white mb-6">For buyers and clients</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3 text-base text-zinc-400"><Lock size={18} className="text-red-400 shrink-0 mt-0.5" /> Worried about paying and not getting delivery</li>
                    <li className="flex items-start gap-3 text-base text-zinc-400"><Lock size={18} className="text-red-400 shrink-0 mt-0.5" /> Worried about quality not matching the agreement</li>
                  </ul>
                </PremiumCard>
              </FadeIn>
              <FadeIn delay={200}>
                <PremiumCard>
                  <h3 className="text-2xl font-bold text-white mb-6">For freelancers and providers</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3 text-base text-zinc-400"><Lock size={18} className="text-red-400 shrink-0 mt-0.5" /> Worried about clients disappearing after delivery</li>
                    <li className="flex items-start gap-3 text-base text-zinc-400"><Lock size={18} className="text-red-400 shrink-0 mt-0.5" /> Worried about payments getting delayed indefinitely</li>
                  </ul>
                </PremiumCard>
              </FadeIn>
            </div>
            <FadeIn delay={300}>
              <p className="text-center text-zinc-300 text-lg md:text-xl max-w-3xl mx-auto font-light leading-relaxed">
                EscrowKit removes this risk by locking funds and releasing them only when conditions are met.
              </p>
            </FadeIn>
          </div>
        </section >

        {/* WHAT IT IS SECTION */}
        < section className="relative z-10 py-20 md:py-32 px-6 bg-[#030303]/50 border-t border-white/5" >
          <div className="max-w-4xl mx-auto text-center">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20 mb-6">
                <ShieldCheck size={12} /> What is EscrowKit
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tighter text-white">A plug-and-play escrow layer for any platform.</h2>
              <p className="text-zinc-400 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
                A full-stack boxed solution you can use directly or embed. Includes smart contracts, dashboard, API, indexer, and SDK.
              </p>
            </FadeIn>
          </div>
        </section >

        {/* AUDIENCE SECTION */}
        < section id="audience" className="relative z-10 py-20 md:py-32 px-6 border-t border-white/5" >
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tighter text-white text-center">Who it{"'"}s for.</h2>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FadeIn delay={100}>
                <PremiumCard highlight>
                  <div className="p-3 bg-emerald-500/10 rounded-xl w-fit mb-4"><Briefcase size={24} className="text-emerald-500" /></div>
                  <h3 className="text-2xl font-bold text-white mb-3">Founders and SMEs</h3>
                  <p className="text-zinc-400 text-base mb-6 leading-relaxed">Safer payments for your marketplace or hiring needs, without building escrow from scratch.</p>
                  <ul className="space-y-3 mt-auto">
                    <li className="flex items-start gap-2 text-base text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Safer payments without rebuilding escrow</li>
                    <li className="flex items-start gap-2 text-base text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Reduced disputes and support load</li>
                    <li className="flex items-start gap-2 text-base text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Full audit timeline across all actions</li>
                  </ul>
                </PremiumCard>
              </FadeIn>
              <FadeIn delay={200}>
                <PremiumCard>
                  <div className="p-3 bg-emerald-500/10 rounded-xl w-fit mb-4"><Users size={24} className="text-emerald-500" /></div>
                  <h3 className="text-2xl font-bold text-white mb-3">Freelancers and service providers</h3>
                  <p className="text-zinc-400 text-base mb-6 leading-relaxed">See locked funds before you start. Get paid faster with verified milestone approvals.</p>
                  <ul className="space-y-3 mt-auto">
                    <li className="flex items-start gap-2 text-base text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Proof that funds are locked</li>
                    <li className="flex items-start gap-2 text-base text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Milestone approvals and faster payouts</li>
                    <li className="flex items-start gap-2 text-base text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Clear dispute path when needed</li>
                  </ul>
                </PremiumCard>
              </FadeIn>
              <FadeIn delay={300}>
                <PremiumCard>
                  <div className="p-3 bg-emerald-500/10 rounded-xl w-fit mb-4"><Code2 size={24} className="text-emerald-500" /></div>
                  <h3 className="text-2xl font-bold text-white mb-3">Developers</h3>
                  <p className="text-zinc-400 text-base mb-6 leading-relaxed">Integrate escrow flows in minutes using our contracts, SDK, API, indexer, and UI components.</p>
                  <ul className="space-y-3 mt-auto">
                    <li className="flex items-start gap-2 text-base text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> SDK and UI components for fast integration</li>
                    <li className="flex items-start gap-2 text-base text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Indexer and API for real-time read models</li>
                    <li className="flex items-start gap-2 text-base text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Signed webhooks for platform sync</li>
                  </ul>
                </PremiumCard>
              </FadeIn>
            </div>
          </div>
        </section >

        {/* USE CASES SECTION */}
        < section className="relative z-10 py-20 md:py-32 px-6 bg-[#030303]/50 border-t border-white/5" >
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tighter text-white text-center">What you can build with it.</h2>
            </FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { icon: <Briefcase size={20} />, title: 'Freelance milestones', desc: 'Design, build, deliver, and handover with staged payments.' },
                { icon: <Zap size={20} />, title: 'Gig work', desc: 'Small tasks with fast approvals.' },
                { icon: <Store size={20} />, title: 'Rental deposits', desc: 'Deposit, claims, disputes, and resolution.' },
                { icon: <Globe size={20} />, title: 'B2B procurement', desc: 'Vendor milestones with audit trail and approvals.' },
                { icon: <MessageCircle size={20} />, title: 'Creator collaborations', desc: 'Staged payouts tied to deliverables.' },
              ].map((item, i) => (
                <FadeIn key={item.title} delay={i * 100}>
                  <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-2xl hover:border-emerald-500/30 transition-all h-full">
                    <div className="p-3 bg-zinc-900 rounded-xl text-emerald-500 w-fit mb-4">{item.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-zinc-400 text-base leading-relaxed">{item.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section >

        {/* KEY FEATURES SECTION */}
        < section id="features" className="relative z-10 py-20 md:py-32 px-6 border-t border-white/5" >
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tighter text-white text-center">Key features.</h2>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { title: 'Milestone escrow', points: ['Add milestones with descriptions, amounts, and deadlines', 'Provider submits deliverable proof as a hash', 'Approve to release funds or refund after deadline'] },
                { title: 'Rental deposit escrow', points: ['Deposit locked until the rental ends', 'Landlord can claim with a reason within a claim window', 'Tenant can accept or dispute, arbiter can resolve'] },
                { title: 'Dispute system', points: ['Dispute opening by payer or payee', 'Pluggable arbitration adapters', 'Supports trusted arbiter flow and decentralized arbitration'] },
                { title: 'Automated verification', points: ['Optional verification oracle for condition checks', 'Automated milestone approvals when conditions are verified'] },
              ].map((feature, i) => (
                <FadeIn key={feature.title} delay={i * 100}>
                  <PremiumCard className="h-full">
                    <h3 className="text-2xl font-bold text-white mb-6">{feature.title}</h3>
                    <ul className="space-y-3">
                      {feature.points.map(point => (
                        <li key={point} className="flex items-start gap-3 text-base text-zinc-300">
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> {point}
                        </li>
                      ))}
                    </ul>
                  </PremiumCard>
                </FadeIn>
              ))}
            </div>
          </div>
        </section >

        {/* INTEGRATION SECTION */}
        < section id="integrate" className="relative z-10 py-20 md:py-32 px-6 bg-[#030303]/50 border-t border-white/5" >
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tighter text-white text-center">Integrate EscrowKit into your product.</h2>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FadeIn delay={100}>
                <PremiumCard highlight className="h-full">
                  <div className="p-3 bg-emerald-500/10 rounded-xl w-fit mb-4"><LayoutDashboard size={24} className="text-emerald-500" /></div>
                  <h3 className="text-2xl font-bold text-white mb-4">Use the EscrowKit dashboard</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-base text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Create escrows using templates</li>
                    <li className="flex items-start gap-3 text-base text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Track milestones and disputes</li>
                    <li className="flex items-start gap-3 text-base text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Manage API keys and settings</li>
                  </ul>
                </PremiumCard>
              </FadeIn>
              <FadeIn delay={200}>
                <PremiumCard className="h-full">
                  <div className="p-3 bg-emerald-500/10 rounded-xl w-fit mb-4"><Terminal size={24} className="text-emerald-500" /></div>
                  <h3 className="text-2xl font-bold text-white mb-4">Embed EscrowKit into your platform</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-base text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Deploy the factory and spawn escrow instances</li>
                    <li className="flex items-start gap-3 text-base text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Run the indexer to sync events into a database</li>
                    <li className="flex items-start gap-3 text-base text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Use signed webhooks to update your system in real time</li>
                    <li className="flex items-start gap-3 text-base text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Use the API and transaction helpers to power your UI</li>
                    <li className="flex items-start gap-3 text-base text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Use the TypeScript SDK for integration</li>
                  </ul>
                </PremiumCard>
              </FadeIn>
            </div>
          </div>
        </section >

        {/* REFINED OPEN SOURCE / DEVELOPER SECTION */}
        < section id="open-source" className="relative z-10 py-20 md:py-40 px-6" >
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className="text-center mb-24">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 mb-6">
                  <Code2 size={12} /> Developer Hub
                </div>
                <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent italic">Open-source and community-built.</h2>
                <div className="w-24 h-1 bg-emerald-500 mx-auto rounded-full mb-8 shadow-lg shadow-emerald-500/50" />
                <p className="text-zinc-300 text-xl max-w-2xl mx-auto font-light leading-relaxed">
                  EscrowKit is open-source. You can self-host it, audit it, and extend it with templates and adapters.
                </p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              {/* Interactive Terminal */}
              <FadeIn delay={100}>
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold">1</div>
                    <h3 className="text-2xl font-bold text-white">Get Started Instantly</h3>
                  </div>
                  <DeveloperTerminal />
                  <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <Link href="https://github.com/chetanya1998/EscrowKit" target="_blank" className="flex-1">
                      <button className="w-full py-4 rounded-xl bg-zinc-900 border border-white/10 hover:border-emerald-500/50 hover:text-emerald-500 transition-colors text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg">
                        <BookOpen size={14} /> View Documentation
                      </button>
                    </Link>
                    <Link href="https://github.com/chetanya1998/EscrowKit/fork" target="_blank" className="flex-1">
                      <button className="w-full py-4 rounded-xl bg-zinc-900 border border-white/10 hover:border-emerald-500/50 hover:text-emerald-500 transition-colors text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg">
                        <Github size={14} /> Fork Repo
                      </button>
                    </Link>
                  </div>
                </div>
              </FadeIn>

              {/* Contribution Grid */}
              <FadeIn delay={300}>
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold">2</div>
                    <h3 className="text-2xl font-bold text-white">Where to Contribute?</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ContributionCard
                      icon={<Plus size={20} />}
                      title="Escrow Templates"
                      desc="Add new escrow templates for different industries."
                      tag="Solidity"
                    />
                    <ContributionCard
                      icon={<LayoutDashboard size={20} />}
                      title="Dashboard UX"
                      desc="Improve dashboard UX and responsiveness."
                      tag="React"
                    />
                    <ContributionCard
                      icon={<Code2 size={20} />}
                      title="SDK Methods"
                      desc="Expand the SDK with submit, approve, dispute, and rental methods."
                      tag="TypeScript"
                    />
                    <ContributionCard
                      icon={<Database size={20} />}
                      title="Indexer Tooling"
                      desc="Add historical backfill and replay tooling."
                      tag="Node.js"
                    />
                    <ContributionCard
                      icon={<Scale size={20} />}
                      title="Arbitration Adapters"
                      desc="Build arbitration adapters and verification integrations."
                      tag="Solidity"
                    />
                    <ContributionCard
                      icon={<BookOpen size={20} />}
                      title="Documentation"
                      desc="Improve documentation and integration recipes."
                      tag="Docs"
                    />
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section >

        {/* ROADMAP SECTION */}
        < section id="roadmap" className="relative z-10 py-16 md:py-32 px-6 bg-[#030303]/50 border-t border-white/5" >
          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tighter text-white">Future Roadmap</h2>
                  <p className="text-zinc-400">See what we are building next.</p>
                </div>
              </div>
            </FadeIn>

            <div className="space-y-8">
              <FadeIn delay={100}>
                <RoadmapItem
                  quarter="Q1 2024"
                  title="Multi-Chain Support"
                  desc="Deploying contracts to Arbitrum, Optimism, and Polygon for lower fees."
                  status="In Progress"
                />
              </FadeIn>
              <FadeIn delay={200}>
                <RoadmapItem
                  quarter="Q2 2024"
                  title="Fiat On-Ramp"
                  desc="Direct credit card funding via Stripe integration for non-crypto clients."
                  status="Planned"
                />
              </FadeIn>
              <FadeIn delay={300}>
                <RoadmapItem
                  quarter="Q3 2024"
                  title="Governance DAO"
                  desc="Community voting on protocol fees, arbiter selection, and upgrades."
                  status="Planned"
                />
              </FadeIn>
            </div>
          </div>
        </section >

        {/* CREDIBILITY SECTION */}
        < section className="relative z-10 py-20 md:py-32 px-6 border-t border-white/5 bg-[#050505]" >
          <div className="max-w-4xl mx-auto text-center">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 tracking-tight">Built for strong foundations.</h2>
            </FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                'Non-custodial by design',
                'Indexer writes and API reads for clean scaling',
                'Signed webhooks for authenticity verification',
                'Open-source monorepo with contracts, indexer, API, dApp, SDK, and docs',
                'CI pipeline with build and contract tests',
                'Active development and deployed on Railway',
              ].map((item, i) => (
                <FadeIn key={item} delay={i * 80}>
                  <div className="flex items-center gap-3 bg-zinc-900/30 border border-white/5 p-4 rounded-xl">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span className="text-sm text-zinc-300 text-left">{item}</span>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section >

        {/* CTA SECTION */}
        <section id="get-started" className="relative z-10 py-28 md:py-40 px-6 border-t border-white/5 overflow-hidden">
          {/* Decorative ISO graphic */}
          <div className="absolute -left-8 top-8 opacity-30 pointer-events-none hidden lg:block">
            <IsoStackedLayers className="w-52 h-52 text-emerald-400" />
          </div>
          <div className="absolute -right-4 bottom-8 opacity-30 pointer-events-none hidden lg:block">
            <IsoStackedCards className="w-52 h-52 text-white" />
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <FadeIn>
              <div className="w-16 h-16 mx-auto mb-8 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
                <ShieldCheck size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tighter">
                Build with trustless escrow.
              </h2>
              <p className="text-zinc-400 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
                Integrate milestone payments, dispute resolution and on-chain escrow into any product — in minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="/dashboard" className="bg-emerald-500 text-black h-14 px-10 rounded-full font-bold text-base hover:bg-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all flex items-center gap-3">
                  <ArrowRight size={18} /> Start for Free
                </a>
                <Link href="https://github.com/chetanya1998/EscrowKit" target="_blank" className="h-14 px-10 rounded-full font-bold text-base border border-white/20 hover:border-emerald-500/60 hover:bg-emerald-500/10 transition-all text-white bg-white/5 flex items-center gap-3">
                  <Github size={18} /> View on GitHub
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="relative z-10 py-20 md:py-32 px-6 bg-[#030303]/50 border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tighter text-white text-center">FAQ</h2>
            </FadeIn>
            <div className="space-y-4">
              {[
                { q: 'Do I need to know coding to use EscrowKit?', a: 'No. You can use the dashboard to create and manage escrows. Developers can integrate EscrowKit into a platform for a deeper experience.' },
                { q: 'Where is the money stored?', a: 'Funds are held in smart contracts. The platform operator does not custody funds.' },
                { q: 'What happens in a dispute?', a: 'A chosen arbiter or a decentralized arbitration adapter can resolve disputes based on evidence.' },
                { q: 'Can I integrate EscrowKit into my existing product?', a: 'Yes. Use the SDK, API, indexer, and signed webhooks to sync escrow events and state into your system.' },
              ].map((faq, i) => (
                <FadeIn key={faq.q} delay={i * 80}>
                  <details className="group bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-colors">
                    <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                      <span className="text-white font-bold text-lg pr-4">{faq.q}</span>
                      <ChevronRight size={18} className="text-zinc-500 group-open:rotate-90 transition-transform shrink-0" />
                    </summary>
                    <div className="px-6 pb-6 text-zinc-400 leading-relaxed">{faq.a}</div>
                  </details>
                </FadeIn>
              ))}
            </div>
          </div>
        </section >

        {/* Footer */}
        < footer className="relative z-10 py-12 px-6 md:py-24 md:px-12 border-t border-white/10 bg-[#000000]" >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 md:gap-16">
            <div className="flex flex-col gap-5 text-center md:text-left">
              <Link href="https://github.com/chetanya1998/EscrowKit" target="_blank" className="flex items-center gap-3 justify-center md:justify-start hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]">
                    <path d="M20 2L4 9v10c0 9.4 6.8 18.2 16 20.4C29.2 37.2 36 28.4 36 19V9L20 2z" fill="#10b981" />
                    <text x="20" y="26" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="system-ui, sans-serif">EK</text>
                  </svg>
                </div>
                <span className="font-bold text-2xl tracking-tighter text-white">EscrowKit</span>
              </Link>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.5em]">The Trustless Marketplace Engine</p>
            </div>

            <div className="flex gap-8 md:gap-12 text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-300 flex-wrap justify-center">
              <Link href="/docs" className="hover:text-emerald-400 transition-colors">Docs</Link>
              <a href="#roadmap" className="hover:text-emerald-400 transition-colors">Roadmap</a>
              <a href="https://github.com/chetanya1998/EscrowKit" target="_blank" className="hover:text-emerald-400 transition-colors">Contribute</a>
              <a href="https://github.com/chetanya1998/EscrowKit/blob/main/LICENSE" target="_blank" className="hover:text-emerald-400 transition-colors">License</a>
            </div>

            <div className="text-[10px] font-mono text-zinc-800">
              © 2024 EscrowKit
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

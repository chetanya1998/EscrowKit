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
const InteractiveWaves = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize coordinates -0.5 to 0.5
      const load = 60; // Max displacement
      targetX = (e.clientX / window.innerWidth - 0.5) * load;
      targetY = (e.clientY / window.innerHeight - 0.5) * load;

      // Update glow position immediately for responsiveness
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${e.clientX - 350}px, ${e.clientY - 350}px)`;
      }
    };

    const animate = () => {
      // Smooth interpolation for waves
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;

      if (waveRef.current) {
        waveRef.current.style.transform = `translate(${currentX}px, ${currentY}px) scale(1.05)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    // Only add listener on non-touch devices to save resources
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (!isTouch) {
      window.addEventListener('mousemove', handleMouseMove);
      rafId = requestAnimationFrame(animate);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-0 overflow-hidden bg-[#010101] pointer-events-none">
      <div className="absolute inset-0 opacity-[0.25] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Interactive Glow - Hidden on mobile via styling logic or simple display none if needed, checking media query in JS is better for performance */}
      <div
        ref={glowRef}
        className="absolute w-[700px] h-[700px] bg-emerald-500/10 blur-[120px] rounded-full will-change-transform hidden md:block"
        style={{ top: 0, left: 0 }} // Position handled by JS
      />

      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-emerald-500/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/15 blur-[150px] rounded-full" />

      <svg
        ref={waveRef}
        className="absolute inset-0 w-full h-full will-change-transform transition-transform duration-0" // Removed css duration, handled by JS
        style={{ transform: `scale(1.05)` }} // Initial scale
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="vibrant-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <filter id="hyper-glow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {[...Array(14)].map((_, i) => (
          <path
            key={i}
            className={`wave-strand-v3-${i}`}
            d={`M-300,${450 + (i - 7) * 22} C400,${200 - (i - 7) * 70} 1200,${700 + (i - 7) * 70} 1900,${450 - (i - 7) * 22}`}
            fill="none"
            stroke="url(#vibrant-grad)"
            strokeWidth={1.8 + (i % 3 === 0 ? 1 : 0)}
            strokeOpacity={0.6 - Math.abs(i - 7) * 0.05}
            filter="url(#hyper-glow)"
          />
        ))}
      </svg>
      <style>{`
        @keyframes pulse-flow {
          0% { stroke-dashoffset: 3000; opacity: 0.3; }
          50% { opacity: 0.7; }
          100% { stroke-dashoffset: 0; opacity: 0.3; }
        }
        ${[...Array(14)].map((_, i) => `
          .wave-strand-v3-${i} {
            stroke-dasharray: 1500;
            animation: pulse-flow ${18 + i * 2.5}s linear infinite;
            animation-delay: ${i * -2.2}s;
          }
        `).join('')}
      `}</style>
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
      transition-all duration-500 hover:border-emerald-500/50 hover:-translate-y-2 
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
 * FULL DASHBOARD SIMULATION
 */
const DashboardSimulation = () => (
  <div className="relative w-full aspect-auto md:aspect-[16/9] lg:aspect-[21/9] bg-[#0c0c0c] rounded-3xl border border-white/10 overflow-hidden shadow-2xl group flex flex-col md:block">
    {/* Fade overlay for "Faded Product Experience" */}
    <div className="absolute inset-0 bg-gradient-to-t from-[#010101] via-transparent to-transparent z-20 pointer-events-none opacity-80" />
    <div className="absolute inset-0 bg-gradient-to-r from-[#010101] via-transparent to-[#010101] z-20 pointer-events-none opacity-50" />

    <div className="flex h-full text-xs flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-64 bg-[#111] border-r border-white/5 p-4 flex flex-col gap-6 hidden md:flex">
        <div className="flex items-center gap-2 px-2">
          <div className="w-6 h-6 bg-emerald-500 rounded-md" />
          <span className="font-bold text-white tracking-widest uppercase">EscrowKit</span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg font-bold flex items-center gap-3">
            <LayoutDashboard size={14} /> Overview
          </div>
          <div className="px-3 py-2 text-zinc-500 hover:text-white flex items-center gap-3 transition-colors">
            <FileText size={14} /> Contracts
          </div>
          <div className="px-3 py-2 text-zinc-500 hover:text-white flex items-center gap-3 transition-colors">
            <CreditCard size={14} /> Payments
          </div>
          <div className="px-3 py-2 text-zinc-500 hover:text-white flex items-center gap-3 transition-colors">
            <Settings size={14} /> Settings
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-[#0c0c0c] flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
          <div className="text-zinc-400 font-medium">Dashboard / Overview</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-white/5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-zinc-400 font-mono">0x8a...42b</span>
            </div>
            <Bell size={16} className="text-zinc-500" />
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pb-20 md:pb-6">
          {/* Stats */}
          <div className="col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5">
              <div className="text-zinc-500 mb-1 font-bold uppercase tracking-wider text-[10px]">Total Volume</div>
              <div className="text-2xl font-bold text-white">12.5 ETH</div>
            </div>
            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5">
              <div className="text-zinc-500 mb-1 font-bold uppercase tracking-wider text-[10px]">Active Deals</div>
              <div className="text-2xl font-bold text-emerald-400">8 Active</div>
            </div>
            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5">
              <div className="text-zinc-500 mb-1 font-bold uppercase tracking-wider text-[10px]">Pending Actions</div>
              <div className="text-2xl font-bold text-amber-500">2 Actions</div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="col-span-2 bg-zinc-900/40 rounded-2xl border border-white/5 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-white text-sm">Recent Transactions</h3>
              <MoreHorizontal size={14} className="text-zinc-500" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group/item">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-500 group-hover/item:bg-emerald-500 group-hover/item:text-black transition-colors">
                      <ArrowRight size={12} />
                    </div>
                    <div>
                      <div className="text-white font-bold">Milestone Release</div>
                      <div className="text-zinc-500 text-[10px]">0x71...3A9 • 2m ago</div>
                    </div>
                  </div>
                  <div className="text-emerald-400 font-mono">+1.2 ETH</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Card */}
          <div className="col-span-1 bg-gradient-to-br from-emerald-900/20 to-zinc-900/40 rounded-2xl border border-emerald-500/20 p-6 flex flex-col justify-center text-center">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 text-black shadow-lg shadow-emerald-500/20">
              <Plus size={24} />
            </div>
            <h3 className="font-bold text-white mb-2">New Escrow</h3>
            <p className="text-zinc-500 mb-4 leading-relaxed">Create a milestone-based contract in seconds.</p>
            <button className="bg-emerald-500 text-black font-bold py-2 rounded-lg hover:bg-emerald-400 transition-colors">Start Now</button>
          </div>
        </div>
      </div>
    </div>

    {/* Floating Interaction Hint */}
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 px-6 py-2 bg-zinc-900/80 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2 animate-bounce w-max max-w-[90%] justify-center whitespace-nowrap">
      <LayoutDashboard size={12} className="text-emerald-500" /> Interactive Preview
    </div>
  </div>
);

/**
 * ANIMATED STEPS COMPONENT
 */
const AnimatedStep = ({ number, title, desc }: { number: string, title: string, desc: string }) => (
  <div className="flex flex-col items-center text-center p-6 rounded-3xl border border-white/5 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-emerald-500/30 transition-all duration-300 group h-full">
    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:border-emerald-500/50 group-hover:shadow-emerald-500/20 transition-all">
      <span className="text-2xl font-black text-zinc-500 group-hover:text-emerald-400 transition-colors">{number}</span>
    </div>
    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors">{title}</h3>
    <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">{desc}</p>
  </div>
);

/**
 * MAIN PAGE
 */
export default function App() {
  const headline = useTypewriter("EscrowKit — Safe Payments for Online Work", 45);
  const subheadline = useTypewriter("Pay only when work is approved. Get paid when you deliver.", 35, 2500);

  return (
    <div className="min-h-screen bg-[#010101] text-zinc-100 font-sans selection:bg-emerald-500 selection:text-black antialiased overflow-x-hidden">
      <InteractiveWaves />

      {/* Navigation */}
      <nav className="relative z-50 h-20 md:h-24 px-4 md:px-16 flex items-center justify-between border-b border-white/[0.08] bg-[#010101]/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]">
            <ShieldCheck className="text-black" size={24} />
          </div>
          <span className="font-bold text-2xl tracking-tighter text-white">EscrowKit</span>
        </div>
        <div className="hidden lg:flex gap-12 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-300">
          <a href="#dashboard" className="hover:text-emerald-400 transition-colors">Platform</a>
          <a href="#how" className="hover:text-emerald-400 transition-colors">Process</a>
          <a href="#open-source" className="hover:text-emerald-400 transition-colors">Developers</a>
          <a href="#roadmap" className="hover:text-emerald-400 transition-colors">Roadmap</a>
        </div>
        <Link href="/dashboard">
          <button className="px-8 py-3 rounded-full font-bold text-[10px] tracking-widest uppercase border border-white/20 hover:border-emerald-500/60 hover:bg-emerald-500/10 transition-all text-white bg-white/5">
            Launch App
          </button>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-20 md:pt-28 md:pb-32 px-6 max-w-6xl mx-auto text-center">
        <FadeIn delay={100}>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold tracking-[0.4em] uppercase text-emerald-400 mb-14 backdrop-blur-md shadow-lg shadow-emerald-500/10">
            <Zap size={12} className="fill-emerald-400" /> Milestone Security v4
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold tracking-tight mb-8 md:mb-10 min-h-[1.2em] leading-[1.05] bg-gradient-to-b from-white via-white to-zinc-500 bg-clip-text text-transparent">
            {headline}
          </h1>
        </FadeIn>

        <FadeIn delay={300}>
          <p className="text-zinc-300 text-lg md:text-2xl max-w-3xl mx-auto mb-10 md:mb-16 min-h-[3.2em] leading-relaxed font-light">
            {subheadline}
          </p>
        </FadeIn>

        <FadeIn delay={400}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 mb-16 md:mb-24 px-4">
            <Link href="/create">
              <button className="bg-emerald-500 text-black h-14 md:h-16 px-10 md:px-14 rounded-full font-bold text-base md:text-lg hover:bg-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all w-full sm:w-auto">
                Start Project
              </button>
            </Link>
            <button className="bg-white/10 text-white h-14 md:h-16 px-10 md:px-14 rounded-full font-bold text-base md:text-lg border border-white/20 hover:bg-white/20 backdrop-blur-md transition-all w-full sm:w-auto">
              View Live Demo
            </button>
          </div>
        </FadeIn>

        {/* Dashboard Preview Integration */}
        <FadeIn delay={500}>
          <div id="dashboard" className="relative w-full max-w-5xl mx-auto mb-20">
            <DashboardSimulation />
          </div>
        </FadeIn>

        <FadeIn delay={600}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
            {['Milestone Secure', 'Arbiter Logic', 'Instant Release', 'Audit Verified', 'Transparent'].map(item => (
              <span key={item} className="text-[11px] font-black uppercase tracking-[0.4em] text-center text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                {item}
              </span>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* HOW IT WORKS: ANIMATED STEPS */}
      <section id="how" className="relative z-10 py-20 md:py-40 px-6 bg-[#030303]/50 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tighter text-white">How it works.</h2>
            <p className="text-zinc-400 text-lg mb-16 leading-relaxed max-w-xl mx-auto">
              A simple, transparent process that keeps everyone honest. No hidden fees, no surprise chargebacks.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <FadeIn delay={100}>
              <AnimatedStep
                number="01"
                title="Create Contract"
                desc="Define the project scope, set milestones, and choose a neutral arbiter."
              />
            </FadeIn>
            <FadeIn delay={200}>
              <AnimatedStep
                number="02"
                title="Fund Vault"
                desc="Buyer deposits funds into the secure smart contract. Funds are locked."
              />
            </FadeIn>
            <FadeIn delay={300}>
              <AnimatedStep
                number="03"
                title="Release Payment"
                desc="Freelancer submits work. Buyer approves. Funds are released instantly."
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* REFINED OPEN SOURCE / DEVELOPER SECTION */}
      <section id="open-source" className="relative z-10 py-20 md:py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-24">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 mb-6">
                <Code2 size={12} /> Developer Hub
              </div>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent italic">Built for Developers.</h2>
              <div className="w-24 h-1 bg-emerald-500 mx-auto rounded-full mb-8 shadow-lg shadow-emerald-500/50" />
              <p className="text-zinc-300 text-xl max-w-2xl mx-auto font-light leading-relaxed">
                EscrowKit is 100% open source. Start building trustless marketplaces in minutes, not months.
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
                <div className="flex gap-4 pt-4">
                  <button className="flex-1 py-3 rounded-xl bg-zinc-900 border border-white/10 hover:border-emerald-500/50 hover:text-emerald-500 transition-colors text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <BookOpen size={14} /> View Documentation
                  </button>
                  <button className="flex-1 py-3 rounded-xl bg-zinc-900 border border-white/10 hover:border-emerald-500/50 hover:text-emerald-500 transition-colors text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <Github size={14} /> Fork Repo
                  </button>
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
                    icon={<Cpu size={20} />}
                    title="Core Protocol"
                    desc="Optimize gas usage in our Solidity smart contracts."
                    tag="Hardhat"
                  />
                  <ContributionCard
                    icon={<LayoutDashboard size={20} />}
                    title="UI Components"
                    desc="Enhance the React SDK with new visual themes."
                    tag="React"
                  />
                  <ContributionCard
                    icon={<Database size={20} />}
                    title="Indexer API"
                    desc="Improve query speed for transaction history."
                    tag="GraphQL"
                  />
                  <ContributionCard
                    icon={<Bug size={20} />}
                    title="Security"
                    desc="Find vulnerabilities and earn bounties."
                    tag="Audits"
                  />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ROADMAP SECTION */}
      <section id="roadmap" className="relative z-10 py-16 md:py-32 px-6 bg-[#030303]/50 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tighter text-white">Future Roadmap</h2>
                <p className="text-zinc-400">See what we are building next.</p>
              </div>
              <a href="#" className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-widest text-xs hover:text-emerald-400">
                View Issues on GitHub <ArrowRight size={14} />
              </a>
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
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 md:py-24 md:px-12 border-t border-white/10 bg-[#000000]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 md:gap-16">
          <div className="flex flex-col gap-5 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <ShieldCheck className="text-emerald-500" size={32} />
              <span className="font-bold text-3xl tracking-tighter text-white uppercase">EscrowKit</span>
            </div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.5em]">Global Trust Protocol</p>
          </div>

          <div className="flex gap-12 text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-300">
            {["Docs", "GitHub", "Privacy", "Contact"].map(l => (
              <a key={l} href="#" className="hover:text-emerald-400 transition-colors">{l}</a>
            ))}
          </div>

          <div className="text-[10px] font-mono text-zinc-800">
            SEC_v4.2 // EMERALD_NET_PROD
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * COMPONENT HELPERS
 */

const DeveloperTerminal = () => (
  <div className="bg-[#1e1e1e] rounded-2xl border border-white/10 overflow-hidden font-mono text-sm shadow-2xl">
    <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-white/5">
      <div className="w-3 h-3 rounded-full bg-red-500" />
      <div className="w-3 h-3 rounded-full bg-amber-500" />
      <div className="w-3 h-3 rounded-full bg-green-500" />
      <div className="ml-2 text-zinc-400 text-xs">escrow-kit-setup — -zsh</div>
    </div>
    <div className="p-6 space-y-4">
      <div className="flex gap-2">
        <span className="text-emerald-500">➜</span>
        <span className="text-blue-400">~</span>
        <span className="text-zinc-300">git clone https://github.com/EscrowKit/core.git</span>
      </div>
      <div className="text-zinc-500 pl-4">Cloning into 'core'...</div>
      <div className="flex gap-2">
        <span className="text-emerald-500">➜</span>
        <span className="text-blue-400">~/core</span>
        <span className="text-zinc-300">npm install @escrowkit/sdk</span>
      </div>
      <div className="text-zinc-500 pl-4">
        added 24 packages in 2s<br />
        <span className="text-emerald-500">✔ Installation complete. Ready to build.</span>
      </div>
      <div className="flex gap-2 animate-pulse">
        <span className="text-emerald-500">➜</span>
        <span className="text-blue-400">~/core</span>
        <span className="inline-block w-2 h-4 bg-zinc-500" />
      </div>
    </div>
  </div>
);

const ContributionCard = ({ icon, title, desc, tag }: { icon: React.ReactNode, title: string, desc: string, tag: string }) => (
  <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-2xl hover:border-emerald-500/40 transition-all hover:bg-zinc-900/50 group cursor-pointer h-full">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-zinc-900 rounded-xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
        {icon}
      </div>
      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase rounded border border-emerald-500/20">
        {tag}
      </span>
    </div>
    <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
    <p className="text-zinc-400 text-sm leading-relaxed mb-4">{desc}</p>
    <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform mt-auto">
      View Issues <ArrowRight size={12} />
    </div>
  </div>
);

const RoadmapItem = ({ quarter, title, desc, status }: { quarter: string, title: string, desc: string, status: string }) => (
  <div className="flex flex-col md:flex-row gap-6 md:items-center bg-zinc-900/20 border border-white/5 p-6 rounded-2xl hover:bg-zinc-900/40 transition-colors">
    <div className="w-32 shrink-0">
      <div className="text-emerald-500 font-bold text-lg">{quarter}</div>
      <div className={`text-[10px] uppercase font-bold tracking-wider ${status === 'In Progress' ? 'text-amber-500' : 'text-zinc-600'}`}>
        {status}
      </div>
    </div>
    <div className="flex-1">
      <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
      <p className="text-zinc-400 text-sm">{desc}</p>
    </div>
    <div className="shrink-0 flex items-center gap-2 text-zinc-600">
      <GitBranch size={16} />
    </div>
  </div>
);

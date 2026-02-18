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

    const particles: { x: number, y: number, vx: number, vy: number }[] = [];
    const particleCount = width < 768 ? 40 : 80;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
      });
    }

    let rafId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.lineWidth = 1;

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
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

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-[#010101] pointer-events-none">
      <div className="absolute inset-0 opacity-[0.25] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />
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
  // const headline = useTypewriter("EscrowKit - The Trustless Marketplace Engine", 45);
  const subheadline = useTypewriter("Secure, milestone-based payments for marketplaces, freelancing, gigs, and rentals.", 35, 2500);

  return (
    <div className="min-h-screen bg-[#010101] text-zinc-100 font-sans selection:bg-emerald-500 selection:text-black antialiased overflow-x-hidden">
      <ParticleConstellation />

      {/* Navigation */}
      <nav className="relative z-50 h-20 md:h-24 px-4 md:px-16 flex items-center justify-between border-b border-white/[0.08] bg-[#010101]/40 backdrop-blur-xl">
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
        <div className="hidden lg:flex gap-12 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-300">
          <a href="#how" className="hover:text-emerald-400 transition-colors">How It Works</a>
          <a href="#audience" className="hover:text-emerald-400 transition-colors">Who It{"'s"} For</a>
          <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
          <a href="#integrate" className="hover:text-emerald-400 transition-colors">Integrate</a>
          <a href="#open-source" className="hover:text-emerald-400 transition-colors">Open Source</a>
        </div>
        <Link href="https://github.com/chetanya1998/EscrowKit" target="_blank">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-[10px] tracking-widest uppercase border border-white/20 hover:border-emerald-500/60 hover:bg-emerald-500/10 transition-all text-white bg-white/5">
            <Github size={14} /> View on GitHub
          </button>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-20 md:pt-28 md:pb-32 px-6 max-w-6xl mx-auto text-center">
        <FadeIn delay={100}>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold tracking-[0.4em] uppercase text-emerald-400 mb-14 backdrop-blur-md shadow-lg shadow-emerald-500/10">
            <Zap size={12} className="fill-emerald-400" /> The Trustless Marketplace Engine
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <h1 className="font-heading font-bold tracking-tighter mb-8 md:mb-10">
            <span className="block text-6xl md:text-8xl lg:text-9xl text-emerald-500 mb-6 drop-shadow-[0_0_25px_rgba(16,185,129,0.3)]">EscrowKit</span>
            <span className="block text-2xl md:text-5xl lg:text-6xl text-white font-medium opacity-90">The Trustless Marketplace Engine</span>
          </h1>
        </FadeIn>

        <FadeIn delay={300}>
          <p className="text-zinc-300 text-lg md:text-2xl max-w-3xl mx-auto mb-6 min-h-[3.2em] leading-relaxed font-light">
            {subheadline}
          </p>

        </FadeIn>

        <FadeIn delay={400}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 mb-16 md:mb-24 px-4">
            <a href="#get-started">
              <button className="bg-emerald-500 text-black h-14 md:h-16 px-10 md:px-14 rounded-full font-bold text-base md:text-lg hover:bg-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all w-full sm:w-auto flex items-center gap-3">
                <ArrowRight size={20} /> Get Started
              </button>
            </a>
            <a href="#integrate">
              <button className="h-14 md:h-16 px-10 md:px-14 rounded-full font-bold text-base md:text-lg border border-white/20 hover:border-emerald-500/60 hover:bg-emerald-500/10 transition-all text-white bg-white/5 w-full sm:w-auto flex items-center gap-3">
                <Code2 size={20} /> Integrate EscrowKit
              </button>
            </a>
          </div>
        </FadeIn>

        {/* Dashboard Preview Integration */}
        <FadeIn delay={500}>
          <div id="dashboard" className="relative w-full max-w-5xl mx-auto mb-20">
            <DashboardSimulation />
          </div>
        </FadeIn>

        <FadeIn delay={600}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
            {[
              'Non-custodial',
              'Milestone-based',
              'Dispute-ready',
              'Transparent',
              'Open-source'
            ].map(item => (
              <div key={item} className="flex items-center gap-2 justify-center px-3 py-2 rounded-full bg-zinc-900/50 border border-white/5">
                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300 text-center">{item}</span>
              </div>
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
      </section>

      {/* PROBLEM SECTION */}
      <section className="relative z-10 py-20 md:py-32 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tighter text-white text-center">Online work fails because trust is missing.</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <FadeIn delay={100}>
              <PremiumCard>
                <h3 className="text-xl font-bold text-white mb-6">For buyers and clients</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-zinc-400"><Lock size={18} className="text-red-400 shrink-0 mt-0.5" /> Worried about paying and not getting delivery</li>
                  <li className="flex items-start gap-3 text-zinc-400"><Lock size={18} className="text-red-400 shrink-0 mt-0.5" /> Worried about quality not matching the agreement</li>
                </ul>
              </PremiumCard>
            </FadeIn>
            <FadeIn delay={200}>
              <PremiumCard>
                <h3 className="text-xl font-bold text-white mb-6">For freelancers and providers</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-zinc-400"><Lock size={18} className="text-red-400 shrink-0 mt-0.5" /> Worried about clients disappearing after delivery</li>
                  <li className="flex items-start gap-3 text-zinc-400"><Lock size={18} className="text-red-400 shrink-0 mt-0.5" /> Worried about payments getting delayed indefinitely</li>
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
      </section>

      {/* WHAT IT IS SECTION */}
      <section className="relative z-10 py-20 md:py-32 px-6 bg-[#030303]/50 border-t border-white/5">
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
      </section>

      {/* AUDIENCE SECTION */}
      <section id="audience" className="relative z-10 py-20 md:py-32 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tighter text-white text-center">Who it{"'"}s for.</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FadeIn delay={100}>
              <PremiumCard highlight>
                <div className="p-3 bg-emerald-500/10 rounded-xl w-fit mb-4"><Briefcase size={24} className="text-emerald-500" /></div>
                <h3 className="text-xl font-bold text-white mb-3">Founders and SMEs</h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">Safer payments for your marketplace or hiring needs, without building escrow from scratch.</p>
                <ul className="space-y-3 mt-auto">
                  <li className="flex items-start gap-2 text-sm text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Safer payments without rebuilding escrow</li>
                  <li className="flex items-start gap-2 text-sm text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Reduced disputes and support load</li>
                  <li className="flex items-start gap-2 text-sm text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Full audit timeline across all actions</li>
                </ul>
              </PremiumCard>
            </FadeIn>
            <FadeIn delay={200}>
              <PremiumCard>
                <div className="p-3 bg-emerald-500/10 rounded-xl w-fit mb-4"><Users size={24} className="text-emerald-500" /></div>
                <h3 className="text-xl font-bold text-white mb-3">Freelancers and service providers</h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">See locked funds before you start. Get paid faster with verified milestone approvals.</p>
                <ul className="space-y-3 mt-auto">
                  <li className="flex items-start gap-2 text-sm text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Proof that funds are locked</li>
                  <li className="flex items-start gap-2 text-sm text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Milestone approvals and faster payouts</li>
                  <li className="flex items-start gap-2 text-sm text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Clear dispute path when needed</li>
                </ul>
              </PremiumCard>
            </FadeIn>
            <FadeIn delay={300}>
              <PremiumCard>
                <div className="p-3 bg-emerald-500/10 rounded-xl w-fit mb-4"><Code2 size={24} className="text-emerald-500" /></div>
                <h3 className="text-xl font-bold text-white mb-3">Developers</h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">Integrate escrow flows in minutes using our contracts, SDK, API, indexer, and UI components.</p>
                <ul className="space-y-3 mt-auto">
                  <li className="flex items-start gap-2 text-sm text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> SDK and UI components for fast integration</li>
                  <li className="flex items-start gap-2 text-sm text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Indexer and API for real-time read models</li>
                  <li className="flex items-start gap-2 text-sm text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Signed webhooks for platform sync</li>
                </ul>
              </PremiumCard>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* USE CASES SECTION */}
      <section className="relative z-10 py-20 md:py-32 px-6 bg-[#030303]/50 border-t border-white/5">
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
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* KEY FEATURES SECTION */}
      <section id="features" className="relative z-10 py-20 md:py-32 px-6 border-t border-white/5">
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
                  <h3 className="text-xl font-bold text-white mb-6">{feature.title}</h3>
                  <ul className="space-y-3">
                    {feature.points.map(point => (
                      <li key={point} className="flex items-start gap-3 text-sm text-zinc-300">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> {point}
                      </li>
                    ))}
                  </ul>
                </PremiumCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATION SECTION */}
      <section id="integrate" className="relative z-10 py-20 md:py-32 px-6 bg-[#030303]/50 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tighter text-white text-center">Integrate EscrowKit into your product.</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FadeIn delay={100}>
              <PremiumCard highlight className="h-full">
                <div className="p-3 bg-emerald-500/10 rounded-xl w-fit mb-4"><LayoutDashboard size={24} className="text-emerald-500" /></div>
                <h3 className="text-xl font-bold text-white mb-4">Use the EscrowKit dashboard</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Create escrows using templates</li>
                  <li className="flex items-start gap-3 text-sm text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Track milestones and disputes</li>
                  <li className="flex items-start gap-3 text-sm text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Manage API keys and settings</li>
                </ul>
              </PremiumCard>
            </FadeIn>
            <FadeIn delay={200}>
              <PremiumCard className="h-full">
                <div className="p-3 bg-emerald-500/10 rounded-xl w-fit mb-4"><Terminal size={24} className="text-emerald-500" /></div>
                <h3 className="text-xl font-bold text-white mb-4">Embed EscrowKit into your platform</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Deploy the factory and spawn escrow instances</li>
                  <li className="flex items-start gap-3 text-sm text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Run the indexer to sync events into a database</li>
                  <li className="flex items-start gap-3 text-sm text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Use signed webhooks to update your system in real time</li>
                  <li className="flex items-start gap-3 text-sm text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Use the API and transaction helpers to power your UI</li>
                  <li className="flex items-start gap-3 text-sm text-zinc-300"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Use the TypeScript SDK for integration</li>
                </ul>
              </PremiumCard>
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

      {/* CREDIBILITY SECTION */}
      <section className="relative z-10 py-20 md:py-32 px-6 border-t border-white/5 bg-[#050505]">
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
      </section>

      {/* CTA SECTION */}
      <section id="get-started" className="relative z-10 py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <div className="w-20 h-20 mx-auto mb-8 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl">
              <ShieldCheck size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Add trustless escrow to your product.</h2>
            <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
              Use milestone-based payments and dispute workflows without building escrow from scratch.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="https://github.com/chetanya1998/EscrowKit" target="_blank" id="docs">
                <button className="inline-flex items-center gap-3 px-10 py-4 border border-white/20 text-white rounded-full font-bold text-sm uppercase tracking-widest hover:border-emerald-500/60 hover:bg-emerald-500/10 transition-all">
                  <Github size={18} /> View Docs and GitHub
                </button>
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
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 md:py-24 md:px-12 border-t border-white/10 bg-[#000000]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 md:gap-16">
          <div className="flex flex-col gap-5 text-center md:text-left">
            <Link href="https://github.com/chetanya1998/EscrowKit" target="_blank" className="flex items-center gap-3 justify-center md:justify-start hover:opacity-80 transition-opacity">
              <ShieldCheck className="text-emerald-500" size={32} />
              <span className="font-bold text-3xl tracking-tighter text-white uppercase">EscrowKit</span>
            </Link>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.5em]">The Trustless Marketplace Engine</p>
          </div>

          <div className="flex gap-8 md:gap-12 text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-300 flex-wrap justify-center">
            <a href="/docs" className="hover:text-emerald-400 transition-colors">Docs</a>
            <a href="#roadmap" className="hover:text-emerald-400 transition-colors">Roadmap</a>
            <a href="https://github.com/chetanya1998/EscrowKit" target="_blank" className="hover:text-emerald-400 transition-colors">Contribute</a>
            <a href="https://github.com/chetanya1998/EscrowKit/blob/main/LICENSE" target="_blank" className="hover:text-emerald-400 transition-colors">License</a>
            <a href="https://github.com/chetanya1998/EscrowKit/issues" target="_blank" className="hover:text-emerald-400 transition-colors">Contact</a>
          </div>

          <div className="text-[10px] font-mono text-zinc-800">
            © 2024 EscrowKit
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
        <span className="text-zinc-300">git clone https://github.com/chetanya1998/EscrowKit.git</span>
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
    <Link href="https://github.com/chetanya1998/EscrowKit/issues" target="_blank" className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform mt-auto">
      View Issues <ArrowRight size={12} />
    </Link>
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

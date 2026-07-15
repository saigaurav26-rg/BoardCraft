import React, { useState, useEffect, useRef } from 'react';
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { 
  Sparkles, 
  Zap, 
  Users, 
  BookOpen, 
  Play, 
  Terminal, 
  Code, 
  Maximize2,
  Heart,
  ExternalLink,
  Sun,
  Moon,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

// NATIVE SVG FOR GITHUB
const CustomGitHubIcon = ({ className = "h-5 w-5" }) => (
  <svg 
    role="img" 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

// SCROLL REVEAL WRAPPER
function ScrollReveal({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      });
    }, { threshold: 0.1 });
    
    const { current } = domRef;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);
  const [demoShape, setDemoShape] = useState("rectangle");
  const [demoColor, setDemoColor] = useState("#10b981"); // Default Nexus green
  const [trail, setTrail] = useState([]);
  
  // Rotating text index state
  const [wordIndex, setWordIndex] = useState(0);
  const words = ["Canvas", "Support", "Experiences", "Relationships", "Service"];

  // Rotating Word Transition Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Trail Cursor Tracking Effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setTrail((prev) => [
        { x: e.clientX, y: e.clientY, id: Math.random() },
        ...prev.slice(0, 12)
      ]);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Sync state to HTML DOM for Tailwind dark class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleGitHubRedirect = () => {
    window.open("https://github.com", "_blank", "noopener,noreferrer");
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className={`min-h-screen w-full font-sans transition-colors duration-500 overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-400 ${
      isDark ? 'dark bg-[#08080c] text-slate-200' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* INJECTED CSS ANIMATION KEYFRAMES FOR ROTATING WORDS */}
      <style>{`
        @keyframes textSlideUp {
          0% {
            transform: translateY(20px);
            opacity: 0;
            filter: blur(4px);
          }
          15% {
            transform: translateY(0);
            opacity: 1;
            filter: blur(0);
          }
          85% {
            transform: translateY(0);
            opacity: 1;
            filter: blur(0);
          }
          100% {
            transform: translateY(-20px);
            opacity: 0;
            filter: blur(4px);
          }
        }
        .animate-word-change {
          animation: textSlideUp 2.5s infinite ease-in-out;
        }
      `}</style>

      {/* CUSTOM PARTICLES/DOT TRAIL FROM CURSOR */}
      <div className="pointer-events-none fixed inset-0 z-50">
        {trail.map((dot, index) => (
          <div
            key={dot.id}
            className={`absolute rounded-full transition-opacity duration-300 pointer-events-none ${
              isDark ? 'bg-emerald-400/30 shadow-[0_0_8px_#10b981]' : 'bg-indigo-600/20'
            }`}
            style={{
              left: dot.x - 4,
              top: dot.y - 4,
              width: `${12 - index * 0.8}px`,
              height: `${12 - index * 0.8}px`,
              opacity: (12 - index) / 12,
              transform: 'translate3d(0,0,0)'
            }}
          />
        ))}
      </div>

      {/* NEXUS STYLE BACKGROUND GRID PATTERN */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* HERO GLOW EFFECT (TOP CENTER) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* HEADER NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b backdrop-blur-xl bg-white/70 dark:bg-[#08080c]/70 border-slate-200/80 dark:border-slate-900/80 px-6 md:px-12 flex items-center justify-between transition-colors duration-300">
        {/* Brand Logo - Symbol REMOVED, keep only styled typography */}
        <div 
          className="flex items-center gap-1.5 font-bold text-xl tracking-tight cursor-pointer" 
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <span className="bg-gradient-to-r from-slate-900 via-emerald-600 to-emerald-400 dark:from-white dark:via-emerald-400 dark:to-teal-300 bg-clip-text text-transparent font-extrabold tracking-tight font-sans">
            BoardCraft
          </span>
        </div>

        {/* Links Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-400 absolute left-1/2 -translate-x-1/2">
          <button onClick={() => scrollToSection("features")} className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">Features</button>
          <button onClick={() => scrollToSection("live-demo")} className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">Live Demo</button>
          <button onClick={() => scrollToSection("docs")} className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">Docs</button>
        </nav>

        {/* Action Blocks */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400">
            {isDark ? <Sun className="h-[18px] w-[18px] text-amber-400" /> : <Moon className="h-[18px] w-[18px] text-indigo-600" />}
          </Button>

          <Button variant="ghost" size="icon" onClick={handleGitHubRedirect} className="text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400">
            <CustomGitHubIcon className="h-4 w-4" />
          </Button>

          {/* CLERK ACTIONS */}
          <SignedOut>
            <Link to="/login" className="hidden sm:inline-block">
              <button className="text-sm font-semibold px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                Sign In
              </button>
            </Link>
            <Link to="/signup">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-full px-5 py-2 shadow-lg shadow-emerald-500/10 transition-all active:scale-95 text-xs">
                Book a demo
              </Button>
            </Link>
          </SignedOut>

          <SignedIn>
            <Link to="/dashboard">
              <button className="text-sm font-semibold px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-400 transition-colors">
                Dashboard
              </button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-36 pb-20 px-6 md:px-12 flex flex-col items-center text-center max-w-4xl mx-auto space-y-6">
        {/* Announce Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm">
          <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
          <span>Announcing our new dynamic sketch suite</span>
        </div>

        {/* Big Nexus Title with Rotating Text Array */}
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.1] text-slate-900 dark:text-white">
          Deliver collaborative <br />
          <span className="relative inline-block h-[1.2em] overflow-hidden align-bottom">
            <span 
              key={wordIndex} 
              className="absolute left-0 right-0 animate-word-change bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 dark:from-emerald-400 dark:via-emerald-300 dark:to-teal-300 bg-clip-text text-transparent"
            >
              {words[wordIndex]}
            </span>
            {/* Invisibly render the longest word to preserve text bounding size and prevent layout layout-shifting */}
            <span className="opacity-0 select-none pointer-events-none">Relationships</span>
          </span>
        </h1>

        <p className="text-base sm:text-lg max-w-2xl leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
          Support your team's brightest sketches on infinite canvas. Wireframe, map architecture design, and sync in real-time with responsive vector aesthetics.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 w-full sm:w-auto justify-center">
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 hover:shadow-emerald-500/20 text-slate-950 font-bold px-8 h-12 rounded-full shadow-lg shadow-emerald-500/10 w-full sm:w-auto transition-all active:scale-95 flex items-center justify-center gap-2">
              Start Free Hand-Sketching <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button onClick={handleGitHubRedirect} size="lg" variant="outline" className="font-semibold px-6 h-12 rounded-full w-full sm:w-auto flex items-center justify-center gap-2 bg-transparent border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300 transition-all active:scale-95">
            <CustomGitHubIcon className="h-4 w-4" /> View Open Source
          </Button>
        </div>
      </section>

      {/* SKETCHING IMAGE SECTION (Organic Sketching Viewpoint) */}
      <ScrollReveal>
        <div className="max-w-5xl mx-auto px-6 mb-28">
          <div className="rounded-2xl border p-3 shadow-[0_0_50px_rgba(16,185,129,0.08)] dark:shadow-[0_0_50px_rgba(16,185,129,0.05)] relative border-slate-200/80 dark:border-slate-900 bg-slate-200/30 dark:bg-slate-950/40 backdrop-blur-sm">
            <div className="absolute top-4 left-4 flex gap-1.5 z-10">
              <div className="w-3 h-3 rounded-full bg-rose-500/40" />
              <div className="w-3 h-3 rounded-full bg-amber-500/40" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/40" />
            </div>

            {/* Hand-drawn Mock Vector Sketch Concept Illustration */}
            <div className="w-full min-h-[420px] rounded-xl border flex flex-col items-center justify-center relative overflow-hidden border-slate-300 dark:border-slate-800 bg-white dark:bg-[#06060a]">
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />
              
              {/* Organic Hand-Drawn Sketch Drawing Overlay */}
              <svg className="w-full max-w-3xl h-96 p-4 text-emerald-500 dark:text-emerald-400 opacity-90 stroke-current fill-none transition-transform duration-700 hover:scale-[1.02]" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 800 400">
                {/* Hand Drawn Cloud Sketch */}
                <path d="M 120,180 Q 110,140 150,130 Q 170,90 220,110 Q 250,90 280,120 Q 320,110 310,150 Q 340,180 300,210 Q 280,240 230,220 Q 190,240 160,210 Q 100,210 120,180 Z" className="animate-[pulse_4s_infinite_alternate]" />
                <text x="160" y="170" className="fill-slate-800 dark:fill-slate-200 text-xs font-mono tracking-wider stroke-0 font-bold">Cloud Server</text>

                {/* Hand Drawn Connection Lines with Arrows */}
                <path d="M 320,170 C 370,170 380,110 440,110" />
                <path d="M 430,105 L 442,110 L 430,115" />

                <path d="M 320,170 C 370,170 380,230 440,230" />
                <path d="M 430,225 L 442,230 L 430,235" />

                {/* Hand Drawn Rectangle Database Node */}
                <path d="M 450,80 L 580,80 C 585,82 583,78 580,140 L 450,140 C 445,138 448,142 450,80" />
                <text x="470" y="115" className="fill-slate-800 dark:fill-slate-200 text-xs font-mono stroke-0 font-bold">Web Frontend</text>

                {/* Hand Drawn Circle Sync Node */}
                <path d="M 515,230 A 40,42 0 1 1 514.9,230 Z" />
                <text x="488" y="235" className="fill-slate-800 dark:fill-slate-200 text-xs font-mono stroke-0 font-bold">Sync API</text>

                {/* Annotation arrow & notes */}
                <path d="M 280,310 C 360,330 420,310 480,255" className="stroke-dashed stroke-emerald-500/60" />
                <path d="M 470,252 L 482,253 L 477,262" className="stroke-emerald-500/60" />
                <text x="220" y="340" className="fill-emerald-600 dark:fill-emerald-400 text-xs font-mono stroke-0 italic">"Real-time websocket sync frame loop"</text>
              </svg>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* "PACKED WITH EVERYTHING YOU NEED" SECTION (With Glowing Dynamic Hover/Animation Effects) */}
      <section id="features" className="py-24 border-t scroll-mt-16 bg-slate-100/30 dark:bg-slate-950/20 border-slate-200/80 dark:border-slate-900/80">
        <div className="max-w-5xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center max-w-xl mx-auto mb-20 space-y-4">
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Packed with everything you need</h2>
              <p className="text-base leading-relaxed text-slate-500 dark:text-slate-400">Zero bloat. Absolute performance. Built purely for high-fidelity hand-drawn designs.</p>
            </div>
          </ScrollReveal>

          {/* Glowing Animated Interactive Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "Hand-Drawn Logic", 
                desc: "Convert boring vector shapes into warm, sketchy components effortlessly using our smart geometry engine.", 
                icon: Sparkles, 
                color: "text-emerald-400 shadow-emerald-500/10", 
                badge: "✍️" 
              },
              { 
                title: "Optimized Export", 
                desc: "Quickly export frames directly to clean SVG formats, dynamic high-res PNG arrays, or clipboards with single key bindings.", 
                icon: Zap, 
                color: "text-teal-400 shadow-teal-500/10", 
                badge: "⚡" 
              },
              { 
                title: "Low-Latency Sync", 
                desc: "Brainstorm on the same shared spatial workspace safely with teammates using reliable zero-lag multiplayer setups.", 
                icon: Users, 
                color: "text-emerald-500 shadow-emerald-500/10", 
                badge: "👥" 
              }
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <ScrollReveal key={idx}>
                  <div className="group relative rounded-2xl p-[1px] bg-slate-200 dark:bg-slate-900 hover:bg-gradient-to-br hover:from-emerald-500 hover:to-teal-300 transition-all duration-500 shadow-md hover:shadow-xl hover:shadow-emerald-500/10 transform hover:-translate-y-2">
                    <div className="relative rounded-[15px] p-8 h-full bg-white dark:bg-[#0a0a0f] transition-all">
                      
                      {/* Glow effect spot inside card */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                      <div className="flex items-center justify-between mb-6">
                        <div className={`p-3 rounded-xl border bg-slate-50 dark:bg-[#0c0c14] border-slate-200 dark:border-slate-800 ${feat.color}`}>
                          <Icon className="h-6 w-6 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-2xl filter drop-shadow-[0_4px_12px_rgba(16,185,129,0.15)] group-hover:rotate-12 transition-transform duration-300">{feat.badge}</span>
                      </div>
                      
                      <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-3 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                        {feat.title}
                      </h3>
                      
                      <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* LIVE DEMO SECTION */}
      <section id="live-demo" className="py-24 border-t scroll-mt-16 border-slate-200 dark:border-slate-900">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <ScrollReveal>
            <div className="text-center max-w-xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Play className="h-3 w-3 fill-current" /> Interactive Sandbox
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Try interactive micro-canvas</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Test our vector render layers in real-time. No sign-up required.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 rounded-2xl border p-6 bg-white dark:bg-[#09090e] border-slate-200 dark:border-slate-900 shadow-lg">
              {/* Controls panel */}
              <div className="space-y-6 lg:col-span-1 flex flex-col justify-center">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Preset</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["rectangle", "circle"].map((shape) => (
                      <button
                        key={shape}
                        onClick={() => setDemoShape(shape)}
                        className={`py-2 px-3 text-xs font-bold rounded-full capitalize border transition-all ${
                          demoShape === shape 
                            ? "bg-emerald-500 border-emerald-400 text-slate-950 font-extrabold" 
                            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-400"
                        }`}
                      >
                        {shape}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Stroke Glow</label>
                  <div className="flex gap-3">
                    {["#10b981", "#3b82f6", "#ec4899", "#eab308"].map((color) => (
                      <button
                        key={color}
                        onClick={() => setDemoColor(color)}
                        style={{ backgroundColor: color }}
                        className={`w-7 h-7 rounded-full transition-transform ${
                          demoColor === color ? "scale-125 ring-2 ring-emerald-400 dark:ring-white ring-offset-2 dark:ring-offset-[#08080c]" : "hover:scale-110"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Vector view area */}
              <div className="lg:col-span-3 h-72 lg:h-80 rounded-xl border relative flex items-center justify-center bg-slate-50 dark:bg-[#050508] border-slate-200/80 dark:border-slate-900 overflow-hidden">
                <div className="absolute top-3 left-3 text-[10px] font-mono text-slate-400 tracking-widest uppercase">Renderer Vector Interface</div>
                <div className="transition-all duration-500 transform hover:scale-110" style={{ color: demoColor }}>
                  {demoShape === "rectangle" ? (
                    <div 
                      className="w-44 h-28 border-4 rounded-xl transition-all duration-300" 
                      style={{ 
                        borderColor: demoColor, 
                        boxShadow: `0 0 30px ${demoColor}30`, 
                        backgroundColor: `${demoColor}15` 
                      }} 
                    />
                  ) : (
                    <div 
                      className="w-32 h-32 border-4 rounded-full transition-all duration-300" 
                      style={{ 
                        borderColor: demoColor, 
                        boxShadow: `0 0 30px ${demoColor}30`, 
                        backgroundColor: `${demoColor}15` 
                      }} 
                    />
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* DOCUMENTATION SECTION */}
      <section id="docs" className="py-24 border-t scroll-mt-16 bg-slate-100/20 dark:bg-slate-950/10 border-slate-200 dark:border-slate-900">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4 md:col-span-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-500">
              <BookOpen className="h-4 w-4" /> Architectural Schemas
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Developer Specs</h2>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
              Access modular configuration matrices, coordinates structures, and high-frequency key bindings.
            </p>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="border rounded-xl p-6 space-y-4 bg-white dark:bg-[#09090e] border-slate-200 dark:border-slate-900/60 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Terminal className="h-4 w-4 text-emerald-500" />
                <span>Initialize Board SDK package</span>
              </div>
              <div className="rounded-lg p-4 font-mono text-xs border overflow-x-auto whitespace-pre bg-slate-50 dark:bg-slate-900/80 text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-800/60">
                npm install @boardcraft/canvas-core roughjs
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border rounded-xl p-5 space-y-2 bg-white dark:bg-[#09090e] border-slate-200 dark:border-slate-900/60 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Code className="h-3.5 w-3.5 text-emerald-500" /> Vector Schemas
                </div>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Every asset is preserved natively inside structured arrays containing coordinates ($x_1$, $y_1$), operational dimensions, opacity parameters, and custom type definitions.
                </p>
              </div>

              <div className="border rounded-xl p-5 space-y-2 bg-white dark:bg-[#09090e] border-slate-200 dark:border-slate-900/60 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Maximize2 className="h-3.5 w-3.5 text-emerald-500" /> Rapid Bindings
                </div>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Accelerate board mapping speeds using quick triggers: <code className="px-1 py-0.5 rounded font-mono bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-300">V</code> for selection tools, and <code className="px-1 py-0.5 rounded font-mono bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-300">R</code> for rectangles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER SECTION - Fully Black in Dark Theme and Pure White in Light Theme */}
      <footer className="border-t pt-16 pb-8 px-6 md:px-12 transition-colors duration-500 bg-white text-black dark:bg-[#000000] dark:text-white border-slate-200 dark:border-slate-950">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2 font-black text-xl tracking-tight">
              <span>BoardCraft</span>
            </div>
            <p className="text-xs max-w-xs leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
              The high-performance spatial whiteboarding environment tailored for system engineers, agile product developers, and interface crafters.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Status: All Core Canvas Systems Normal</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Product</h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <li><button onClick={() => scrollToSection("features")} className="hover:text-emerald-400 transition-colors">Features Layer</button></li>
              <li><button onClick={() => scrollToSection("live-demo")} className="hover:text-emerald-400 transition-colors">Interactive Engine</button></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Enterprise Sync</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Resources</h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <li><button onClick={() => scrollToSection("docs")} className="hover:text-emerald-400 transition-colors">Documentation</button></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">API References</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Open Source Center</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Community</h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <li><button onClick={handleGitHubRedirect} className="hover:text-emerald-400 transition-colors flex items-center gap-1">GitHub Repositories <ExternalLink className="h-2.5 w-2.5" /></button></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Discord Workspace</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Twitter Updates</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-5xl mx-auto border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] border-slate-200 dark:border-slate-900 text-slate-600 dark:text-slate-500 font-semibold">
          <p>&copy; {new Date().getFullYear()} BoardCraft Inc. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Designed and compiled with</span>
            <Heart className="h-3 w-3 text-rose-500 fill-rose-500 mx-0.5" />
            <span>by Gaurav</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
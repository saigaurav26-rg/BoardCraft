import React, { useState, useEffect } from 'react';
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
  Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// NATIVE SVG FOR GITHUB TO BYPASS ANY EXPORT INTEROP ERRORS
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

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);
  const [demoShape, setDemoShape] = useState("rectangle");
  const [demoColor, setDemoColor] = useState("#6366f1");

  // Sync state token to DOM class reference for complete Tailwind dark wrapper support
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
    <div className={`min-h-screen w-full font-sans transition-colors duration-300 ${isDark ? 'dark bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* PERFECTLY CENTER-ALIGNED NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b backdrop-blur-md bg-white/80 dark:bg-[#030712]/80 border-slate-200 dark:border-slate-900 px-6 md:px-12 flex items-center justify-between transition-colors duration-300">
        
        {/* Brand Logo Left */}
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-indigo-600 dark:text-indigo-400 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">⚡</div>
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">BoardCraft</span>
        </div>

        {/* Center Aligned Links Group */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400 absolute left-1/2 -translate-x-1/2">
          <button onClick={() => scrollToSection("features")} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</button>
          <button onClick={() => scrollToSection("live-demo")} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Live Demo</button>
          <button onClick={() => scrollToSection("docs")} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Docs</button>
        </nav>

        {/* Right Actions Block */}
        <div className="flex items-center gap-3.5">
          {/* Active Custom Theme Control Switcher */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900">
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
          </Button>

          <Button variant="ghost" size="icon" onClick={handleGitHubRedirect} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900">
            <CustomGitHubIcon className="h-4 w-4" />
          </Button>

          {/* CLERK LIVE AUTH ACTIONS INTEGRATION */}
          <SignedOut>
            <Link to="/login">
              <button className="text-sm font-medium px-3 py-1.5 transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                Sign In
              </button>
            </Link>
            <Link to="/signup">
              <Button className="bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white rounded-lg px-4 shadow-md shadow-indigo-600/10 transition-all active:scale-95">
                Sign Up
              </Button>
            </Link>
          </SignedOut>

          <SignedIn>
            <Link to="/dashboard">
              <button className="text-sm font-medium px-3 py-1.5 transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                Go to Dashboard
              </button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-6 md:px-12 flex flex-col items-center text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium border-indigo-100 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
          <Sparkles className="h-3 w-3" />
          <span>Sketch, Collaborate, and Build</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
          The ultimate canvas for your <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">wildest ideas.</span>
        </h1>

        <p className="text-base sm:text-lg max-w-2xl leading-relaxed text-slate-500 dark:text-slate-400">
          An open-source, hand-drawn styled whiteboard app to sketch diagrams, wireframes, or brainstorm with your team in real-time.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:w-auto justify-center">
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 h-12 rounded-xl shadow-lg shadow-indigo-600/20 w-full sm:w-auto transition-all active:scale-95">
              Start Drawing — It's Free
            </Button>
          </Link>
          <Button onClick={handleGitHubRedirect} size="lg" variant="outline" className="font-medium px-6 h-12 rounded-xl w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 transition-all active:scale-95">
            <CustomGitHubIcon className="h-4 w-4" /> View on GitHub
          </Button>
        </div>
      </section>

      {/* INTERACTIVE PREVIEW PANEL */}
      <div className="max-w-5xl mx-auto px-6 mb-24">
        <div className="rounded-xl border p-2 shadow-2xl relative border-slate-200 dark:border-slate-900 bg-slate-200/60 dark:bg-slate-950">
          <div className="absolute top-4 left-4 flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <div className="w-full h-[400px] rounded-lg border flex flex-col items-center justify-center relative overflow-hidden border-slate-300 dark:border-slate-900/60 bg-slate-100 dark:bg-[#070a13]">
            <div className="absolute top-4 p-1 rounded-lg border flex gap-4 text-xs font-mono px-3 py-1.5 bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shadow-sm">
              <span className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5">⬠ Rectangle</span>
              <span className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5">◯ Circle</span>
              <span className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5">↗ Arrow</span>
              <span className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5">✎ Draw</span>
            </div>
            
            <div className="whiteboard-mockup relative w-full h-full text-slate-400 dark:text-slate-500 p-12 mt-6">
              <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-current rounded-xl p-4 text-left w-64 bg-white/50 dark:bg-transparent shadow-sm dark:shadow-none">
                <p className="font-bold text-base text-slate-800 dark:text-slate-200 mb-1">User Experience Loop</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Define user flow, identify pain points, and map out the ideal interaction paths.</p>
              </div>

              <div className="absolute top-1/4 left-3/4 transform -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-current rounded-xl p-4 text-left w-64 bg-white/50 dark:bg-transparent shadow-sm dark:shadow-none">
                <p className="font-bold text-base text-slate-800 dark:text-slate-200 mb-1">Core Features List</p>
                <ul className="text-xs list-disc pl-4 text-slate-500 dark:text-slate-400 space-y-0.5">
                  <li>Real-time Collaboration</li>
                  <li>Hand-drawn Aesthetics</li>
                  <li>Infinite Canvas</li>
                  <li>Instant SVG Export</li>
                </ul>
              </div>

              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 border-2 border-dashed border-current rounded-xl p-4 text-center w-80 bg-white/50 dark:bg-transparent shadow-sm dark:shadow-none">
                <p className="font-bold text-base text-slate-800 dark:text-slate-200 mb-2">Component Architecture Sketch</p>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                  <div className="border border-current rounded p-1 bg-white dark:bg-slate-900">Navbar</div>
                  <div className="border border-current rounded p-1 col-span-2 bg-white dark:bg-slate-900">MainCanvas</div>
                  <div className="border border-current rounded p-1 col-span-3 bg-white dark:bg-slate-900">Sidebar (Tools & Layers)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 border-t scroll-mt-16 bg-slate-100/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-900">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Packed with everything you need</h2>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">No bloat. Just speed, fluid hand-drawn aesthetics, and robust drawing tools.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Hand-Drawn Feel", desc: "Transform rigid shapes into beautiful, organic sketches automatically using rough.js logic.", icon: Sparkles, color: "text-amber-500", badge: "✍️" },
              { title: "Instant Export", desc: "Save your canvas directly to PNG, SVG, or copy it instantly onto your clipboard with one click.", icon: Zap, color: "text-indigo-500", badge: "⚡" },
              { title: "Live Syncing", desc: "Invite your team with a shareable URL and brainstorm together on a low-latency shared state.", icon: Users, color: "text-purple-500", badge: "👥" }
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <Card key={idx} className="transition-all hover:border-indigo-500/50 bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-900 shadow-sm dark:shadow-none">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 ${feat.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xl">{feat.badge}</span>
                    </div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{feat.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{feat.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* LIVE DEMO SECTION */}
      <section id="live-demo" className="py-24 border-t scroll-mt-16 border-slate-200 dark:border-slate-900">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60">
              <Play className="h-3 w-3 fill-current" /> Interactive Sandbox
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Try it live inside the page</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Interact with our micro-render interface framework instantly. No signup required.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 rounded-2xl border p-4 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-900 shadow-sm dark:shadow-none">
            <div className="space-y-6 p-2 lg:col-span-1">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Select Shape</label>
                <div className="grid grid-cols-2 gap-2">
                  {["rectangle", "circle"].map((shape) => (
                    <button
                      key={shape}
                      onClick={() => setDemoShape(shape)}
                      className={`py-2 text-xs font-medium rounded-lg capitalize border transition ${
                        demoShape === shape ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:text-white"
                      }`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stroke Color</label>
                <div className="flex gap-2">
                  {["#6366f1", "#10b981", "#f59e0b", "#ec4899"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setDemoColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-6 h-6 rounded-full transition-transform border-2 ${demoColor === color ? "scale-110 border-slate-400 dark:border-white" : "border-transparent"}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 h-64 lg:h-80 rounded-xl border relative flex items-center justify-center bg-slate-50 dark:bg-[#06080f] border-slate-200 dark:border-slate-900">
              <div className="absolute top-3 left-3 text-[10px] font-mono text-slate-400">Canvas Core Sandbox Layer</div>
              <div className="transition-all duration-300 transform hover:scale-105" style={{ color: demoColor }}>
                {demoShape === "rectangle" ? (
                  <div className="w-36 h-24 border-4 rounded-md bg-opacity-10 animate-pulse" style={{ borderColor: demoColor, backgroundColor: `${demoColor}15` }} />
                ) : (
                  <div className="w-28 h-28 border-4 rounded-full bg-opacity-10 animate-pulse" style={{ borderColor: demoColor, backgroundColor: `${demoColor}15` }} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DOCUMENTATION SECTION */}
      <section id="docs" className="py-24 border-t scroll-mt-16 bg-slate-100/30 dark:bg-slate-950/20 border-slate-200 dark:border-slate-900">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4 md:col-span-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-purple-500">
              <BookOpen className="h-4 w-4" /> Technical Blueprints
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Developer Docs</h2>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Explore configuration options, programmatic layout parameters, and quick keyboard utility schemas.
            </p>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="border rounded-xl p-5 space-y-4 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-900 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Terminal className="h-4 w-4 text-indigo-500" />
                <span>Quickstart Framework Integration</span>
              </div>
              <div className="rounded-lg p-3 font-mono text-xs border overflow-x-auto whitespace-pre bg-slate-50 dark:bg-slate-900/60 text-indigo-700 dark:text-indigo-300 border-slate-200 dark:border-slate-800/60">
                npm install @boardcraft/canvas-core roughjs
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border rounded-xl p-5 space-y-2 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-900 shadow-sm dark:shadow-none">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Code className="h-3.5 w-3.5 text-purple-500" /> Elements Schema
                </div>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Every asset is preserved natively inside structured arrays containing coordinates ($x_1$, $y_1$), operational dimensions, opacity parameters, and custom type definitions.
                </p>
              </div>

              <div className="border rounded-xl p-5 space-y-2 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-900 shadow-sm dark:shadow-none">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Maximize2 className="h-3.5 w-3.5 text-emerald-500" /> Hotkey Shortcuts
                </div>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Accelerate board mapping speeds using quick triggers: <code className="px-1 py-0.5 rounded font-mono bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-300">V</code> for selection tools, and <code className="px-1 py-0.5 rounded font-mono bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-300">R</code> for rectangles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER SECTION */}
      <footer className="border-t pt-16 pb-8 px-6 md:px-12 bg-slate-100 dark:bg-slate-950/60 border-slate-200 dark:border-slate-900">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-indigo-500">
              <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center text-white text-xs font-black">⚡</div>
              <span>BoardCraft</span>
            </div>
            <p className="text-xs max-w-xs leading-relaxed text-slate-500 dark:text-slate-400">
              The high-performance spatial whiteboarding environment tailored for system engineers, agile product developers, and interface crafters.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] border bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 fill-emerald-500 animate-ping" />
              <span>Status: All Systems Operational</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Product</h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li><button onClick={() => scrollToSection("features")} className="hover:text-indigo-500 transition-colors">Features Layer</button></li>
              <li><button onClick={() => scrollToSection("live-demo")} className="hover:text-indigo-500 transition-colors">Interactive Engine</button></li>
              <li><a href="#" className="hover:text-indigo-500 transition-colors">Enterprise Sync</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Resources</h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li><button onClick={() => scrollToSection("docs")} className="hover:text-indigo-500 transition-colors">Documentation</button></li>
              <li><a href="#" className="hover:text-indigo-500 transition-colors">API References</a></li>
              <li><a href="#" className="hover:text-indigo-500 transition-colors">Open Source Center</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Community</h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li><button onClick={handleGitHubRedirect} className="hover:text-indigo-500 transition-colors flex items-center gap-1">GitHub Repositories <ExternalLink className="h-2.5 w-2.5" /></button></li>
              <li><a href="#" className="hover:text-indigo-500 transition-colors">Discord Workspace</a></li>
              <li><a href="#" className="hover:text-indigo-500 transition-colors">Twitter Updates</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-5xl mx-auto border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] border-slate-200 dark:border-slate-900 text-slate-400 dark:text-slate-500">
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
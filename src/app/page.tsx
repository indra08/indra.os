"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import BootSequence from "@/components/BootSequence";
import NeuralNav from "@/components/NeuralNav";
import SkillGalaxy from "@/components/SkillGalaxy";
import DataFlow from "@/components/DataFlow";
import ProjectTunnel from "@/components/ProjectTunnel";
import DevOpsDashboard from "@/components/DevOpsDashboard";
import CommandCenter from "@/components/CommandCenter";
import ContactPortal from "@/components/ContactPortal";
import CursorEffect from "@/components/CursorEffect";
import ScrollManager from "@/components/ScrollManager";

export default function Home() {
  const [bootComplete, setBootComplete] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const sectionIds = [
    "neural-nav",
    "skill-galaxy",
    "data-flow",
    "project-tunnel",
    "devops-dashboard",
    "command-center",
    "contact-portal",
  ];

  const setSectionRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      sectionRefs.current[index] = el;
    },
    []
  );

  useEffect(() => {
    if (!bootComplete) return;
    document.body.style.cursor = "none";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [bootComplete]);

  if (!bootComplete) {
    return <BootSequence onComplete={() => setBootComplete(true)} />;
  }

  return (
    <>
      <CursorEffect />
      <ScrollManager
        sectionIds={sectionIds}
        onSectionChange={setActiveSection}
        sectionRefs={sectionRefs}
      />
      <NeuralNav activeSection={activeSection} sectionIds={sectionIds} />
      <main className="relative">
        <section
          ref={setSectionRef(0)}
          id="neural-nav"
          className="min-h-screen relative overflow-hidden cyber-grid"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-void-deep via-transparent to-void-deep pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-16 md:pt-20">
            {/* Profile Photo */}
            <div className="relative mb-10">
              <svg className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)]" viewBox="0 0 220 220">
                <circle cx="110" cy="110" r="105" fill="none" stroke="rgba(124,92,252,0.25)" strokeWidth="1" strokeDasharray="8 4" />
              </svg>
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border border-white/5 shadow-2xl shadow-purple-900/20">
                <img src="/pro.png" alt="Indra Maulana" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-3 -right-3 bg-void-surface/90 backdrop-blur-md border border-void-border rounded-xl px-4 py-2 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-sm font-semibold text-white">Available</span>
              </div>
            </div>
            <div className="text-center max-w-4xl">
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.85] mb-4">
                <span className="text-white">Indra</span><br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400">
                  Maulana
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 font-mono mb-4">
                Tech Lead &amp; Product Engineering Manager
              </p>
              <p className="text-base text-gray-500 max-w-xl mx-auto leading-relaxed mb-10">
                I lead teams through the full application development lifecycle — from requirements analysis and architecture design to quality delivery. Agile practitioner. DevOps enthusiast. Full-stack builder when needed.
              </p>
              <div className="flex flex-wrap gap-8 md:gap-16 justify-center mt-12">
                <div>
                  <div className="text-4xl md:text-5xl font-black text-white">100+</div>
                  <div className="text-sm text-gray-500 mt-1 font-mono">Products shipped</div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-black text-white">10+</div>
                  <div className="text-sm text-gray-500 mt-1 font-mono">Years of impact</div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-black text-white">50+</div>
                  <div className="text-sm text-gray-500 mt-1 font-mono">Happy clients</div>
                </div>
              </div>
              <div className="mt-12 flex gap-4 justify-center">
                {["TECH LEAD", "ARCHITECT", "FULL-STACK"].map((label, i) => (
                  <div
                    key={label}
                    className="px-6 py-2 border border-void-border rounded text-xs font-mono text-gray-500 hover:text-neon-cyan hover:border-neon-cyan/40 transition-colors duration-500"
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    [{label}]
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          ref={setSectionRef(1)}
          id="skill-galaxy"
          className="min-h-screen relative overflow-hidden"
        >
          <SkillGalaxy />
        </section>

        <section
          ref={setSectionRef(2)}
          id="data-flow"
          className="min-h-screen relative overflow-hidden"
        >
          <DataFlow />
        </section>

        <section
          ref={setSectionRef(3)}
          id="project-tunnel"
          className="min-h-screen relative overflow-hidden"
        >
          <ProjectTunnel />
        </section>

        <section
          ref={setSectionRef(4)}
          id="devops-dashboard"
          className="min-h-screen relative overflow-hidden"
        >
          <DevOpsDashboard />
        </section>

        <section
          ref={setSectionRef(5)}
          id="command-center"
          className="min-h-screen relative overflow-hidden"
        >
          <CommandCenter />
        </section>

        <section
          ref={setSectionRef(6)}
          id="contact-portal"
          className="min-h-screen relative overflow-hidden"
        >
          <ContactPortal />
        </section>
      </main>
    </>
  );
}

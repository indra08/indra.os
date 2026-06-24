"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

interface NeuralNavProps {
  activeSection: number;
  sectionIds: string[];
}

const NAV_ITEMS = [
  { id: "neural-nav", label: "HOME", icon: "◈" },
  { id: "skill-galaxy", label: "SKILLS", icon: "◆" },
  { id: "data-flow", label: "EXPERIENCE", icon: "▶" },
  { id: "project-tunnel", label: "PROJECTS", icon: "◉" },
  { id: "command-center", label: "TERMINAL", icon: "▣" },
  { id: "contact-portal", label: "CONTACT", icon: "◉" },
];

export default function NeuralNav({ activeSection }: NeuralNavProps) {
  const navRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<SVGSVGElement>(null);
  const prevSection = useRef(activeSection);

  useEffect(() => {
    if (!navRef.current) return;

    // Animate nav bar entrance
    anime({
      targets: navRef.current,
      translateY: [-80, 0],
      opacity: [0, 1],
      duration: 1000,
      easing: "easeOutExpo",
      delay: 200,
    });
  }, []);

  useEffect(() => {
    if (!navRef.current || prevSection.current === activeSection) return;

    const items = navRef.current.querySelectorAll(".nav-item");
    const current = items[activeSection] as HTMLElement;
    const previous = items[prevSection.current] as HTMLElement;

    if (previous) {
      anime({
        targets: previous,
        color: "#666",
        scale: 1,
        duration: 300,
        easing: "easeOutQuad",
      });
    }

    if (current) {
      anime({
        targets: current,
        color: ["#666", "#00f0ff"],
        scale: [1, 1.1, 1],
        duration: 400,
        easing: "easeOutElastic(1, .6)",
      });
    }

    // Animate connecting line between nodes
    if (linesRef.current) {
      const line = linesRef.current.querySelector(".nav-path") as SVGPathElement;
      if (line) {
        const startX = 20 + previous.getBoundingClientRect().left;
        const endX = 20 + current.getBoundingClientRect().left;
        const startY = 24;
        const pathData = `M${startX} ${startY} Q${(startX + endX) / 2} 40 ${endX} ${startY}`;
        line.setAttribute("d", pathData);
        anime({
          targets: line,
          strokeDashoffset: [anime.setDashoffset, 0],
          duration: 600,
          easing: "easeInOutQuad",
        });
      }
    }

    prevSection.current = activeSection;
  }, [activeSection]);

  const handleNavClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 bg-void-deep/90 backdrop-blur-md border-b border-void-border"
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="font-mono text-neon-cyan text-sm tracking-wider">
          <span className="text-purple-400">&lt;</span>
          IM
          <span className="text-purple-400">/&gt;</span>
        </div>

        {/* Nav items */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item, i) => (
            <button
              key={item.id}
              data-interactive
              onClick={() => handleNavClick(item.id)}
              className={`nav-item px-3 py-1.5 font-mono text-xs tracking-wider transition-colors relative group ${
                i === activeSection
                  ? "text-neon-cyan"
                  : "text-gray-600 hover:text-gray-400"
              }`}
            >
              <span className="mr-1 opacity-50">{item.icon}</span>
              {item.label}
              {/* Active indicator */}
              {i === activeSection && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-neon-cyan rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          data-interactive
          className="md:hidden font-mono text-neon-cyan text-sm"
          onClick={() => {
            const nav = document.getElementById("mobile-nav");
            if (nav) {
              const isOpen = nav.style.display === "flex";
              nav.style.display = isOpen ? "none" : "flex";
            }
          }}
        >
          [MENU]
        </button>
      </div>

      {/* Mobile nav dropdown */}
      <div
        id="mobile-nav"
        className="hidden md:hidden flex-col bg-void-deep/95 backdrop-blur-md border-b border-void-border px-4 py-2 gap-1"
      >
        {NAV_ITEMS.map((item, i) => (
          <button
            key={item.id}
            data-interactive
            onClick={() => handleNavClick(item.id)}
            className={`nav-item px-3 py-2 font-mono text-xs text-left ${
              i === activeSection ? "text-neon-cyan" : "text-gray-500"
            }`}
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* SVG connection lines */}
      <svg
        ref={linesRef}
        className="absolute bottom-0 left-0 w-full h-10 pointer-events-none opacity-0 md:opacity-30"
      >
        <path
          className="nav-path"
          d="M0 24 Q400 40 800 24"
          fill="none"
          stroke="#00f0ff"
          strokeWidth="0.5"
          strokeDasharray="1000"
          strokeDashoffset="1000"
        />
      </svg>
    </nav>
  );
}

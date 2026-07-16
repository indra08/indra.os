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
  { id: "devops-dashboard", label: "DEVOPS", icon: "◈" },
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

    if (current) {
      // Only animate scale — color handled by React/Tailwind classes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      anime({ targets: current, scale: [1, 1.15, 1], duration: 500, easing: "easeOutElastic(1, .5)" } as any);
    }

    // Animate connecting SVG line between nav items
    if (linesRef.current) {
      const prev = items[prevSection.current] as HTMLElement;
      const cur = items[activeSection] as HTMLElement;
      if (prev && cur) {
        const prevRect = prev.getBoundingClientRect();
        const curRect = cur.getBoundingClientRect();
        const navRect = linesRef.current.getBoundingClientRect();
        const x1 = prevRect.left + prevRect.width / 2 - navRect.left;
        const x2 = curRect.left + curRect.width / 2 - navRect.left;
        const y = 26;
        const line = linesRef.current.querySelector(".nav-path") as SVGPathElement;
        if (line) {
          line.setAttribute("d", `M${x1} ${y} Q${(x1 + x2) / 2} 42 ${x2} ${y}`);
          anime({
            targets: line,
            strokeDashoffset: [anime.setDashoffset, 0],
            duration: 600,
            easing: "easeInOutQuad",
          });
        }
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
        <div className="font-mono text-sm tracking-wider">
          <span className="text-purple-400">&lt;</span>
          <span className="text-white">IM</span>
          <span className="text-purple-400">/&gt;</span>
        </div>

        {/* Nav items */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item, i) => (
            <button
              key={item.id}
              data-interactive
              onClick={() => handleNavClick(item.id)}
              className={`nav-item px-3 py-1.5 font-mono text-xs tracking-wider transition-all relative group ${
                i === activeSection
                  ? "text-purple-400"
                  : "text-gray-600 hover:text-gray-400"
              }`}
            >
              <span className="mr-1 opacity-50">{item.icon}</span>
              {item.label}
              {/* Active indicator */}
              {i === activeSection && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          data-interactive
          className="md:hidden font-mono text-purple-400 text-sm"
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
              i === activeSection ? "text-purple-400" : "text-gray-500"
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
          stroke="#a78bfa"
          strokeWidth="0.5"
          strokeDasharray="1000"
          strokeDashoffset="1000"
        />
      </svg>
    </nav>
  );
}

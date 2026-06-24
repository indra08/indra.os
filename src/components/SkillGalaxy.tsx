"use client";

import { useEffect, useRef, useCallback } from "react";
import anime from "animejs";

interface Skill {
  name: string;
  category: string;
  color: string;
  icon: string;
}

const SKILLS: Skill[] = [
  { name: "React/Next.js", category: "Frontend", color: "#00f0ff", icon: "react" },
  { name: "Laravel", category: "Backend", color: "#f9322c", icon: "laravel" },
  { name: "Golang", category: "Backend", color: "#00add8", icon: "golang" },
  { name: "Node.js", category: "Backend", color: "#83cd29", icon: "nodejs" },
  { name: "Python", category: "Backend", color: "#ffe600", icon: "python" },
  { name: "Flutter", category: "Mobile", color: "#47c5fb", icon: "flutter" },
  { name: "React Native", category: "Mobile", color: "#61dafb", icon: "react" },
  { name: "Swift", category: "Mobile", color: "#f05138", icon: "swift" },
  { name: "Kotlin", category: "Mobile", color: "#7f52ff", icon: "kotlin" },
  { name: "MySQL", category: "Database", color: "#e48e00", icon: "mysql" },
  { name: "PostgreSQL", category: "Database", color: "#336791", icon: "postgresql" },
  { name: "Redis", category: "Database", color: "#dc382d", icon: "redis" },
  { name: "Docker", category: "DevOps", color: "#2496ed", icon: "docker" },
  { name: "CI/CD", category: "DevOps", color: "#8a4af3", icon: "cicd" },
  { name: "Agile/Scrum", category: "Process", color: "#009688", icon: "agile" },
  { name: "System Design", category: "Architecture", color: "#ff00ff", icon: "architecture" },
  { name: "Team Leadership", category: "Process", color: "#e535ab", icon: "leadership" },
];

// SVG icon paths (simplified, recognizable tech icons)
const ICON_PATHS: Record<string, string> = {
  react: "M12 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9-9-4.03-9-9zm9-6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  laravel: "M6 4h4v16H6V4zm8 0h4v16h-4V4zm-4 8h4v8h-4v-8zm-4-6h12M10 20h4M14 4l-4 16m12 0l-4-16",
  golang: "M6 12h4v8H6zm6-4h4v12h-4zm6-6h4v18h-4zM12 8V6m0 0V4m0 2h2m-2 0h-2",
  nodejs: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  python: "M8 4v4h4v2H6v-2H4V4h4zm8 0h4v4h-2v2h-4V8h2V4zm-8 8h4v4h2v2H6v-2h2v-4z",
  flutter: "M4 4l8 8-8 8h12l8-8-8-8H4zm12 0l-4 4h8l4-4h-8z",
  swift: "M6 18l6-6m-6 6l6 6m-6-12l12-12M6 6l12 6m-6-6l-6 6",
  kotlin: "M6 6h12l-6 12-6-12zm0 12l4-4m2 2l-6 6",
  mysql: "M4 20h16M4 4v16m16 0V4M4 20l16-16",
  postgresql: "M4 6h16M4 10h16M4 14h16M4 18h6M14 18h6M7 18v2m4-2v2m4-2v2m-4-12v2",
  redis: "M12 4v16m-4-8h8m-2-4l2 2-2 2m-6-4L6 10l2 2",
  docker: "M8 6h2M14 6h2M8 10h2M14 10h2M8 14h2M14 14h2M8 18h2M14 18h2M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z",
  cicd: "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83M12 8a4 4 0 110 8 4 4 0 010-8z",
  agile: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  architecture: "M4 4h6v4H4V4zm10 0h6v4h-6V4zM4 12h6v4H4v-4zm10 0h6v4h-6v-4zm0 8h6v4h-6v-4zM4 20h6v4H4v-4zm3-8h2v4H7v-4zm10 0h2v4h-2v-4zM10 4v16M14 4v16M4 10h16",
  leadership: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
};

function SkillIcon({ icon, color }: { icon: string; color: string }) {
  const path = ICON_PATHS[icon] || ICON_PATHS.architecture;
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="mx-auto">
      <circle cx="12" cy="12" r="11" stroke={color} strokeWidth="0.8" opacity="0.25" />
      <path d={path} stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

export default function SkillGalaxy() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    anime({
      targets: ".skill-node",
      scale: [0, 1],
      opacity: [0, 1],
      translateY: [40, 0],
      duration: 800,
      delay: anime.stagger(60, { start: 300 }),
      easing: "easeOutElastic(1, .6)",
      begin: () => {
        const lines = svgRef.current?.querySelectorAll(".skill-line");
        if (lines) {
          anime({
            targets: lines,
            strokeDashoffset: [anime.setDashoffset, 0],
            duration: 2000,
            delay: anime.stagger(100),
            easing: "easeInOutQuad",
          });
        }
      },
    });

    const particles = svgRef.current.querySelectorAll(".particle");
    particles.forEach((p, i) => {
      anime({
        targets: p,
        opacity: [0, 1, 0],
        translateX: () => anime.random(-30, 30),
        translateY: () => anime.random(-30, 30),
        duration: 2000 + anime.random(0, 1000),
        delay: i * 200,
        loop: true,
        easing: "easeInOutSine",
        direction: "alternate",
      });
    });
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent, node: HTMLElement) => {
    anime({ targets: node, scale: 1.15, duration: 300, easing: "easeOutElastic(1, .4)" });
  }, []);

  const handleMouseLeave = useCallback((node: HTMLElement) => {
    anime({ targets: node, scale: 1, duration: 500, easing: "easeOutElastic(1, .4)" });
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen flex items-center justify-center relative overflow-hidden py-24">
      <svg ref={svgRef} className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice">
        {[200, 280, 360, 440].map((r, i) => (
          <circle key={r} cx="400" cy="400" r={r} fill="none" stroke={i % 2 === 0 ? "#7c5cfc" : "#38bdf8"} strokeWidth="0.5" className="skill-line" strokeDasharray="2000" strokeDashoffset="2000" />
        ))}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return <line key={`line-${i}`} x1="400" y1="400" x2={400 + Math.cos(angle) * 350} y2={400 + Math.sin(angle) * 350} stroke="#7c5cfc" strokeWidth="0.3" className="skill-line" strokeDasharray="500" strokeDashoffset="500" />;
        })}
        {Array.from({ length: 50 }).map((_, i) => (
          <circle key={`p-${i}`} className="particle" cx={anime.random(100, 700)} cy={anime.random(100, 700)} r={anime.random(1, 3)} fill="#7c5cfc" opacity="0" />
        ))}
      </svg>

      <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center">
        <p className="font-mono text-xs text-gray-600 tracking-[0.3em] mb-2">// TECHNICAL ARSENAL</p>
        <h2 className="text-4xl md:text-5xl font-bold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">SKILL</span>
          <span className="text-gray-400">_GALAXY</span>
        </h2>
      </div>

      <div className="relative w-full max-w-5xl mx-auto px-4 mt-24">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {SKILLS.map((skill) => (
            <div
              key={skill.name}
              className="skill-node group relative"
              data-category={skill.category}
              onMouseEnter={(e) => handleMouseEnter(e, e.currentTarget)}
              onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}
            >
              <div className="p-3 rounded border border-void-border hover:border-purple-500/20 transition-colors duration-500 bg-void-surface/50 backdrop-blur-sm text-center cursor-default" data-interactive>
                <SkillIcon icon={skill.icon} color={skill.color} />
                <p className="text-[11px] font-mono text-gray-300 mb-0.5 truncate leading-tight mt-2">{skill.name}</p>
                <p className="text-[9px] font-mono text-gray-600">{skill.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-5 flex-wrap justify-center">
        {["Frontend", "Backend", "Mobile", "Database", "DevOps", "Architecture", "Process"].map((cat) => (
          <div key={cat} className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500">
            <span className="w-2 h-2 rounded-full bg-purple-400/50" />
            {cat}
          </div>
        ))}
      </div>
    </div>
  );
}

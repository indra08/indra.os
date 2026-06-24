"use client";

import { useEffect, useRef, useState } from "react";
import anime from "animejs";

interface TimelineNode {
  title: string;
  description: string;
  tags: string[];
  color: string;
}

const TIMELINE: TimelineNode[] = [
  {
    title: "Tech Lead",
    description:
      "Menjaga sistem workflow dan menjadi penentu arah teknologi. Memimpin tim melalui siklus pengembangan penuh — dari analisis kebutuhan, desain arsitektur, hingga delivery berkualitas. Memastikan setiap keputusan teknologi selaras dengan visi produk dan bisnis.",
    tags: ["System Workflow", "Tech Decision", "Team Leadership", "Architecture"],
    color: "#7c5cfc",
  },
  {
    title: "Cybersecurity",
    description:
      "Menjamin keamanan data melalui desain yang tepat. Menerapkan prinsip security-by-design pada setiap layer aplikasi — dari enkripsi data, autentikasi, otorisasi, hingga audit trail. Memastikan kepatuhan terhadap standar keamanan industri.",
    tags: ["Data Security", "Encryption", "Auth & Access", "Audit Trail"],
    color: "#38bdf8",
  },
  {
    title: "DevOps Engineer",
    description:
      "Mengelola pipeline CI/CD dan memastikan skalabilitas sistem. Mengorkestrasi container dengan Docker, mengelola deployment multi-environment, serta membangun infrastruktur yang tangguh dengan monitoring dan auto-recovery.",
    tags: ["CI/CD", "Docker", "Scalability", "Monitoring", "AWS"],
    color: "#f59e0b",
  },
  {
    title: "Application Supervisor",
    description:
      "Bertanggung jawab atas stabilitas sistem dan workflow aplikasi. Mengawasi performa production, menangani incident response, melakukan root cause analysis, dan memastikan SLA tetap terjaga di seluruh layanan.",
    tags: ["System Stability", "Workflow", "Incident Response", "SLA"],
    color: "#10b981",
  },
  {
    title: "Mobile Programmer",
    description:
      "Fokus pada UX dan performa aplikasi mobile. Membangun pengalaman pengguna yang mulus dengan animasi halus, load time minimal, dan navigasi intuitif. Mengoptimalkan rendering, memory usage, dan network efficiency.",
    tags: ["UX Focus", "Performance", "Cross-Platform", "Flutter"],
    color: "#f97316",
  },
  {
    title: "Web Programmer",
    description:
      "Membangun aplikasi management energy berbasis ASPX. Fondasi karir sebagai programmer — membangun sistem enterprise yang menangani data energi dan reporting. Belajar disiplin kode, query optimization, dan software lifecycle.",
    tags: ["ASPX", "Enterprise", "SQL", "Reporting"],
    color: "#6366f1",
  },
];

export default function DataFlow() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dataStreamsRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const path = svgRef.current.querySelector(".flow-path");
    if (path) {
      anime({
        targets: path,
        strokeDashoffset: [anime.setDashoffset, 0],
        duration: 2500,
        easing: "easeInOutSine",
      });
    }

    anime({
      targets: ".flow-node",
      opacity: [0, 1],
      translateX: [-30, 0],
      duration: 600,
      delay: anime.stagger(150, { start: 500 }),
      easing: "easeOutCubic",
    });

    const particles = dataStreamsRef.current?.querySelectorAll(".data-particle");
    if (particles) {
      particles.forEach((p, i) => {
        anime({
          targets: p,
          translateX: () => anime.random(-100, 100),
          translateY: () => anime.random(-50, 50),
          opacity: [0, 0.8, 0],
          duration: 2000 + anime.random(0, 1500),
          delay: i * 300,
          loop: true,
          easing: "easeInOutSine",
        });
      });
    }

    anime({
      targets: ".flow-dot",
      scale: [1, 1.5, 1],
      opacity: [0.5, 1, 0.5],
      duration: 2000,
      easing: "easeInOutSine",
      loop: true,
      delay: anime.stagger(400),
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-24 px-4"
    >
      {/* Section label */}
      <div className="text-center mb-16">
        <p className="font-mono text-xs text-gray-600 tracking-[0.3em] mb-2">
          // EXPERIENCE DATA STREAM
        </p>
        <h2 className="text-4xl md:text-5xl font-bold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            DATA
          </span>
          <span className="text-gray-400">_FLOW</span>
        </h2>
      </div>

      {/* Central flow SVG */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.06]"
        viewBox="0 0 800 800"
        preserveAspectRatio="none"
      >
        <path
          className="flow-path"
          d="M-50 400 Q200 100 400 400 Q600 700 850 400"
          fill="none"
          stroke="#7c5cfc"
          strokeWidth="2"
          strokeDasharray="2000"
          strokeDashoffset="2000"
        />
      </svg>

      {/* Data stream particles SVG */}
      <svg
        ref={dataStreamsRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        viewBox="0 0 800 800"
        preserveAspectRatio="none"
      >
        {Array.from({ length: 60 }).map((_, i) => (
          <rect
            key={i}
            className="data-particle"
            x={anime.random(50, 750)}
            y={anime.random(50, 750)}
            width="4"
            height="1"
            fill="#7c5cfc"
            rx="1"
            opacity="0"
          />
        ))}
      </svg>

      {/* Timeline */}
      <div className="relative w-full max-w-4xl mx-auto">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-purple-400 via-fuchsia-400 to-cyan-400 hidden md:block" />

        <div className="space-y-12 md:space-y-16">
          {TIMELINE.map((node, i) => (
            <div
              key={node.title}
              className={`flow-node relative flex items-center ${
                i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              } flex-col`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="absolute left-1/2 -translate-x-1/2 z-10 hidden md:block">
                <div
                  className="flow-dot w-3 h-3 rounded-full"
                  style={{ background: node.color }}
                />
              </div>

              <div
                className={`w-full md:w-5/12 p-6 rounded border border-void-border bg-void-surface/80 backdrop-blur-sm transition-all duration-500 ${
                  hoveredIndex === i ? "border-purple-500/30 scale-[1.02]" : ""
                } ${i % 2 === 0 ? "md:mr-auto" : "md:ml-auto"}`}
                data-interactive
              >
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: node.color }}
                  />
                  {node.title}
                </h3>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                  {node.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {node.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[10px] font-mono rounded border border-void-border text-gray-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

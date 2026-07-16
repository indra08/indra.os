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
  const particlesRef = useRef<SVGSVGElement>(null);
  const flowingCirclesRef = useRef<SVGSVGElement>(null);
  const timelinePulseRef = useRef<SVGSVGElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!containerRef.current || hasAnimated.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            runEntranceAnimation();
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const runEntranceAnimation = () => {
    if (!svgRef.current || !particlesRef.current) return;

    // 1. Main flow path drawing
    const flowPath = svgRef.current.querySelector(".flow-path");
    if (flowPath) {
      anime({
        targets: flowPath,
        strokeDashoffset: [anime.setDashoffset, 0],
        duration: 2200,
        easing: "easeInOutSine",
      });
    }

    // 2. Glow scan effect on vertical timeline
    const tlLine = svgRef.current.querySelector(".timeline-glow");
    if (tlLine) {
      anime({
        targets: tlLine,
        opacity: [0, 1],
        scaleY: [0, 1],
        duration: 1800,
        easing: "easeOutExpo",
      });
    }

    // 3. Sequential node animations: title → desc → tags with stagger
    const tlNodeAnim = anime.timeline({ easing: "easeOutExpo" });

    for (let i = 0; i < TIMELINE.length; i++) {
      tlNodeAnim
        .add(
          {
            targets: `.fn-title-${i}`,
            opacity: [0, 1],
            translateX: [-20, 0],
            duration: 500,
            delay: anime.stagger(60, { start: 200 }),
          },
          `-=${i === 0 ? 0 : 350}`
        )
        .add(
          {
            targets: `.fn-desc-${i}`,
            opacity: [0, 1],
            translateY: [10, 0],
            duration: 400,
          },
          "-=200"
        )
        .add(
          {
            targets: `.fn-tag-${i}`,
            opacity: [0, 1],
            scale: [0.8, 1],
            duration: 350,
            delay: anime.stagger(40),
          },
          "-=150"
        );
    }

    // 4. Flow dots appear with delay
    setTimeout(() => {
      anime({
        targets: ".flow-dot",
        scale: [0, 2, 1],
        opacity: [0, 1],
        duration: 700,
        delay: anime.stagger(200),
        easing: "easeOutElastic(1, .5)",
      });
    }, 400);

    // 5. Particle system
    const particles = particlesRef.current.querySelectorAll(".data-particle");
    particles.forEach((p, i) => {
      const angle = (i / particles.length) * Math.PI * 2;
      const dist = 40 + Math.random() * 80;
      anime({
        targets: p,
        translateX: [0, Math.cos(angle) * dist],
        translateY: [0, Math.sin(angle) * dist * 0.5],
        opacity: [0, 0.7, 0],
        duration: 1800 + anime.random(0, 1200),
        delay: i * 60,
        loop: true,
        easing: "easeInOutSine",
        direction: "alternate",
      });
    });

    // 6. Flowing circles along the path
    const circles = flowingCirclesRef.current?.querySelectorAll(".flow-circle");
    if (circles) {
      circles.forEach((c, i) => {
        anime({
          targets: c,
          opacity: [
            { value: 0, duration: 0 },
            { value: 0.6, duration: 1000 },
            { value: 0, duration: 2000 },
          ],
          translateX: () => anime.random(-60, 60),
          translateY: () => anime.random(-40, 40),
          duration: 3500 + i * 800,
          delay: 600 + i * 1200,
          loop: true,
          easing: "easeInOutCubic",
        });
      });
    }
  };

  // Hover effects
  useEffect(() => {
    const dots = document.querySelectorAll(".flow-dot");
    dots.forEach((d, i) => {
      if (i === hoveredIndex) {
        anime({
          targets: d,
          scale: 2.2,
          boxShadow: `0 0 12px ${TIMELINE[i]?.color}`,
          duration: 400,
          easing: "easeOutElastic(1, .4)",
        });
      } else {
        anime({
          targets: d,
          scale: 1,
          boxShadow: "0 0 0px transparent",
          duration: 300,
          easing: "easeOutQuad",
        });
      }
    });
  }, [hoveredIndex]);

  // Continuous pulse on timeline line
  useEffect(() => {
    if (!timelinePulseRef.current) return;
    const pulse = timelinePulseRef.current.querySelector(".tl-pulse");
    if (!pulse) return;

    anime({
      targets: pulse,
      strokeDashoffset: [0, -200],
      duration: 3000,
      loop: true,
      easing: "linear",
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-24 px-4"
    >
      {/* Section label */}
      <div className="text-center mb-14">
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

      {/* Background SVGs */}
      <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 800" preserveAspectRatio="none">
        {/* Main bezier flow path */}
        <path
          className="flow-path"
          d="M-50 400 Q200 100 400 400 Q600 700 850 400"
          fill="none"
          stroke="#7c5cfc"
          strokeWidth="2"
          strokeDasharray="2000"
          strokeDashoffset="2000"
          opacity="0.08"
        />
        {/* Secondary paths */}
        <path
          d="M0 300 Q300 500 400 300 Q500 100 800 200"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1"
          opacity="0.04"
          strokeDasharray="8 12"
        />
        <path
          d="M0 500 Q200 300 400 500 Q600 700 800 600"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1"
          opacity="0.03"
          strokeDasharray="4 16"
        />
        {/* Timeline glow line */}
        <line
          className="timeline-glow"
          x1="400" y1="0" x2="400" y2="800"
          stroke="url(#tlGradient)"
          strokeWidth="2"
          opacity="0"
          style={{ transformOrigin: "400px 400px" }}
        />
        <defs>
          <linearGradient id="tlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c5cfc" stopOpacity="0" />
            <stop offset="20%" stopColor="#7c5cfc" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="80%" stopColor="#6366f1" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Flowing circles along the main path */}
      <svg ref={flowingCirclesRef} className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 800" preserveAspectRatio="none">
        {Array.from({ length: 10 }).map((_, i) => (
          <circle key={i} className="flow-circle" r={anime.random(2, 5)} fill="#7c5cfc" cx={anime.random(100, 700)} cy={anime.random(100, 700)} opacity="0" />
        ))}
      </svg>

      {/* Data stream particles */}
      <svg ref={particlesRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-25" viewBox="0 0 800 800" preserveAspectRatio="none">
        {Array.from({ length: 50 }).map((_, i) => (
          <rect key={i} className="data-particle" x={anime.random(50, 750)} y={anime.random(50, 750)} width={anime.random(2, 5)} height={anime.random(1, 2)} fill={["#7c5cfc", "#38bdf8", "#f59e0b", "#10b981"][i % 4]} rx="1" opacity="0" />
        ))}
      </svg>

      {/* Timeline pulse on the vertical line */}
      <svg ref={timelinePulseRef} className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" viewBox="0 0 800 800" preserveAspectRatio="none" style={{ opacity: 0.06 }}>
        <line className="tl-pulse" x1="400" y1="0" x2="400" y2="800" stroke="#7c5cfc" strokeWidth="1" strokeDasharray="10 30" />
      </svg>

      {/* Timeline */}
      <div className="relative w-full max-w-4xl mx-auto">
        {/* Vertical line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-purple-400/30 via-cyan-400/30 to-purple-400/30 hidden md:block" />

        <div className="space-y-14 md:space-y-20">
          {TIMELINE.map((node, i) => (
            <div
              key={node.title}
              className={`flow-node relative flex items-center ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} flex-col`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Center dot */}
              <div className="absolute left-1/2 -translate-x-1/2 z-10 hidden md:block">
                <div
                  className="flow-dot w-3 h-3 rounded-full transition-shadow duration-300"
                  style={{ background: node.color }}
                />
              </div>

              {/* Card */}
              <div
                className={`fn-card-${i} w-full md:w-5/12 p-5 rounded-lg border border-void-border bg-void-surface/80 backdrop-blur-sm transition-all duration-400 ${
                  hoveredIndex === i ? "border-purple-500/25 scale-[1.02] shadow-lg shadow-purple-900/10" : ""
                } ${i % 2 === 0 ? "md:mr-auto" : "md:ml-auto"}`}
                data-interactive
              >
                <h3 className={`fn-title-${i} text-base font-bold mb-1.5 flex items-center gap-2`} style={{ opacity: 0 }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: node.color }} />
                  <span className="text-white">{node.title}</span>
                </h3>
                <p className={`fn-desc-${i} text-sm text-gray-400 mb-3 leading-relaxed`} style={{ opacity: 0 }}>
                  {node.description}
                </p>
                <div className={`fn-tags-${i} flex flex-wrap gap-1.5`}>
                  {node.tags.map((tag) => (
                    <span
                      key={tag}
                      className="fn-tag-item px-2 py-0.5 text-[10px] font-mono rounded border border-void-border text-gray-500"
                      style={{ opacity: 0 }}
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

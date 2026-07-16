"use client";

import { useEffect, useRef, useState } from "react";
import anime from "animejs";

/* ─── Static Data ─────────────────────────────────────── */

const PIPELINE_STAGES = [
  { label: "GIT PUSH", color: "#f97316" },
  { label: "BUILD", color: "#f59e0b" },
  { label: "TEST", color: "#38bdf8" },
  { label: "SECURITY SCAN", color: "#ef4444" },
  { label: "DEPLOY", color: "#10b981" },
  { label: "MONITOR", color: "#7c5cfc" },
];

const SRE_METRICS = [
  { label: "MTTR", value: 12, unit: "min", max: 60, desc: "Mean Time to Recovery", color: "#10b981" },
  { label: "Deploy Freq", value: 18, unit: "/week", max: 30, desc: "Deployment Frequency", color: "#38bdf8" },
  { label: "Change Fail", value: 4, unit: "%", max: 15, desc: "Change Failure Rate", color: "#f97316" },
];

const DEPLOY_LOG_RAW = [
  "9:41:02  [INFO]   git push origin main → commit a3f8c2d",
  "9:41:04  [BUILD]  docker build -t app:latest .",
  "9:41:18  [BUILD]  ✓ Image built successfully (14.2s)",
  "9:41:19  [TEST]   Running 247 tests...",
  "9:41:27  [TEST]   ✓ 247 passed | 0 failed | 0 skipped",
  "9:41:28  [SCAN]   npm audit — 0 vulnerabilities",
  "9:41:29  [SCAN]   ✓ Security scan passed",
  "9:41:30  [DEPLOY] docker push registry.example.com/app:latest",
  "9:41:35  [DEPLOY] kubectl apply -f deployment.yaml",
  "9:41:38  [DEPLOY] ✓ Deployed to production (namespace: prod)",
  "9:41:39  [HEALTH] GET /health → 200 OK",
  "9:41:40  [INFO]   ▲ All systems operational | Uptime: 99.97%",
];

const INFRA_NODES = [
  { id: "cf", label: "Cloudflare", x: 400, y: 35, desc: "CDN · WAF · SSL Termination" },
  { id: "nx", label: "Nginx", x: 400, y: 115, desc: "Reverse Proxy · Load Balancer · Rate Limiting" },
  { id: "dk", label: "Docker", x: 120, y: 210, desc: "Container Orchestration · Docker Compose" },
  { id: "lv", label: "Laravel", x: 400, y: 240, desc: "API Backend · Business Logic · Authentication" },
  { id: "nd", label: "Node.js", x: 680, y: 210, desc: "WebSocket · Real-time · Messaging" },
  { id: "my", label: "MySQL", x: 200, y: 330, desc: "Transactional Data · Users · Orders" },
  { id: "rd", label: "Redis", x: 400, y: 315, desc: "Cache Layer · Queue · Session Store" },
  { id: "mg", label: "MongoDB", x: 600, y: 330, desc: "Event Log · Analytics · Document Store" },
  { id: "aw", label: "AWS", x: 400, y: 410, desc: "S3 Object Storage · EC2 Compute · RDS" },
];

const INFRA_LINES = [
  ["cf","nx"],["nx","dk"],["dk","lv"],["dk","nd"],
  ["lv","my"],["lv","rd"],["nd","mg"],["nd","rd"],["dk","aw"],
];

/* ─── Component ────────────────────────────────────────── */
export default function DevOpsDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePipe, setActivePipe] = useState(-1);
  const [logCount, setLogCount] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const started = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!containerRef.current || started.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          runAnimations();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      timers.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runAnimations() {
    // Pipeline stages entrance
    anime({
      targets: ".pipe-dot",
      scale: [0, 1],
      opacity: [0, 1],
      duration: 500,
      delay: anime.stagger(200, { start: 300 }),
      easing: "easeOutBack",
    });

    anime({
      targets: ".pipe-line-seg",
      strokeDashoffset: [anime.setDashoffset, 0],
      duration: 2000,
      delay: 500,
      easing: "easeInOutSine",
    });

    // Pipeline cycling
    let idx = 0;
    const t1 = setInterval(() => {
      setActivePipe(idx % PIPELINE_STAGES.length);
      idx++;
      if (idx > PIPELINE_STAGES.length * 2) clearInterval(t1);
    }, 1200);

    // SRE rings
    anime({
      targets: ".sre-fill",
      strokeDashoffset: (el: HTMLElement) => anime.setDashoffset(el) * 0.3,
      duration: 2000,
      delay: 800,
      easing: "easeInOutCubic",
    });

    // Deploy log typewriter (simple setTimeout chain, no array push)
    DEPLOY_LOG_RAW.forEach((_, i) => {
      const t = setTimeout(() => setLogCount(i + 1), (i + 1) * 350);
      timers.current.push(t);
    });

    // Infra nodes
    anime({
      targets: ".infra-node-g",
      scale: [0, 1],
      opacity: [0, 1],
      duration: 600,
      delay: anime.stagger(150, { start: 1500 }),
      easing: "easeOutElastic(1, .4)",
    });

    anime({
      targets: ".infra-line-path",
      strokeDashoffset: [anime.setDashoffset, 0],
      duration: 1800,
      delay: 2000,
      easing: "easeInOutSine",
    });
  }

  const nodePos: Record<string, { x: number; y: number }> = {};
  INFRA_NODES.forEach((n) => { nodePos[n.id] = { x: n.x, y: n.y }; });

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-24 px-4"
    >
      <div className="text-center mb-14">
        <p className="font-mono text-xs text-gray-600 tracking-[0.3em] mb-2">
          // INFRASTRUCTURE & OPERATIONS
        </p>
        <h2 className="text-4xl md:text-5xl font-bold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-emerald-400">
            DEVOPS
          </span>
          <span className="text-gray-400">_DASHBOARD</span>
        </h2>
      </div>

      <div className="w-full max-w-6xl space-y-12">

        {/* ═══ ROW 1: Pipeline + SRE ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pipeline */}
          <div className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl p-6">
            <p className="text-xs font-mono text-gray-600 mb-6 tracking-wider">CI/CD PIPELINE</p>
            <div className="relative">
              <svg className="w-full h-16" viewBox="0 0 500 60" preserveAspectRatio="none">
                {PIPELINE_STAGES.slice(0, -1).map((_, i) => (
                  <line
                    key={i}
                    className="pipe-line-seg"
                    x1={50 + i * 80}
                    y1={30}
                    x2={130 + i * 80}
                    y2={30}
                    stroke="#1e1e2e"
                    strokeWidth="2"
                    strokeDasharray="100"
                    strokeDashoffset="100"
                  />
                ))}
              </svg>
              <div className="absolute top-0 left-0 w-full flex justify-around">
                {PIPELINE_STAGES.map((s, i) => (
                  <div key={s.label} className="flex flex-col items-center gap-1">
                    <div
                      className="pipe-dot w-10 h-10 md:w-11 md:h-11 rounded-full border-2 transition-all duration-500"
                      style={{
                        opacity: 0,
                        background: i === activePipe ? `${s.color}15` : "transparent",
                        borderColor: i === activePipe ? s.color : "#1e1e2e",
                        boxShadow: i === activePipe ? `0 0 18px ${s.color}25` : "none",
                        transform: i === activePipe ? "scale(1.15)" : "scale(1)",
                      }}
                    />
                    <span
                      className="text-[9px] font-mono transition-colors duration-500"
                      style={{ color: i === activePipe ? s.color : "#444" }}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SRE */}
          <div className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl p-6">
            <p className="text-xs font-mono text-gray-600 mb-6 tracking-wider">SRE METRICS</p>
            <div className="flex items-center justify-around">
              {SRE_METRICS.map((m) => {
                const circ = 2 * Math.PI * 32;
                const fillColor = m.value < m.max * 0.3 ? "#10b981" : m.value < m.max * 0.6 ? "#f59e0b" : "#f97316";
                return (
                  <div key={m.label} className="flex flex-col items-center gap-1">
                    <div className="relative">
                      <svg width="84" height="84" viewBox="0 0 84 84">
                        <circle cx="42" cy="42" r="32" fill="none" stroke="#1e1e2e" strokeWidth="4" />
                        <circle
                          className="sre-fill"
                          cx="42" cy="42" r="32" fill="none"
                          stroke={fillColor} strokeWidth="4" strokeLinecap="round"
                          strokeDasharray={circ} strokeDashoffset={circ}
                          transform="rotate(-90 42 42)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold font-mono" style={{ color: fillColor }}>{m.value}</span>
                        <span className="text-[9px] font-mono text-gray-500">{m.unit}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">{m.label}</span>
                    <span className="text-[8px] font-mono text-gray-600">{m.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ Deploy Log ═══ */}
        <div className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#050510] border-b border-[#1e1e2e]">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <span className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-3 text-[10px] font-mono text-gray-600">deploy@prod:~$ tail -f /var/log/deploy.log</span>
          </div>
          <div className="p-4 h-48 overflow-y-auto font-mono text-[11px] leading-relaxed">
            {logCount === 0 && (
              <span className="text-gray-700">Waiting for deployment…</span>
            )}
            {DEPLOY_LOG_RAW.slice(0, logCount).map((line, i) => {
              const isError = line.includes("[SCAN]");
              const isOk = line.includes("✓") || line.includes("200 OK");
              const isInfo = line.includes("[INFO]");
              const color = isError ? "#ef4444" : isOk ? "#10b981" : isInfo ? "#7c5cfc" : "#888";
              return (
                <div key={i} style={{ color }}>{line}</div>
              );
            })}
          </div>
        </div>

        {/* ═══ Infra Diagram ═══ */}
        <div className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl p-6">
          <p className="text-xs font-mono text-gray-600 mb-6 tracking-wider">INFRASTRUCTURE ARCHITECTURE</p>
          <div className="relative w-full" style={{ height: "520px" }}>
            {/* SVG layer: connection lines only */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 520" preserveAspectRatio="none">
              {INFRA_LINES.map(([a, b], i) => {
                const f = nodePos[a];
                const t = nodePos[b];
                if (!f || !t) return null;
                return (
                  <line
                    key={i}
                    className="infra-line-path"
                    x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                    stroke="#1e1e2e" strokeWidth="2"
                    strokeDasharray="300" strokeDashoffset="300"
                  />
                );
              })}
            </svg>
            {/* HTML layer: nodes (absolute positioned, proportional to SVG viewBox) */}
            {INFRA_NODES.map((n) => (
              <div
                key={n.id}
                className="infra-node-g absolute flex flex-col items-center"
                style={{
                  left: `${(n.x / 800) * 100}%`,
                  top: `${(n.y / 520) * 100}%`,
                  transform: "translate(-50%, -50%)",
                  opacity: 0,
                }}
                onMouseEnter={() => setHoveredNode(n.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <div
                  className={`rounded-full border-2 transition-all duration-300 ${
                    hoveredNode === n.id ? "scale-125" : ""
                  }`}
                  style={{
                    width: hoveredNode === n.id ? "60px" : "44px",
                    height: hoveredNode === n.id ? "60px" : "44px",
                    borderColor: hoveredNode === n.id ? "#7c5cfc" : "#1e1e2e",
                    background: hoveredNode === n.id ? "#7c5cfc30" : "transparent",
                    boxShadow: hoveredNode === n.id ? "0 0 20px #7c5cfc30" : "none",
                  }}
                />
                <span
                  className="mt-2 text-[11px] md:text-xs font-mono font-bold transition-colors duration-300"
                  style={{ color: hoveredNode === n.id ? "#c4b5fd" : "#666" }}
                >
                  {n.label}
                </span>
                {hoveredNode === n.id && (
                  <span className="mt-1 text-[10px] font-mono text-purple-400 text-center leading-tight max-w-[160px]">
                    {n.desc}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

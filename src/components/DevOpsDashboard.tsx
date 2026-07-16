"use client";

import { useEffect, useRef, useState } from "react";
import anime from "animejs";

/* ─── Pipeline Stages ─────────────────────────────────── */
const PIPELINE_STAGES = [
  { label: "GIT PUSH", icon: "⬆", color: "#f97316" },
  { label: "BUILD", icon: "⚙", color: "#f59e0b" },
  { label: "TEST", icon: "✓", color: "#38bdf8" },
  { label: "SECURITY SCAN", icon: "🛡", color: "#ef4444" },
  { label: "DEPLOY", icon: "☁", color: "#10b981" },
  { label: "MONITOR", icon: "◉", color: "#7c5cfc" },
];

/* ─── SRE Metrics ──────────────────────────────────────── */
const SRE_METRICS = [
  { label: "MTTR", value: 12, unit: "min", max: 60, desc: "Mean Time to Recovery", color: "#10b981" },
  { label: "Deploy Freq", value: 18, unit: "/week", max: 30, desc: "Deployment Frequency", color: "#38bdf8" },
  { label: "Change Fail", value: 4, unit: "%", max: 15, desc: "Change Failure Rate", color: "#f97316" },
];

/* ─── Infrastructure Nodes ─────────────────────────────── */
const INFRA_NODES = [
  { id: "cloudflare", label: "Cloudflare", x: 50, y: 6, icon: "🌐", desc: "CDN · DDoS Protection · SSL Termination" },
  { id: "nginx", label: "Nginx", x: 50, y: 19, icon: "⚡", desc: "Reverse Proxy · Load Balancer · Rate Limiting" },
  { id: "docker", label: "Docker", x: 15, y: 34, icon: "📦", desc: "Container Orchestration · Docker Compose" },
  { id: "laravel", label: "Laravel", x: 50, y: 36, icon: "🔷", desc: "API Backend · Business Logic · Auth" },
  { id: "nodejs", label: "Node.js", x: 85, y: 34, icon: "💚", desc: "Real-time · WebSocket · Messaging" },
  { id: "mysql", label: "MySQL", x: 22, y: 52, icon: "🐬", desc: "Transactional Data · Orders · Users" },
  { id: "redis", label: "Redis", x: 50, y: 50, icon: "♦", desc: "Cache · Queue · Session Store" },
  { id: "mongo", label: "MongoDB", x: 78, y: 52, icon: "🍃", desc: "Message Store · Event Log · Analytics" },
  { id: "aws", label: "AWS", x: 50, y: 66, icon: "☁", desc: "S3 · EC2 · RDS · CloudWatch" },
];

/* ─── Connection lines between infra nodes ────────────── */
const INFRA_LINES = [
  { from: "cloudflare", to: "nginx" },
  { from: "nginx", to: "docker" },
  { from: "docker", to: "laravel" },
  { from: "docker", to: "nodejs" },
  { from: "laravel", to: "mysql" },
  { from: "laravel", to: "redis" },
  { from: "nodejs", to: "mongo" },
  { from: "nodejs", to: "redis" },
  { from: "docker", to: "aws" },
];

/* ─── Deploy log lines ─────────────────────────────────── */
const DEPLOY_LOG = [
  { time: "9:41:02", msg: "[INFO]   git push origin main → commit a3f8c2d", color: "#888" },
  { time: "9:41:04", msg: "[BUILD]  docker build -t app:latest .", color: "#f59e0b" },
  { time: "9:41:18", msg: "[BUILD]  ✓ Image built successfully (14.2s)", color: "#10b981" },
  { time: "9:41:19", msg: "[TEST]   Running 247 tests...", color: "#38bdf8" },
  { time: "9:41:27", msg: "[TEST]   ✓ 247 passed | 0 failed | 0 skipped", color: "#10b981" },
  { time: "9:41:28", msg: "[SCAN]   npm audit — 0 vulnerabilities", color: "#ef4444" },
  { time: "9:41:29", msg: "[SCAN]   ✓ Security scan passed", color: "#10b981" },
  { time: "9:41:30", msg: "[DEPLOY] docker push registry.example.com/app:latest", color: "#10b981" },
  { time: "9:41:35", msg: "[DEPLOY] kubectl apply -f deployment.yaml", color: "#10b981" },
  { time: "9:41:38", msg: "[DEPLOY] ✓ Deployed to production (namespace: prod)", color: "#10b981" },
  { time: "9:41:39", msg: "[HEALTH] GET /health → 200 OK", color: "#10b981" },
  { time: "9:41:40", msg: "[INFO]   ▲ All systems operational | Uptime: 99.97%", color: "#7c5cfc" },
];

/* ── Component ────────────────────────────────────────── */
export default function DevOpsDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pipelineRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const infraRef = useRef<SVGSVGElement>(null);
  const [activePipeStage, setActivePipeStage] = useState(-1);
  const [logLines, setLogLines] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const hasAnimated = useRef(false);

  /* ── Intersection Observer ── */
  useEffect(() => {
    if (!containerRef.current || hasAnimated.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          startAnimations();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  /* ── All animations ── */
  function startAnimations() {
    // 1. Pipeline stage reveal + connection lines
    const pipelineBalls = document.querySelectorAll(".pipe-stage");
    anime({
      targets: pipelineBalls,
      scale: [0, 1],
      opacity: [0, 1],
      duration: 500,
      delay: anime.stagger(200, { start: 300 }),
      easing: "easeOutBack",
    });

    // Pipeline connecting lines draw
    anime({
      targets: ".pipe-line",
      strokeDashoffset: [anime.setDashoffset, 0],
      duration: 2000,
      delay: 500,
      easing: "easeInOutSine",
    });

    // Pipeline stage cycling (endless)
    let stageIdx = 0;
    const stageInterval = setInterval(() => {
      setActivePipeStage(stageIdx % PIPELINE_STAGES.length);
      stageIdx++;
    }, 1200);
    setTimeout(() => clearInterval(stageInterval), PIPELINE_STAGES.length * 1200);

    // 2. SRE rings
    anime({
      targets: ".sre-ring",
      strokeDashoffset: (el: HTMLElement) => anime.setDashoffset(el) * 0.3,
      duration: 2000,
      delay: 800,
      easing: "easeInOutCubic",
    });

    // 3. Deploy log typewriter (safe: count-based, uses static data)
    DEPLOY_LOG.forEach((_, i) => {
      setTimeout(() => setLogLines(i + 1), (i + 1) * 350);
    });

    // 4. Infrastructure diagram nodes + lines
    anime({
      targets: ".infra-node",
      scale: [0, 1],
      opacity: [0, 1],
      duration: 600,
      delay: anime.stagger(150, { start: 1500 }),
      easing: "easeOutElastic(1, .4)",
    });

    anime({
      targets: ".infra-line",
      strokeDashoffset: [anime.setDashoffset, 0],
      duration: 1800,
      delay: 2000,
      easing: "easeInOutSine",
    });

    // Data flow particles on infra lines (continuous)
    const particles = infraRef.current?.querySelectorAll(".infra-particle");
    if (particles) {
      particles.forEach((p, i) => {
        anime({
          targets: p,
          opacity: [0, 0.8, 0],
          duration: 2000 + i * 300,
          delay: 2500 + i * 500,
          loop: true,
          easing: "linear",
        });
      });
    }
  }

  /* ── Auto scroll deploy log ── */
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logLines]);

  /* ── Render ── */
  const nodePositions: Record<string, { x: number; y: number }> = {};
  INFRA_NODES.forEach((n) => { nodePositions[n.id] = { x: n.x, y: n.y }; });

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-24 px-4"
    >
      {/* Section label */}
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

        {/* ═══ ROW 1: Pipeline Visualizer + SRE Metrics ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Pipeline ── */}
          <div className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl p-6">
            <p className="text-xs font-mono text-gray-600 mb-6 tracking-wider">CI/CD PIPELINE</p>

            {/* Pipeline SVG */}
            <div ref={pipelineRef} className="relative pb-16">
              <svg className="w-full h-20" viewBox="0 0 500 80" preserveAspectRatio="none">
                {/* Connecting lines */}
                {PIPELINE_STAGES.slice(0, -1).map((_, i) => (
                  <line
                    key={i}
                    className="pipe-line"
                    x1={45 + i * 82}
                    y1={40}
                    x2={127 + i * 82}
                    y2={40}
                    stroke="#1e1e2e"
                    strokeWidth="2"
                    strokeDasharray="100"
                    strokeDashoffset="100"
                  />
                ))}
              </svg>

              {/* Stage circles */}
              <div className="absolute top-0 left-0 w-full flex justify-between px-[5%]">
                {PIPELINE_STAGES.map((stage, i) => (
                  <div key={stage.label} className="flex flex-col items-center gap-2">
                    <div
                      className={`pipe-stage w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-500 cursor-default ${
                        i === activePipeStage ? "scale-125 shadow-lg" : ""
                      }`}
                      style={{
                        background: i === activePipeStage ? `${stage.color}15` : "transparent",
                        borderColor: i === activePipeStage ? stage.color : "#1e1e2e",
                        boxShadow: i === activePipeStage ? `0 0 20px ${stage.color}30` : "none",
                        opacity: 0,
                      }}
                    >
                      <span className="text-xs">{stage.icon}</span>
                    </div>
                    <span
                      className="text-[9px] font-mono transition-colors duration-500"
                      style={{ color: i === activePipeStage ? stage.color : "#555" }}
                    >
                      {stage.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SRE Metrics ── */}
          <div className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl p-6">
            <p className="text-xs font-mono text-gray-600 mb-6 tracking-wider">SRE METRICS</p>
            <div className="flex items-center justify-around">
              {SRE_METRICS.map((m) => {
                const circumference = 2 * Math.PI * 34;
                const offset = circumference * (1 - m.value / m.max);
                const statusColor = m.value < m.max * 0.3 ? "#10b981" : m.value < m.max * 0.6 ? "#f59e0b" : "#f97316";

                return (
                  <div key={m.label} className="flex flex-col items-center gap-2">
                    <svg width="90" height="90" viewBox="0 0 90 90">
                      <circle cx="45" cy="45" r="34" fill="none" stroke="#1e1e2e" strokeWidth="4" />
                      <circle
                        className="sre-ring"
                        cx="45"
                        cy="45"
                        r="34"
                        fill="none"
                        stroke={statusColor}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference}
                        transform="rotate(-90 45 45)"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center" style={{ marginTop: 22 }}>
                      <span className="text-lg font-bold font-mono" style={{ color: statusColor }}>{m.value}</span>
                      <span className="text-[9px] font-mono text-gray-500">{m.unit}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">{m.label}</span>
                    <span className="text-[9px] font-mono text-gray-600 -mt-1">{m.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ ROW 2: Deploy Log Terminal ═══ */}
        <div className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#050510] border-b border-[#1e1e2e]">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <span className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-3 text-[10px] font-mono text-gray-600">deploy@prod:~$ tail -f /var/log/deploy.log</span>
          </div>
          <div
            ref={logRef}
            className="p-4 h-48 overflow-y-auto font-mono text-xs leading-relaxed"
          >
            {logLines === 0 && (
              <p className="text-gray-700 animate-pulse">Waiting for deployment…</p>
            )}
            {DEPLOY_LOG.slice(0, logLines).map((line, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-gray-700 flex-shrink-0">{line.time}</span>
                <span style={{ color: line.color }}>{line.msg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ ROW 3: Infrastructure Architecture Diagram ═══ */}
        <div className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl p-6">
          <p className="text-xs font-mono text-gray-600 mb-6 tracking-wider">INFRASTRUCTURE ARCHITECTURE</p>
          <div className="relative w-full" style={{ paddingBottom: "70%" }}>
            <svg
              ref={infraRef}
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 72"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Connection lines */}
              {INFRA_LINES.map((line, i) => {
                const from = nodePositions[line.from];
                const to = nodePositions[line.to];
                if (!from || !to) return null;
                return (
                  <line
                    key={i}
                    className="infra-line"
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="#1e1e2e"
                    strokeWidth="1.5"
                    strokeDasharray="200"
                    strokeDashoffset="200"
                  />
                );
              })}

              {/* Data flow particles on lines */}
              {INFRA_LINES.map((line, i) => {
                const from = nodePositions[line.from];
                const to = nodePositions[line.to];
                if (!from || !to) return null;
                const mx = (from.x + to.x) / 2;
                const my = (from.y + to.y) / 2;
                return (
                  <circle
                    key={`p-${i}`}
                    className="infra-particle"
                    cx={mx}
                    cy={my}
                    r="1.5"
                    fill="#7c5cfc"
                    opacity="0"
                  />
                );
              })}

              {/* Nodes */}
              {INFRA_NODES.map((node) => (
                <g
                  key={node.id}
                  className="infra-node"
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: "pointer", opacity: 0 }}
                >
                  {/* Glow ring */}
                  <circle
                    cx="0"
                    cy="0"
                    r={hoveredNode === node.id ? "10" : "7"}
                    fill="none"
                    stroke={hoveredNode === node.id ? "#7c5cfc" : "#1e1e2e"}
                    strokeWidth="1"
                    className="transition-all duration-300"
                  />
                  {/* Center circle */}
                  <circle
                    cx="0"
                    cy="0"
                    r="4"
                    fill={hoveredNode === node.id ? "#7c5cfc" : "#0a0a14"}
                    stroke={hoveredNode === node.id ? "#7c5cfc" : "#333"}
                    strokeWidth="1.5"
                    className="transition-all duration-300"
                  />
                  {/* Label */}
                  <text
                    x="0"
                    y="14"
                    textAnchor="middle"
                    fill={hoveredNode === node.id ? "#c4b5fd" : "#666"}
                    fontSize="3"
                    fontFamily="monospace"
                    className="transition-all duration-300"
                  >
                    {node.label}
                  </text>

                  {/* Tooltip on hover */}
                  {hoveredNode === node.id && (
                    <>
                      <rect
                        x="-22"
                        y="-22"
                        width="44"
                        height="10"
                        rx="2"
                        fill="#0a0a14"
                        stroke="#7c5cfc"
                        strokeWidth="0.5"
                      />
                      <text
                        x="0"
                        y="-15"
                        textAnchor="middle"
                        fill="#a78bfa"
                        fontSize="2.5"
                        fontFamily="monospace"
                      >
                        {node.desc.length > 35 ? node.desc.slice(0, 35) + "…" : node.desc}
                      </text>
                    </>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}

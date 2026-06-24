"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import anime from "animejs";

const COMMANDS: Record<string, { output: string | string[]; color?: string }> = {
  help: {
    output: [
      "AVAILABLE COMMANDS:",
      "  about     - Display architect profile",
      "  skills    - List technical competencies",
      "  projects  - View project portfolio",
      "  services  - What I deliver",
      "  contact   - Show contact channels",
      "  system    - System diagnostics",
      "  matrix    - Enter the matrix",
      "  clear     - Clear terminal",
      "  help      - Show this message",
    ],
    color: "#7c5cfc",
  },
  about: {
    output: [
      "═══════════════════════════════",
      "  ARCHITECT PROFILE",
      "═══════════════════════════════",
      "",
      "Name:     Indra Maulana",
      "Role:     Tech Lead & Product Engineering Manager",
      "Location: Semarang, Indonesia",
      "Exp:      10+ years in production",
      "Shipped:  100+ products",
      "Clients:  50+ happy clients",
      "",
      "I lead teams through the full application",
      "development lifecycle — from requirements",
      "analysis and architecture design to quality",
      "delivery. Agile practitioner. DevOps enthusiast.",
      "Full-stack builder when needed.",
    ],
    color: "#7c5cfc",
  },
  skills: {
    output: [
      "TECHNICAL ARSENAL:",
      "─────────────────────────",
      "Frontend:  React, Next.js, Vue.js, TypeScript",
      "Backend:   Laravel, Node.js, Golang, Python",
      "Mobile:    Flutter, React Native, Swift, Kotlin",
      "Database:  MySQL, PostgreSQL, Redis",
      "DevOps:    Docker, AWS, CI/CD",
      "Process:   Agile, Scrum, Team Leadership",
      "",
      "Technology decisions that compound.",
      "Tools I trust to ship.",
    ],
    color: "#6366f1",
  },
  projects: {
    output: [
      "[1] ForYou by SML",
      "    Loyalty Platform - SinarmasLand",
      "    Tech: React JS, Flutter, Laravel, MySQL, Redis",
      "    4 platforms: Mobile (iOS+Android), Web, Admin Panel",
      "    Live: foryoubysml.com",
      "",
      "[2] FindPix",
      "    Event Platform - Face Recognition + Bib Search",
      "    Tech: React JS, Laravel, Golang, Python, PostgreSQL",
      "    Sub-2s face search from 50K+ photos",
      "    Live: findpix.id",
    ],
    color: "#f59e0b",
  },
  services: {
    output: [
      "WHAT I DELIVER:",
      "─────────────────────────",
      "Tech Architecture  - System design, tech selection",
      "Team Leadership    - Agile sprints, cross-team coord",
      "Product Delivery   - Requirements to production",
      "DevOps & CI/CD     - Docker, AWS, pipelines",
      "Mobile Development - Flutter, React Native",
      "Consulting         - Audits, reviews, strategy",
    ],
    color: "#38bdf8",
  },
  contact: {
    output: [
      "COMM CHANNELS:",
      "──────────────",
      "Email:    indra.maulana08@gmail.com",
      "GitHub:   github.com/indra08",
      "LinkedIn: linkedin.com/in/indra-maulana-husni-mubarok-565429105",
      "IG:       instagram.com/maulanaindra.mubarok",
      "Phone:    +62 856 268 1814",
      "Location: Semarang, Central Java, Indonesia",
      "──────────┴───",
      "Available for opportunities",
    ],
    color: "#10b981",
  },
  system: {
    output: [
      "SYSTEM DIAGNOSTICS:",
      "──────────────────",
      "Kernel:    IndraOS v10.0",
      "Uptime:    10+ years in production",
      "Products:  100+ shipped",
      "Clients:   50+ satisfied",
      "Stack:     Full-stack polyglot",
      "Status:    Available for opportunities",
      "──────────────────",
      "All systems nominal. Ready to build.",
    ],
    color: "#7c5cfc",
  },
};

export default function CommandCenter() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<
    { type: "input" | "output"; text: string; color?: string }[]
  >([
    { type: "output", text: "NEURAL TERMINAL v10.0 // Type 'help' to begin.", color: "#7c5cfc" },
    { type: "output", text: "───────────────────────────────────────", color: "#666" },
  ]);
  const [matrixMode, setMatrixMode] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const addHistory = useCallback(
    (items: { type: "input" | "output"; text: string; color?: string }[]) => {
      setHistory((prev) => [...prev, ...items]);
    },
    []
  );

  const executeCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim().toLowerCase();

      if (trimmed === "clear") {
        setHistory([]);
        return;
      }

      if (trimmed === "matrix") {
        setMatrixMode(true);
        addHistory([
          { type: "output", text: "ENTERING THE MATRIX...", color: "#00ff41" },
        ]);
        setTimeout(() => setMatrixMode(false), 5000);
        return;
      }

      const response = COMMANDS[trimmed];
      if (!response) {
        addHistory([
          {
            type: "output",
            text: `Command not found: '${cmd}'. Type 'help' for available commands.`,
            color: "#ff4444",
          },
        ]);
        return;
      }

      const output = response.output;
      const items: { type: "input" | "output"; text: string; color?: string }[] = [];
      if (Array.isArray(output)) {
        output.forEach((line) => {
          items.push({ type: "output", text: line, color: response.color });
        });
      } else if (output) {
        items.push({ type: "output", text: output, color: response.color });
      }
      addHistory(items);
    },
    [addHistory]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      addHistory([{ type: "input", text: `> ${input}` }]);
      executeCommand(input);
      setInput("");
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (!matrixMode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*><";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(0).map(() => Math.random() * -100);

    const draw = () => {
      ctx.fillStyle = "rgba(5, 5, 16, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff41";
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);
    return () => clearInterval(interval);
  }, [matrixMode]);

  useEffect(() => {
    anime({
      targets: ".terminal-container",
      opacity: [0, 1],
      translateY: [40, 0],
      duration: 800,
      easing: "easeOutExpo",
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-24 px-4">
      <div className="text-center mb-10 terminal-container">
        <p className="font-mono text-xs text-gray-600 tracking-[0.3em] mb-2">
          // INTERACTIVE COMMAND CENTER
        </p>
        <h2 className="text-4xl md:text-5xl font-bold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            COMMAND
          </span>
          <span className="text-gray-400">_CENTER</span>
        </h2>
      </div>

      <div
        className="terminal-container w-full max-w-2xl rounded-lg border border-void-border bg-void-deep overflow-hidden"
        onClick={() => inputRef.current?.focus()}
        data-interactive
      >
        <div className="flex items-center gap-2 px-4 py-2 bg-void-surface border-b border-void-border">
          <span className="w-3 h-3 rounded-full bg-red-500/60" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <span className="w-3 h-3 rounded-full bg-green-500/60" />
          <span className="ml-3 text-xs font-mono text-gray-600">
            indra@portfolio:~$
          </span>
        </div>

        <div
          ref={terminalRef}
          className="p-4 h-80 overflow-y-auto font-mono text-sm"
        >
          {history.map((item, i) => (
            <div
              key={i}
              className="mb-1 leading-relaxed"
              style={{
                color: item.color || (item.type === "input" ? "#7c5cfc" : "#888"),
              }}
            >
              {item.text}
            </div>
          ))}
          <div className="flex items-center text-purple-400">
            <span className="mr-2">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-purple-400 placeholder-gray-700"
              placeholder="Type command..."
              spellCheck={false}
              autoComplete="off"
            />
            <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse" />
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs font-mono text-gray-600 terminal-container">
        Try: help | about | skills | projects | services | contact | system | matrix | clear
      </p>

      {matrixMode && (
        <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" />
      )}
    </div>
  );
}

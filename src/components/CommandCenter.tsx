"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import anime from "animejs";

type HistoryItem = { type: "input" | "output"; text: string; color?: string };

// ─── Static commands ──────────────────────────────────────
const COMMANDS: Record<string, { output: string | string[]; color?: string }> = {
  help: {
    output: [
      "AVAILABLE COMMANDS:",
      "  about        - Display architect profile",
      "  skills       - List technical competencies",
      "  projects     - View project portfolio",
      "  services     - What I deliver",
      "  contact      - Show contact channels",
      "  system       - System diagnostics",
      "  whois <ip>   - WHOIS lookup on IP/domain",
      "  sqlinject <u>- Simulate SQL injection attack",
      "  myip         - Show your public IP & geolocation",
      "  clear        - Clear terminal",
      "  help         - Show this message",
    ],
    color: "#7c5cfc",
  },
  about: {
    output: [
      "═══════════════════════════════",
      "  ARCHITECT PROFILE",
      "═══════════════════════════════",
      "",
      "Name:     Indra Maulana Husni Mubarok",
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
      "Full-stack builder.",
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
      "",
      "[3] Ticket Web (Nexatiket)",
      "    Event Ticketing - Management + Scan",
      "    Tech: Laravel, React JS, Python, MySQL, Xendit",
      "    Offline QR Scanner + Payment Integration",
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

function O(text: string, color?: string): HistoryItem {
  return { type: "output", text, color };
}

// ─── WHOIS simulator ──────────────────────────────────────
function simulateWhois(target: string): HistoryItem[] {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const ips = ["104.21.45.192", "172.67.154.89", "203.0.113.55", "198.51.100.14", "192.0.2.87"];
  const ip = ips[Math.floor(target.length % ips.length)];
  const ns = `ns${(target.length % 3) + 1}.${target.replace(/^www\./, "")}`;

  return [
    O(`WHOIS ${target}`, "#7c5cfc"),
    O("────────────────────────────────────────", "#666"),
    O(""),
    O("Domain Information:", "#38bdf8"),
    O(`  Domain Name:     ${target}`),
    O("  Registrar:       GoDaddy.com, LLC"),
    O(`  Creation Date:   ${2018 + (target.length % 6)}-0${(target.length % 9) + 1}-${10 + (target.length % 20)}`),
    O(`  Expiry Date:     ${2027 + (target.length % 3)}-0${6 + (target.length % 5)}-${5 + (target.length % 20)}`),
    O("  Status:          clientTransferProhibited"),
    O(""),
    O("Registrant:", "#38bdf8"),
    O("  Organization:    REDACTED FOR PRIVACY"),
    O(`  Country:         ${["US", "ID", "SG", "DE"][target.length % 4]}`),
    O(""),
    O("DNS:", "#38bdf8"),
    O(`  Nameserver:      ${ns}`),
    O(`  Nameserver:      ns${(target.length % 4) + 1}.${target.replace(/^www\./, "")}`),
    O(""),
    O("Network:", "#38bdf8"),
    O(`  IPv4:            ${ip}`, "#f59e0b"),
    O("  Hosting:         Cloudflare, Inc."),
    O(`  ASN:             AS13335`),
    O(""),
    O(`Queried at: ${now} UTC`, "#666"),
    O("────────────────────────────────────────", "#666"),
  ];
}

// ─── SQL Injection simulator ──────────────────────────────
function simulateSQLInjection(target: string): Promise<HistoryItem[]> {
  return new Promise((resolve) => {
    const S = (lines: (string | [string, string])[]): HistoryItem[] =>
      lines.map((l) => (Array.isArray(l) ? O(l[0], l[1]) : O(l)));

    const steps: HistoryItem[][] = [
      S([
        `[*] Target: ${target}`,
        "[*] Phase 1/5 — Reconnaissance…",
        "",
        "[~] Probing: GET /product?id=1",
        "    Status: 200 OK | Server: Apache/2.4.41",
        "[~] Probing: GET /product?id=1'",
        ["    Status: 500 | MySQL Error detected!", "#ff4444"],
        ["    Error: You have an error in your SQL syntax…", "#ff4444"],
        "",
        ["[+] Vulnerable to SQL Injection (error-based)", "#f59e0b"],
      ]),
      S([
        "[*] Phase 2/5 — Enumerating columns…",
        "",
        "[~] ORDER BY 1 — 200 OK",
        "[~] ORDER BY 5 — 200 OK",
        "[~] ORDER BY 8 — 200 OK",
        "[~] ORDER BY 12 — 200 OK",
        ["[~] ORDER BY 15 — 500 Error", "#ff4444"],
        "",
        ["[+] Column count: 14", "#f59e0b"],
      ]),
      S([
        "[*] Phase 3/5 — Enumerating database…",
        "",
        "[~] UNION SELECT @@version,2,3,4,5,6,7,8,9,10,11,12,13,14",
        "    MySQL 8.0.35 | InnoDB",
        "[~] UNION SELECT table_name,2,3,4,5,6,7,8,9,10,11,12,13,14",
        "    FROM information_schema.tables WHERE table_schema=DATABASE()",
        "",
        ["    [+] users", "#10b981"],
        ["    [+] products", "#10b981"],
        ["    [+] orders", "#10b981"],
        ["    [+] sessions", "#10b981"],
        ["    [+] payments", "#10b981"],
        "",
        ["[+] Found 5 tables in current database", "#f59e0b"],
      ]),
      S([
        "[*] Phase 4/5 — Extracting 'users' schema…",
        "",
        "[~] UNION SELECT column_name,2,3,4,5,6,7,8,9,10,11,12,13,14",
        "    FROM information_schema.columns WHERE table_name='users'",
        "",
        ["    [+] id           int(11)    AUTO_INCREMENT", "#10b981"],
        ["    [+] username     varchar(64)", "#10b981"],
        ["    [+] email        varchar(128)", "#10b981"],
        ["    [+] password     varchar(255)", "#ff4444"],
        ["    [+] role         enum('admin','user')", "#10b981"],
        ["    [+] created_at   datetime", "#10b981"],
        ["    [+] last_login   datetime", "#10b981"],
        "",
        ["[+] 7 columns in 'users' table", "#f59e0b"],
      ]),
      S([
        ["[*] Phase 5/5 — Dumping credentials…", "#f59e0b"],
        "",
        "[~] UNION SELECT CONCAT(username,':',email,':',password,':',role)",
        "    FROM users LIMIT 5",
        "",
      ]).concat([
        O("┌──────┬──────────────────────────────┬────────────────────────┬─────────┐", "#666"),
        O("│  id  │  email                       │  username              │  role    │", "#666"),
        O("├──────┼──────────────────────────────┼────────────────────────┼─────────┤", "#666"),
        O("│  1   │  admin@corp.com              │  admin                 │  admin   │", "#ff4444"),
        O("│  2   │  j.smith@corp.com            │  jsmith                │  user    │"),
        O("│  3   │  m.jones@corp.com            │  mjones                │  user    │"),
        O("│  4   │  a.williams@corp.com         │  awilliams             │  user    │"),
        O("│  5   │  d.brown@corp.com            │  dbrown                │  user    │"),
        O("└──────┴──────────────────────────────┴────────────────────────┴─────────┘", "#666"),
        O(""),
        O(""),
        O("  ╔══════════════════════════════════════════════╗", "#10b981"),
        O("  ║  [+] DATABASE ACCESS OBTAINED                ║", "#10b981"),
        O("  ║  [+] Admin credentials: admin / ***          ║", "#10b981"),
        O("  ║  [+] 5 user records extracted                ║", "#10b981"),
        O("  ╚══════════════════════════════════════════════╝", "#10b981"),
        O(""),
        O("[!] Simulation complete. Vulnerability: unsanitized user input", "#f59e0b"),
        O("[!] in GET parameter 'id'. Patch: use prepared statements.", "#f59e0b"),
      ]),
    ];

    let delay = 0;
    steps.forEach((step, i) => {
      delay += [800, 900, 1000, 1100, 1200][i];
      setTimeout(() => resolve(step), delay);
    });
  });
}

// ─── Component ────────────────────────────────────────────
export default function CommandCenter() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([
    O("NEURAL TERMINAL v10.0 // Type 'help' to begin.", "#7c5cfc"),
    O("───────────────────────────────────────", "#666"),
  ]);
  const [isBusy, setIsBusy] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addHistory = useCallback((items: HistoryItem[]) => {
    setHistory((prev) => [...prev, ...items]);
  }, []);

  const executeCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim();
      const lower = trimmed.toLowerCase();

      if (lower === "clear") {
        setHistory([]);
        return;
      }

      if (lower === "myip") {
        setIsBusy(true);
        addHistory([O("Fetching IP information…", "#f59e0b")]);

        Promise.all([
          fetch("https://api.ipify.org?format=json").then((r) => r.json()),
          fetch("https://ipapi.co/json/").then((r) => r.json()),
        ])
          .then(([ipData, geoData]) => {
            addHistory([
              O(""),
              O("═══ PUBLIC IP INFO ═══", "#7c5cfc"),
              O(""),
              O(`  IPv4:         ${ipData.ip}`, "#38bdf8"),
              O(`  IPv6:         ${geoData.ip || "Not detected"}`),
              O(""),
              O("─── Geolocation ───", "#38bdf8"),
              O(`  City:         ${geoData.city || "—"}`),
              O(`  Region:       ${geoData.region || "—"}`),
              O(`  Country:      ${geoData.country_name || "—"} (${geoData.country || "—"})`),
              O(`  Postal:       ${geoData.postal || "—"}`),
              O(`  Coordinates:  ${geoData.latitude}, ${geoData.longitude}`),
              O(""),
              O("─── Network ───", "#38bdf8"),
              O(`  ISP:          ${geoData.org || geoData.asn || "—"}`, "#f59e0b"),
              O(`  ASN:          ${geoData.asn || "—"}`),
              O(`  Timezone:     ${geoData.timezone || "—"}`),
              O(`  Currency:     ${geoData.currency || "—"} ${geoData.currency_name || ""}`),
              O(""),
              O("────────────────", "#666"),
            ]);
            setIsBusy(false);
          })
          .catch(() => {
            addHistory([
              O("Failed to fetch IP data. Try again later.", "#ff4444"),
            ]);
            setIsBusy(false);
          });
        return;
      }

      if (lower.startsWith("whois ")) {
        const target = trimmed.slice(6).trim();
        if (!target) return addHistory([O("Usage: whois <domain|ip>", "#ff4444")]);
        setIsBusy(true);
        addHistory([O(`Resolving ${target}…`, "#f59e0b")]);
        setTimeout(() => {
          addHistory(simulateWhois(target));
          setIsBusy(false);
        }, 600);
        return;
      }

      if (lower.startsWith("sqlinject ")) {
        const target = trimmed.slice(10).trim();
        if (!target) return addHistory([O("Usage: sqlinject <target_url>", "#ff4444")]);
        setIsBusy(true);
        addHistory([
          O(`[*] Starting SQL injection simulation on ${target}`, "#f59e0b"),
          O("[!] This is a simulation. No actual attack is performed.", "#666"),
          O(""),
        ]);
        simulateSQLInjection(target).then((result) => {
          addHistory(result);
          setIsBusy(false);
        });
        return;
      }

      const response = COMMANDS[lower];
      if (!response) {
        addHistory([O(`Command not found: '${cmd}'. Type 'help'.`, "#ff4444")]);
        return;
      }

      const output = response.output;
      const items: HistoryItem[] = [];
      if (Array.isArray(output)) {
        output.forEach((line) => items.push(O(line, response.color)));
      } else if (output) {
        items.push(O(output, response.color));
      }
      addHistory(items);
    },
    [addHistory]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim() && !isBusy) {
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

        <div ref={terminalRef} className="p-4 h-80 overflow-y-auto font-mono text-sm">
          {history.map((item, i) => (
            <div
              key={i}
              className="mb-1 leading-relaxed"
              style={{ color: item.color || (item.type === "input" ? "#7c5cfc" : "#888") }}
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
              disabled={isBusy}
              className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-purple-400 placeholder-gray-700"
              placeholder={isBusy ? "Running…" : "Type command..."}
              spellCheck={false}
              autoComplete="off"
            />
            <span className={`inline-block w-2 h-4 ${isBusy ? "bg-amber-400" : "bg-purple-400"} animate-pulse`} />
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs font-mono text-gray-600 terminal-container text-center leading-relaxed">
        Try: help | about | skills | projects | services | contact | system<br />
        myip | whois example.com | sqlinject https://target.com/login
      </p>
    </div>
  );
}

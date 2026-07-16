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
      "  whois <ip>   - WHOIS lookup on IP/domain",
      "  inject <url> - Simulate injection attacks (SQL, XSS, CMD, etc.)",
      "  myip         - Show your public IP & geolocation",
      "  scan <url>   - OWASP Top 10 security scan (new tab)",
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

// ─── Multi-Injection Simulator ────────────────────────────
// Simulates: SQLi, XSS (Reflected/Stored/DOM), Command Injection,
//            LDAP Injection, NoSQL Injection, SSTI, XXE, Path Traversal

type InjectType = {
  name: string;
  payload: string;
  endpoint: string;
  severity: string;
  owasp: string;
};

const INJECT_TYPES: InjectType[] = [
  { name: "SQL Injection (Error-based)", payload: "' OR '1'='1", endpoint: "/login", severity: "Critical", owasp: "A03:2021 – Injection" },
  { name: "SQL Injection (UNION-based)", payload: "' UNION SELECT null,null,null--", endpoint: "/product?id=", severity: "Critical", owasp: "A03:2021 – Injection" },
  { name: "SQL Injection (Blind/Boolean)", payload: "' AND 1=1--", endpoint: "/user?id=", severity: "Critical", owasp: "A03:2021 – Injection" },
  { name: "SQL Injection (Time-based)", payload: "'; WAITFOR DELAY '00:00:05'--", endpoint: "/search?q=", severity: "Critical", owasp: "A03:2021 – Injection" },
  { name: "Reflected XSS", payload: "<script>alert(1)</script>", endpoint: "/search?q=", severity: "High", owasp: "A03:2021 – Injection" },
  { name: "Stored XSS", payload: "<img src=x onerror=alert(1)>", endpoint: "/comment", severity: "High", owasp: "A03:2021 – Injection" },
  { name: "DOM-based XSS", payload: "#<img src=x onerror=alert(1)>", endpoint: "/#", severity: "High", owasp: "A03:2021 – Injection" },
  { name: "Command Injection", payload: "; ls -la", endpoint: "/ping?host=", severity: "Critical", owasp: "A03:2021 – Injection" },
  { name: "Command Injection (Chained)", payload: "| cat /etc/passwd", endpoint: "/exec?cmd=", severity: "Critical", owasp: "A03:2021 – Injection" },
  { name: "LDAP Injection", payload: "*)(uid=*))(|(uid=*", endpoint: "/login?user=", severity: "High", owasp: "A03:2021 – Injection" },
  { name: "NoSQL Injection (MongoDB)", payload: '{"$gt": ""}', endpoint: "/api/user?id=", severity: "High", owasp: "A03:2021 – Injection" },
  { name: "NoSQL Injection ($where)", payload: '{"$where": "1==1"}', endpoint: "/api/search", severity: "High", owasp: "A03:2021 – Injection" },
  { name: "Server-Side Template Injection", payload: "{{7*7}}", endpoint: "/profile?name=", severity: "High", owasp: "A03:2021 – Injection" },
  { name: "SSTI (Jinja2/Python)", payload: "{{config.__class__.__init__.__globals__}}", endpoint: "/render?template=", severity: "Critical", owasp: "A03:2021 – Injection" },
  { name: "XXE (External Entity)", payload: "<!DOCTYPE foo [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]>", endpoint: "/api/xml", severity: "Critical", owasp: "A03:2021 – Injection" },
  { name: "Path Traversal (Basic)", payload: "../../../../etc/passwd", endpoint: "/download?file=", severity: "High", owasp: "A01:2021 – Broken Access Control" },
  { name: "Path Traversal (Encoded)", payload: "..%2f..%2f..%2fetc%2fpasswd", endpoint: "/view?path=", severity: "High", owasp: "A01:2021 – Broken Access Control" },
  { name: "CRLF Injection", payload: "%0d%0aSet-Cookie: hacked=1", endpoint: "/redirect?url=", severity: "Medium", owasp: "A03:2021 – Injection" },
  { name: "HTTP Parameter Pollution", payload: "&admin=true&admin=true", endpoint: "/user?role=user", severity: "Low", owasp: "A04:2021 – Insecure Design" },
  { name: "Host Header Injection", payload: "evil.com", endpoint: "Host: ", severity: "Medium", owasp: "A05:2021 – Security Misconfiguration" },
];

function simulateInject(target: string): Promise<HistoryItem[]> {
  return new Promise((resolve) => {
    const steps: HistoryItem[][] = [];

    // Phase 1: Scan setup
    steps.push([
      O("╔══════════════════════════════════════╗", "#f59e0b"),
      O("║  INJECTION SCANNER — Multi-Vector    ║", "#f59e0b"),
      O("╚══════════════════════════════════════╝", "#f59e0b"),
      O(""),
      O(`[*] Target: ${target}`, "#f59e0b"),
      O(`[*] Vectors loaded: ${INJECT_TYPES.length}`, "#888"),
      O("[!] Simulation only. No actual exploit performed.", "#666"),
      O(""),
    ]);

    // Phase 2-7: Group injections by category
    const categories = [
      { label: "Phase 1/6 — SQL Injection Vectors", types: INJECT_TYPES.filter((t) => t.name.startsWith("SQL")) },
      { label: "Phase 2/6 — Cross-Site Scripting (XSS)", types: INJECT_TYPES.filter((t) => t.name.includes("XSS")) },
      { label: "Phase 3/6 — Command & OS Injection", types: INJECT_TYPES.filter((t) => t.name.includes("Command")) },
      { label: "Phase 4/6 — LDAP, NoSQL & Template Injection", types: INJECT_TYPES.filter((t) => t.name.includes("LDAP") || t.name.includes("NoSQL") || t.name.includes("Template") || t.name.includes("SSTI")) },
      { label: "Phase 5/6 — XXE, Path Traversal & CRLF", types: INJECT_TYPES.filter((t) => t.name.includes("XXE") || t.name.includes("Path") || t.name.includes("CRLF")) },
      { label: "Phase 6/6 — HTTP Header & Parameter Attacks", types: INJECT_TYPES.filter((t) => t.name.includes("Header") || t.name.includes("Parameter")) },
    ];

    let findings = 0;
    let criticals = 0;
    let highs = 0;

    categories.forEach((cat) => {
      const lines: HistoryItem[] = [];
      lines.push(O(`[~] ${cat.label}`, "#f59e0b"));
      lines.push(O(""));

      cat.types.forEach((t) => {
        const vulnerable = Math.random() > 0.45; // ~55% chance per vector
        const status = vulnerable ? "VULNERABLE" : "OK";
        const color = vulnerable ? (t.severity === "Critical" ? "#ef4444" : "#f59e0b") : "#10b981";
        lines.push(O(`  [~] ${t.payload}`, "#888"));
        lines.push(O(`      ${t.endpoint} → ${status}  [${t.severity}]`, color));

        if (vulnerable) {
          findings++;
          if (t.severity === "Critical") criticals++;
          if (t.severity === "High") highs++;

          const evidence = t.name.includes("SQL") ? "MySQL error: 'You have an error in your SQL syntax...'" :
            t.name.includes("XSS") ? "Payload reflected in HTML without encoding" :
            t.name.includes("Command") ? "Output: bin  boot  dev  etc  home  lib" :
            t.name.includes("LDAP") ? "LDAP filter bypassed — all users returned" :
            t.name.includes("NoSQL") ? "NoSQL operator executed — all documents returned" :
            t.name.includes("Template") || t.name.includes("SSTI") ? "Template expression evaluated: 49" :
            t.name.includes("XXE") ? "External entity resolved — /etc/passwd contents leaked" :
            t.name.includes("Path") ? "File contents returned: root:x:0:0:root:" :
            t.name.includes("CRLF") ? "Header injected — Set-Cookie reflected" :
            t.name.includes("Header") ? "Host header accepted without validation" :
            "Parameter pollution accepted — logic bypassed";

          lines.push(O(`      → Evidence: ${evidence}`, "#888"));
        }
      });

      lines.push(O(""));
      steps.push(lines);
    });

    // Final summary
    const totalChecks = INJECT_TYPES.length;
    const score = Math.max(0, Math.round(100 - (criticals * 18 + highs * 12 + (findings - criticals - highs) * 5)));
    const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";

    steps.push([
      O(""),
      O("╔══════════════════════════════════════╗", "#f59e0b"),
      O("║  INJECTION SCAN COMPLETE             ║", "#f59e0b"),
      O("╚══════════════════════════════════════╝", "#f59e0b"),
      O(""),
      O("─── Summary ───", "#7c5cfc"),
      O(""),
      O(`  Vectors tested:  ${totalChecks}`, "#888"),
      O(`  Vulnerabilities: ${findings} found`, findings > 0 ? "#ef4444" : "#10b981"),
      O(`    Critical: ${criticals}  |  High: ${highs}`, "#888"),
      O(`  Injection Score: ${score}/100  (Grade: ${grade})`, score >= 75 ? "#10b981" : "#f59e0b"),
      O(""),
      O("─── OWASP Mapping ───", "#7c5cfc"),
      O("  A03:2021 – Injection (SQL, XSS, CMD, LDAP, SSTI, CRLF)", "#888"),
      O("  A01:2021 – Broken Access Control (Path Traversal)", "#888"),
      O("  A04:2021 – Insecure Design (Param Pollution)", "#888"),
      O("  A05:2021 – Security Misconfiguration (Host Header)", "#888"),
      O(""),
      O("─── Top Mitigations ───", "#7c5cfc"),
      O("  1. Parameterized queries for ALL database access", "#38bdf8"),
      O("  2. Output encoding (HTML, JS, URL contexts)", "#38bdf8"),
      O("  3. Input validation + whitelist approach", "#38bdf8"),
      O("  4. Disable external entities in XML parsers", "#38bdf8"),
      O("  5. Restrict file system access (chroot/sandbox)", "#38bdf8"),
      O("  6. Disable template expression evaluation on user input", "#38bdf8"),
      O("  7. Validate and sanitize HTTP headers", "#38bdf8"),
      O(""),
      O("[!] Simulation complete. For real testing, use:", "#f59e0b"),
      O("    sqlmap | xsstrike | commix | burp suite | nuclei", "#666"),
      O(""),
      O("────────────────────────────────────────", "#666"),
    ]);

    let delay = 0;
    steps.forEach((step, i) => {
      delay += [300, 600, 600, 600, 700, 600, 500, 800][i] || 600;
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

      if (lower.startsWith("scan ")) {
        const target = trimmed.slice(5).trim();
        if (!target) return addHistory([O("Usage: scan <url>  —  e.g. scan https://example.com", "#ff4444")]);
        addHistory([
          O(""),
          O("╔══════════════════════════════════════╗", "#f59e0b"),
          O("║  WEBSITE SECURITY SCANNER            ║", "#f59e0b"),
          O("║  OWASP Top 10 (2021) — Safe Scan     ║", "#f59e0b"),
          O("╚══════════════════════════════════════╝", "#f59e0b"),
          O(""),
          O(`[*] Target: ${target}`, "#f59e0b"),
          O("[!] Opening professional vulnerability report in new tab…", "#38bdf8"),
          O("[!] All checks are read-only and safe.", "#666"),
          O(""),
        ]);
        // Open scan report in a new tab
        const reportUrl = `/scan-report?url=${encodeURIComponent(target)}`;
        window.open(reportUrl, "_blank");
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

      if (lower.startsWith("inject ")) {
        const target = trimmed.slice(7).trim();
        if (!target) return addHistory([O("Usage: inject <url>  —  e.g. inject https://example.com", "#ff4444")]);
        setIsBusy(true);
        simulateInject(target).then((result: HistoryItem[]) => {
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
        Try: help | about | whois example.com | myip |<br />
        inject https://example.com | scan https://example.com
      </p>
    </div>
  );
}

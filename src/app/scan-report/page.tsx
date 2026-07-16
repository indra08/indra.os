"use client";

import { useEffect, useState, useRef, useCallback } from "react";

/* ─── Types ─────────────────────────────── */
type Finding = {
  id: string; title: string; severity: "Critical" | "High" | "Medium" | "Low" | "Info";
  score: number; owasp: string; category: string; description: string; evidence: string; affected: string; recommendation: string; references: string[];
};
type CookieInfo = { name: string; secure: boolean; httpOnly: boolean; sameSite: string };
type ExposedResult = { path: string; status: number | string };
type ScanReport = {
  url: string; timestamp: string; score: number; grade: string;
  findings: Finding[]; headers: Record<string, string>;
  cookies: CookieInfo[]; exposedFiles: ExposedResult[];
  statusCode: number; statusText: string; scanDuration: number;
  owaspSummary: Record<string, number>; recommendations: string[];
  detectedTech: string[];
};

/* ─── Color helpers ─────────────────────── */
const sevColors: Record<string, string> = { Critical: "#ef4444", High: "#f97316", Medium: "#f59e0b", Low: "#38bdf8", Info: "#a78bfa" };
const sevBg: Record<string, string> = { Critical: "rgba(239,68,68,0.12)", High: "rgba(249,115,22,0.10)", Medium: "rgba(245,158,11,0.10)", Low: "rgba(56,189,248,0.08)", Info: "rgba(167,139,250,0.08)" };

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const color = score >= 75 ? "#10b981" : score >= 60 ? "#f59e0b" : score >= 40 ? "#f97316" : "#ef4444";
  const circumference = 251.2;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="62" fill="none" stroke="#1e1e2e" strokeWidth="8" />
        <circle cx="70" cy="70" r="62" fill="none" stroke={color} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 70 70)" style={{ transition: "stroke-dashoffset 1s ease-out" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[10px] text-gray-500 font-mono">/100</span>
      </div>
      <span className="mt-2 text-xs font-mono font-semibold" style={{ color }}>{grade}</span>
    </div>
  );
}

function SeverityBar({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="flex h-3 rounded-full overflow-hidden bg-[#1e1e2e]">
      {(["Critical", "High", "Medium", "Low", "Info"] as const).map((s) =>
        counts[s] > 0 ? <div key={s} style={{ width: `${(counts[s] / total) * 100}%`, background: sevColors[s] }} /> : null
      )}
    </div>
  );
}

/* ─── Security headers checklist ────────── */
const SECURITY_HEADERS = [
  "content-security-policy", "strict-transport-security", "permissions-policy",
  "referrer-policy", "x-frame-options", "x-content-type-options",
  "cross-origin-resource-policy", "cross-origin-embedder-policy",
  "cross-origin-opener-policy", "origin-agent-cluster",
];

const EXPOSED_PATHS = [
  "/.env", "/.env.local", "/.env.backup", "/.env.production",
  "/.git/config", "/.git/HEAD", "/.git/index", "/.git/description",
  "/.git/logs/HEAD", "/.git/refs/heads/master", "/.git/refs/heads/main",
  "/.svn/entries", "/.svn/wc.db", "/.hg/requires",
  "/backup.zip", "/backup.tar.gz", "/backup.sql", "/dump.sql",
  "/database.sql", "/db.sql", "/backup.sql.gz",
  "/phpinfo.php", "/info.php", "/test.php",
  "/.DS_Store", "/Thumbs.db",
  "/composer.json", "/composer.lock",
  "/package.json", "/package-lock.json", "/yarn.lock", "/pnpm-lock.yaml",
  "/docker-compose.yml", "/Dockerfile", "/.dockerignore",
  "/.htaccess", "/.htpasswd",
  "/.idea/workspace.xml", "/.vscode/settings.json",
  "/admin", "/login", "/administrator",
  "/wp-admin", "/wp-login.php", "/wp-content/debug.log",
  "/.well-known/security.txt",
  "/robots.txt", "/sitemap.xml",
  "/node_modules/.package-lock.json",
  "/storage/logs/laravel.log",
  "/debug/default/view", "/_debugbar/open",
];

/* ─── Real scan engine ───────────────────── */
async function runRealScan(targetUrl: string): Promise<ScanReport> {
  const t0 = performance.now();
  const findings: Finding[] = [];
  const recommendations: string[] = [];
  const headers: Record<string, string> = {};
  const cookies: CookieInfo[] = [];
  const exposedFiles: ExposedResult[] = [];
  let statusCode = 0;
  let statusText = "Unknown";

  // Normalize URL
  let url = targetUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;

  // ── CORS Proxy (Multi-layered: own CF Function → public proxies) ──
  // /api/scan-proxy is a Cloudflare Pages Function (server-side, no CORS issue)
  // Public proxies are fallbacks for local dev

  async function fetchViaEdge(targetUrl: string): Promise<{
    status: number; statusText: string; headers: Record<string, string>; body: string;
  } | null> {
    try {
      const resp = await fetch(`/api/scan-proxy?url=${encodeURIComponent(targetUrl)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.error) return null;
        // Parse response headers from the edge function response
        const rawHeaders: Record<string, string> = {};
        if (data.headers) {
          for (const [k, v] of Object.entries(data.headers)) {
            if (typeof v === "string") rawHeaders[k as string] = v as string;
          }
        }
        return {
          status: data.status || 200,
          statusText: data.statusText || "OK",
          headers: rawHeaders,
          body: data.body || "",
        };
      }
    } catch { /* fall through to public proxy */ }
    return null;
  }

  async function fetchViaAllOrigins(targetUrl: string): Promise<{
    status: number; statusText: string; headers: Record<string, string>; body: string;
  } | null> {
    try {
      const apiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
      const resp = await fetch(apiUrl);
      if (!resp.ok) return null;
      const data = await resp.json();
      if (!data.contents || data.contents.length < 50) return null;
      const rawHeaders: Record<string, string> = {};
      if (data.status) {
        const hdrStr = data.status.response_headers || "";
        hdrStr.split("\n").forEach((line: string) => {
          const idx = line.indexOf(":");
          if (idx > 0) rawHeaders[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
        });
      }
      return {
        status: data.status?.http_code || 200,
        statusText: "OK",
        headers: rawHeaders,
        body: data.contents,
      };
    } catch { return null; }
  }

  async function fetchViaCorsproxyIo(targetUrl: string): Promise<{
    status: number; statusText: string; headers: Record<string, string>; body: string;
  } | null> {
    try {
      const resp = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
      if (!resp.ok) return null;
      const text = await resp.text();
      return { status: 200, statusText: "OK", headers: {}, body: text };
    } catch { return null; }
  }

  // Unified fetch with fallback chain: Edge Function → allorigins → corsproxy
  async function fetchMainPage(targetUrl: string): Promise<{
    status: number; statusText: string; headers: Record<string, string>; body: string;
  }> {
    // 1. Try own Cloudflare Pages Function (best: no rate limits, accurate status)
    const edge = await fetchViaEdge(targetUrl);
    if (edge) return edge;

    // 2. Try allorigins.win (accurate status codes)
    const ao = await fetchViaAllOrigins(targetUrl);
    if (ao) return ao;

    // 3. Fallback: corsproxy.io (always returns 200 body)
    const cp = await fetchViaCorsproxyIo(targetUrl);
    if (cp) return cp;

    throw new Error("All proxy methods failed");
  }

  async function fetchPathForCheck(targetUrl: string): Promise<{
    status: number; body: string; contentType: string;
  }> {
    // 1. Try own Edge Function (best)
    const edge = await fetchViaEdge(targetUrl);
    if (edge) {
      return { status: edge.status, body: edge.body.slice(0, 500), contentType: edge.headers["content-type"] || "" };
    }

    // 2. Try allorigins for accurate status
    const ao = await fetchViaAllOrigins(targetUrl);
    if (ao) {
      const ct = (ao.headers["content-type"] || "").toLowerCase();
      return { status: ao.status, body: ao.body.slice(0, 500), contentType: ct };
    }

    // 3. Fallback: corsproxy.io
    const cp = await fetchViaCorsproxyIo(targetUrl);
    if (cp) {
      const ct = (cp.headers["content-type"] || "").toLowerCase();
      return { status: 200, body: cp.body.slice(0, 500), contentType: ct };
    }

    throw new Error("Path check failed");
  }

  // ── Import axios (only for DNS/CRT.SH APIs) ──
  const axios = (await import("axios")).default;

  // ── CHECK 1: Fetch main page & headers ──
  let mainResp;
  try {
    mainResp = await fetchMainPage(url);
    statusCode = mainResp.status;
    statusText = mainResp.statusText;

    // Extract headers (normalize to lowercase keys)
    if (mainResp.headers) {
      for (const [key, val] of Object.entries(mainResp.headers)) {
        if (typeof val === "string") headers[key.toLowerCase()] = val;
      }
    }

    // Parse cookies from Set-Cookie
    const setCookie = mainResp.headers["set-cookie"];
    const cookieHeaders: string[] = Array.isArray(setCookie) ? setCookie : setCookie ? [String(setCookie)] : [];
    for (const raw of cookieHeaders) {
      const parts = raw.split(";").map((s: string) => s.trim());
      const [nameVal] = parts;
      const name = nameVal?.split("=")[0] || "";
      const secure = parts.some((p: string) => p.toLowerCase() === "secure");
      const httpOnly = parts.some((p: string) => p.toLowerCase() === "httponly");
      const sameSitePart = parts.find((p: string) => p.toLowerCase().startsWith("samesite"));
      const sameSite = sameSitePart ? sameSitePart.split("=")[1]?.trim() || sameSitePart : "—";
      cookies.push({ name, secure, httpOnly, sameSite });
    }
  } catch {
    findings.push({
      id: "CONN-ERR", title: "Connection Failed", severity: "Critical", score: 30,
      owasp: "A05:2021 – Security Misconfiguration", category: "Connection",
      description: `Unable to connect to ${url}. The server may be down or blocking requests.`,
      evidence: "Connection refused or timed out.",
      affected: url, recommendation: "Verify the URL is correct and the server is running.",
      references: [],
    });
    const t1 = performance.now();
    return buildReport(url, findings, headers, cookies, exposedFiles, 0, "Connection Failed", t1 - t0);
  }

  // ── CHECK 2: Security Headers ──
  const missingHeaders: string[] = [];
  for (const h of SECURITY_HEADERS) {
    if (!headers[h]) missingHeaders.push(h);
  }
  const presentHdrs = SECURITY_HEADERS.filter((h) => !!headers[h]);
  if (missingHeaders.length > 0) {
    const severity: Finding["severity"] = missingHeaders.length >= 7 ? "High" : missingHeaders.length >= 4 ? "Medium" : "Low";
    findings.push({
      id: "SEC-HDR", title: `Missing Security Headers (${missingHeaders.length}/${SECURITY_HEADERS.length})`,
      severity, score: missingHeaders.length >= 7 ? 22 : missingHeaders.length >= 4 ? 12 : 5,
      owasp: "A05:2021 – Security Misconfiguration", category: "Headers",
      description: `${missingHeaders.length} of ${SECURITY_HEADERS.length} recommended security headers are missing: ${missingHeaders.join(", ")}. Present: ${presentHdrs.length > 0 ? presentHdrs.join(", ") : "none"}.`,
      evidence: `Missing from HTTP response: ${missingHeaders.join(", ")}`,
      affected: `${url} — Response headers`,
      recommendation: "Configure missing security headers in your web server or load balancer.",
      references: ["https://owasp.org/www-project-secure-headers/"],
    });
  }
  if (presentHdrs.length > 0) {
    recommendations.push(`Security headers present: ${presentHdrs.join(", ")}`);
  }

  // ── CHECK 3: HTTPS ──
  if (url.startsWith("http://")) {
    findings.push({
      id: "HTTPS-001", title: "HTTPS Not Enforced", severity: "High", score: 18,
      owasp: "A02:2021 – Cryptographic Failures", category: "HTTPS",
      description: "The site was accessed over HTTP. All traffic is transmitted in plaintext.",
      evidence: `Connected via HTTP. Status: ${statusCode}`,
      affected: url,
      recommendation: "Redirect all HTTP traffic to HTTPS. Enable HSTS with includeSubDomains.",
      references: ["https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html"],
    });
  } else {
    // Check for HSTS
    if (!headers["strict-transport-security"]) {
      findings.push({
        id: "HSTS-001", title: "HSTS Header Missing", severity: "Medium", score: 8,
        owasp: "A02:2021 – Cryptographic Failures", category: "HTTPS",
        description: "Site uses HTTPS but does not send Strict-Transport-Security header.",
        evidence: "HSTS header not present in HTTPS response.",
        affected: url,
        recommendation: "Add 'Strict-Transport-Security: max-age=31536000; includeSubDomains' header.",
        references: ["https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html"],
      });
    }
  }

  // ── CHECK 4: Server Disclosure ──
  const disclHeaders = ["server", "x-powered-by", "x-aspnet-version", "x-generator"];
  const leaked: string[] = [];
  for (const h of disclHeaders) {
    if (headers[h]) leaked.push(`${h}: ${headers[h]}`);
  }
  if (leaked.length > 0) {
    findings.push({
      id: "INFO-001", title: "Server Information Disclosure",
      severity: "Low", score: 4,
      owasp: "A05:2021 – Security Misconfiguration", category: "Disclosure",
      description: `${leaked.length} header(s) expose server technology: ${leaked.join("; ")}.`,
      evidence: leaked.join(" | "),
      affected: `${url} — Response headers`,
      recommendation: "Remove or mask version information from response headers.",
      references: ["https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html"],
    });
  }

  // ── CHECK 5: Cookie Security ──
  const insecureCookies = cookies.filter((c) => !c.secure || !c.httpOnly);
  if (insecureCookies.length > 0) {
    findings.push({
      id: "CK-001", title: `Insecure Cookie Configuration (${insecureCookies.length} cookie(s))`,
      severity: "Medium", score: 10,
      owasp: "A04:2021 – Insecure Design", category: "Cookies",
      description: `${insecureCookies.length} cookie(s) missing Secure/HttpOnly flags: ${insecureCookies.map((c) => c.name).join(", ")}.`,
      evidence: insecureCookies.map((c) => `${c.name}: Secure=${c.secure}, HttpOnly=${c.httpOnly}, SameSite=${c.sameSite}`).join(" | "),
      affected: `${url} — Set-Cookie`,
      recommendation: "Set Secure; HttpOnly; SameSite=Strict on all session cookies.",
      references: ["https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html"],
    });
  }

  // ── CHECK 6: CORS ──
  const acao = headers["access-control-allow-origin"];
  const acac = headers["access-control-allow-credentials"];
  if (acao === "*" && acac === "true") {
    findings.push({
      id: "CORS-001", title: "CORS Misconfiguration (Wildcard + Credentials)",
      severity: "High", score: 20,
      owasp: "A01:2021 – Broken Access Control", category: "CORS",
      description: "Access-Control-Allow-Origin: * combined with Access-Control-Allow-Credentials: true allows any website to make authenticated requests.",
      evidence: `ACAO: ${acao} | ACAC: ${acac}`,
      affected: `${url} — CORS headers`,
      recommendation: "Never use wildcard with credentials. Specify exact allowed origins.",
      references: ["https://owasp.org/www-project-web-security-testing-guide/"],
    });
  } else if (acao === "*") {
    findings.push({
      id: "CORS-002", title: "CORS: Wildcard Origin",
      severity: "Low", score: 3,
      owasp: "A01:2021 – Broken Access Control", category: "CORS",
      description: "Access-Control-Allow-Origin: * allows any origin to read responses (non-credentialed requests only).",
      evidence: `ACAO: ${acao}`,
      affected: `${url}`,
      recommendation: "Restrict CORS to specific trusted origins if the API handles sensitive data.",
      references: [],
    });
  }

  // ── CHECK 7: Clickjacking ──
  if (!headers["x-frame-options"] && !(headers["content-security-policy"] || "").includes("frame-ancestors")) {
    findings.push({
      id: "CJ-001", title: "Clickjacking Vulnerability (No Frame Protection)",
      severity: "Medium", score: 10,
      owasp: "A05:2021 – Security Misconfiguration", category: "Clickjacking",
      description: "Neither X-Frame-Options nor CSP frame-ancestors is set. The site can be embedded in iframes.",
      evidence: "X-Frame-Options: not set. frame-ancestors: not found in CSP.",
      affected: url,
      recommendation: "Add 'X-Frame-Options: DENY' or 'Content-Security-Policy: frame-ancestors 'none''.",
      references: ["https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html"],
    });
  }

  // ── CHECK 8: MIME Sniffing ──
  if (!headers["x-content-type-options"]) {
    findings.push({
      id: "MIME-001", title: "MIME Sniffing Not Prevented",
      severity: "Low", score: 3,
      owasp: "A05:2021 – Security Misconfiguration", category: "MIME",
      description: "X-Content-Type-Options header is missing. Browsers may MIME-sniff responses.",
      evidence: "X-Content-Type-Options header not present.",
      affected: url,
      recommendation: "Add 'X-Content-Type-Options: nosniff' header.",
      references: [],
    });
  }

  // ── CHECK 9: Exposed Files & Paths (real requests, parallel) ──
  const baseUrl = url.replace(/\/$/, "");
  const mainBody = (mainResp?.body || "").slice(0, 5000).replace(/\s+/g, " ").trim();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  const pathResults = await Promise.allSettled(
    EXPOSED_PATHS.map(async (path) => {
      try {
        const r = await fetchPathForCheck(baseUrl + path);
        return { path, status: r.status, contentType: r.contentType, bodyPreview: r.body };
      } catch {
        return { path, status: "Error", contentType: "", bodyPreview: "" };
      }
    })
  );
  clearTimeout(timeoutId);

  // Helper: detect if path body is same as main page (SPA catch-all)
  function isSamePage(a: string, b: string): boolean {
    if (!a || !b) return false;
    const na = a.replace(/\s+/g, " ").trim().slice(0, 3000);
    const nb = b.replace(/\s+/g, " ").trim().slice(0, 3000);
    if (na.length < 20 || nb.length < 20) return false;
    let matches = 0;
    const len = Math.min(na.length, nb.length);
    for (let i = 0; i < len; i++) { if (na[i] === nb[i]) matches++; }
    return len > 0 && matches / len > 0.85;
  }

  for (const result of pathResults) {
    if (result.status === "fulfilled" && typeof result.value.status === "number") {
      exposedFiles.push({ path: result.value.path, status: result.value.status });
      const { path, status, contentType, bodyPreview } = result.value;
      const statusNum = status as number;

      if (statusNum === 200) {
        const pathBody = (bodyPreview || "").replace(/\s+/g, " ").trim();
        const isSameAsMain = isSamePage(pathBody, mainBody);

        // If body matches main page → SPA catch-all, not a real file. Skip silently.
        if (isSameAsMain && mainBody.length > 20) {
          continue;
        }

        // If response looks like HTML but body is different from main → could be real
        const isGit = path.startsWith("/.git/");
        const isEnv = path.startsWith("/.env");
        const isSql = path.endsWith(".sql") || path.endsWith(".sql.gz");
        const sev: Finding["severity"] = isGit || isEnv ? "Critical" : isSql ? "High" : "High";
        findings.push({
          id: `EXP-${path.replace(/[\/\.]/g, "-")}`,
          title: `Exposed File: ${path}`,
          severity: sev, score: isGit || isEnv ? 28 : isSql ? 22 : 18,
          owasp: "A05:2021 – Security Misconfiguration", category: "Exposed Files",
          description: `${path} is publicly accessible (HTTP 200). ${isGit ? "This exposes Git repository internals." : isEnv ? "This may expose credentials and secrets." : isSql ? "This may expose database dumps." : "This path returns content that differs from the main page — likely a real file."}`,
          evidence: `GET ${path} → HTTP 200 OK (body != main page)`,
          affected: `${url}${path}`,
          recommendation: `Restrict access to ${path} via web server configuration.`,
          references: [],
        });
      } else if (statusNum === 302 || statusNum === 301) {
        findings.push({
          id: `EXP-${path.replace(/[\/\.]/g, "-")}`,
          title: `Discoverable Path: ${path} (${statusNum} Redirect)`,
          severity: "Low", score: 3,
          owasp: "A01:2021 – Broken Access Control", category: "Access Control",
          description: `${path} returns HTTP ${statusNum} redirect, confirming this resource exists.`,
          evidence: `GET ${path} → HTTP ${statusNum}`,
          affected: `${url}${path}`,
          recommendation: "Consider moving administrative paths to non-guessable URLs.",
          references: [],
        });
      }
    }
  }

  // ── CHECK 10: CSP Analysis (if present) ──
  const csp = headers["content-security-policy"] || "";
  if (csp) {
    if (csp.includes("unsafe-inline")) {
      findings.push({
        id: "CSP-001", title: "CSP Contains 'unsafe-inline'",
        severity: "Medium", score: 6,
        owasp: "A05:2021 – Security Misconfiguration", category: "CSP",
        description: "The Content-Security-Policy allows 'unsafe-inline' scripts/styles, weakening XSS protection.",
        evidence: `CSP: ${csp.slice(0, 120)}...`,
        affected: url,
        recommendation: "Remove 'unsafe-inline' and use nonces or hashes instead.",
        references: ["https://content-security-policy.com/"],
      });
    }
    if (csp.includes("unsafe-eval")) {
      findings.push({
        id: "CSP-002", title: "CSP Contains 'unsafe-eval'",
        severity: "High", score: 14,
        owasp: "A05:2021 – Security Misconfiguration", category: "CSP",
        description: "The Content-Security-Policy allows 'unsafe-eval', enabling code execution from strings.",
        evidence: `CSP: ${csp.slice(0, 120)}...`,
        affected: url,
        recommendation: "Remove 'unsafe-eval'. Refactor code to avoid eval() and Function() constructor.",
        references: [],
      });
    }
  }

  // ── CHECK 11: HTTP → HTTPS Redirect ──
  if (url.startsWith("https://")) {
    try {
      const httpUrl = url.replace("https://", "http://");
      const redirectResp = await fetchPathForCheck(httpUrl);
      const isRedirect = redirectResp.status >= 300 && redirectResp.status < 400;
      if (isRedirect) {
        // Redirect working — no finding
      } else {
        findings.push({
          id: "REDIR-001", title: "HTTP → HTTPS Redirect Missing",
          severity: "High", score: 16,
          owasp: "A02:2021 – Cryptographic Failures", category: "HTTPS",
          description: "HTTP request returned status " + redirectResp.status + " without redirecting to HTTPS.",
          evidence: `GET http://... → ${redirectResp.status}`,
          affected: httpUrl,
          recommendation: "Configure server to redirect all HTTP traffic to HTTPS (301).",
          references: [],
        });
      }
    } catch {
      // Could not reach HTTP version — likely already blocked at network level, which is fine
    }
  }

  // ── CHECK 12: robots.txt Analysis (real) ──
  try {
    const robotsResp = await fetchPathForCheck(url.replace(/\/$/, "") + "/robots.txt");
    if (robotsResp.status === 200 && typeof robotsResp.body === "string") {
      const robotsText = robotsResp.body as string;
      try {
        const robotsParser = (await import("robots-parser")).default;
        const robots = robotsParser(url, robotsText);
        const sensitivePaths = ["/admin", "/api", "/config", "/backup", "/dev", "/staging", "/logs", "/db", "/database", "/wp-admin", "/.git", "/.env", "/private"];
        const disallowedInRobots: string[] = [];
        for (const p of sensitivePaths) {
          if (!robots.isAllowed("IndraScanner", p)) disallowedInRobots.push(p);
        }
        if (robotsText.includes("Disallow: /")) {
          findings.push({
            id: "ROBOTS-002", title: "robots.txt Blocks All Crawling",
            severity: "Info", score: 1,
            owasp: "A05:2021 – Security Misconfiguration", category: "Robots",
            description: "robots.txt contains 'Disallow: /' which blocks all crawlers but also reveals that the site owner wants to hide content.",
            evidence: `robots.txt content: Disallow: /`,
            affected: `${url}/robots.txt`,
            recommendation: "Review robots.txt — it should block only sensitive paths, not the entire site.",
            references: [],
          });
        }
        if (disallowedInRobots.length > 0) {
          findings.push({
            id: "ROBOTS-001", title: "Sensitive Paths Disclosed via robots.txt",
            severity: "Low", score: 3,
            owasp: "A05:2021 – Security Misconfiguration", category: "Robots",
            description: `robots.txt explicitly blocks ${disallowedInRobots.length} sensitive path(s), revealing their existence: ${disallowedInRobots.join(", ")}.`,
            evidence: `robots.txt disallows: ${disallowedInRobots.join(", ")}`,
            affected: `${url}/robots.txt`,
            recommendation: "Avoid listing sensitive paths in robots.txt. Use authentication instead.",
            references: [],
          });
        }
      } catch {
        // robots-parser failed — skip
      }
    } else {
      findings.push({
        id: "ROBOTS-003", title: "robots.txt Not Found",
        severity: "Info", score: 1,
        owasp: "A05:2021 – Security Misconfiguration", category: "Robots",
        description: "No robots.txt found. While not a vulnerability, it helps crawlers understand which paths to avoid.",
        evidence: `GET /robots.txt → HTTP ${robotsResp.status}`,
        affected: `${url}/robots.txt`,
        recommendation: "Consider adding a robots.txt to guide legitimate crawlers.",
        references: [],
      });
    }
  } catch {
    // robots.txt check failed — non-critical
  }

  // ── CHECK 13: Sitemap Analysis (real) ──
  try {
    const sitemapResp = await fetchPathForCheck(url.replace(/\/$/, "") + "/sitemap.xml");
    if (sitemapResp.status === 200 && typeof sitemapResp.body === "string") {
      try {
        const xml2jsLib = (await import("xml2js")).default;
        const parsed = await xml2jsLib.parseStringPromise(sitemapResp.body as string);
        const urls = parsed?.urlset?.url || [];
        const urlCount = Array.isArray(urls) ? urls.length : 0;
        if (urlCount > 0) {
          // Check for dev/staging URLs in sitemap
          const devUrls: string[] = [];
          const sensitiveUrls: string[] = [];
          for (const u of urls) {
            const loc = (u.loc && u.loc[0]) || "";
            if (/dev\.|staging\.|test\.|localhost|\.local/i.test(loc)) devUrls.push(loc);
            if (/admin|\/api\/|\/config|\.env|\.git|\.sql/i.test(loc)) sensitiveUrls.push(loc);
          }
          if (devUrls.length > 0) {
            findings.push({
              id: "SITEMAP-001", title: `Development URLs Exposed in sitemap.xml`,
              severity: "Medium", score: 8,
              owasp: "A05:2021 – Security Misconfiguration", category: "Sitemap",
              description: `${devUrls.length} development/staging URL(s) found in sitemap.xml: ${devUrls.slice(0, 3).join(", ")}.`,
              evidence: `sitemap.xml contains: ${devUrls.slice(0, 3).join("; ")}`,
              affected: `${url}/sitemap.xml`,
              recommendation: "Remove development/staging URLs from production sitemap.",
              references: [],
            });
          }
          if (sensitiveUrls.length > 0) {
            findings.push({
              id: "SITEMAP-002", title: `Sensitive URLs in sitemap.xml`,
              severity: "Low", score: 3,
              owasp: "A05:2021 – Security Misconfiguration", category: "Sitemap",
              description: `${sensitiveUrls.length} sensitive URL(s) exposed in sitemap.xml.`,
              evidence: `sitemap.xml contains sensitive paths: ${sensitiveUrls.slice(0, 3).join("; ")}`,
              affected: `${url}/sitemap.xml`,
              recommendation: "Remove sensitive/administrative URLs from public sitemap.",
              references: [],
            });
          }
        }
      } catch {
        // XML parsing failed
      }
    }
  } catch {
    // sitemap check failed — non-critical
  }

  // ── CHECK 14: DNS Records (real, via Cloudflare DoH) ──
  try {
    const domain = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
    const dnsTypes = ["A", "AAAA", "MX", "TXT", "NS"];
    const dnsResults: { type: string; value: string }[] = [];
    for (const t of dnsTypes) {
      try {
        const dnsResp = await axios.get(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${t}`, {
          timeout: 5000,
          headers: { "Accept": "application/dns-json" },
        });
        const answers = dnsResp.data?.Answer || [];
        for (const a of answers) {
          dnsResults.push({ type: t, value: a.data || JSON.stringify(a) });
        }
      } catch {
        // skip individual DNS type
      }
    }
    if (dnsResults.length > 0) {
      const spf = dnsResults.find((r) => r.type === "TXT" && r.value.includes("v=spf1"));
      const dmarc = dnsResults.find((r) => r.type === "TXT" && r.value.includes("v=DMARC1"));
      if (!spf) {
        findings.push({
          id: "DNS-001", title: "SPF Record Missing",
          severity: "Medium", score: 6,
          owasp: "A05:2021 – Security Misconfiguration", category: "DNS",
          description: "No SPF record found. This allows attackers to spoof emails from this domain.",
          evidence: "No v=spf1 TXT record found.",
          affected: domain,
          recommendation: "Add an SPF TXT record to prevent email spoofing.",
          references: ["https://www.cloudflare.com/learning/dns/dns-records/dns-spf-record/"],
        });
      }
      if (!dmarc) {
        findings.push({
          id: "DNS-002", title: "DMARC Record Missing",
          severity: "Medium", score: 6,
          owasp: "A05:2021 – Security Misconfiguration", category: "DNS",
          description: "No DMARC record found. DMARC helps prevent email spoofing and phishing.",
          evidence: "No v=DMARC1 TXT record found.",
          affected: domain,
          recommendation: "Add a DMARC TXT record (e.g., v=DMARC1; p=none; rua=mailto:dmarc@example.com).",
          references: [],
        });
      }
    }
  } catch {
    // DNS check failed — non-critical
  }

  // ── CHECK 15: HTML Analysis (real, via cheerio) ──
  if (mainResp && typeof mainResp.body === "string") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cheerioLib = (await import("cheerio") as any);
      const $ = cheerioLib.load ? cheerioLib.load(mainResp.body as string) : cheerioLib.default.load(mainResp.body as string);

      // Detect forms without CSRF protection
      const forms = $("form");
      const formsWithoutCsrf: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      forms.each((_i: number, el: any) => {
        const action = $(el).attr("action") || window.location.pathname;
        const hasCsrf = $(el).find('input[name="_token"], input[name="csrf_token"], input[name="_csrf"], input[name="authenticity_token"], input[name="xsrf"]').length > 0;
        const method = ($(el).attr("method") || "GET").toUpperCase();
        if (method === "POST" && !hasCsrf) {
          formsWithoutCsrf.push(action);
        }
      });
      if (formsWithoutCsrf.length > 0) {
        findings.push({
          id: "CSRF-001", title: `Forms Without CSRF Protection (${formsWithoutCsrf.length})`,
          severity: "Medium", score: 8,
          owasp: "A01:2021 – Broken Access Control", category: "CSRF",
          description: `${formsWithoutCsrf.length} POST form(s) lack visible CSRF tokens: ${formsWithoutCsrf.slice(0, 3).join(", ")}. This may indicate missing CSRF protection.`,
          evidence: `Forms at: ${formsWithoutCsrf.slice(0, 3).join(", ")} have no CSRF token input.`,
          affected: `${url} — HTML forms`,
          recommendation: "Add CSRF tokens to all state-changing forms. Use framework-provided CSRF protection.",
          references: ["https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html"],
        });
      }

      // Detect meta generator tags (fingerprint)
      const generator = $('meta[name="generator"]').attr("content");
      if (generator && /wordpress|joomla|drupal|wix|shopify/i.test(generator)) {
        findings.push({
          id: "META-001", title: `CMS Fingerprinted via Meta Tag`,
          severity: "Info", score: 1,
          owasp: "A05:2021 – Security Misconfiguration", category: "Fingerprinting",
          description: `Meta generator tag reveals CMS: "${generator}". This helps attackers identify known vulnerabilities.`,
          evidence: `<meta name="generator" content="${generator}">`,
          affected: url,
          recommendation: "Remove meta generator tags in production or use a security plugin to hide CMS identity.",
          references: [],
        });
      }

      // Detect inline scripts (CSP bypass risk)
      const inlineScripts = $('script:not([src])').length;
      if (inlineScripts > 5) {
        findings.push({
          id: "INLINE-001", title: `Many Inline Scripts Detected (${inlineScripts})`,
          severity: "Low", score: 3,
          owasp: "A05:2021 – Security Misconfiguration", category: "CSP",
          description: `${inlineScripts} inline <script> tags found. Inline scripts weaken CSP effectiveness and make XSS mitigation harder.`,
          evidence: `${inlineScripts} inline <script> tags in HTML.`,
          affected: url,
          recommendation: "Move inline scripts to external files. Use nonces or hashes if inline scripts are required.",
          references: [],
        });
      }

      // Detect comments with sensitive keywords
      const htmlComments: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      $("*").contents().each((_i: number, el: any) => {
        if (el.type === "comment") {
          const commentText = (el as unknown as { data?: string }).data || "";
          if (/TODO|FIXME|password|secret|api.?key|token|private|hack/i.test(commentText)) {
            htmlComments.push(commentText.trim().slice(0, 80));
          }
        }
      });
      if (htmlComments.length > 0) {
        findings.push({
          id: "COMM-001", title: `Sensitive Info in HTML Comments (${htmlComments.length})`,
          severity: "Low", score: 3,
          owasp: "A05:2021 – Security Misconfiguration", category: "Disclosure",
          description: `${htmlComments.length} HTML comment(s) may contain sensitive information: "${htmlComments[0].slice(0, 60)}${htmlComments[0].length > 60 ? "..." : ""}"`,
          evidence: htmlComments.slice(0, 2).join(" | "),
          affected: url,
          recommendation: "Remove sensitive information from HTML comments. Use build-time comment stripping in production.",
          references: [],
        });
      }

      // Detect external JS loaded over HTTP
      const httpScripts: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      $('script[src^="http://"]').each((_i: number, el: any) => {
        httpScripts.push($(el).attr("src") || "");
      });
      if (httpScripts.length > 0) {
        findings.push({
          id: "MIXED-001", title: `Scripts Loaded Over HTTP (Mixed Content)`,
          severity: "High", score: 14,
          owasp: "A02:2021 – Cryptographic Failures", category: "Mixed Content",
          description: `${httpScripts.length} script(s) loaded over insecure HTTP on an HTTPS page.`,
          evidence: `HTTP scripts: ${httpScripts.slice(0, 3).join(", ")}`,
          affected: url,
          recommendation: "Change all script src attributes to HTTPS or use protocol-relative URLs (//).",
          references: [],
        });
      }
    } catch {
      // cheerio parsing failed — skip
    }
  }

  // ── CHECK 16: SSL Certificate (real, via HTTPS check) ──
  if (url.startsWith("https://")) {
    try {
      // Use crt.sh API to get certificate info
      const domainForSsl = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
      const crtResp = await axios.get(`https://crt.sh/?q=%25.${encodeURIComponent(domainForSsl)}&output=json`, {
        timeout: 8000,
        headers: { "User-Agent": "IndraSecurityScanner/1.0" },
      });
      if (Array.isArray(crtResp.data) && crtResp.data.length > 0) {
        const latest = crtResp.data[0];
        const notAfter = latest.not_after;
        if (notAfter) {
          const expiryDate = new Date(notAfter);
          const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / 86400000);
          if (daysLeft < 0) {
            findings.push({
              id: "SSL-EXPIRED", title: "SSL Certificate Expired",
              severity: "Critical", score: 25,
              owasp: "A02:2021 – Cryptographic Failures", category: "SSL",
              description: `The SSL certificate expired ${Math.abs(daysLeft)} day(s) ago (${notAfter}).`,
              evidence: `Certificate not_after: ${notAfter}`,
              affected: url,
              recommendation: "Renew the SSL certificate immediately.",
              references: [],
            });
          } else if (daysLeft < 30) {
            findings.push({
              id: "SSL-EXPIRING", title: `SSL Certificate Expiring Soon (${daysLeft} days)`,
              severity: "Medium", score: 7,
              owasp: "A02:2021 – Cryptographic Failures", category: "SSL",
              description: `The SSL certificate expires in ${daysLeft} day(s). Renew soon to avoid downtime.`,
              evidence: `Certificate not_after: ${notAfter}`,
              affected: url,
              recommendation: "Renew the SSL certificate before it expires.",
              references: [],
            });
          }
        }
      }
    } catch {
      // crt.sh check failed — skip
    }
  }

  // ── CHECK 17: Technology Stack Detection (real, via response fingerprints) ──
  const techFingerprints: { name: string; headers: string[]; htmlPattern?: RegExp; htmlData?: string }[] = [
    { name: "Cloudflare", headers: ["cf-ray", "cf-cache-status", "server"] },
    { name: "PHP", headers: ["x-powered-by"] },
    { name: "ASP.NET", headers: ["x-aspnet-version", "x-powered-by"] },
    { name: "Node.js/Express", headers: ["x-powered-by"] },
    { name: "Nginx", headers: ["server"] },
    { name: "Apache", headers: ["server"] },
    { name: "Vercel", headers: ["x-vercel-id", "x-vercel-cache"] },
    { name: "Netlify", headers: ["x-nf-request-id", "server"] },
    { name: "AWS CloudFront", headers: ["x-amz-cf-id", "x-amz-cf-pop"] },
    { name: "Fastly", headers: ["x-served-by", "x-cache"] },
    { name: "WordPress", headers: ["x-powered-by"], htmlPattern: /wp-content|wp-includes|wordpress/i },
    { name: "React", headers: [], htmlPattern: /react|__REACT_DEVTOOLS|react-root/i },
    { name: "Next.js", headers: [], htmlPattern: /__NEXT_DATA__|__next|_next\/static/i },
    { name: "Vue.js", headers: [], htmlPattern: /vue\.js|data-v-|__vue__/i },
    { name: "jQuery", headers: [], htmlPattern: /jquery[\.-]?[0-9]/i },
    { name: "Bootstrap", headers: [], htmlPattern: /bootstrap[\.-]?[0-9]/i },
    { name: "Tailwind CSS", headers: [], htmlPattern: /tailwindcss|tailwind/i },
    { name: "Google Analytics", headers: [], htmlPattern: /google-analytics|gtag|ga\(/i },
    { name: "Google Tag Manager", headers: [], htmlPattern: /googletagmanager/i },
    { name: "Font Awesome", headers: [], htmlPattern: /font-?awesome/i },
  ];
  const detectedTech: string[] = [];
  const htmlData = (mainResp && typeof mainResp.body === "string") ? mainResp.body as string : "";
  for (const tech of techFingerprints) {
    let detected = false;
    for (const h of tech.headers) {
      const val = (headers[h] || "").toLowerCase();
      if (val && val.includes(tech.name.toLowerCase())) { detected = true; break; }
    }
    if (!detected && tech.htmlPattern && htmlData) {
      detected = tech.htmlPattern.test(htmlData);
    }
    if (detected) detectedTech.push(tech.name);
  }
  // Note: we don't push findings here — this is just informational, shown in the tech/detail panels

  // ── Score Calculation ──
  const t1 = performance.now();
  return buildReport(url, findings, headers, cookies, exposedFiles, statusCode, statusText, t1 - t0, detectedTech);
}

function buildReport(
  url: string, findings: Finding[], headers: Record<string, string>,
  cookies: CookieInfo[], exposedFiles: ExposedResult[],
  statusCode: number, statusText: string, scanDuration: number,
  detectedTech: string[] = [],
): ScanReport {
  const totalDeduction = findings.reduce((sum, f) => sum + f.score, 0);
  const maxPossible = 30 * 22;
  const score = Math.round(Math.max(0, 100 * (1 - totalDeduction / maxPossible)));
  const grade = score >= 90 ? "A — Excellent" : score >= 75 ? "B — Good" : score >= 60 ? "C — Fair" : score >= 40 ? "D — Poor" : "F — Critical";

  const owaspSummary: Record<string, number> = {};
  findings.forEach((f) => { const k = f.owasp.split(" –")[0] || f.owasp; owaspSummary[k] = (owaspSummary[k] || 0) + 1; });

  const recommendations: string[] = [];
  if (!headers["content-security-policy"]) recommendations.push("Add Content-Security-Policy header");
  if (!headers["strict-transport-security"]) recommendations.push("Enable HTTP Strict Transport Security (HSTS)");
  if (!headers["x-frame-options"] && !(headers["content-security-policy"] || "").includes("frame-ancestors")) recommendations.push("Add X-Frame-Options or CSP frame-ancestors to prevent clickjacking");
  if (!headers["x-content-type-options"]) recommendations.push("Add X-Content-Type-Options: nosniff");
  if (!headers["referrer-policy"]) recommendations.push("Add Referrer-Policy header");
  if (!headers["permissions-policy"]) recommendations.push("Add Permissions-Policy header");
  if (cookies.filter((c) => !c.secure || !c.httpOnly).length > 0) recommendations.push("Set Secure; HttpOnly; SameSite=Strict on all cookies");
  if (headers["server"] || headers["x-powered-by"]) recommendations.push("Remove server technology disclosure headers");
  if (exposedFiles.filter((f) => f.status === 200).length > 0) recommendations.push(`Block access to ${exposedFiles.filter((f) => f.status === 200).length} exposed file(s) via web server config`);

  return {
    url, timestamp: new Date().toISOString(), score, grade, findings, headers,
    cookies, exposedFiles, statusCode, statusText, scanDuration,
    owaspSummary, recommendations, detectedTech,
  };
}

/* ─── Page Component ────────────────────── */
export default function ScanReportPage() {
  const [report, setReport] = useState<ScanReport | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing…");
  const [filter, setFilter] = useState<string>("All");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.search);
    const targetUrl = params.get("url");
    if (!targetUrl) {
      setError("No URL provided. Use ?url=https://example.com in the address.");
      return;
    }

    const steps = [
      { pct: 5, msg: "Connecting to target…" },
      { pct: 15, msg: "Fetching HTTP response headers…" },
      { pct: 25, msg: "Analyzing security headers…" },
      { pct: 35, msg: "Checking HTTPS & HSTS…" },
      { pct: 45, msg: "Parsing cookies…" },
      { pct: 55, msg: "Checking CORS configuration…" },
      { pct: 65, msg: "Scanning exposed files & paths…" },
      { pct: 80, msg: "Analyzing CSP policy…" },
      { pct: 90, msg: "Verifying HTTP → HTTPS redirect…" },
      { pct: 97, msg: "Generating report…" },
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setProgress(steps[stepIdx].pct);
        setStatusText(steps[stepIdx].msg);
        stepIdx++;
      }
    }, 400);

    runRealScan(targetUrl)
      .then((rep) => {
        clearInterval(interval);
        setProgress(100);
        setStatusText("Report ready");
        setReport(rep);
      })
      .catch((err) => {
        clearInterval(interval);
        setError("Scan failed: " + (err instanceof Error ? err.message : String(err)));
      });

    return () => clearInterval(interval);
  }, []);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl p-6 sm:p-8 max-w-lg w-full text-center">
          <p className="text-xl font-mono text-red-400 mb-4">SCAN FAILED</p>
          <p className="text-sm text-gray-400 font-mono mb-6">{error}</p>
          <a href="/" className="text-xs text-purple-400 font-mono underline">← Back to portfolio</a>
        </div>
      </div>
    );
  }

  // Loading state
  if (!report) {
    return (
      <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-sm text-purple-400 mb-4 tracking-widest">SECURITY SCAN IN PROGRESS</p>
          <div className="w-64 sm:w-80 max-w-[90vw] h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden mb-3">
            <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-600 font-mono">{progress}% — {statusText}</p>
        </div>
      </div>
    );
  }

  const filtered = filter === "All" ? report.findings : report.findings.filter((f) => f.severity === filter);
  const sevCounts = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 };
  report.findings.forEach((f) => { sevCounts[f.severity as keyof typeof sevCounts]++; });

  return (
    <div className="min-h-screen bg-[#050510] text-gray-200 font-sans">
      {/* Header */}
      <header className="border-b border-[#1e1e2e] bg-[#0a0a14]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" className="sm:w-4 sm:h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div className="min-w-0">
              <h1 className="font-mono text-xs sm:text-sm font-bold text-white truncate">VULNERABILITY REPORT</h1>
              <p className="text-[9px] sm:text-[10px] text-gray-600 font-mono hidden sm:block">OWASP Top 10 (2021) · Safe Scan · Real Data</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-mono text-gray-500 flex-shrink-0">
            <span className="max-w-[100px] sm:max-w-[200px] truncate">{report.url}</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── No findings banner ── */}
        {report.findings.length === 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 mb-8 text-center">
            <p className="text-emerald-400 font-mono text-lg font-bold mb-1">NO VULNERABILITIES DETECTED</p>
            <p className="text-gray-500 text-xs font-mono">All passive checks passed. The target appears well-configured for the checks performed.</p>
          </div>
        )}

        {/* ── Score Row ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl p-6 flex justify-center">
            <ScoreRing score={report.score} grade={report.grade} />
          </div>
          <div className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl p-6 flex flex-col justify-center">
            <p className="text-xs font-mono text-gray-600 mb-4 tracking-wider">SEVERITY BREAKDOWN</p>
            {(["Critical", "High", "Medium", "Low", "Info"] as const).map((s) => (
              <div key={s} className="flex items-center gap-3 mb-2">
                <span className="w-3 h-3 rounded" style={{ background: sevColors[s] }} />
                <span className="text-xs font-mono text-gray-400 w-16">{s}</span>
                <span className="text-xs font-mono font-bold" style={{ color: sevColors[s] }}>{sevCounts[s]}</span>
                <div className="flex-1 h-1 bg-[#1e1e2e] rounded-full">
                  <div className="h-full rounded-full" style={{ width: `${sevCounts[s] > 0 ? (sevCounts[s] / Math.max(report.findings.length, 1)) * 100 : 0}%`, background: sevColors[s] }} />
                </div>
              </div>
            ))}
            <SeverityBar counts={sevCounts} />
          </div>
          <div className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl p-6">
            <p className="text-xs font-mono text-gray-600 mb-4 tracking-wider">SCAN INFO</p>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={report.statusCode < 400 ? "text-green-400" : "text-red-400"}>{report.statusCode} {report.statusText}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="text-gray-300">{(report.scanDuration / 1000).toFixed(2)}s</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Findings</span><span className="text-purple-400">{report.findings.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Headers</span><span className="text-gray-300">{Object.keys(report.headers).length} received</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Cookies</span><span className="text-gray-300">{report.cookies.length}</span></div>
            </div>
          </div>
        </div>

        {/* ── Quick Info Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: "TARGET", value: report.url },
            { label: "STATUS", value: `${report.statusCode} ${report.statusText}` },
            { label: "FINDINGS", value: `${report.findings.length} issues` },
            { label: "DURATION", value: `${(report.scanDuration / 1000).toFixed(1)}s` },
          ].map((c) => (
            <div key={c.label} className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl p-3 sm:p-4">
              <p className="text-[9px] sm:text-[10px] font-mono text-gray-600 mb-0.5 sm:mb-1">{c.label}</p>
              <p className="text-xs sm:text-sm font-mono text-white truncate">{c.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filter ── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-xs font-mono text-gray-600">FILTER:</span>
          {(["All", "Critical", "High", "Medium", "Low", "Info"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-[11px] font-mono border transition-all ${
                filter === f ? "border-purple-400/50 text-purple-400 bg-purple-400/10" : "border-[#1e1e2e] text-gray-600 hover:border-gray-600"
              }`}
            >
              {f} {f !== "All" ? `(${sevCounts[f]})` : `(${report.findings.length})`}
            </button>
          ))}
        </div>

        {/* ── Findings Table ── */}
        <div className="space-y-3 mb-8">
          {filtered.map((finding) => {
            const isOpen = expanded.has(finding.id);
            return (
              <div key={finding.id} className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl overflow-hidden transition-all">
                <button onClick={() => toggleExpand(finding.id)} className="w-full p-3 sm:p-4 flex items-center gap-2 sm:gap-4 text-left hover:bg-white/[0.02] transition-all">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0" style={{ background: sevColors[finding.severity] }} />
                  <span className="flex-1 text-xs sm:text-sm text-white font-mono truncate">{finding.title}</span>
                  <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded flex-shrink-0" style={{ background: sevBg[finding.severity], color: sevColors[finding.severity] }}>
                    {finding.severity.toUpperCase()}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-gray-600 hidden sm:inline flex-shrink-0">{finding.category}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" className={`transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
                </button>
                {isOpen && (
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 pl-8 sm:pl-12 border-t border-[#1e1e2e] pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                    <div><p className="text-[10px] font-mono text-gray-600 mb-1">OWASP</p><p className="text-xs text-gray-400">{finding.owasp}</p></div>
                    <div><p className="text-[10px] font-mono text-gray-600 mb-1">DESCRIPTION</p><p className="text-xs text-gray-400 leading-relaxed">{finding.description}</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div><p className="text-[10px] font-mono text-gray-600 mb-1">EVIDENCE</p><p className="text-xs text-gray-500 font-mono break-all">{finding.evidence}</p></div>
                      <div><p className="text-[10px] font-mono text-gray-600 mb-1">AFFECTED</p><p className="text-xs text-gray-500 font-mono break-all">{finding.affected}</p></div>
                    </div>
                    <div><p className="text-[10px] font-mono text-green-400 mb-1">RECOMMENDATION</p><p className="text-xs text-gray-300 leading-relaxed">{finding.recommendation}</p></div>
                    {finding.references.length > 0 && (
                      <div><p className="text-[10px] font-mono text-gray-600 mb-1">REFERENCES</p>
                        <div className="flex flex-wrap gap-2">
                          {finding.references.map((r, i) => (
                            <a key={i} href={r} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-purple-400 underline hover:text-purple-300">{r.split("/").pop()?.split("#")[0] || r}</a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-center text-gray-600 font-mono text-sm py-12">No findings match the selected filter.</p>}
        </div>

        {/* ── Detail Panels ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Headers */}
          <div className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl p-4 sm:p-5">
            <p className="text-xs font-mono text-gray-600 mb-3 tracking-wider">HTTP HEADERS ({Object.keys(report.headers).length})</p>
            <div className="space-y-1 text-[10px] font-mono max-h-48 overflow-y-auto">
              {Object.entries(report.headers).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${SECURITY_HEADERS.includes(k) ? "bg-purple-400" : "bg-gray-600"}`} />
                  <span className="text-gray-500 flex-1 truncate">{k}</span>
                  <span className="text-gray-600 truncate max-w-[150px]">{String(v).slice(0, 40)}</span>
                </div>
              ))}
              {Object.keys(report.headers).length === 0 && <p className="text-gray-600">No headers received</p>}
            </div>
          </div>

          {/* Cookies */}
          <div className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs font-mono text-gray-600 mb-3 tracking-wider">COOKIES ({report.cookies.length})</p>
            {report.cookies.length === 0 ? (
              <p className="text-gray-600 text-xs font-mono">No cookies set</p>
            ) : (
              report.cookies.map((c) => (
                <div key={c.name} className="mb-3 last:mb-0">
                  <p className="text-xs font-mono text-gray-300 mb-1">{c.name}</p>
                  <div className="flex gap-3 text-[10px] font-mono">
                    <span className={c.secure ? "text-green-400" : "text-red-400"}>Secure: {c.secure ? "YES" : "NO"}</span>
                    <span className={c.httpOnly ? "text-green-400" : "text-red-400"}>HttpOnly: {c.httpOnly ? "YES" : "NO"}</span>
                    <span className="text-gray-500">SameSite: {c.sameSite}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Exposed Files */}
          <div className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs font-mono text-gray-600 mb-3 tracking-wider">EXPOSED FILES ({report.exposedFiles.length} checked)</p>
            <div className="space-y-1 text-[10px] font-mono max-h-48 overflow-y-auto">
              {report.exposedFiles.map((f) => (
                <div key={f.path} className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.status === 200 ? "bg-red-400" : f.status === 302 || f.status === 301 ? "bg-amber-400" : "bg-gray-600"}`} />
                  <span className="text-gray-500 truncate">{f.path}</span>
                  <span className="text-gray-700 ml-auto">{f.status}</span>
                </div>
              ))}
              {report.exposedFiles.length === 0 && <p className="text-gray-600">Not yet checked</p>}
            </div>
          </div>
        </div>

        {/* ── Recommendations ── */}
        {report.recommendations.length > 0 && (
          <div className="bg-[#0a0a14] border border-[#1e1e2e] rounded-xl p-6 mb-8">
            <p className="text-xs font-mono text-gray-600 mb-4 tracking-wider">PRIORITY RECOMMENDATIONS</p>
            <ol className="space-y-2">
              {report.recommendations.map((r, i) => (
                <li key={i} className="flex gap-3 text-xs text-gray-400">
                  <span className="text-purple-400 font-mono flex-shrink-0">{i + 1}.</span>
                  <span>{r}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-[9px] sm:text-[10px] font-mono text-gray-700 pt-3 sm:pt-4 border-t border-[#1e1e2e]">
          <p className="leading-relaxed">OWASP TOP 10 (2021) · SAFE PASSIVE SCAN (READ-ONLY) · REAL HTTP DATA</p>
          <p className="mt-1">INDRA MAULANA · TECH LEAD & PRODUCT ENGINEERING MANAGER</p>
        </div>
      </div>
    </div>
  );
}

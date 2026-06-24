"use client";

import { useEffect, useRef, useState } from "react";
import anime from "animejs";

export default function ContactPortal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [formState, setFormState] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!svgRef.current) return;

    const rings = svgRef.current.querySelectorAll(".portal-ring");
    rings.forEach((ring, i) => {
      anime({
        targets: ring,
        scale: [0.3, 1],
        opacity: [0, 0.15],
        duration: 1500,
        delay: i * 200,
        easing: "easeOutElastic(1, .6)",
      });
    });

    const curves = svgRef.current.querySelectorAll(".portal-curve");
    curves.forEach((curve, i) => {
      anime({
        targets: curve,
        strokeDashoffset: [anime.setDashoffset, 0],
        duration: 2000,
        delay: i * 300 + 500,
        easing: "easeInOutQuad",
      });
    });

    const dots = svgRef.current.querySelectorAll(".orbit-dot");
    dots.forEach((dot, i) => {
      const angle = (i / dots.length) * Math.PI * 2;
      const rx = 120 + i * 15;
      const ry = 120 + i * 15;

      anime({
        targets: dot,
        cx: [
          200 + Math.cos(angle) * rx,
          200 + Math.cos(angle + Math.PI * 2) * rx,
        ],
        cy: [
          200 + Math.sin(angle) * ry,
          200 + Math.sin(angle + Math.PI * 2) * ry,
        ],
        duration: 4000 + i * 500,
        loop: true,
        easing: "linear",
      });
    });

    anime({
      targets: ".portal-element",
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 800,
      delay: anime.stagger(100, { start: 300 }),
      easing: "easeOutCubic",
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.message) return;

    anime({
      targets: ".form-card",
      scale: [1, 1.02, 1],
      duration: 400,
      easing: "easeOutElastic(1, .4)",
    });

    // Open mailto
    window.location.href = `mailto:indra.maulana08@gmail.com?subject=Portfolio Contact: ${encodeURIComponent(formState.name)}&body=${encodeURIComponent(
      `Hello Indra,\n\nName: ${formState.name}\nEmail: ${formState.email}\n\nMessage:\n${formState.message}`
    )}`;

    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      setFormState({ name: "", email: "", message: "" });
    }, 4000);
  };

  const inputClass =
    "w-full px-4 py-3 bg-void-deep border border-void-border rounded font-mono text-sm text-gray-300 placeholder-gray-700 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all duration-300";
  const labelClass = "block text-xs font-mono text-gray-500 mb-2 tracking-wider";

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-24 px-4"
    >
      {/* Portal background SVG */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full opacity-[0.04]"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
      >
        {[60, 100, 140, 180, 220].map((r, i) => (
          <circle
            key={r}
            className="portal-ring"
            cx="200"
            cy="200"
            r={r}
            fill="none"
            stroke={i % 2 === 0 ? "#7c5cfc" : "#38bdf8"}
            strokeWidth="0.5"
          />
        ))}
        <path
          className="portal-curve"
          d="M50 200 C100 100, 150 150, 200 200 C250 250, 300 300, 350 200"
          fill="none"
          stroke="#7c5cfc"
          strokeWidth="0.5"
          strokeDasharray="500"
          strokeDashoffset="500"
        />
        <path
          className="portal-curve"
          d="M50 200 C100 300, 150 250, 200 200 C250 150, 300 100, 350 200"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="0.3"
          strokeDasharray="500"
          strokeDashoffset="500"
        />
        {Array.from({ length: 8 }).map((_, i) => (
          <circle
            key={`dot-${i}`}
            className="orbit-dot"
            r="2"
            fill={i % 2 === 0 ? "#7c5cfc" : "#38bdf8"}
            cx="200"
            cy="200"
          />
        ))}
      </svg>

      {/* Section label */}
      <div className="text-center mb-10 portal-element">
        <p className="font-mono text-xs text-gray-600 tracking-[0.3em] mb-2">
          // ESTABLISH CONNECTION
        </p>
        <h2 className="text-4xl md:text-5xl font-bold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            CONTACT
          </span>
          <span className="text-gray-400">_PORTAL</span>
        </h2>
      </div>

      {/* Contact channels grid */}
      <div className="portal-element w-full max-w-2xl grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "EMAIL", value: "indra.maulana08@gmail.com", icon: "✉", href: "mailto:indra.maulana08@gmail.com" },
          { label: "GITHUB", value: "github.com/indra08", icon: "⌨", href: "https://github.com/indra08" },
          { label: "LINKEDIN", value: "in/indra-maulana-husni-mubarok", icon: "◈", href: "https://www.linkedin.com/in/indra-maulana-husni-mubarok-565429105" },
          { label: "INSTAGRAM", value: "@maulanaindra.mubarok", icon: "◎", href: "https://www.instagram.com/maulanaindra.mubarok/" },
        ].map((ch) => (
          <a
            key={ch.label}
            href={ch.href}
            target="_blank"
            rel="noopener noreferrer"
            data-interactive
            className="p-4 rounded border border-void-border bg-void-surface/50 text-center hover:border-purple-500/30 transition-all duration-300 hover:bg-void-surface/80 cursor-pointer group no-underline"
          >
            <span className="text-2xl mb-2 block opacity-50 group-hover:opacity-100 transition-opacity">
              {ch.icon}
            </span>
            <p className="text-[10px] font-mono text-gray-600 mb-1">{ch.label}</p>
            <p className="text-[11px] font-mono text-gray-400 group-hover:text-purple-400 transition-colors leading-tight break-all">
              {ch.value}
            </p>
          </a>
        ))}
      </div>

      {/* Contact form */}
      <div className="form-card portal-element w-full max-w-2xl p-8 rounded-lg border border-void-border bg-void-surface/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>[ IDENTIFY_YOURSELF ]</label>
            <input
              type="text"
              value={formState.name}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, name: e.target.value }))
              }
              className={inputClass}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className={labelClass}>[ COMMUNICATION_CHANNEL ]</label>
            <input
              type="email"
              value={formState.email}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, email: e.target.value }))
              }
              className={inputClass}
              placeholder="your.email@example.com"
            />
          </div>
          <div>
            <label className={labelClass}>[ TRANSMISSION_DATA ]</label>
            <textarea
              value={formState.message}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, message: e.target.value }))
              }
              rows={4}
              className={inputClass + " resize-none"}
              placeholder="Tell me about your project..."
            />
          </div>
          <button
            type="submit"
            data-interactive
            disabled={submitted}
            className={`w-full py-3 font-mono text-sm font-bold tracking-wider rounded transition-all duration-300 ${
              submitted
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-purple-600/10 text-purple-400 border border-purple-500/30 hover:bg-purple-600/20"
            }`}
          >
            {submitted ? "[ TRANSMISSION SENT ✓ ]" : "[ INITIATE_TRANSMISSION ]"}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="portal-element mt-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-gray-600 text-sm font-mono">
            <span className="text-purple-400">Phone:</span> +62 856 268 1814
          </span>
          <span className="text-gray-800">|</span>
          <span className="text-gray-600 text-sm font-mono">
            <span className="text-purple-400">Location:</span> Semarang, Central Java, Indonesia
          </span>
        </div>
        <p className="font-mono text-[10px] text-gray-800">
          &lt;IM/&gt; // TECH LEAD &amp; PRODUCT ENGINEERING // &copy; 2025 INDRA MAULANA
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import anime from "animejs";

interface BootSequenceProps {
  onComplete: () => void;
}

const BOOT_LINES = [
  { text: "INITIALIZING INDRAOS v10...", delay: 200 },
  { text: "LOADING KERNEL MODULES...", delay: 400 },
  { text: "[ OK ] quantum.renderer.ko", delay: 300 },
  { text: "[ OK ] neural.net.ko", delay: 200 },
  { text: "[ OK ] synth.memory.ko", delay: 200 },
  { text: "[ OK ] cyber.deck.io", delay: 200 },
  { text: "MOUNTING DIGITAL IDENTITY...", delay: 500 },
  { text: "CALIBRATING NEURAL SYNAPSES...", delay: 400 },
  { text: "[ OK ] Synaptic pathways: 128 active", delay: 300 },
  { text: "[ OK ] Quantum cores: 4 locked", delay: 200 },
  { text: "ESTABLISHING SECURE TUNNEL...", delay: 500 },
  { text: "DECRYPTING PORTFOLIO MATRIX...", delay: 400 },
  { text: "[ OK ] Access level: Tech Lead & Product Engineering Manager", delay: 300 },
  { text: "[ OK ] System integrity: 100%", delay: 200 },
  { text: "SYSTEM READY. WELCOME.", delay: 600 },
];

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [showPercent, setShowPercent] = useState(false);
  const [percent, setPercent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let lineIndex = 0;

    const showNextLine = () => {
      if (lineIndex >= BOOT_LINES.length) {
        setTimeout(() => {
          if (containerRef.current) {
            anime({
              targets: containerRef.current,
              opacity: [1, 0],
              scale: [1, 1.05],
              duration: 800,
              easing: "easeInExpo",
              complete: onComplete,
            });
          }
        }, 800);
        return;
      }

      const line = BOOT_LINES[lineIndex];
      setVisibleLines(lineIndex + 1);
      setPercent(Math.min(Math.round(((lineIndex + 1) / BOOT_LINES.length) * 100), 99));

      if (lineIndex === BOOT_LINES.length - 2) {
        setShowPercent(true);
      }

      lineIndex++;
      setTimeout(showNextLine, line.delay);
    };

    const startDelay = setTimeout(showNextLine, 500);

    return () => clearTimeout(startDelay);
  }, [onComplete]);

  useEffect(() => {
    if (!showPercent || !svgRef.current) return;

    const anim = anime({
      targets: { val: percent },
      val: 100,
      round: 1,
      easing: "easeInOutQuad",
      duration: 1200,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: (a: any) =>
        setPercent(
          Math.floor(
            parseFloat(String(a.animations[0].currentValue)) || 0
          )
        ),
    });

    return () => anim.pause();
  }, [showPercent]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-void-deep flex items-center justify-center"
    >
      {/* Decorative SVG circuit lines */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full opacity-10"
        viewBox="0 0 800 600"
        preserveAspectRatio="none"
      >
        <path
          d="M0 200 Q200 200 200 100 T400 100"
          fill="none"
          stroke="#00f0ff"
          strokeWidth="0.5"
        />
        <path
          d="M400 500 Q600 500 600 400 T800 400"
          fill="none"
          stroke="#00f0ff"
          strokeWidth="0.5"
        />
        <path
          d="M100 600 Q100 400 300 400 T500 300 T800 300"
          fill="none"
          stroke="#ff00ff"
          strokeWidth="0.3"
        />
      </svg>

      <div className="relative z-10 w-full max-w-2xl px-8">
        {/* ASCII-style header */}
        <div className="mb-8 text-center">
          <pre className="text-neon-cyan font-mono text-xs md:text-sm leading-tight">
{`╔══════════════════════════════════╗
║   INDRA.BOOK // NEURAL OS v3.7  ║
╚══════════════════════════════════╝`}
          </pre>
        </div>

        {/* Boot log */}
        <div className="bg-void-deep border border-void-border p-6 rounded min-h-[300px] font-mono text-sm">
          {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
            <div
              key={i}
              className={`mb-1 ${
                line.text.startsWith("[ OK ]")
                  ? "text-neon-green"
                  : line.text.startsWith("SYSTEM READY")
                  ? "text-neon-cyan"
                  : "text-gray-400"
              }`}
            >
              <span className="text-neon-cyan mr-2">&gt;</span>
              {line.text}
            </div>
          ))}
          {visibleLines < BOOT_LINES.length && (
            <span className="inline-block w-2 h-4 bg-neon-cyan animate-pulse ml-0" />
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs font-mono text-gray-500 mb-1">
            <span>BOOT_PROGRESS</span>
            <span className="text-neon-cyan">{percent}%</span>
          </div>
          <div className="h-1 bg-void-border rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta rounded transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Decorative bottom */}
        <div className="mt-4 text-center text-xs font-mono text-gray-600">
          <span>QUANTUM_CORE: ACTIVE | NEURAL_NET: ONLINE | INDRAOS v10: READY</span>
        </div>
      </div>
    </div>
  );
}

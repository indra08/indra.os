"use client";

import { useEffect, useRef, useState } from "react";
import anime from "animejs";

interface ProjectImage {
  src: string;
  label: string;
}

interface Project {
  title: string;
  subtitle: string;
  category: string;
  description: string[];
  role: string;
  tech: string[];
  metrics: { label: string; value: string }[];
  color: string;
  images: ProjectImage[];
  link: string;
}

const PROJECTS: Project[] = [
  // ======== TAMBAH PORTFOLIO BARU DI SINI ========
  // Copy blok di bawah, isi data project baru.
  // ===============================================
  {
    title: "ForYou by SML",
    subtitle: "Loyalty App SinarmasLand",
    category: "Loyalty Platform",
    description: [
      "ForYou merupakan aplikasi Loyalty App dari SinarmasLand, digunakan sebagai media promosi, perolehan poin, transaksi voucher, hingga gamification di dalamnya — semua dalam satu pengalaman terpadu di mobile dan web.",
      "Saya berperan sebagai Tech Lead yang memimpin project ini end-to-end: menentukan infrastruktur aplikasi, memilih teknologi yang tepat di seluruh stack (Mobile, Frontend, Backend, dan Admin Panel), serta terus memvalidasi kebutuhan bisnis SinarmasLand yang terus berkembang sepanjang siklus pengembangan.",
    ],
    role: "Tech Lead — Menentukan infrastruktur aplikasi, teknologi (Mobile, FE, BE, Panel), dan memvalidasi kebutuhan SinarmasLand.",
    tech: ["React JS", "Flutter", "Laravel", "MySQL", "Redis"],
    metrics: [
      { label: "Platforms", value: "4" },
      { label: "Apps", value: "iOS+Android" },
      { label: "Role", value: "Tech Lead" },
    ],
    color: "#6366f1",
    images: [
      { src: "/foryou/fe/foryoubysml.com.png", label: "Web App — foryoubysml.com" },
      { src: "/foryou/mobile/appstore.png", label: "Apple App Store" },
      { src: "/foryou/mobile/playstore.png", label: "Google Play Store" },
      { src: "/foryou/panel/office.foryoubysml.com.png", label: "Admin Panel — Management & Reporting" },
    ],
    link: "https://foryoubysml.com",
  },
  {
    title: "FindPix",
    subtitle: "Face Recognition Event Platform",
    category: "Event Platform",
    description: [
      "FindPix merupakan platform dokumentasi event yang menyatukan Event Organizer, fotografer, dan peserta event. Peserta dapat mencari dokumentasi foto mereka berdasarkan wajah atau bib number dari event yang telah mereka ikuti.",
      "FindPix menggabungkan infrastruktur berkinerja tinggi dengan kecepatan aplikasi — mampu menampilkan hasil pencarian wajah dari puluhan ribu foto dalam waktu kurang dari 2 detik.",
      "Saya selain menjadi Tech Lead atas project ini, juga langsung menjadi Core Backend Engineer yang merancang pipeline pengelolaan data foto: Python untuk facial recognition processing, Golang untuk high-performance API indexing dan search, Laravel untuk business logic dan API gateway, PostgreSQL untuk data persistence. Arsitektur multi-stack ini memungkinkan setiap komponen bekerja optimal pada tugasnya.",
    ],
    role: "Tech Lead & Core Backend Engineer — Merancang pipeline multi-stack untuk facial recognition dan high-perf search.",
    tech: ["React JS", "Laravel", "Golang", "Python", "PostgreSQL"],
    metrics: [
      { label: "Search", value: "<2 detik" },
      { label: "Foto", value: "50.000+" },
      { label: "Role", value: "Tech Lead" },
    ],
    color: "#f59e0b",
    images: [
      { src: "/findpix/fe/fe.png", label: "Landing Page" },
      { src: "/findpix/fe/detail_fe.png", label: "Detail & Search" },
      { src: "/findpix/fe/event_fe.png", label: "Event Page" },
      { src: "/findpix/panel/panel.png", label: "Admin Panel" },
    ],
    link: "https://findpix.id",
  },
  {
    title: "WA Official Messenger",
    subtitle: "WhatsApp Business Communication Hub",
    category: "Messaging Platform",
    description: [
      "Platform untuk menghubungkan WhatsApp Official dengan tool official — digunakan untuk mengajukan template pesan, broadcast pesan ke banyak kontak, hingga melakukan chat langsung dari WhatsApp Official dalam satu dashboard terpadu.",
      "Saya berperan sebagai Tech Lead sekaligus pembentuk core system dari platform ini. Merancang arsitektur scalable dengan Docker yang mengorkestrasi Laravel sebagai API backend, Node.js untuk real-time messaging handler, MySQL untuk transactional data, MongoDB untuk message storage, dan Redis untuk caching serta queue management.",
    ],
    role: "Tech Lead & Core System Architect — Membentuk core system dari nol, merancang arsitektur Docker yang scalable dengan multi-stack backend.",
    tech: ["Laravel", "Node.js", "MySQL", "MongoDB", "Redis", "Docker"],
    metrics: [
      { label: "Stack", value: "6" },
      { label: "Arsitektur", value: "Docker" },
      { label: "Role", value: "Tech Lead" },
    ],
    color: "#25D366",
    images: [
      { src: "/wa_official_messenger/dashboard.png", label: "Dashboard" },
      { src: "/wa_official_messenger/broadcast.png", label: "Broadcast Pesan" },
      { src: "/wa_official_messenger/chat.png", label: "Chat WhatsApp Official" },
    ],
    link: "",
  },
  // ======== TAMBAH PROJECT BARU DI ATAS LINE INI ========
];

export default function ProjectTunnel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeProject, setActiveProject] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Reset selected image when project changes
  useEffect(() => {
    setSelectedImage(0);
  }, [activeProject]);

  // Entrance animation
  useEffect(() => {
    if (!containerRef.current) return;
    anime({
      targets: ".tunnel-enter",
      opacity: [0, 1],
      scale: [0.8, 1],
      duration: 1000,
      delay: anime.stagger(100),
      easing: "easeOutExpo",
    });
  }, []);

  // Project change animation
  useEffect(() => {
    anime({
      targets: ".project-card-active",
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 600,
      easing: "easeOutCubic",
    });
    anime({
      targets: ".metric-ring",
      strokeDashoffset: (el: HTMLElement) => anime.setDashoffset(el) * 0.3,
      duration: 1200,
      delay: 200,
      easing: "easeInOutCubic",
    });
  }, [activeProject]);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying) return;
    autoPlayRef.current = setInterval(() => {
      setActiveProject((prev) => (prev + 1) % PROJECTS.length);
    }, 8000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying]);

  const project = PROJECTS[activeProject];

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-24 px-4"
    >
      {/* Tunnel background */}
      <div className="absolute inset-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 border border-void-border rounded-full opacity-[0.03]"
            style={{
              margin: `${i * 8}%`,
              borderColor: i % 2 === 0 ? "#7c5cfc" : "#38bdf8",
            }}
          />
        ))}
      </div>

      {/* Section label */}
      <div className="text-center mb-8 tunnel-enter">
        <p className="font-mono text-xs text-gray-600 tracking-[0.3em] mb-2">
          // SELECTED WORK
        </p>
        <h2 className="text-4xl md:text-5xl font-bold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            PROJECT
          </span>
          <span className="text-gray-400">_TUNNEL</span>
        </h2>
      </div>

      {/* Nav buttons */}
      <div className="tunnel-enter w-full max-w-4xl mb-8 flex items-center justify-center gap-3 flex-wrap">
        {PROJECTS.map((p, i) => (
          <button
            key={p.title}
            data-interactive
            onClick={() => {
              setActiveProject(i);
              setIsAutoPlaying(false);
              setTimeout(() => setIsAutoPlaying(true), 12000);
            }}
            className={`px-4 py-2 font-mono text-xs rounded-full border transition-all duration-300 ${
              i === activeProject
                ? "border-purple-400/50 text-purple-400 bg-purple-400/5"
                : "border-void-border text-gray-600 hover:border-gray-600"
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Project card */}
      <div
        key={project.title}
        className="project-card-active tunnel-enter w-full max-w-6xl rounded-lg border border-void-border bg-void-surface/80 backdrop-blur-sm p-6 md:p-10"
      >
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT: Info */}
          <div className="flex-1 lg:max-w-[45%]">
            {/* Badge */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span
                className="font-mono text-xs px-3 py-1 rounded-full border"
                style={{
                  color: project.color,
                  borderColor: `${project.color}33`,
                  backgroundColor: `${project.color}0d`,
                }}
              >
                {project.category}
              </span>
              <span className="font-mono text-xs text-gray-600">{project.subtitle}</span>
            </div>

            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {project.title}
            </h3>

            {/* Description paragraphs */}
            <div className="text-gray-400 leading-relaxed mb-5 space-y-3">
              {project.description.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Role highlight */}
            <div
              className="p-4 rounded-lg mb-5 font-mono text-sm leading-relaxed"
              style={{
                backgroundColor: `${project.color}0d`,
                borderLeft: `2px solid ${project.color}`,
                color: "#c0c0c0",
              }}
            >
              <span style={{ color: project.color }}>[ROLE]</span>{" "}
              {project.role}
            </div>

            {/* Tech tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {project.tech.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 text-xs font-mono rounded border border-void-border text-gray-400 bg-void-deep/50"
                >
                  {t}
                </span>
              ))}
            </div>

            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                data-interactive
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-sm transition-all duration-300 hover:bg-white/5"
                style={{
                  color: project.color,
                  border: `1px solid ${project.color}33`,
                }}
              >
                Visit live site &rarr;
              </a>
            )}
          </div>

          {/* RIGHT: Screenshots gallery + Metrics */}
          <div className="flex-1 lg:max-w-[55%] flex flex-col gap-4">
            {/* Main screenshot */}
            <div className="relative">
              <div className="rounded-lg overflow-hidden border border-void-border bg-void-deep">
                <img
                  src={project.images[selectedImage]?.src}
                  alt={project.images[selectedImage]?.label}
                  className="w-full h-56 md:h-72 object-cover transition-opacity duration-300"
                  loading="lazy"
                />
              </div>
              <p className="text-center text-[10px] font-mono text-gray-500 mt-2">
                {project.images[selectedImage]?.label}
              </p>
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-2 justify-center flex-wrap">
              {project.images.map((img, i) => (
                <button
                  key={img.src}
                  data-interactive
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-10 rounded-md overflow-hidden border transition-all duration-200 flex-shrink-0 ${
                    i === selectedImage
                      ? "border-purple-400/60 opacity-100 ring-1 ring-purple-400/30"
                      : "border-void-border opacity-50 hover:opacity-80"
                  }`}
                >
                  <img
                    src={img.src}
                    alt={img.label}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>

            {/* Metrics */}
            <div className="flex gap-4 justify-around mt-2">
              {project.metrics.map((m) => (
                <div key={m.label} className="flex items-center gap-2">
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      fill="none"
                      stroke={project.color}
                      strokeWidth="2"
                      opacity="0.2"
                    />
                    <circle
                      className="metric-ring"
                      cx="22"
                      cy="22"
                      r="18"
                      fill="none"
                      stroke={project.color}
                      strokeWidth="2"
                      strokeDasharray="113"
                      strokeDashoffset="113"
                      strokeLinecap="round"
                      transform="rotate(-90 22 22)"
                    />
                  </svg>
                  <div>
                    <p
                      className="text-lg font-bold font-mono"
                      style={{ color: project.color }}
                    >
                      {m.value}
                    </p>
                    <p className="text-[10px] font-mono text-gray-600">{m.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-0.5 bg-void-border rounded overflow-hidden">
          <div
            className="h-full transition-all duration-500 rounded"
            style={{
              width: `${((activeProject + 1) / PROJECTS.length) * 100}%`,
              background: `linear-gradient(90deg, ${project.color}, transparent)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

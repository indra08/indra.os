import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indra Maulana — Tech Lead & Product Engineering Manager",
  description: "Indra Maulana — Tech Lead & Product Engineering Manager based in Semarang, Indonesia. 10+ years, 100+ products shipped. Full-stack builder. Agile practitioner. DevOps enthusiast.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-void-deep text-gray-200 antialiased">
        <div className="scanline-overlay" />
        {children}
      </body>
    </html>
  );
}

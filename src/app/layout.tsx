import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});

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
      <body className={`${inter.variable} ${jetbrainsMono.variable} bg-void-deep text-gray-200 antialiased`}>
        <div className="scanline-overlay" />
        {children}
      </body>
    </html>
  );
}

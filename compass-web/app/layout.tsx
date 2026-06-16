import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import "./globals.css";
import { AppGate } from "@/features/auth/AppGate";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Serif display face for headings — the warm, editorial half of the design.
const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Compass",
  description: "A focus tool for anyone building something — entrepreneurs, veterans in transition, and anyone finding their next path. Roadmap, tasks, journaling, and daily focus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Dark mode by default — The Compass is built for deep-work sessions.
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${lora.variable} h-full antialiased`}
    >
      {/* Full-bleed cockpit shell: fixed sidebar, content fills the rest of the screen. */}
      <body className="flex h-screen overflow-hidden bg-background text-foreground">
        <Providers>
          {/* AppGate enforces auth → onboarding → app, and renders the cockpit shell. */}
          <AppGate>{children}</AppGate>
        </Providers>
      </body>
    </html>
  );
}

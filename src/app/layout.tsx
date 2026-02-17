import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentBridge - Cross-Platform AI Agent Communication Hub",
  description: "Discover, connect, and orchestrate AI agents across different protocols via Intercom P2P sidechannels. Built for the Trac Network Intercom Competition.",
  keywords: ["AgentBridge", "Intercom", "Trac Network", "AI Agents", "P2P", "Sidechannels", "Agent Discovery", "Multi-Agent"],
  authors: [{ name: "AgentBridge Team" }],
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "AgentBridge - AI Agent Communication Hub",
    description: "Cross-platform hub for AI agent discovery and communication",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentBridge",
    description: "Cross-platform hub for AI agent discovery and communication",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground dark`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

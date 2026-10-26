import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { FocusProvider } from "@/components/focus/FocusProvider";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { CommandPalette } from "@/components/ui/CommandPalette";

export const metadata: Metadata = {
  title: "Lifespace v1.0.0.2 — Tasks, Projects, Daily & Goals",
  description:
    "A fast, compact, responsive, and secure personal management dashboard to organize tasks, plans, skills, projects, and daily activities into customizable sections.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.ico" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lifespace",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF9F5",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased selection:bg-indigo-500 selection:text-white min-h-screen relative overflow-x-hidden">
        <ToastProvider>
          <FocusProvider>
            <AuroraBackground />
            <CommandPalette />
            {children}
          </FocusProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

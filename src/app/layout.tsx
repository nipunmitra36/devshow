import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DevShow — Show your code. Show your impact.",
    template: "%s · DevShow",
  },
  description:
    "Turn your GitHub activity into a beautiful developer profile: commit heatmap, streaks, top repositories and recent commits.",
  keywords: ["GitHub", "developer profile", "contribution graph", "commit history", "portfolio"],
  openGraph: {
    type: "website",
    siteName: "DevShow",
    title: "DevShow — Show your code. Show your impact.",
    description: "Turn your GitHub activity into a beautiful developer profile.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevShow",
    description: "Turn your GitHub activity into a beautiful developer profile.",
  },
};

export const viewport: Viewport = {
  themeColor: "#050607",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the init script sets data-theme on <html> before React hydrates.
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      {/* suppressHydrationWarning: extensions like Grammarly add attributes to <body> before React hydrates. */}
      <body className="min-h-dvh font-sans" suppressHydrationWarning>
        <div aria-hidden className="bg-backdrop pointer-events-none fixed inset-x-0 top-0 -z-10 h-[48rem]" />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-fg focus:px-3 focus:py-2 focus:text-canvas"
        >
          Skip to content
        </a>
        <div className="flex min-h-dvh flex-col">
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}

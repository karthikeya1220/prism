import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prism — Personalized Content Dashboard",
  description:
    "Unified, customizable feed of news, movie recommendations, and social posts.",
};

/**
 * Pre-paint theme script (M4): applies the saved dark-mode preference — or
 * the OS preference on first visit — before the browser paints, so there is
 * no flash of the wrong theme. Mirrors the persistence payload written by
 * store/persistence.ts (key + version must match) and the sync logic in
 * components/Providers.tsx.
 */
const THEME_SCRIPT = `(function(){try{
  var p=JSON.parse(localStorage.getItem('pcd:state:v1')||'null');
  var saved=p&&p.version===1&&p.preferences&&typeof p.preferences.darkMode==='boolean'?p.preferences.darkMode:null;
  var dark=saved===null?window.matchMedia('(prefers-color-scheme: dark)').matches:saved;
  document.documentElement.classList.toggle('dark',dark);
}catch(e){}})()`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      /* The theme script mutates <html class> before hydration; React must
         keep that class instead of warning about the SSR/client difference. */
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

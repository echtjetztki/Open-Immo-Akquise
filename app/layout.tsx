import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Open-Akquise Dashboard | github.com/echtjetztki/Open-Immo-Akquise",
    template: "%s | Open-Akquise Dashboard",
  },
  description: "Open-Akquise Immobilien-Management Dashboard – Provisions-Berechnung, Property-Management und Status-Tracking.",
  keywords: ["Immobilien", "Dashboard", "Provision", "Property Management", "Open-Akquise", "openakquise"],
  authors: [{ name: "github.com/echtjetztki/Open-Immo-Akquise" }],
  creator: "github.com/echtjetztki/Open-Immo-Akquise",
  openGraph: {
    type: "website",
    locale: "de_AT",
    siteName: "Open-Akquise Dashboard | github.com/echtjetztki/Open-Immo-Akquise",
    title: "Open-Akquise Dashboard | github.com/echtjetztki/Open-Immo-Akquise",
    description: "Open-Akquise Immobilien-Management Dashboard von github.com/echtjetztki/Open-Immo-Akquise",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Open-Akquise",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#fb923c",
};

import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";
import { CookieConsent } from "@/components/CookieConsent";
import { DsgvoFooter } from "@/components/DsgvoFooter";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">
        {children}
        <DsgvoFooter />
        <CookieConsent />
        <IOSInstallPrompt />
      </body>
    </html>
  );
}



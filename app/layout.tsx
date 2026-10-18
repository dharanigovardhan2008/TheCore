import { Suspense } from "react";
import type { Metadata } from "next";
import { DM_Sans, Caveat } from "next/font/google";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { getSiteUrlForMetadata } from '@/lib/site-url';
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const siteUrl = getSiteUrlForMetadata();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s | TheCore",
    default: "TheCore: track your projects, hosting platforms and .env files",
  },
  description: "Keep track of all your side projects in one place.",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TheCore",
    description: "Keep track of all your side projects in one place.",
    url: siteUrl,
    siteName: "TheCore",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TheCore",
    description: "Keep track of all your side projects in one place.",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${caveat.variable} antialiased`}>
      <body className="flex flex-col min-h-[100dvh] m-0 p-0 selection:bg-tint selection:text-white">
        <Suspense fallback={null}>
          <NavigationLoader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

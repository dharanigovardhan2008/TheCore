import type { Metadata } from "next";
import { DM_Sans, Caveat } from "next/font/google";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thecore.isroot.in";

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
      <body className="flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] selection:bg-tint selection:text-white">
        {children}
      </body>
    </html>
  );
}


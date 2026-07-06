import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ReferralTracker } from "@/components/ReferralTracker";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://velora.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Velora — Community-Powered BNB Smart Chain Platform",
    template: "%s | Velora",
  },
  description:
    "Velora is a transparent, blockchain-powered community platform on BNB Smart Chain. Connect your wallet, build your community, and grow together with real-time rewards.",
  keywords: [
    "Velora",
    "BNB Smart Chain",
    "blockchain community",
    "crypto platform",
    "decentralized app",
    "DApp",
    "community rewards",
    "BSC wallet",
    "Web3 platform",
    "BNB rewards",
  ],
  authors: [{ name: "Velora" }],
  creator: "Velora",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Velora",
    title: "Velora — Community-Powered BNB Smart Chain Platform",
    description:
      "Build meaningful communities on a transparent, blockchain-powered platform. Connect, invite, and grow together.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Velora — Community-Powered BNB Smart Chain Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Velora — Community-Powered BNB Smart Chain Platform",
    description:
      "Transparent, blockchain-powered community platform on BNB Smart Chain. Connect your wallet and grow together.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: baseUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <WalletProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <ReferralTracker />
            </Suspense>
            {children}
          </AuthProvider>
        </WalletProvider>
        <Toaster />
      </body>
    </html>
  );
}

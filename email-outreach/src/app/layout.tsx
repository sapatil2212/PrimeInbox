import type { Metadata } from "next";
import { Raleway, JetBrains_Mono, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { GlowBg } from "@/components/ui/glow-bg";
import { CookieConsent } from "@/components/layout/cookie-consent";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PrimeInbox | Turn Your DevRel Program Into Revenue Growth",
  description: "AI-powered Email Outreach Automation SaaS platform. Convert developer engagement into qualified leads and sales opportunities.",
  icons: {
    icon: "/favicon.png",
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
      className={`${raleway.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground relative overflow-x-hidden">
        {/* Global Background Layer */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <GlowBg />
        </div>
        
        {/* Main Content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
        <Toaster />
        <CookieConsent />
      </body>
    </html>
  );
}



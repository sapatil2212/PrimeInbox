import type { Metadata } from "next";
import { Raleway, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { GlowBg } from "@/components/ui/glow-bg";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { FeedbackRoot } from "@/components/ui/feedback";

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
  title: "PrimeInbox | AI-Powered Email Campaign & Engagement Platform",
  description: "PrimeInbox is an AI-powered email campaign and sales engagement platform. Create personalized email campaigns, automate follow-ups, manage contacts, and track opens and clicks — all from one dashboard. A product of Brightwave Digital Products LLP.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
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
        <FeedbackRoot />
        <CookieConsent />
      </body>
    </html>
  );
}



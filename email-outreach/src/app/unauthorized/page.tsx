"use client";

import Link from "next/link";
import { GlowCard } from "@/components/ui/glow-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ShieldAlert, ArrowLeft, Mail } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-[460px]">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <img src="/logo/primeinbox-logo.png" alt="PrimeInbox Logo" className="h-9 w-auto group-hover:scale-105 transition-all" />
          </Link>
        </div>

        <GlowCard className="border border-zinc-200/50 shadow-none" glowColor="rgba(239, 68, 68, 0.05)">
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 border border-red-500/20 animate-bounce">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Access Denied</h2>
              <p className="text-sm text-zinc-500 leading-relaxed">
                You do not have the required permissions to view this page. If you believe this is an error, please reach out to your workspace administrator.
              </p>
            </div>
            <div className="pt-4">
              <Link href="/dashboard">
                <ShimmerButton 
                  className="h-11 w-full rounded-xl text-sm font-bold bg-zinc-900 text-white hover:bg-black flex items-center justify-center gap-2"
                  shimmerColor="#ef4444"
                >
                  <ArrowLeft className="w-4 h-4" /> Go back to Dashboard
                </ShimmerButton>
              </Link>
            </div>
          </div>
        </GlowCard>
      </div>
    </main>
  );
}

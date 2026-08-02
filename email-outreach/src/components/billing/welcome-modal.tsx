"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, PartyPopper, ArrowRight, X } from "lucide-react";
import { toast } from "@/components/ui/feedback";

export function WelcomeModal({
  userName,
  planName,
  onDismiss,
}: {
  userName: string;
  planName?: string;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after mount
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await fetch("/api/auth/welcome", { method: "POST" });
    } catch {
      // Silently fail — the modal won't show again regardless
    }
    setVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        visible ? "bg-zinc-950/50 backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <style>{`
        @keyframes welcomeEntry {
          from { transform: scale(0.9) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes welcomeExit {
          from { transform: scale(1) translateY(0); opacity: 1; }
          to { transform: scale(0.9) translateY(20px); opacity: 0; }
        }
        @keyframes sparkleFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
          50% { transform: translateY(-8px) rotate(15deg); opacity: 1; }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(60px) rotate(360deg); opacity: 0; }
        }
        .animate-welcome-entry {
          animation: welcomeEntry 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-welcome-exit {
          animation: welcomeExit 0.25s ease-in forwards;
        }
        .sparkle-float {
          animation: sparkleFloat 2s ease-in-out infinite;
        }
        .confetti {
          animation: confettiFall 1.5s ease-out forwards;
        }
      `}</style>

      <div
        className={`w-full max-w-[440px] bg-white border border-zinc-200/60 rounded-2xl shadow-2xl relative overflow-hidden ${
          visible && !dismissing ? "animate-welcome-entry" : dismissing ? "animate-welcome-exit" : "opacity-0"
        }`}
      >
        {/* Decorative gradient top bar */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Floating confetti dots */}
        <div className="absolute top-6 left-8 w-2 h-2 rounded-full bg-indigo-400 confetti" style={{ animationDelay: "0.1s" }} />
        <div className="absolute top-4 right-12 w-1.5 h-1.5 rounded-full bg-pink-400 confetti" style={{ animationDelay: "0.3s" }} />
        <div className="absolute top-8 left-20 w-1.5 h-1.5 rounded-full bg-amber-400 confetti" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-3 right-24 w-2 h-2 rounded-full bg-emerald-400 confetti" style={{ animationDelay: "0.2s" }} />
        <div className="absolute top-10 left-32 w-1 h-1 rounded-full bg-violet-400 confetti" style={{ animationDelay: "0.7s" }} />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 pt-10 text-center space-y-5">
          {/* Icon */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center border border-indigo-100/50 shadow-sm">
              <PartyPopper className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="absolute -top-1 -right-1 sparkle-float">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-tight text-zinc-900">
              Welcome to PrimeInbox! 🎉
            </h2>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
              Hey <span className="font-bold text-zinc-700">{userName}</span>, your workspace is all set!
              {planName && (
                <>
                  {" "}You&apos;re on the <span className="font-bold text-indigo-600">{planName}</span> plan.
                </>
              )}
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-2 text-left">
            {[
              { emoji: "📧", text: "Send email campaigns" },
              { emoji: "📊", text: "Track opens & clicks" },
              { emoji: "👥", text: "Manage lead lists" },
              { emoji: "🔧", text: "Configure SMTP" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-100 text-xs font-semibold text-zinc-600"
              >
                <span className="text-sm">{item.emoji}</span>
                {item.text}
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleDismiss}
            disabled={dismissing}
            className="h-11 w-full rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/20"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

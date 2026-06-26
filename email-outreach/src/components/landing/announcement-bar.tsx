"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { SlideUp } from "@/components/animations/slide-up";

interface AnnouncementBarProps {
  onClose?: () => void;
}

export function AnnouncementBar({ onClose }: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <SlideUp yOffset={-20} duration={0.4} className="pointer-events-auto w-full">
      <div className="relative bg-zinc-950 border-b border-white/5 px-4 py-1 text-white sm:px-6 lg:px-8 z-50">
        <div className="flex items-center justify-center gap-2.5">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <p className="text-xs font-semibold text-zinc-300">
            <span className="text-white">New AI Email Generator Released</span>
            <span className="hidden md:inline"> &mdash; Construct high-converting developer sequence templates in seconds.</span>
          </p>
          <a href="#features" className="text-xs font-bold text-primary underline underline-offset-2 hover:text-primary-foreground/90 transition-colors ml-1">
            Learn more
          </a>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors focus:outline-none"
        >
          <span className="sr-only">Dismiss</span>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </SlideUp>
  );
}

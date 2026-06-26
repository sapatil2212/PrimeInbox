"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  shimmerDuration?: string;
  borderRadius?: string;
  className?: string;
  children: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "#ffffff",
      shimmerSize = "0.1em",
      shimmerDuration = "4.5s",
      borderRadius = "9999px",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        style={
          {
            "--border-radius": borderRadius,
            "--shimmer-color": shimmerColor,
            "--shimmer-duration": shimmerDuration,
            "--shimmer-size": shimmerSize,
          } as React.CSSProperties
        }
        className={cn(
          "group relative flex items-center justify-center overflow-hidden bg-zinc-900 text-white font-medium px-6 py-3 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-zinc-800/50 shadow-sm",
          className
        )}
        {...props}
      >
        {/* Shimmer Border Light */}
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            borderRadius: "var(--border-radius)",
          }}
        >
          <div
            className="absolute inset-[-100%] animate-shimmer-loop bg-[linear-gradient(110deg,transparent,45%,var(--shimmer-color),55%,transparent)] bg-[length:200%_100%] bg-no-repeat"
            style={{
              animationDuration: "var(--shimmer-duration)",
            }}
          />
        </div>

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </button>
    );
  }
);

ShimmerButton.displayName = "ShimmerButton";

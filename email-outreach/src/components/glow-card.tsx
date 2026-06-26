"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: string; // e.g. "rgba(59, 130, 246, 0.06)"
}

export function GlowCard({
  children,
  className,
  glowColor = "rgba(59, 130, 246, 0.06)",
  ...props
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative rounded-2xl bg-gradient-to-b from-zinc-50/80 to-white border border-zinc-200/50 overflow-hidden transition-all duration-300 shadow-none",
        className
      )}
      {...props}
    >
      {/* Dynamic Cursor Light Spot */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl transition duration-300"
          style={{
            background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, ${glowColor}, transparent 85%)`,
          }}
        />
      )}

      {/* Dynamic Cursor Border Light Spot */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl transition duration-300 opacity-80"
          style={{
            background: `radial-gradient(150px circle at ${coords.x}px ${coords.y}px, rgba(37, 99, 235, 0.08), transparent 50%)`,
            border: "1px solid rgba(37, 99, 235, 0.15)",
          }}
        />
      )}

      {/* Card Content Container */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}

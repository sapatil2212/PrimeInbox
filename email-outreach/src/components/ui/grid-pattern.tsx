"use client";

import { useId } from "react";
import { motion } from "framer-motion";

interface GridPatternProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  strokeDasharray?: string;
  className?: string;
  gridCircles?: Array<{ x: number; y: number; delay?: number }>;
}

export function GridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray,
  className,
  gridCircles = [
    { x: 4, y: 5, delay: 0.5 },
    { x: 12, y: 3, delay: 1.2 },
    { x: 8, y: 9, delay: 2.1 },
    { x: 18, y: 7, delay: 0.8 },
    { x: 2, y: 12, delay: 3.0 },
    { x: 15, y: 11, delay: 1.7 },
  ],
  ...props
}: GridPatternProps) {
  const id = useId();

  return (
    <svg
      aria-hidden="true"
      className={className}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      {gridCircles && (
        <svg x={x} y={y} className="overflow-visible">
          {gridCircles.map(({ x: cx, y: cy, delay }, index) => (
            <motion.rect
              key={`${cx}-${cy}-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0.3, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: delay || 0,
                ease: "easeInOut",
              }}
              width={width - 1}
              height={height - 1}
              x={cx * width + 1}
              y={cy * height + 1}
              fill="rgba(37, 99, 235, 0.04)"
              className="stroke-primary/10 stroke-1"
            />
          ))}
        </svg>
      )}
    </svg>
  );
}

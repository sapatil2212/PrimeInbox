"use client";

import { motion } from "framer-motion";

export function GlowBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#FCFCFD]">
      {/* Soft light base radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(219,234,254,0.3),rgba(252,252,253,1)_80%)]" />

      {/* Flowing Pastel Lavender/Indigo Gradient Backdrop matching the mockup image */}
      <div className="absolute inset-0 opacity-100 filter blur-[80px] md:blur-[115px]">
        {/* Left Ambient purple-indigo blob */}
        <motion.div
          animate={{
            x: [-30, 20, -30],
            y: [-25, 25, -25],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-[10%] left-[-15%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-indigo-300/35 via-purple-300/25 to-transparent"
        />
        
        {/* Right Ambient fuchsia-indigo blob */}
        <motion.div
          animate={{
            x: [20, -30, 20],
            y: [15, -20, 15],
            scale: [1, 0.95, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[5%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-purple-300/30 via-pink-200/20 to-transparent"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#FCFCFD] via-transparent to-transparent" />
    </div>
  );
}

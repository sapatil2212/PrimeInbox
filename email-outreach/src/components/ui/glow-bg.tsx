"use client";

export function GlowBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#FCFCFD]">
      {/* Soft light base radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(219,234,254,0.3),rgba(252,252,253,1)_80%)]" />

      {/* Flowing Pastel Lavender/Indigo Gradient Backdrop — CSS-only for performance */}
      <div className="absolute inset-0 opacity-100 filter blur-[80px] md:blur-[115px]">
        {/* Left Ambient purple-indigo blob */}
        <div
          className="absolute -top-[10%] left-[-15%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-indigo-300/35 via-purple-300/25 to-transparent animate-glow-drift-left"
          style={{ willChange: "transform" }}
        />
        
        {/* Right Ambient fuchsia-indigo blob */}
        <div
          className="absolute top-[5%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-purple-300/30 via-pink-200/20 to-transparent animate-glow-drift-right"
          style={{ willChange: "transform" }}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#FCFCFD] via-transparent to-transparent" />
    </div>
  );
}

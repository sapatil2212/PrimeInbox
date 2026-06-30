"use client";

import { Container } from "@/components/layout/container";
import { SlideUp } from "@/components/animations/slide-up";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CtaSection() {
  return (
    <section className="py-16 relative overflow-hidden bg-zinc-950 border-t border-zinc-900 z-10">
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(59, 130, 246, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(59, 130, 246, 0.08) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      
      {/* Blue Centered Radial Glow behind text */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[360px] z-0 pointer-events-none opacity-70"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
        }}
      />

      <Container className="relative z-10 text-center flex flex-col items-center">
        <SlideUp>
          {/* Main Title Heading */}
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Ready to Simplify Your <br />
            <span className="text-blue-500 font-extrabold">Outreach Process?</span>
          </h2>
          
          {/* Descriptive Content Paragraph */}
          <p className="max-w-2xl mx-auto text-xs sm:text-sm md:text-base text-zinc-400 mb-10 leading-relaxed font-normal">
            Automate sequences, protect your domains, and deliver a seamless developer relations outreach experience with PrimeInbox. 
            Let AI draft the copy while you focus on growing developer relationships.
          </p>
          
          {/* Action Call-to-Action Buttons */}
          <div className="flex flex-row items-center justify-center gap-3 w-full px-4 sm:px-0">
            <Link href="/signup">
              <Button 
                className="h-10 px-6 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white border-0 transition-all shadow-lg shadow-blue-600/25 whitespace-nowrap flex items-center justify-center"
              >
                Get started now <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </Link>
            
            <Link href="/contact">
              <Button 
                className="h-10 px-6 rounded-lg text-xs font-semibold text-white/80 hover:text-white border border-white/20 hover:border-white/40 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all whitespace-nowrap"
              >
                Talk to sales
              </Button>
            </Link>
          </div>
        </SlideUp>
      </Container>
    </section>
  );
}

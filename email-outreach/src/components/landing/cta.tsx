"use client";

import { Container } from "@/components/layout/container";
import { SlideUp } from "@/components/animations/slide-up";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ArrowRight, Sparkles } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-32 relative overflow-hidden bg-transparent z-10">
      {/* Background Radial Glow Spotlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-purple-600 blur-[130px] rounded-full filter" />
      </div>

      <Container className="relative z-10 text-center">
        <SlideUp>
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-semibold rounded-full bg-zinc-100 border border-zinc-200/80 text-primary">
            <Sparkles className="w-3 h-3 animate-pulse" />
            Get Started Instantly
          </div>
          <h2 className="max-w-4xl mx-auto text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 mb-6 leading-tight">
            Start scaling your outreach today
          </h2>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-zinc-500 mb-10 leading-relaxed font-semibold">
            Join developer relations and growth engineering teams using PrimeInbox to land in developer inboxes, build relationships, and grow pipeline.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto sm:max-w-none">
            <ShimmerButton 
              className="h-14 px-8 rounded-full text-base font-bold w-full sm:w-auto bg-zinc-900 hover:bg-black"
              shimmerColor="#3B82F6"
            >
              Start Free Trial <ArrowRight className="ml-2 w-4 h-4" />
            </ShimmerButton>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 px-8 rounded-full text-base font-semibold w-full sm:w-auto text-zinc-700 hover:text-zinc-950 border border-zinc-200/80 hover:bg-zinc-50 bg-white/40 backdrop-blur-sm transition-all"
            >
              Book a Demo
            </Button>
          </div>
          
          <p className="mt-8 text-xs text-zinc-400 font-bold">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </SlideUp>
      </Container>
    </section>
  );
}

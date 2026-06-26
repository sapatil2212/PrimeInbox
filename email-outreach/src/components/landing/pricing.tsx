"use client";

import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/animations/fade-in";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { motion } from "framer-motion";
import Link from "next/link";

const PLANS = [
  {
    name: "Silver",
    price: "₹499",
    description: "Perfect for startups and small developer relations teams.",
    features: [
      "20,000 emails/month",
      "Up to 2 SMTP sender domains",
      "HTML Based Email Generator",
      "Basic Conversion Analytics",
      "Community Slack Support"
    ]
  },
  {
    name: "Gold",
    price: "₹999",
    description: "For scaling developer platforms and dedicated agencies.",
    popular: true,
    features: [
      "100,000 emails/month",
      "Up to 5 SMTP sender domains",
      "Advanced Sentiment Analytics",
      "AI Based Email Builder",
      "Priority Discord & Support"
    ]
  },
  {
    name: "Platinum",
    price: "₹1999",
    description: "Enterprise sending infrastructure with complete API access.",
    features: [
      "250,000 emails/month",
      "Up to 10 SMTP sender domains",
      "Advanced Sentiment Analytics",
      "AI Based Email Builder",
      "Priority Discord & Support"
    ]
  }
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-28 bg-transparent relative z-10">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      <Container>
        <div className="text-center max-w-3xl mx-auto mb-20">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-zinc-100 border border-zinc-200/80 text-primary">
              Simple Billing
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-zinc-900">
              Simple, transparent pricing
            </h2>
            <p className="text-base md:text-lg text-zinc-500">
              Choose the sending volume that fits your DevRel growth goals. No hidden fees.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {PLANS.map((plan, i) => {
            const isPopular = plan.popular;
            
            return (
              <FadeIn key={plan.name} delay={i * 0.1} className="h-full">
                <div 
                  className={`relative flex flex-col h-full p-8 rounded-3xl border transition-all duration-300 ${
                    isPopular 
                      ? 'border-primary bg-white shadow-2xl shadow-primary/5 scale-[1.02] md:scale-[1.04]' 
                      : 'border-zinc-200/60 bg-white/70 backdrop-blur-sm hover:border-zinc-300 shadow-sm'
                  }`}
                >
                  {isPopular && (
                    <>
                      {/* Popular status badge */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-primary text-white text-[10px] font-bold tracking-wide uppercase rounded-full border border-primary/30 shadow-md">
                        Most Popular
                      </div>
                      {/* Interactive glowing background ring */}
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                    </>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">{plan.name}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed min-h-[40px]">{plan.description}</p>
                  </div>
                  
                  <div className="mb-8 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-zinc-900">{plan.price}</span>
                    <span className="text-zinc-400 text-xs font-semibold">/ month</span>
                  </div>
                  
                  <div className="w-full h-px bg-zinc-150 mb-8" />
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3 text-xs text-zinc-650 font-semibold">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isPopular ? "text-primary" : "text-zinc-400"}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {isPopular ? (
                    <Link href={`/signup?plan=${plan.name.toUpperCase()}`} className="block">
                      <ShimmerButton 
                        className="w-full h-12 rounded-xl text-xs font-bold bg-zinc-950 hover:bg-black"
                        shimmerColor="#3B82F6"
                      >
                        Get Started {plan.name}
                      </ShimmerButton>
                    </Link>
                  ) : (
                    <Link href={`/signup?plan=${plan.name.toUpperCase()}`} className="block">
                      <Button 
                        className="w-full h-12 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-950 border border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50 transition-all bg-white" 
                        variant="outline"
                      >
                        Get Started
                      </Button>
                    </Link>
                  )}
                </div>
              </FadeIn>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

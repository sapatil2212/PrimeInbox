"use client";

import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/animations/fade-in";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { motion } from "framer-motion";
import Link from "next/link";

const PLANS = [
  {
    name: "Bronze",
    price: "Free",
    description: "Get started and test the waters with no commitment.",
    features: [
      "10 emails total",
      "1 SMTP sender domain",
      { text: "HTML Based Email Generator", included: false },
      { text: "Basic Conversion Analytics", included: false },
      { text: "Community Slack Support", included: false }
    ]
  },
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
    <section id="pricing" className="pt-16 pb-12 bg-transparent relative z-10">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      <Container>
        <div className="text-center max-w-3xl mx-auto mb-14">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-zinc-100 border border-zinc-200/80 text-primary">
              Simple Billing
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-zinc-900">
              Simple, transparent pricing
            </h2>
            <p className="text-sm md:text-base text-zinc-500 font-normal">
              Choose the sending volume that fits your DevRel growth goals. No hidden fees.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch">
          {PLANS.map((plan, i) => {
            const isPopular = plan.popular;
            
            return (
              <FadeIn key={plan.name} delay={i * 0.1} className="h-full">
                <div 
                  className={`relative flex flex-col h-full p-6 rounded-2xl border transition-all duration-300 ${
                    isPopular 
                      ? 'border-primary/40 bg-white scale-[1.02] md:scale-[1.04]' 
                      : 'border-zinc-200/50 bg-white/70 backdrop-blur-sm hover:border-zinc-300'
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
                  
                  <div className="mb-2">
                    <h3 className="text-lg font-bold text-zinc-900 mb-1">{plan.name}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed min-h-[36px]">{plan.description}</p>
                  </div>
                  
                  <div className="mb-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-zinc-900">{plan.price}</span>
                    {plan.price !== "Free" && (
                      <span className="text-zinc-400 text-xs font-semibold">/ month</span>
                    )}
                  </div>
                  
                  <div className="w-full h-px bg-zinc-150 mb-4" />
                  
                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature, j) => {
                      const isObj = typeof feature === "object";
                      const included = isObj ? feature.included : true;
                      const text = isObj ? feature.text : feature;
                      return (
                        <li
                          key={j}
                          className={`flex items-start gap-3 text-xs font-semibold ${
                            included ? "text-zinc-650" : "text-zinc-400"
                          }`}
                        >
                          {included ? (
                            <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isPopular ? "text-primary" : "text-zinc-400"}`} />
                          ) : (
                            <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                          )}
                          <span>{text}</span>
                        </li>
                      );
                    })}
                  </ul>
                  
                  {isPopular ? (
                    <Link href={`/signup?plan=${plan.name.toUpperCase()}`} className="block">
                      <ShimmerButton 
                        className="w-full h-9 rounded-lg text-xs font-bold bg-zinc-950 hover:bg-black"
                        shimmerColor="#3B82F6"
                      >
                        Get Started {plan.name}
                      </ShimmerButton>
                    </Link>
                  ) : (
                    <Link href={`/signup?plan=${plan.name.toUpperCase()}`} className="block">
                      <Button 
                        className="w-full h-9 rounded-lg text-xs font-bold text-zinc-600 hover:text-zinc-950 border border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50 transition-all bg-white" 
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

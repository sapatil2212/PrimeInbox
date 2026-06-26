"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/animations/fade-in";
import { Users, FileText, Send, Calendar, Play, Check } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  { icon: Users, title: "Import Leads", description: "CSV or GitHub webhook Sync" },
  { icon: FileText, title: "Select Template", description: "AI generated or manual HTML" },
  { icon: Send, title: "Choose SMTP", description: "Configure auto-rotation" },
  { icon: Calendar, title: "Schedule Sequence", description: "Target prospect timezones" },
  { icon: Play, title: "Launch outreach", description: "Watch leads roll in" },
];

export function CampaignBuilder() {
  const [activeStep, setActiveStep] = useState(0);

  // Automatically cycle active steps for simulated showcase
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-28 bg-transparent relative z-10">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-20">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-zinc-100 border border-zinc-200/80 text-primary">
              Outreach Pipelines
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-zinc-900">
              Launch campaigns in minutes
            </h2>
            <p className="text-base md:text-lg text-zinc-500">
              Our wizard pipeline makes it effortless to construct multi-step drip sequences. 
              No developer expertise required.
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          <div className="relative max-w-5xl mx-auto px-4 md:px-0">
            
            {/* Glowing Pipeline Connector Line */}
            <div className="absolute top-[48px] left-[10%] right-[10%] h-[2px] bg-zinc-200/50 -translate-y-1/2 hidden md:block z-0 overflow-hidden">
              <motion.div
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 relative z-10">
              {STEPS.map((step, i) => {
                const isActive = activeStep === i;
                const isCompleted = i < activeStep;
                
                return (
                  <div 
                    key={i} 
                    className="flex flex-col items-center text-center group cursor-pointer"
                    onClick={() => setActiveStep(i)}
                  >
                    {/* Circle Node Container */}
                    <div 
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-500 relative border ${
                        isActive 
                          ? "bg-primary/10 border-primary shadow-md shadow-primary/10 scale-105" 
                          : isCompleted 
                            ? "bg-white border-emerald-500/50 shadow-sm" 
                            : "bg-white border-zinc-200/60 shadow-sm group-hover:border-zinc-300"
                      }`}
                    >
                      {/* Ambient Halo */}
                      {isActive && (
                        <span className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping opacity-45 pointer-events-none" />
                      )}
                      
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <step.icon className={`w-5 h-5 transition-colors duration-500 ${
                          isActive ? "text-primary" : "text-zinc-400 group-hover:text-zinc-900"
                        }`} />
                      )}
                    </div>
                    
                    {/* Text Details */}
                    <h4 className={`text-sm font-bold mb-1.5 transition-colors duration-300 ${
                      isActive ? "text-primary" : "text-zinc-800"
                    }`}>
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-zinc-500 px-2">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}

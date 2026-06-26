"use client";

import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/animations/fade-in";
import { GlowCard } from "@/components/ui/glow-card";
import { 
  Wand2, Repeat, Download, LayoutTemplate, 
  BarChart, Layers, Code, Target 
} from "lucide-react";

const FEATURES = [
  {
    title: "AI Email Generator",
    description: "Instantly draft highly personalized emails that get replies using our advanced AI models tailored for developer relations.",
    icon: Wand2,
    gridClass: "md:col-span-3 lg:col-span-4",
    accent: "rgba(59, 130, 246, 0.06)"
  },
  {
    title: "SMTP Rotation",
    description: "Cycle through multiple sender accounts to maintain deliverability and protect domain reputation.",
    icon: Repeat,
    gridClass: "md:col-span-3 lg:col-span-2",
    accent: "rgba(6, 182, 212, 0.06)"
  },
  {
    title: "Intelligent Lead Import",
    description: "Import your contacts via CSV or sync with CRM. Automap custom fields like github username or social links.",
    icon: Download,
    gridClass: "md:col-span-3 lg:col-span-2",
    accent: "rgba(16, 185, 129, 0.06)"
  },
  {
    title: "Visual Campaign Builder",
    description: "Drag-and-drop wizard builder to map complex multi-step developer sequence paths without code.",
    icon: LayoutTemplate,
    gridClass: "md:col-span-3 lg:col-span-2",
    accent: "rgba(245, 158, 11, 0.06)"
  },
  {
    title: "Real-time Analytics",
    description: "Track precise opens, link clicks, and reply sentiment to measure DevRel pipeline growth.",
    icon: BarChart,
    gridClass: "md:col-span-3 lg:col-span-2",
    accent: "rgba(99, 102, 241, 0.06)"
  },
  {
    title: "White Label Engine",
    description: "Run under custom subdomains, branded SMTP connections, and custom logo styling.",
    icon: Layers,
    gridClass: "md:col-span-3 lg:col-span-3",
    accent: "rgba(236, 72, 153, 0.06)"
  },
  {
    title: "Tailored HTML Editor",
    description: "Create HTML layouts directly or insert raw code snippets with full syntax highlight.",
    icon: Code,
    gridClass: "md:col-span-3 lg:col-span-3",
    accent: "rgba(139, 92, 246, 0.06)"
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-28 bg-transparent relative z-10">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-20">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-zinc-100 border border-zinc-200/80 text-primary">
              Core Capabilities
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-zinc-900">
              Everything you need to scale your outreach
            </h2>
            <p className="text-base md:text-lg text-zinc-500">
              A comprehensive suite of tools built for developer relations teams to reach the inbox, 
              engage developers, and grow pipelines.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {FEATURES.map((feature, i) => (
            <div key={i} className={feature.gridClass}>
              <GlowCard 
                glowColor={feature.accent}
                className="h-full group hover:-translate-y-1 transition-all duration-300 border border-zinc-200/50"
              >
                <div className="p-8 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200/60 flex items-center justify-center text-zinc-600 mb-6 group-hover:scale-105 group-hover:bg-zinc-200/40 group-hover:text-primary transition-all duration-300">
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-zinc-900 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-xs md:text-sm text-zinc-500 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] font-bold text-zinc-400 group-hover:text-zinc-800 transition-colors">
                    <span>Learn more</span>
                    <span>&rarr;</span>
                  </div>
                </div>
              </GlowCard>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

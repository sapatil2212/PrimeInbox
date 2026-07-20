"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideUp } from "@/components/animations/slide-up";
import { CtaSection } from "@/components/landing/cta";
import { Button } from "@/components/ui/button";
import { 
  Wand2, Repeat, Download, LayoutTemplate, 
  BarChart3, Layers, Code, CheckCircle2, 
  Server, ArrowRight, ShieldCheck, Mail, Send,
  Webhook, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type FeatureId = "ai" | "smtp" | "import" | "builder";

const FEATURE_TABS = [
  {
    id: "ai",
    title: "AI Studio & Copilot",
    label: "AI Generation",
    icon: Wand2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    desc: "Draft context-aware 2-step sequences, subject lines, and call-to-actions automatically using AI prompts, or command our design copilot to change layouts (colors, padding, spacing) conversationally.",
    bullets: [
      "Generate sequences via AI studio",
      "AI design copilot within the editor",
      "Context-aware subject line optimizer",
      "Dynamic recipient tag variables"
    ]
  },
  {
    id: "smtp",
    title: "SMTP Accounts Rotation",
    label: "Deliverability Engine",
    icon: Repeat,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    desc: "Distribute sends across multiple connected mailboxes with custom daily/hourly limits, priority weights, and optional domain-level DKIM signing to help maintain deliverability.",
    bullets: [
      "Custom hourly and daily limit caps",
      "Optional domain-level DKIM signing",
      "Priority and rotation weights",
      "Multiple connected sender accounts"
    ]
  },
  {
    id: "import",
    title: "CSV Upload & Mapper",
    label: "Lead Integrator",
    icon: Download,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    desc: "Import contact directories easily. Map custom CSV headers directly to profile variables, automatically clean out duplicates, and validate against bounce suppression lists.",
    bullets: [
      "Interactive CSV header mapper",
      "Automatic duplicate filtering",
      "Active validation check on import",
      "Sync custom profile variables"
    ]
  },
  {
    id: "builder",
    title: "Drag-and-Drop Editor",
    label: "Campaign Builder",
    icon: LayoutTemplate,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    desc: "Build professional, responsive email layouts visually. Drag-and-drop headings, text columns, buttons, social links, dividers, or custom raw HTML blocks with responsive views.",
    bullets: [
      "Flexible grid columns & block elements",
      "Global color & font adjustments",
      "Live desktop, tablet, and mobile views",
      "Save reusable custom templates"
    ]
  }
];

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState<FeatureId>("ai");
  const activeFeature = FEATURE_TABS.find((tab) => tab.id === activeTab)!;

  // Automatically rotate tabs every 5 seconds
  useEffect(() => {
    const tabs: FeatureId[] = ["ai", "smtp", "import", "builder"];
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        const currentIndex = tabs.indexOf(prev);
        const nextIndex = (currentIndex + 1) % tabs.length;
        return tabs[nextIndex];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50/50">
      <Navbar />

      {/* Hero Header Section */}
      <section className="relative pt-36 pb-16 overflow-hidden bg-white border-b border-zinc-150">
        <div 
          className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(to right, #09090b 1px, transparent 1px), linear-gradient(to bottom, #09090b 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <Container className="relative z-10 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-zinc-100 border border-zinc-200/80 text-primary">
              PrimeInbox Core
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 mb-6 max-w-4xl mx-auto leading-tight">
              Powerful tools built to scale <span className="text-blue-600 font-extrabold">your email campaigns</span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm md:text-base text-zinc-500 leading-relaxed font-normal">
              A comprehensive email platform built to support reliable deliverability, draft personalized sequence templates, import your contacts, and track engagement.
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* Interactive Tabs Section */}
      <section className="py-20 bg-transparent">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            {/* Left Side: Interaction Tabs Selector */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Interactive Tour</span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 tracking-tight">Explore the platform features</h2>
                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-normal">
                  Click through the core engine features below to view their details, capabilities, and active visual preview models.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {FEATURE_TABS.map((tab) => {
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as FeatureId)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 ${
                        isSelected 
                          ? "bg-white border-zinc-200 shadow-sm scale-[1.01]" 
                          : "bg-transparent border-transparent hover:bg-zinc-100/50 hover:border-zinc-200/20"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tab.bg} ${tab.color} border ${tab.border}`}>
                        <tab.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold ${isSelected ? "text-zinc-900" : "text-zinc-500"}`}>{tab.label}</p>
                        <p className="text-[10px] text-zinc-400 font-semibold truncate mt-0.5">{tab.title} and automation utilities</p>
                      </div>
                      <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isSelected ? "text-primary translate-x-0.5" : "text-zinc-300 opacity-0 group-hover:opacity-100"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Active Tab View Box */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200/50 shadow-sm min-h-[480px] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/[0.02] via-transparent to-transparent pointer-events-none" />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${activeFeature.bg} ${activeFeature.color} border ${activeFeature.border}`}>
                        {activeFeature.title}
                      </span>
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 mb-3">{activeFeature.label} Engine</h3>
                    <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-normal mb-6">
                      {activeFeature.desc}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                      {activeFeature.bullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Simulation Preview Box */}
                  <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200/60 min-h-[160px] flex items-center justify-center">
                    {activeTab === "ai" && (
                      <div className="w-full text-left space-y-2">
                        <span className="text-[9px] uppercase font-bold text-zinc-400 block">AI Output Mockup</span>
                        <div className="text-[11px] font-semibold text-zinc-800 bg-white p-3 rounded-lg border border-zinc-200/40 leading-relaxed">
                          <strong>Subject:</strong> A simpler way to run campaigns at [Company] <br />
                          Hi [Name], I noticed your team is growing its email marketing. I put together a quick overview tailored to your use case...
                        </div>
                      </div>
                    )}
                    {activeTab === "smtp" && (
                      <div className="w-full space-y-3">
                        <span className="text-[9px] uppercase font-bold text-zinc-400 block text-left">Active Delivery Nodes</span>
                        <div className="flex justify-around items-center bg-white p-3 rounded-lg border border-zinc-200/40">
                          <div className="text-center">
                            <Server className="w-5 h-5 text-blue-500 mx-auto" />
                            <span className="text-[9px] font-bold text-zinc-800 mt-1 block">node-1.co</span>
                          </div>
                          <div className="w-8 h-[2px] bg-zinc-200 border-dashed" />
                          <div className="text-center">
                            <Server className="w-5 h-5 text-cyan-500 mx-auto" />
                            <span className="text-[9px] font-bold text-zinc-800 mt-1 block">node-2.app</span>
                          </div>
                          <div className="w-8 h-[2px] bg-zinc-200 border-dashed" />
                          <div className="text-center">
                            <Server className="w-5 h-5 text-emerald-500 mx-auto" />
                            <span className="text-[9px] font-bold text-zinc-800 mt-1 block">node-3.dev</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTab === "import" && (
                      <div className="w-full text-left space-y-2">
                        <span className="text-[9px] uppercase font-bold text-zinc-400 block">Variables Auto-Mapping</span>
                        <div className="grid grid-cols-3 gap-2">
                          {["First Name", "Company", "Email"].map((field) => (
                            <div key={field} className="bg-white p-2 rounded border border-zinc-200 text-center text-[10px] font-bold text-zinc-700">
                              {field} &rarr; mapped
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {activeTab === "builder" && (
                      <div className="w-full space-y-2 text-left">
                        <span className="text-[9px] uppercase font-bold text-zinc-400 block">Drip Timeframe Workflow</span>
                        <div className="flex gap-2">
                          <div className="bg-blue-50 text-blue-600 border border-blue-100 p-2 rounded text-[10px] font-bold flex-1 text-center">Day 1: Send AI intro</div>
                          <div className="bg-amber-50 text-amber-600 border border-amber-100 p-2 rounded text-[10px] font-bold flex-1 text-center">Day 3: Send follow-up</div>
                          <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 p-2 rounded text-[10px] font-bold flex-1 text-center">Unsubscribe: Auto-stop</div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </Container>
      </section>

      {/* Grid of Other Features Section */}
      <section className="py-16 bg-white border-y border-zinc-150 relative z-10">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Additional Capabilities</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 tracking-tight mt-1 mb-3">Even more features to power your campaigns</h2>
            <p className="text-xs sm:text-sm text-zinc-500 font-normal">
              A comprehensive set of tools built to help businesses run organized, reliable email campaigns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "Collaborative Workspaces",
                desc: "Invite teammates, share connected sender accounts, and collaborate on email campaigns from a single dashboard.",
                icon: Users,
                color: "text-purple-600",
                bg: "bg-purple-50"
              },
              {
                title: "Campaign Reports & Exports",
                desc: "Review sent, open, click and bounce metrics per campaign, and export your reports to Excel, PDF, or Word.",
                icon: BarChart3,
                color: "text-indigo-650",
                bg: "bg-indigo-50"
              },
              {
                title: "Suppression & Unsubscribe Lists",
                desc: "Add one-click unsubscribe links and automatically keep unsubscribed and bounced addresses on a suppression list.",
                icon: Code,
                color: "text-pink-650",
                bg: "bg-pink-50"
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-zinc-50 p-6 rounded-xl border border-zinc-200/50 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
                <div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-zinc-200/20 mb-4 ${item.bg} ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-2">{item.title}</h3>
                  <p className="text-[11px] text-zinc-550 leading-relaxed font-normal">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Beautiful overhauled CTA */}
      <CtaSection />
      
      <Footer />
    </main>
  );
}

"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { GlowCard } from "@/components/ui/glow-card";
import { SlideUp } from "@/components/animations/slide-up";
import { Shield, Rocket, Target, Sparkles, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

export default function AboutPage() {
  // Calculator State
  const [domains, setDomains] = useState(4);
  const [volume, setVolume] = useState(3000);
  const [customization, setCustomization] = useState(60); // % of personalization

  // Deliverability Calculations
  const totalVolume = domains * volume;
  
  // Calculate deliverability score based on volume per domain and customization
  // 1. High volume per domain decreases deliverability
  const volPerDomainPenalty = Math.max(0, (volume - 2000) / 150);
  // 2. High customization increases deliverability/reply rates
  const customizationBonus = (customization - 30) * 0.15;
  // 3. Too few domains for high volume increases penalty
  const domainShortagePenalty = totalVolume > 8000 && domains < 3 ? 8 : 0;

  const deliverability = Math.max(
    55,
    Math.min(99.4, 98.5 - volPerDomainPenalty + customizationBonus - domainShortagePenalty)
  );

  // Spam Risk Level
  let spamRisk = "Low";
  let riskColor = "text-emerald-500 bg-emerald-50/50 border-emerald-100";
  if (deliverability < 82) {
    spamRisk = "High Risk";
    riskColor = "text-red-500 bg-red-50/50 border-red-100";
  } else if (deliverability < 92) {
    spamRisk = "Moderate";
    riskColor = "text-amber-500 bg-amber-50/50 border-amber-100";
  }

  // Estimated Responses (Assuming average 12% baseline response on technical outreach, scaled by personalization)
  const baseReplyRate = 0.08;
  const personalizationMultiplier = customization / 50;
  const replyRate = baseReplyRate * personalizationMultiplier * (deliverability / 100);
  const estimatedReplies = Math.round(totalVolume * replyRate);

  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      
      <section className="relative pt-36 pb-24 overflow-hidden bg-transparent z-10">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <Container className="relative z-10">
          <div className="text-center mb-16">
            <SlideUp delay={0.2} yOffset={30}>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-zinc-100 border border-zinc-200/80 text-primary">
                Our Story & Vision
              </div>
              <h1 className="max-w-4xl mx-auto text-4xl md:text-5xl lg:text-6xl leading-[1.1] font-extrabold tracking-tight text-zinc-900 mb-6">
                Empowering developer platforms to grow <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-650 font-extrabold">scalable pipelines.</span>
              </h1>
            </SlideUp>

            <SlideUp delay={0.3} yOffset={20}>
              <p className="max-w-2xl mx-auto text-sm md:text-base text-zinc-500 leading-relaxed font-semibold">
                Founded in 2024, PrimeInbox was built to bridge the gap between developer relations and sales ops. We help B2B developer-first startups turn community engagement into qualified sales pipeline.
              </p>
            </SlideUp>
          </div>

          {/* Interactive Calculator Section */}
          <div className="max-w-5xl mx-auto mb-20">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 mb-2">
                Outreach Deliverability Simulator
              </h2>
              <p className="text-xs md:text-sm text-zinc-500 max-w-xl mx-auto font-medium">
                Adjust the parameters below to simulate your sending health score, deliverability risks, and reply rates using SMTP rotation.
              </p>
            </div>

            <GlowCard className="border border-zinc-200/60 overflow-hidden" glowColor="rgba(59, 130, 246, 0.04)">
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200">
                {/* Sliders Control Panel */}
                <div className="lg:col-span-7 p-6 md:p-8 space-y-6 bg-white/45">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="text-base font-bold text-zinc-900">Campaign Simulator Controls</h3>
                  </div>

                  {/* Slider 1 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-zinc-700">Sending Domains</label>
                      <span className="font-extrabold text-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{domains} domains</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={domains}
                      onChange={(e) => setDomains(Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <p className="text-[10px] text-zinc-400 font-medium">Cycling your outreach across more domains reduces single-domain footprint.</p>
                  </div>

                  {/* Slider 2 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-zinc-700">Volume per Domain / month</label>
                      <span className="font-extrabold text-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{volume.toLocaleString()} emails</span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="10000"
                      step="500"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <p className="text-[10px] text-zinc-400 font-medium">Keep daily volumes under 150 emails per domain to protect sender reputation.</p>
                  </div>

                  {/* Slider 3 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-zinc-700">AI Customization Level</label>
                      <span className="font-extrabold text-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{customization}% unique content</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={customization}
                      onChange={(e) => setCustomization(Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <p className="text-[10px] text-zinc-400 font-medium">Using templates with unique variables prevents templates from triggering spam filters.</p>
                  </div>
                </div>

                {/* Results Screen */}
                <div className="lg:col-span-5 p-6 md:p-8 flex flex-col justify-between bg-zinc-50/50">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                      <h4 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">Health Projection</h4>
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${deliverability > 90 ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${deliverability > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500">Live Simulation</span>
                      </div>
                    </div>

                    {/* Stats Layout */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Deliverability Score</p>
                        <p className="text-3xl font-extrabold text-zinc-900 mt-1">{deliverability.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Spam Risk</p>
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold mt-2 ${riskColor}`}>
                          {spamRisk}
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-zinc-200" />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Total Emails / mo</p>
                        <p className="text-lg font-bold text-zinc-800 mt-1">{totalVolume.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Est. Monthly Replies</p>
                        <p className="text-lg font-bold text-zinc-800 mt-1 flex items-center gap-1.5">
                          {estimatedReplies}
                          <span className="text-[10px] text-emerald-500 font-semibold">(~{(replyRate * 100).toFixed(1)}%)</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-3 rounded-xl border border-zinc-200/50 bg-white text-[11px] font-medium text-zinc-450 leading-relaxed flex items-start gap-2.5">
                    {deliverability > 92 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Healthy Setup!</strong> Cycling domains ensures low volume per inbox. AI customization makes filters happy and replies climb.</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span><strong>Caution:</strong> Daily volumes are too high or customization is low. Consider adding domains or generating unique sequences to improve scores.</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </GlowCard>
          </div>

          {/* Grid of Core Values */}
          <div>
            <h2 className="text-center text-xl font-bold tracking-tight text-zinc-900 mb-8">Our Core Principles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
              <GlowCard className="h-full border border-zinc-200/50" glowColor="rgba(59, 130, 246, 0.05)">
                <div className="p-8 flex flex-col h-full justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200/60 flex items-center justify-center text-primary mb-6">
                      <Target className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-zinc-900">Developer-First</h3>
                    <p className="text-xs md:text-sm text-zinc-500 leading-relaxed font-semibold">
                      We know developers hate spam. Our tools ensure you send tailored, meaningful, and context-rich messages that respect developer time.
                    </p>
                  </div>
                </div>
              </GlowCard>

              <GlowCard className="h-full border border-zinc-200/50" glowColor="rgba(6, 182, 212, 0.05)">
                <div className="p-8 flex flex-col h-full justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200/60 flex items-center justify-center text-cyan-600 mb-6">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-zinc-900">Deliverability Focus</h3>
                    <p className="text-xs md:text-sm text-zinc-500 leading-relaxed font-semibold">
                      Through advanced SMTP rotation, multi-inbox setup, and auto-warmups, we prioritize deliverability so you land in the primary inbox.
                    </p>
                  </div>
                </div>
              </GlowCard>

              <GlowCard className="h-full border border-zinc-200/50" glowColor="rgba(99, 102, 241, 0.05)">
                <div className="p-8 flex flex-col h-full justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200/60 flex items-center justify-center text-indigo-600 mb-6">
                      <Rocket className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-zinc-900">Revenue Oriented</h3>
                    <p className="text-xs md:text-sm text-zinc-500 leading-relaxed font-semibold">
                      We tie outreach to actual business metrics. Track opens, links, replies, and opportunities generated from your campaigns in real-time.
                    </p>
                  </div>
                </div>
              </GlowCard>
            </div>
          </div>
        </Container>
      </section>
      
      <Footer />
    </main>
  );
}

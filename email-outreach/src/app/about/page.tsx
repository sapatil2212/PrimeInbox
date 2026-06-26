import { Navbar } from "@/components/layout/navbar";
import { AnnouncementBar } from "@/components/landing/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { GlowCard } from "@/components/ui/glow-card";
import { SlideUp } from "@/components/animations/slide-up";
import { Shield, Rocket, Target } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Navbar />
      
      <section className="relative pt-36 pb-20 overflow-hidden bg-transparent z-10">
        <Container className="relative z-10 text-center">
          <SlideUp delay={0.2} yOffset={30}>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-zinc-100 border border-zinc-200/80 text-primary">
              Our Story
            </div>
            <h1 className="max-w-4xl mx-auto text-4xl md:text-5xl lg:text-6xl leading-[1.1] font-extrabold tracking-tight text-zinc-900 mb-6">
              Empowering developer platforms to grow <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-650 font-extrabold">scalable pipelines.</span>
            </h1>
          </SlideUp>

          <SlideUp delay={0.3} yOffset={20}>
            <p className="max-w-2xl mx-auto text-sm md:text-base text-zinc-500 mb-16 leading-relaxed font-semibold">
              Founded in 2024, PrimeInbox was built to bridge the gap between developer relations and sales ops. We help B2B developer-first startups turn community engagement into qualified sales pipeline.
            </p>
          </SlideUp>

          {/* Grid of Core Values */}
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
        </Container>
      </section>
      
      <Footer />
    </main>
  );
}

"use client";

import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/animations/fade-in";
import { Server, ArrowRight, ShieldCheck, Mail, Send } from "lucide-react";
import { motion } from "framer-motion";

export function SmtpRotation() {
  return (
    <section className="py-28 bg-transparent relative z-10">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* SMTP Rotation visual diagram */}
          <div className="order-2 lg:order-1 relative">
            <div className="relative w-full max-w-lg mx-auto bg-white/60 p-8 rounded-2xl border border-zinc-200/80 backdrop-blur-xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />
              
              {/* Outer SVG Grid Connection Line Paths */}
              <div className="absolute inset-0 z-0 pointer-events-none">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  {/* Glowing Connection Paths */}
                  <motion.path
                    d="M 280,100 L 380,165"
                    stroke="rgba(37, 99, 235, 0.15)"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                    fill="none"
                  />
                  <motion.path
                    d="M 280,170 L 380,170"
                    stroke="rgba(6, 182, 212, 0.15)"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                    fill="none"
                  />
                  <motion.path
                    d="M 280,240 L 380,175"
                    stroke="rgba(16, 185, 129, 0.15)"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                    fill="none"
                  />
                  
                  {/* Floating Pulsating light streaks */}
                  <motion.circle
                    r="4"
                    fill="#2563EB"
                    initial={{ offset: 0 }}
                    animate={{
                      cx: [280, 380],
                      cy: [100, 165],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <motion.circle
                    r="4"
                    fill="#06B6D4"
                    initial={{ offset: 0 }}
                    animate={{
                      cx: [280, 380],
                      cy: [170, 170],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "linear",
                      delay: 0.8,
                    }}
                  />
                  <motion.circle
                    r="4"
                    fill="#10B981"
                    initial={{ offset: 0 }}
                    animate={{
                      cx: [280, 380],
                      cy: [240, 175],
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: "linear",
                      delay: 1.5,
                    }}
                  />
                </svg>
              </div>

              {/* Grid content nodes */}
              <div className="relative z-10 grid grid-cols-12 gap-4 items-center">
                
                {/* SMTP Nodes (Left side) */}
                <div className="col-span-7 space-y-4">
                  {[
                    { id: 1, name: "dev-sender.co", color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                    { id: 2, name: "outreach-node.app", color: "text-cyan-600", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
                    { id: 3, name: "ops-mail.dev", color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                  ].map((node) => (
                    <motion.div
                      key={node.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: node.id * 0.15, duration: 0.5 }}
                      className={`flex items-center gap-3 bg-white p-3.5 rounded-xl border border-zinc-200/50 relative hover:border-zinc-300 transition-all shadow-sm`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${node.bg} ${node.border} flex items-center justify-center ${node.color}`}>
                        <Server className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-zinc-900 truncate">{node.name}</p>
                        <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-bold">Active Rotation</p>
                      </div>
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    </motion.div>
                  ))}
                </div>

                {/* Gateway Destination Node (Right side) */}
                <div className="col-span-5 flex justify-end pl-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="flex flex-col items-center justify-center text-center bg-white border border-zinc-200/80 p-5 rounded-2xl w-full max-w-[130px] aspect-square shadow-md relative"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-sm">
                      <Send className="w-5 h-5 animate-pulse" />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-900">Inboxes</p>
                    <p className="text-[9px] text-zinc-500 font-semibold mt-0.5">Primary Delivery</p>
                    <div className="absolute -top-1 -right-1 bg-emerald-100 text-emerald-600 text-[8px] font-bold border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                      99.9%
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Texts content description */}
          <div className="order-1 lg:order-2">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-zinc-100 border border-zinc-200/80 text-primary">
                Smart Routing Technology
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-zinc-900">
                Never land in spam again
              </h2>
              <p className="text-base md:text-lg text-zinc-500 mb-6 leading-relaxed font-semibold">
                Our intelligent SMTP rotation engine automatically distributes your sending volume across multiple domains and custom mailboxes.
              </p>
              <p className="text-base md:text-lg text-zinc-500 mb-8 leading-relaxed font-semibold">
                By monitoring reputation in real-time, the platform instantly pauses mailboxes that show signs of rate-limiting, ensuring your sequences consistently hit the primary tab.
              </p>
              
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-200/80">
                <div>
                  <div className="text-3xl font-extrabold text-zinc-900 mb-1">99.9%</div>
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Average Deliverability</div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-zinc-900 mb-1">Zero</div>
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Domain Blacklists</div>
                </div>
              </div>
            </FadeIn>
          </div>

        </div>
      </Container>
    </section>
  );
}

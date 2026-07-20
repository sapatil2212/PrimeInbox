"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideUp } from "@/components/animations/slide-up";
import { Sparkles, Send, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const PROMPTS = [
  "Write an intro email to a marketing manager about our email campaign platform...",
  "Draft a friendly follow-up email for contacts who opened our last newsletter...",
  "Create an invitation sequence for our upcoming product webinar..."
];

const OUTPUTS = [
  {
    subject: "A simpler way to run your email campaigns",
    body: `Hi [Name],

I noticed [Company] is growing its email marketing efforts.

We built a platform that helps teams create personalized campaigns, connect their own sending accounts, and track opens and clicks — all from one dashboard.

Would you be open to a quick chat next week to see if it's a fit for your team?`
  },
  {
    subject: "Thanks for reading our last update",
    body: `Hi [Name],

Thanks for opening our latest newsletter!

I wanted to check in: are you exploring tools to make your email campaigns easier to manage, or is this something on your roadmap at [Company]?

Either way, I'd be happy to share a short getting-started guide if it's helpful.`
  },
  {
    subject: "Invitation: our upcoming product webinar",
    body: `Hi [Name],

We're hosting a live webinar next Wednesday on running effective, well-organized email campaigns.

Given your role at [Company], I thought you might find it useful.

Can I save a free seat for you and your team?`
  }
];

export function AISection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [typingText, setTypingText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(true);

  // Typewriter effect on prompt changes
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const fullText = PROMPTS[activeIdx];
    let currentText = "";
    let i = 0;

    setIsGenerating(false);
    setShowResult(false);
    setTypingText("");

    const type = () => {
      if (i < fullText.length) {
        currentText += fullText.charAt(i);
        setTypingText(currentText);
        i++;
        timer = setTimeout(type, 30);
      } else {
        // Trigger simulated generation
        setIsGenerating(true);
        setTimeout(() => {
          setIsGenerating(false);
          setShowResult(true);
        }, 1500);
      }
    };

    timer = setTimeout(type, 500);

    return () => clearTimeout(timer);
  }, [activeIdx]);

  return (
    <section className="py-16 bg-transparent text-zinc-900 relative overflow-hidden z-10">
      {/* Decorative Radial Grid Mask */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[90px] pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-zinc-100 border border-zinc-200/85 text-primary">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                AI Assistant Engine
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-zinc-900">
                Draft email copy in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-primary">seconds</span>
              </h2>
              <p className="text-sm md:text-base text-zinc-500 mb-5 leading-relaxed font-normal">
                Say goodbye to writer's block. Provide a simple prompt, and the AI assistant drafts personalized email copy and follow-up sequences that you can review and edit before sending.
              </p>
              
              <ul className="space-y-3 mb-6">
                {[
                  "Subject line and call-to-action suggestions",
                  "Personalization placeholders like {{firstName}}",
                  "Editable, review-before-you-send drafts",
                  "Automated follow-up sequence generation"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-700 text-sm font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-4">
                <Button 
                  size="lg" 
                  className="rounded-full bg-zinc-900 text-white hover:bg-black font-bold transition-all text-sm shadow-md"
                  onClick={() => setActiveIdx((prev) => (prev + 1) % PROMPTS.length)}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Another Prompt
                </Button>
              </div>
            </FadeIn>
          </div>

          {/* Interactive AI Screen Simulator */}
          <SlideUp yOffset={40} className="relative">
            <div className="rounded-2xl border border-zinc-200/40 bg-white/80 backdrop-blur-xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
              
              {/* Card Header Controls */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">AI Email Editor</span>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-2">Prompt Input</label>
                <div className="relative">
                  <div className="w-full bg-zinc-50 border border-zinc-200/60 rounded-lg px-4 py-3 text-zinc-800 text-xs md:text-sm font-semibold min-h-[50px] flex items-center">
                    {typingText}
                    <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Generation Status */}
                <AnimatePresence mode="wait">
                  {isGenerating && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex gap-2 items-center text-xs text-primary font-bold mb-2 animate-pulse"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> AI is generating custom templates...
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Generated Output */}
                <div className="bg-zinc-50 rounded-lg p-5 border border-zinc-200/60 relative min-h-[220px] flex flex-col justify-center">
                  {showResult ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full text-left"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-zinc-850">
                          <strong>Subject:</strong> {OUTPUTS[activeIdx].subject}
                        </p>
                        <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Ready
                        </span>
                      </div>
                      <div className="w-full h-px bg-zinc-200/60 mb-3" />
                      <p className="text-xs text-zinc-650 leading-relaxed whitespace-pre-line">
                        {OUTPUTS[activeIdx].body}
                      </p>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-400 gap-2">
                      <Sparkles className="w-8 h-8 opacity-40" />
                      <p className="text-xs font-semibold">Waiting for prompt input...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SlideUp>
        </div>
      </Container>
    </section>
  );
}

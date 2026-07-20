"use client";

import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/animations/fade-in";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "Connecting several sending accounts and setting per-account limits made managing our campaigns far easier. Setup was quick and the dashboard is clear.",
    author: "Rohan Sharma",
    title: "Marketing Manager",
    company: "B2B SaaS Startup",
  },
  {
    quote: "The open and click tracking gives us a clear view of how each campaign performs, so we can iterate on subject lines and content with confidence.",
    author: "Neha Gupta",
    title: "Growth Lead",
    company: "Digital Marketing Agency",
  },
  {
    quote: "Importing our contact lists from CSV and mapping custom fields used to take hours. Now it's a simple few-minute upload.",
    author: "Amit Patel",
    title: "Head of Sales",
    company: "IT Services Company",
  },
  {
    quote: "The AI assistant helps us draft first-draft email copy and follow-up sequences quickly, which we then review and personalize before sending.",
    author: "Ananya Iyer",
    title: "Community & Growth Lead",
    company: "Early-Stage Startup",
  },
  {
    quote: "The drag-and-drop template builder combined with multi-account sending makes running our email campaigns straightforward and reliable.",
    author: "Siddharth Verma",
    title: "Co-Founder",
    company: "Consulting Firm",
  },
  {
    quote: "Intuitive setup, clear analytics, and dependable delivery. It has saved our team a lot of manual work each week.",
    author: "Priya Nair",
    title: "Email Marketing Lead",
    company: "E-commerce Business",
  }
];

// Duplicate list for seamless infinite marquee loop
const SCROLLING_TESTIMONIALS = [...TESTIMONIALS, ...TESTIMONIALS];

export function TestimonialsSection() {
  return (
    <section className="pt-12 pb-24 bg-transparent relative z-10 overflow-hidden">
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee-scroll {
          animation: marquee 35s linear infinite;
        }
        .animate-marquee-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="border-t border-zinc-200/60 mb-12 w-full" />
      
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-10">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-zinc-100 border border-zinc-200/80 text-primary">
              Success Stories
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4">
              Loved by growing teams
            </h2>
            <p className="text-sm md:text-base text-zinc-500">
              See how businesses and marketing teams use PrimeInbox to run better email campaigns.
            </p>
          </FadeIn>
        </div>
      </Container>

      {/* Infinite Horizontal Marquee Container */}
      <div className="relative w-full max-w-[100vw] overflow-x-hidden py-4">
        {/* Soft edge masking for professional look */}
        <div className="absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-zinc-50 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-zinc-50 to-transparent z-20 pointer-events-none" />

        {/* Scrolling track */}
        <div className="flex w-max animate-marquee-scroll gap-4 px-4">
          {SCROLLING_TESTIMONIALS.map((testimonial, i) => (
            <div 
              key={i} 
              className="w-[280px] sm:w-[360px] bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200/50 hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between shrink-0 group relative hover:scale-[1.01]"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none rounded-2xl" />
              
              <div>
                <div className="flex gap-1 mb-4.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-3.5 h-3.5 fill-current text-amber-500 group-hover:scale-110 transition-transform duration-300" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-zinc-650 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
              </div>
              
              <div className="flex items-center gap-3.5 pt-4 border-t border-zinc-100">
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs shadow-sm">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 text-xs sm:text-sm">{testimonial.author}</h4>
                  <p className="text-[10px] sm:text-xs text-zinc-400 font-semibold">{testimonial.title}, {testimonial.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

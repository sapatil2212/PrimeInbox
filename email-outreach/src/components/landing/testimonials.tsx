"use client";

import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/animations/fade-in";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "SMTP rotation completely resolved our daily rate-limiting issues. We successfully reached 1,200+ event contributors without a single domain block.",
    author: "Rohan Sharma",
    title: "Developer Relations Manager",
    company: "Appsmith",
  },
  {
    quote: "Our email open rates leaped from 22% to 68% in just two campaigns. The reputation monitor gave us real-time alerts before any drop occurred.",
    author: "Neha Gupta",
    title: "Growth Lead",
    company: "SigNoz",
  },
  {
    quote: "Building personalized sequence pipelines for GitHub contributors used to take hours. Now it's a seamless 5-minute CSV import.",
    author: "Amit Patel",
    title: "Head of Developer Relations",
    company: "Devtron",
  },
  {
    quote: "PrimeInbox is a game-changer for open-source adoption. We map GitHub stargazers directly to custom personalized sequences.",
    author: "Ananya Iyer",
    title: "Community & Growth Lead",
    company: "Plane",
  },
  {
    quote: "The HTML template rendering combined with automatic SMTP rotation makes our cold developer outreach incredibly robust.",
    author: "Siddharth Verma",
    title: "Co-Founder",
    company: "Hasura",
  },
  {
    quote: "Super intuitive setup, clear analytics, and excellent deliverability results. It has saved our growth engineering team countess dev hours.",
    author: "Priya Nair",
    title: "Developer Marketing Lead",
    company: "Razorpay",
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
              Loved by DevRel leaders
            </h2>
            <p className="text-sm md:text-base text-zinc-500">
              See how developer relations and growth engineering teams use PrimeInbox to grow pipelines.
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

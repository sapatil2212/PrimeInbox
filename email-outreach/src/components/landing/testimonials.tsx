"use client";

import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/animations/fade-in";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "PrimeInbox fundamentally transformed how we approach DevRel. Our pipeline has never looked healthier.",
    author: "Sarah Jenkins",
    title: "VP of Developer Relations",
    company: "Sourcegraph",
  },
  {
    quote: "The AI email generator alone saves our team 15 hours a week. The deliverability is just the cherry on top.",
    author: "David Chen",
    title: "Head of Growth",
    company: "Twilio",
  },
  {
    quote: "Finally, a tool that understands the nuances of developer outreach. No more getting stuck in spam filters.",
    author: "Elena Rodriguez",
    title: "Developer Advocate",
    company: "Hedera",
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-28 bg-transparent relative z-10">
      <div className="border-t border-zinc-200/60 mb-24 w-full" />
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-20">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="bg-white p-8 rounded-2xl border border-zinc-200/50 hover:border-zinc-300 transition-all flex flex-col justify-between h-full group relative shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none rounded-2xl" />
                
                <div>
                  <div className="flex gap-1.5 mb-6 text-yellow-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-current text-amber-500 group-hover:scale-110 transition-transform duration-300" />
                    ))}
                  </div>
                  <p className="text-sm md:text-base text-zinc-700 mb-8 leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>
                </div>
                
                <div className="flex items-center gap-4 pt-4 border-t border-zinc-100">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm shadow-sm">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 text-sm">{testimonial.author}</h4>
                    <p className="text-xs text-zinc-500">{testimonial.title}, {testimonial.company}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Container>
    </section>
  );
}

"use client";

import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/animations/fade-in";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    question: "How does the AI email generator work?",
    answer: "Our AI is trained on millions of highly converting developer relations and cold outreach emails. It takes your target developer profile, product details, and prompt to construct sequences that follow proven technical copywriting frameworks. You can adjust tone, technical depth, and call-to-actions.",
  },
  {
    question: "What is SMTP rotation and why do I need it?",
    answer: "Sending high volume from a single domain or IP causes spam filters to block you. SMTP rotation cycles your outbound emails through multiple sending accounts, maintaining perfect sender reputation and deliverability.",
  },
  {
    question: "Can I connect my own email domains?",
    answer: "Yes, you can integrate Google Workspace, Microsoft 365, or custom SMTP/IMAP servers. We recommend routing through 3-5 domains for optimal anti-ban rotation.",
  },
  {
    question: "Do you provide prospect developer leads?",
    answer: "No, PrimeInbox is a pipeline execution engine. You import your developer targets via CSV or webhooks (like star event triggers or community registers), and we execute the sequence paths.",
  },
  {
    question: "What happens when a prospect developer replies?",
    answer: "When a reply is detected, our sentiment analyzer classifies the response, pauses the sequence for that user, and lists the thread in your inbox for manual follow-up.",
  }
];

export function FaqSection() {
  return (
    <section className="py-28 bg-transparent relative z-10">
      <Container className="max-w-4xl">
        <div className="text-center mb-20">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-zinc-100 border border-zinc-200/80 text-primary">
              Support Center
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4">
              Frequently asked questions
            </h2>
            <p className="text-sm md:text-base text-zinc-500 font-semibold">
              Clear, transparent answers to help you configure your DevRel campaign channels.
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          <div className="bg-white border border-zinc-200/60 p-6 md:p-8 rounded-2xl shadow-sm">
            <Accordion className="w-full space-y-2">
              {FAQS.map((faq, i) => (
                <AccordionItem 
                  key={i} 
                  value={`item-${i}`}
                  className="border-b border-zinc-100 last:border-b-0 py-2"
                >
                  <AccordionTrigger className="text-left text-sm md:text-base font-bold text-zinc-900 hover:text-primary transition-colors py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs md:text-sm text-zinc-500 leading-relaxed font-semibold pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}

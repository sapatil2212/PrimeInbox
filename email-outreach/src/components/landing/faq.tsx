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
    answer: "PrimeInbox uses advanced AI to help you draft email copy. You provide a short prompt along with your company and recipient context, and the assistant generates subject lines, call-to-actions, and multi-step sequences with personalization placeholders. You can review and edit everything before sending.",
  },
  {
    question: "What is multi-account sending and why is it useful?",
    answer: "PrimeInbox lets you connect more than one sending account and distribute your campaign volume across them, with configurable daily and hourly limits per account. Spreading volume helps you manage sender reputation and keep deliverability healthy.",
  },
  {
    question: "Can I connect my own email accounts?",
    answer: "Yes. You can connect your own SMTP accounts — such as Google Workspace, Microsoft 365, or any custom SMTP provider — and PrimeInbox sends through the accounts you configure. Your credentials are stored encrypted.",
  },
  {
    question: "Do you provide contact lists?",
    answer: "No. PrimeInbox is a campaign execution platform. You import your own contacts via CSV, Excel, PDF, or Word files, and you are responsible for having permission to email them. We then run your configured campaign sequences.",
  },
  {
    question: "How do you handle unsubscribes?",
    answer: "Every email can include a one-click unsubscribe link. When a recipient unsubscribes, or an address hard-bounces, PrimeInbox adds it to your suppression list automatically so it is never contacted again.",
  }
];

export function FaqSection() {
  return (
    <section className="py-16 bg-transparent relative z-10">
      <Container className="max-w-4xl">
        <div className="text-center mb-12">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-zinc-100 border border-zinc-200/80 text-primary">
              Support Center
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4">
              Frequently asked questions
            </h2>
            <p className="text-sm md:text-base text-zinc-500">
              Clear, transparent answers to help you set up and run your email campaigns.
            </p>
          </FadeIn>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion className="w-full">
            {FAQS.map((faq, i) => (
              <FadeIn key={i} delay={0.1 + i * 0.1}>
                <AccordionItem 
                  value={`item-${i}`}
                  className={`border-b border-zinc-200 ${i === FAQS.length - 1 ? "border-b-0" : ""}`}
                >
                  <AccordionTrigger className="text-left text-base md:text-lg font-bold text-zinc-900 hover:text-primary transition-colors py-6 hover:no-underline [&[data-state=open]]:text-primary group">
                    <span className="group-hover:translate-x-2 transition-transform duration-300">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm md:text-base text-zinc-500 leading-relaxed font-medium pb-6 pl-2">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </FadeIn>
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  );
}

"use client";

import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/animations/fade-in";
import { motion } from "framer-motion";

const COMPANIES = [
  { name: "SaaS Startups", id: "saas" },
  { name: "Marketing Agencies", id: "agencies" },
  { name: "Sales Teams", id: "sales" },
  { name: "Consultants", id: "consultants" },
  { name: "E-commerce Brands", id: "ecommerce" },
  { name: "IT Service Providers", id: "it-services" },
  { name: "Recruiters", id: "recruiters" },
  { name: "Small Businesses", id: "smb" },
];

export function TrustedCompanies() {
  // Duplicate list to create a seamless infinite loop
  const marqueeItems = [...COMPANIES, ...COMPANIES];

  return (
    <section className="py-10 bg-transparent relative overflow-hidden z-10">
      <Container>
        <FadeIn>
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-8">
            Built for businesses of every kind
          </p>
        </FadeIn>
      </Container>

      {/* Marquee Wrapper with fading mask edge lines */}
      <div className="relative flex max-w-full overflow-x-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
        <motion.div
          animate={{ x: [0, "-50%"] }}
          transition={{
            ease: "linear",
            duration: 25,
            repeat: Infinity,
          }}
          className="flex gap-16 shrink-0 pr-16"
        >
          {marqueeItems.map((company, i) => (
            <div
              key={`${company.id}-${i}`}
              className="flex items-center justify-center text-sm md:text-base font-bold tracking-tight text-zinc-400 hover:text-zinc-900 transition-all cursor-default select-none py-1"
            >
              {/* Subtle Tech Icon Dot */}
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mr-2.5 inline-block" />
              {company.name}
            </div>
          ))}
        </motion.div>
      </div>
      <div className="border-b border-white/[0.04] mt-10 w-full" />
    </section>
  );
}

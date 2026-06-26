import { Navbar } from "@/components/layout/navbar";
import { HeroSection } from "@/components/landing/hero";
import dynamic from "next/dynamic";

// Lazy-load below-the-fold sections for instant initial paint
const FeaturesSection = dynamic(
  () => import("@/components/landing/features").then((m) => m.FeaturesSection),
  { ssr: true }
);
const AISection = dynamic(
  () => import("@/components/landing/ai-section").then((m) => m.AISection),
  { ssr: true }
);
const SmtpRotation = dynamic(
  () => import("@/components/landing/smtp-rotation").then((m) => m.SmtpRotation),
  { ssr: true }
);
const CampaignBuilder = dynamic(
  () =>
    import("@/components/landing/campaign-builder").then(
      (m) => m.CampaignBuilder
    ),
  { ssr: true }
);
const AnalyticsSection = dynamic(
  () =>
    import("@/components/landing/analytics").then((m) => m.AnalyticsSection),
  { ssr: true }
);
const PricingSection = dynamic(
  () => import("@/components/landing/pricing").then((m) => m.PricingSection),
  { ssr: true }
);
const TestimonialsSection = dynamic(
  () =>
    import("@/components/landing/testimonials").then(
      (m) => m.TestimonialsSection
    ),
  { ssr: true }
);
const FaqSection = dynamic(
  () => import("@/components/landing/faq").then((m) => m.FaqSection),
  { ssr: true }
);
const CtaSection = dynamic(
  () => import("@/components/landing/cta").then((m) => m.CtaSection),
  { ssr: true }
);
const Footer = dynamic(
  () => import("@/components/layout/footer").then((m) => m.Footer),
  { ssr: true }
);

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <AISection />
      <SmtpRotation />
      <CampaignBuilder />
      <AnalyticsSection />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </main>
  );
}

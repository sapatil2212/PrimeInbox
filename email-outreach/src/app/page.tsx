import { Navbar } from "@/components/layout/navbar";
import { AnnouncementBar } from "@/components/landing/announcement-bar";
import { HeroSection } from "@/components/landing/hero";
import { FeaturesSection } from "@/components/landing/features";
import { AISection } from "@/components/landing/ai-section";
import { SmtpRotation } from "@/components/landing/smtp-rotation";
import { CampaignBuilder } from "@/components/landing/campaign-builder";
import { AnalyticsSection } from "@/components/landing/analytics";
import { PricingSection } from "@/components/landing/pricing";
import { TestimonialsSection } from "@/components/landing/testimonials";
import { FaqSection } from "@/components/landing/faq";
import { CtaSection } from "@/components/landing/cta";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <AnnouncementBar />
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

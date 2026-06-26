import { Navbar } from "@/components/layout/navbar";
import { AnnouncementBar } from "@/components/landing/announcement-bar";
import { PricingSection } from "@/components/landing/pricing";
import { FaqSection } from "@/components/landing/faq";
import { Footer } from "@/components/layout/footer";

export default function PricingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Navbar />
      <div className="pt-16">
        <PricingSection />
        <FaqSection />
      </div>
      <Footer />
    </main>
  );
}

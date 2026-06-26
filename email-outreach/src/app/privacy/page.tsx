"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-32 pb-16 relative z-10">
        <Container className="max-w-4xl">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950">Privacy Policy</h1>
              <p className="text-sm font-semibold text-zinc-500">Last updated: June 25, 2026</p>
            </div>
            
            <div className="prose prose-zinc max-w-none text-zinc-650 space-y-6 text-sm md:text-base leading-relaxed">
              <p>
                At PrimeInbox, we take your privacy seriously. This Privacy Policy describes how we collect, use, disclose, and protect your information when you use our AI-powered email outreach platform.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us when creating an account, setting up workspaces, configuring SMTP details, or contacting customer support. This may include your name, business email, company details, billing info, and credentials needed for outreach accounts.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">2. How We Use Your Information</h2>
              <p>
                We use the information we collect to operate, maintain, and improve our services, including personalization of AI outreach copy, sending emails on your behalf based on your triggers, managing billing, and analyzing general metrics to optimize delivery.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">3. Cookie Policy & Tracking</h2>
              <p>
                We use cookies and other tracking technologies to enhance user session authentication, remember preferences, and analyze usage statistics. You can control cookie settings through our consent banner or via your browser settings.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">4. Sharing & Data Protection</h2>
              <p>
                We do not sell your personal data. We only share information with third-party service providers (like payment processors or server infrastructure) to help run the service. We implement strict security measures to protect your credentials, tokens, and data from unauthorized access.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">5. Your Data Rights</h2>
              <p>
                Depending on your location (e.g. European Union GDPR), you may have rights to access, correct, delete, or limit the processing of your personal information. You can request these actions at any time by contacting our support.
              </p>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

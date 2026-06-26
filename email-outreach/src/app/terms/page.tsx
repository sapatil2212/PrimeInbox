"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-32 pb-16 relative z-10">
        <Container className="max-w-4xl">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950">Terms of Service</h1>
              <p className="text-sm font-semibold text-zinc-500">Last updated: June 25, 2026</p>
            </div>
            
            <div className="prose prose-zinc max-w-none text-zinc-650 space-y-6 text-sm md:text-base leading-relaxed">
              <p>
                Welcome to PrimeInbox ("we," "our," or "us"). By accessing or using our website, services, and software provided on or in connection with the service, you signify that you have read, understood, and agree to be bound by these Terms of Service.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">1. Use of Our Service</h2>
              <p>
                PrimeInbox provides an AI-powered email outreach automation SaaS platform. You agree to use the service in compliance with all applicable laws, rules, and regulations (including but not limited to CAN-SPAM, GDPR, and other email compliance guidelines).
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">2. Account Registration</h2>
              <p>
                To access certain features of the service, you must register for an account. When you register, you agree to provide accurate, current, and complete information, and you agree to maintain the security of your password and accept all risks of unauthorized access to your account.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">3. 14-Day Free Trial</h2>
              <p>
                We offer a 14-day free trial for new users. After the trial period expires, your account will be limited unless you purchase a subscription plan. You may cancel your trial at any time.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">4. Acceptable Email Sending & Compliance</h2>
              <p>
                You represent and warrant that you will not use PrimeInbox to send spam or unsolicited bulk email. You must provide a valid physical mailing address and an unsubscribe option in all emails sent via our service.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">5. Limitation of Liability</h2>
              <p>
                In no event shall PrimeInbox, its directors, employees, partners, or agents, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

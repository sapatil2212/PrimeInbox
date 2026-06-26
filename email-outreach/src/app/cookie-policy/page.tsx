"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";

export default function CookiePolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-32 pb-16 relative z-10">
        <Container className="max-w-4xl">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950">Cookie Policy</h1>
              <p className="text-sm font-semibold text-zinc-500">Last updated: June 25, 2026</p>
            </div>
            
            <div className="prose prose-zinc max-w-none text-zinc-650 space-y-6 text-sm md:text-base leading-relaxed">
              <p>
                This Cookie Policy explains how PrimeInbox ("we," "our," or "us") uses cookies and similar technologies to recognize you when you visit our website or use our outreach platform.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">1. What are Cookies?</h2>
              <p>
                Cookies are small data files placed on your computer or mobile device when you visit a website. They are widely used by website owners to make websites work, or work more efficiently, as well as to provide reporting information.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">2. Types of Cookies We Use</h2>
              <p>
                We use three main categories of cookies on our site:
              </p>
              <ul className="list-disc pl-6 space-y-2 font-semibold">
                <li>
                  <span className="text-zinc-900">Strictly Necessary Cookies:</span> These cookies are essential to provide you with services available through our site, such as user login, session management, security, and CSRF protection.
                </li>
                <li>
                  <span className="text-zinc-900">Analytics Cookies:</span> These cookies collect information used to help us understand how our website is being accessed and used, measuring site performance and visitor interactions.
                </li>
                <li>
                  <span className="text-zinc-900">Marketing Cookies:</span> These cookies are used to track advertising performance and show relevant marketing content tailored to your preferences.
                </li>
              </ul>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">3. Managing Your Cookie Choices</h2>
              <p>
                You have the right to decide whether to accept or reject non-essential cookies. You can manage your preferences at any time by clicking the "Customize" button on our cookie consent banner, or by configuring your web browser to delete or refuse cookies.
              </p>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

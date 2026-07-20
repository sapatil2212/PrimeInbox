"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";

export default function RefundPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-32 pb-16 relative z-10">
        <Container className="max-w-4xl">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950">Refund & Cancellation Policy</h1>
              <p className="text-sm font-semibold text-zinc-500">Last updated: June 25, 2026</p>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                A PRODUCT OF BRIGHTWAVE DIGITAL PRODUCTS LLP.
              </p>
            </div>
            
            <div className="prose prose-zinc max-w-none text-zinc-650 space-y-6 text-sm md:text-base leading-relaxed">
              <p>
                At PrimeInbox, we want you to be completely satisfied with our platform. This Refund & Cancellation Policy explains the rules and terms regarding the cancellation of your subscription and eligibility for refunds.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">1. Subscription Cancellation</h2>
              <p>
                You can cancel your PrimeInbox subscription at any time directly through your account dashboard in the Billing section. Upon cancellation, your subscription will remain active until the end of your current billing period, after which it will not renew. No further automatic charges will occur.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">2. 14-Day Free Trial</h2>
              <p>
                We offer a 14-day free trial for new users to test the full range of features of PrimeInbox. If you cancel your subscription during this 14-day trial period, you will not be charged. 
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">3. Refund Eligibility</h2>
              <p>
                As a general rule, all fees paid for PrimeInbox subscriptions are non-refundable. This is because system resources, warmups, and AI tokens are provisioned instantly to your account. However, we consider refund requests on a case-by-case basis under the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 font-semibold">
                <li>
                  <span className="text-zinc-900">Technical Issues:</span> If you experience a persistent technical failure that prevents you from using our service, and our support team cannot resolve it within 7 business days of notification.
                </li>
                <li>
                  <span className="text-zinc-900">Accidental Renewal:</span> If you intended to cancel before renewal but forgot, and submit a refund request within 48 hours of the renewal charge (provided you have not used the service or sent any emails during that billing cycle).
                </li>
              </ul>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">4. Processing Refunds</h2>
              <p>
                Approved refunds will be processed back to the original payment method used during the purchase. Please allow 5 to 10 business days for the refund amount to show up on your credit card statement or bank account.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">5. Contact Support</h2>
              <p>
                If you have any questions about cancellation or if you believe you qualify for a refund, please contact our support team at <a href="mailto:contact.primeinbox@gmail.com" className="text-primary hover:underline font-bold">contact.primeinbox@gmail.com</a>.
              </p>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

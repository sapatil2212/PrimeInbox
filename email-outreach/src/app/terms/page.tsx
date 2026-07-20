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
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950">Terms &amp; Conditions</h1>
              <p className="text-sm font-semibold text-zinc-500">
                Effective Date: July 1, 2026 · Last Updated: July 1, 2026
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                A PRODUCT OF BRIGHTWAVE DIGITAL PRODUCTS LLP.
              </p>
            </div>

            <div className="prose prose-zinc max-w-none text-zinc-650 space-y-6 text-sm md:text-base leading-relaxed">
              <p>
                Welcome to PrimeInbox (&quot;PrimeInbox&quot;, &quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, or
                &quot;us&quot;). These Terms &amp; Conditions (&quot;Terms&quot;) govern your access to and use of the
                PrimeInbox website, software, APIs, applications, and related services (collectively referred to as the
                &quot;Platform&quot;).
              </p>
              <p>
                By registering an account or using PrimeInbox, you acknowledge that you have read, understood, and agree
                to be bound by these Terms.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">1. About PrimeInbox</h2>
              <p>
                PrimeInbox is an AI-powered Software-as-a-Service (SaaS) platform, operated by Brightwave Digital Products
                LLP, designed to help businesses streamline email campaigns and sales engagement. Our platform provides
                features including:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>AI Email Generation</li>
                <li>Email Campaigns</li>
                <li>Email Personalization</li>
                <li>Automated Follow-ups</li>
                <li>Lead Management (CRM)</li>
                <li>Team Collaboration</li>
                <li>SMTP Account Management</li>
                <li>Email Tracking (Opens &amp; Clicks)</li>
                <li>Campaign Analytics</li>
                <li>Contact Import &amp; Management</li>
              </ul>
              <p>
                PrimeInbox is a technology platform and does not guarantee business results, email deliverability, or
                sales outcomes.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">2. Eligibility</h2>
              <p>To use PrimeInbox, you must:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Be at least 18 years of age.</li>
                <li>Have the legal capacity to enter into a binding agreement.</li>
                <li>Provide accurate and complete registration information.</li>
                <li>Maintain updated account information.</li>
              </ul>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">3. Account Registration</h2>
              <p>To access the Platform, users must create an account. You agree to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide accurate registration details.</li>
                <li>Keep your login credentials secure.</li>
                <li>Maintain confidentiality of your password.</li>
                <li>Notify us immediately of unauthorized account access.</li>
              </ul>
              <p>You are responsible for all activities that occur under your account.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">4. Free Trial</h2>
              <p>
                PrimeInbox offers a 14-day free trial for all new users. During the trial period, users can evaluate
                eligible platform features before purchasing a subscription. PrimeInbox reserves the right to modify,
                suspend, or discontinue the free trial at any time without prior notice.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">5. Subscription Plans</h2>
              <p>PrimeInbox offers subscription-based services, including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Monthly Plans</li>
                <li>Quarterly Plans</li>
                <li>Annual Plans</li>
                <li>Team Plans</li>
                <li>Enterprise Plans</li>
              </ul>
              <p>Features available depend on the selected subscription.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">6. Payments</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Subscription fees are billed according to the selected plan.</li>
                <li>Payments are securely processed through authorized third-party payment gateways.</li>
                <li>Applicable taxes may be charged as required by law.</li>
                <li>Failure to complete payment may result in suspension or termination of premium services.</li>
              </ul>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">7. Automatic Renewal</h2>
              <p>
                Where applicable, subscriptions may automatically renew at the end of each billing cycle. Users may
                disable automatic renewal before the next billing date through their account settings or by contacting
                support.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">8. User Responsibilities</h2>
              <p>Users agree to use PrimeInbox responsibly and lawfully. Users are solely responsible for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Email content.</li>
                <li>Lead lists.</li>
                <li>Recipient information.</li>
                <li>Campaign scheduling.</li>
                <li>SMTP configuration.</li>
                <li>Compliance with applicable laws.</li>
              </ul>
              <p>PrimeInbox does not review or approve campaign content before it is sent.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">9. Email Compliance</h2>
              <p>
                Users are responsible for complying with all applicable email marketing, privacy, and anti-spam laws in
                the jurisdictions where they operate. Users agree not to use PrimeInbox to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Send unsolicited bulk email.</li>
                <li>Send phishing emails.</li>
                <li>Distribute malware.</li>
                <li>Promote illegal products or services.</li>
                <li>Engage in fraudulent activity.</li>
                <li>Violate recipient privacy rights.</li>
              </ul>
              <p>
                PrimeInbox reserves the right to suspend or terminate accounts engaged in abusive or unlawful email
                practices.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">10. AI Features</h2>
              <p>PrimeInbox provides AI-powered tools to assist with:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Email writing.</li>
                <li>Subject line generation.</li>
                <li>Personalization.</li>
                <li>Content improvement.</li>
              </ul>
              <p>
                AI-generated content is provided as a suggestion only. Users remain fully responsible for reviewing,
                editing, and approving all content before sending. PrimeInbox does not guarantee the accuracy, legality,
                or effectiveness of AI-generated content.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">11. SMTP Integrations</h2>
              <p>PrimeInbox allows users to connect third-party SMTP providers. Users are responsible for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Their SMTP credentials.</li>
                <li>Email sending reputation.</li>
                <li>Domain authentication (SPF, DKIM, DMARC).</li>
                <li>Sending limits.</li>
                <li>SMTP provider compliance.</li>
              </ul>
              <p>
                PrimeInbox is not responsible for outages, restrictions, or policies imposed by third-party SMTP
                providers.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">12. Lead Data</h2>
              <p>Users retain ownership of:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Contact Lists</li>
                <li>CRM Data</li>
                <li>Email Templates</li>
                <li>Campaign Data</li>
                <li>Uploaded Files</li>
              </ul>
              <p>
                Users confirm they have the legal authority to process and use all uploaded data. PrimeInbox acts solely
                as a technology provider.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">13. Acceptable Use</h2>
              <p>Users may not:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Use PrimeInbox for unlawful activities.</li>
                <li>Circumvent platform security.</li>
                <li>Attempt unauthorized access.</li>
                <li>Reverse engineer the software.</li>
                <li>Upload malicious software.</li>
                <li>Interfere with platform performance.</li>
                <li>Abuse APIs or system resources.</li>
                <li>Misrepresent identity or impersonate others.</li>
              </ul>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">14. Intellectual Property</h2>
              <p>
                All software, branding, source code, graphics, documentation, trademarks, and platform features remain
                the exclusive property of PrimeInbox. Users may not:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Copy</li>
                <li>Modify</li>
                <li>Redistribute</li>
                <li>Reverse engineer</li>
                <li>Resell</li>
                <li>License</li>
              </ul>
              <p>any part of the Platform without prior written permission.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">15. Platform Availability</h2>
              <p>We strive to maintain reliable service availability. However, temporary interruptions may occur due to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Scheduled maintenance.</li>
                <li>Infrastructure upgrades.</li>
                <li>Network issues.</li>
                <li>Third-party service outages.</li>
                <li>Circumstances beyond our reasonable control.</li>
              </ul>
              <p>PrimeInbox does not guarantee uninterrupted availability.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">16. Limitation of Liability</h2>
              <p>To the maximum extent permitted by applicable law, PrimeInbox shall not be liable for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Loss of revenue.</li>
                <li>Lost business opportunities.</li>
                <li>Email deliverability issues.</li>
                <li>Spam filtering by recipients.</li>
                <li>Domain reputation.</li>
                <li>Data loss.</li>
                <li>Business interruption.</li>
                <li>Indirect or consequential damages.</li>
              </ul>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">17. Account Suspension</h2>
              <p>PrimeInbox reserves the right to suspend or terminate accounts that:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Violate these Terms.</li>
                <li>Abuse the Platform.</li>
                <li>Send spam or malicious emails.</li>
                <li>Engage in fraudulent activities.</li>
                <li>Fail to pay subscription fees.</li>
              </ul>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">18. Privacy</h2>
              <p>
                Your use of PrimeInbox is also governed by our{" "}
                <a href="/privacy" className="text-primary font-semibold hover:underline">Privacy Policy</a>. Users are
                encouraged to review the Privacy Policy before using the Platform.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">19. Third-Party Services</h2>
              <p>PrimeInbox may integrate with third-party providers including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>SMTP Services</li>
                <li>AI Providers</li>
                <li>Payment Gateways</li>
                <li>Cloud Infrastructure</li>
                <li>Analytics Services</li>
              </ul>
              <p>
                PrimeInbox is not responsible for the policies, availability, or performance of third-party services.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">20. Governing Law</h2>
              <p>
                These Terms shall be governed by and interpreted in accordance with the laws of India.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">21. Dispute Resolution</h2>
              <p>
                In the event of any dispute, both parties agree to first attempt resolution through mutual discussion.
                If unresolved, disputes shall be subject to the exclusive jurisdiction of the competent courts located
                in Pune, Maharashtra, India.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">22. Modifications</h2>
              <p>
                PrimeInbox may update these Terms from time to time. Revised versions will be published on this page with
                an updated effective date. Continued use of the Platform after updates constitutes acceptance of the
                revised Terms.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">23. Contact Information</h2>
              <p>For questions regarding these Terms, please contact:</p>
              <ul className="list-none pl-0 space-y-1">
                <li><strong className="text-zinc-900">PrimeInbox Support</strong></li>
                <li>Website: <a href="https://primeinbox.online" className="text-primary font-semibold hover:underline">https://primeinbox.online</a></li>
                <li>Email: <a href="mailto:contact.primeinbox@gmail.com" className="text-primary font-semibold hover:underline">contact.primeinbox@gmail.com</a></li>
                <li>Business Hours: Monday – Saturday, 9:00 AM – 6:00 PM (IST)</li>
              </ul>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">24. Entire Agreement</h2>
              <p>
                These Terms constitute the complete agreement between you and PrimeInbox regarding your use of the
                Platform and supersede all previous agreements relating to the services.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">Acceptance</h2>
              <p>
                By creating an account or using PrimeInbox, you acknowledge that you have read, understood, and agreed to
                these Terms &amp; Conditions.
              </p>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

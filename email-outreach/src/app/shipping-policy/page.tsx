"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";

export default function ShippingPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-32 pb-16 relative z-10">
        <Container className="max-w-4xl">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950">Shipping &amp; Delivery Policy</h1>
              <p className="text-sm font-semibold text-zinc-500">
                Effective Date: July 1, 2026 · Last Updated: July 1, 2026
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                A PRODUCT OF BRIGHTWAVE DIGITAL PRODUCTS LLP.
              </p>
            </div>

            <div className="prose prose-zinc max-w-none text-zinc-650 space-y-6 text-sm md:text-base leading-relaxed">
              <p>
                This Shipping &amp; Delivery Policy explains how PrimeInbox delivers its digital services after a
                successful purchase.
              </p>
              <p>
                PrimeInbox is a cloud-based Software-as-a-Service (SaaS) platform. As our services are entirely digital,
                no physical products are shipped or delivered.
              </p>
              <p>
                By purchasing a subscription or using our services, you agree to this Shipping &amp; Delivery Policy.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">1. Nature of Services</h2>
              <p>
                PrimeInbox provides cloud-based software designed for businesses to manage and automate email campaign
                activities. Our services include:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>AI Email Generation</li>
                <li>Email Campaign Management</li>
                <li>Email Personalization</li>
                <li>Automated Follow-ups</li>
                <li>Lead &amp; CRM Management</li>
                <li>SMTP Integration</li>
                <li>Email Tracking &amp; Analytics</li>
                <li>Team Collaboration</li>
                <li>Campaign Reports</li>
                <li>File &amp; Lead Imports</li>
              </ul>
              <p>Since these are digital services, there is no physical shipment involved.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">2. 14-Day Free Trial</h2>
              <p>
                Every new user receives a 14-day free trial to evaluate PrimeInbox before purchasing a subscription.
                During the trial period:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Users can explore eligible platform features.</li>
                <li>No physical product is delivered.</li>
                <li>Users may decide whether to subscribe after evaluating the platform.</li>
              </ul>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">3. Subscription Activation</h2>
              <p>Once payment is successfully processed:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your subscription is activated digitally.</li>
                <li>Premium features become available in your PrimeInbox account.</li>
                <li>Access is linked to your registered email address.</li>
              </ul>
              <p>Under normal circumstances, activation occurs within a few minutes after successful payment.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">4. Delivery Method</h2>
              <p>PrimeInbox services are delivered electronically through:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your registered PrimeInbox account</li>
                <li>Secure web browser access</li>
                <li>Supported desktop and mobile browsers</li>
                <li>Internet-connected devices</li>
              </ul>
              <p>No installation CD, hardware device, USB drive, or printed materials are shipped.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">5. Payment Confirmation</h2>
              <p>After a successful payment, you may receive:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Payment confirmation</li>
                <li>Subscription activation confirmation</li>
                <li>Invoice or payment receipt</li>
                <li>Welcome email</li>
                <li>Trial or subscription status notification</li>
              </ul>
              <p>These communications are sent to your registered email address.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">6. Delivery Timeline</h2>
              <p>Typical delivery times are:</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-zinc-300">
                      <th className="py-2 pr-4 font-bold text-zinc-900">Service</th>
                      <th className="py-2 font-bold text-zinc-900">Delivery Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-200">
                      <td className="py-2 pr-4">Account Registration</td>
                      <td className="py-2">Immediate</td>
                    </tr>
                    <tr className="border-b border-zinc-200">
                      <td className="py-2 pr-4">Free Trial Activation</td>
                      <td className="py-2">Immediate</td>
                    </tr>
                    <tr className="border-b border-zinc-200">
                      <td className="py-2 pr-4">Paid Subscription Activation</td>
                      <td className="py-2">Within a few minutes</td>
                    </tr>
                    <tr className="border-b border-zinc-200">
                      <td className="py-2 pr-4">Subscription Renewal</td>
                      <td className="py-2">Automatic after successful payment</td>
                    </tr>
                    <tr className="border-b border-zinc-200">
                      <td className="py-2 pr-4">Enterprise Setup</td>
                      <td className="py-2">Within 1–2 business days (if additional configuration is required)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                In exceptional cases involving payment verification or technical issues, activation may take up to 24
                hours.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">7. Delayed Activation</h2>
              <p>Service activation may be delayed due to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Payment gateway verification</li>
                <li>Banking delays</li>
                <li>Incorrect registration details</li>
                <li>Technical maintenance</li>
                <li>Network interruptions</li>
                <li>Third-party infrastructure issues</li>
              </ul>
              <p>
                If your subscription is not activated within 24 hours after successful payment, please contact our
                support team.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">8. Customer Responsibilities</h2>
              <p>Customers are responsible for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Providing a valid email address.</li>
                <li>Providing accurate registration details.</li>
                <li>Maintaining internet connectivity.</li>
                <li>Using a supported web browser.</li>
                <li>Keeping login credentials secure.</li>
              </ul>
              <p>
                PrimeInbox is not responsible for delays caused by incorrect information provided by the customer.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">9. Platform Availability</h2>
              <p>
                PrimeInbox is a cloud-hosted platform intended to be available 24 hours a day, 7 days a week. Temporary
                interruptions may occur due to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Scheduled maintenance</li>
                <li>Infrastructure upgrades</li>
                <li>Security updates</li>
                <li>Emergency maintenance</li>
                <li>Circumstances beyond our reasonable control</li>
              </ul>
              <p>Whenever possible, planned maintenance will be communicated in advance.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">10. Failed Activation</h2>
              <p>If payment has been completed but your subscription is not activated:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Wait a few minutes and refresh your dashboard.</li>
                <li>Check your email for activation confirmation.</li>
                <li>Verify that payment was successful.</li>
                <li>Contact our support team with your transaction details.</li>
              </ul>
              <p>
                We will investigate the issue and activate your subscription promptly if payment has been successfully
                received.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">11. Geographic Availability</h2>
              <p>
                PrimeInbox is accessible globally wherever internet connectivity is available. However, certain features,
                payment methods, or third-party integrations may vary depending on regional availability, local
                regulations, or service provider restrictions.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">12. No Physical Shipping</h2>
              <p>PrimeInbox does not sell or deliver any physical products. Accordingly:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>No courier services are used.</li>
                <li>No shipping charges apply.</li>
                <li>No tracking numbers are generated.</li>
                <li>No physical delivery timelines apply.</li>
              </ul>
              <p>All services are delivered digitally through your PrimeInbox account.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">13. Policy Updates</h2>
              <p>
                PrimeInbox may update this Shipping &amp; Delivery Policy from time to time to reflect changes in our
                services or legal requirements. Updated versions will be published on this page with the revised
                effective date.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">14. Contact Us</h2>
              <p>
                If you have questions regarding subscription activation or digital service delivery, please contact:
              </p>
              <ul className="list-none pl-0 space-y-1">
                <li><strong className="text-zinc-900">PrimeInbox Support</strong></li>
                <li>Website: <a href="https://primeinbox.online" className="text-primary font-semibold hover:underline">https://primeinbox.online</a></li>
                <li>Email: <a href="mailto:contact.primeinbox@gmail.com" className="text-primary font-semibold hover:underline">contact.primeinbox@gmail.com</a></li>
                <li>Business Hours: Monday – Saturday, 9:00 AM – 6:00 PM (IST)</li>
              </ul>

              <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <p className="font-bold text-zinc-900 mb-1">Digital Service Notice</p>
                <p>
                  PrimeInbox is a subscription-based cloud software platform. All products and services are delivered
                  electronically through your registered account. No physical shipment or courier delivery is involved.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

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
              <p className="text-sm font-semibold text-zinc-500">
                Effective Date: July 1, 2026 · Last Updated: July 1, 2026
              </p>
            </div>

            <div className="prose prose-zinc max-w-none text-zinc-650 space-y-6 text-sm md:text-base leading-relaxed">
              <p>
                This Cookie Policy explains how PrimeInbox (&quot;PrimeInbox&quot;, &quot;we&quot;, &quot;our&quot;, or
                &quot;us&quot;) uses cookies and similar technologies when you visit our website, web application, or use
                our services.
              </p>
              <p>
                By continuing to use PrimeInbox, you consent to our use of cookies in accordance with this Cookie Policy.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">1. What Are Cookies?</h2>
              <p>
                Cookies are small text files stored on your computer, tablet, or mobile device when you visit a website.
                Cookies help websites remember information about your visit, improve functionality, enhance security, and
                provide a better user experience.
              </p>
              <p>
                Cookies generally do not contain personally identifiable information but may be associated with your
                account when you log in.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">2. Why We Use Cookies</h2>
              <p>PrimeInbox uses cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Authenticate users after login.</li>
                <li>Maintain secure user sessions.</li>
                <li>Remember account preferences.</li>
                <li>Improve platform performance.</li>
                <li>Enhance security.</li>
                <li>Analyze website usage.</li>
                <li>Improve user experience.</li>
                <li>Store language and display preferences.</li>
                <li>Detect suspicious or fraudulent activity.</li>
              </ul>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">3. Types of Cookies We Use</h2>

              <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">Essential Cookies</h3>
              <p>
                These cookies are necessary for the proper operation of PrimeInbox. They enable features such as:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>User Authentication</li>
                <li>Secure Login</li>
                <li>Session Management</li>
                <li>Dashboard Access</li>
                <li>Account Security</li>
              </ul>
              <p>Without these cookies, many features of the platform will not function correctly.</p>

              <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">Performance Cookies</h3>
              <p>
                Performance cookies help us understand how visitors use PrimeInbox. They may collect information such as:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Pages Visited</li>
                <li>Time Spent on the Platform</li>
                <li>Feature Usage</li>
                <li>Error Reports</li>
                <li>Performance Metrics</li>
              </ul>
              <p>This information is aggregated and used solely to improve our services.</p>

              <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">Functional Cookies</h3>
              <p>Functional cookies remember your preferences, including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Language Selection</li>
                <li>Dashboard Preferences</li>
                <li>Theme Settings</li>
                <li>Saved User Preferences</li>
                <li>Notification Preferences</li>
              </ul>
              <p>These cookies enhance your experience by providing a more personalized interface.</p>

              <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">Security Cookies</h3>
              <p>Security cookies help protect both users and the PrimeInbox platform by:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Detecting suspicious login attempts.</li>
                <li>Preventing unauthorized access.</li>
                <li>Protecting active sessions.</li>
                <li>Supporting fraud prevention measures.</li>
              </ul>

              <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">Analytics Cookies</h3>
              <p>PrimeInbox may use analytics cookies to better understand:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Visitor Trends</li>
                <li>Campaign Feature Usage</li>
                <li>Browser Types</li>
                <li>Device Types</li>
                <li>Traffic Sources</li>
                <li>User Navigation Patterns</li>
              </ul>
              <p>This information helps us continuously improve our platform.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">4. Third-Party Cookies</h2>
              <p>
                PrimeInbox may integrate with trusted third-party services that use cookies to support platform
                functionality, including:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Payment Gateway Providers</li>
                <li>Analytics Services</li>
                <li>Customer Support Tools</li>
                <li>Email Delivery Services</li>
                <li>AI Service Providers</li>
                <li>Cloud Infrastructure Providers</li>
              </ul>
              <p>Each third-party provider operates under its own privacy and cookie policies.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">5. Managing Cookies</h2>
              <p>Most modern web browsers allow you to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>View stored cookies.</li>
                <li>Delete cookies.</li>
                <li>Block cookies.</li>
                <li>Configure cookie preferences.</li>
                <li>Receive notifications before cookies are stored.</li>
              </ul>
              <p>
                Please note that disabling certain cookies may affect the functionality and performance of PrimeInbox.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">6. Browser Controls</h2>
              <p>You can manage cookies through your browser settings. Popular browsers include:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Google Chrome</li>
                <li>Mozilla Firefox</li>
                <li>Microsoft Edge</li>
                <li>Safari</li>
                <li>Opera</li>
              </ul>
              <p>Refer to your browser&apos;s official documentation for instructions on managing cookies.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">7. Impact of Disabling Cookies</h2>
              <p>If cookies are disabled:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Login sessions may not persist.</li>
                <li>User preferences may not be saved.</li>
                <li>Some platform features may not function properly.</li>
                <li>Performance and usability may be affected.</li>
              </ul>
              <p>For the best experience, we recommend enabling cookies while using PrimeInbox.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">8. Similar Technologies</h2>
              <p>In addition to cookies, PrimeInbox may use similar technologies such as:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Local Storage</li>
                <li>Session Storage</li>
                <li>Browser Cache</li>
                <li>Security Tokens</li>
              </ul>
              <p>
                These technologies support secure authentication, improve performance, and enhance the overall user
                experience.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">9. Data Collected Through Cookies</h2>
              <p>Depending on your interaction with the platform, cookies may collect:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Browser Information</li>
                <li>Device Information</li>
                <li>IP Address</li>
                <li>Session Identifier</li>
                <li>Language Preferences</li>
                <li>Login Status</li>
                <li>Usage Statistics</li>
                <li>Referring Website</li>
              </ul>
              <p>This information is used only for legitimate operational, security, and analytical purposes.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">10. Changes to This Cookie Policy</h2>
              <p>
                PrimeInbox may update this Cookie Policy from time to time to reflect changes in technology, legal
                requirements, or our services. Any changes will be posted on this page with an updated effective date.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">11. Contact Us</h2>
              <p>
                If you have any questions regarding our use of cookies or this Cookie Policy, please contact us.
              </p>
              <ul className="list-none pl-0 space-y-1">
                <li><strong className="text-zinc-900">PrimeInbox Support</strong></li>
                <li>Website: <a href="https://primeinbox.online" className="text-primary font-semibold hover:underline">https://primeinbox.online</a></li>
                <li>Email: <a href="mailto:contact.primeinbox@gmail.com" className="text-primary font-semibold hover:underline">contact.primeinbox@gmail.com</a></li>
                <li>Business Hours: Monday – Saturday, 9:00 AM – 6:00 PM (IST)</li>
              </ul>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">Consent</h2>
              <p>
                By continuing to use PrimeInbox, you acknowledge that you have read, understood, and agreed to this
                Cookie Policy and consent to our use of cookies as described herein.
              </p>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

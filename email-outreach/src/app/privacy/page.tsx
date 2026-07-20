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
              <p className="text-sm font-semibold text-zinc-500">
                Effective Date: July 1, 2026 · Last Updated: July 1, 2026
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                A PRODUCT OF BRIGHTWAVE DIGITAL PRODUCTS LLP.
              </p>
            </div>

            <div className="prose prose-zinc max-w-none text-zinc-650 space-y-6 text-sm md:text-base leading-relaxed">
              <p>
                Welcome to PrimeInbox (&quot;PrimeInbox&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). PrimeInbox is an
                AI-powered email campaign and sales engagement platform, operated by Brightwave Digital Products LLP, that
                enables businesses to manage leads, create personalized email campaigns, automate follow-ups, collaborate
                with teams, and analyze campaign performance.
              </p>
              <p>
                Your privacy is important to us. This Privacy Policy explains how we collect, use, store, process,
                and protect your information when you access our website, applications, APIs, and services
                (collectively referred to as the &quot;Platform&quot;).
              </p>
              <p>
                By using PrimeInbox, you agree to the practices described in this Privacy Policy.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">1. Information We Collect</h2>
              <p>We collect information necessary to provide, improve, and secure our services.</p>

              <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">A. Personal Information</h3>
              <p>When you create an account or subscribe to PrimeInbox, we may collect:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Full Name</li>
                <li>Email Address</li>
                <li>Mobile Number</li>
                <li>Company Name</li>
                <li>Business Address</li>
                <li>GST Number (if applicable)</li>
                <li>Profile Photo</li>
                <li>Job Title</li>
                <li>Team Information</li>
              </ul>

              <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">B. Account Information</h3>
              <p>We collect information related to your account, including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Username</li>
                <li>Encrypted Password</li>
                <li>Login Activity</li>
                <li>Subscription Details</li>
                <li>Authentication Tokens</li>
                <li>Account Preferences</li>
              </ul>
              <p>Passwords are securely hashed and are never stored in plain text.</p>

              <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">C. Lead &amp; CRM Data</h3>
              <p>
                PrimeInbox allows users to upload and manage business contacts. Depending on your usage, we may
                process:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Contact Name</li>
                <li>Company Name</li>
                <li>Business Email Address</li>
                <li>Phone Number</li>
                <li>Job Title</li>
                <li>Tags</li>
                <li>Custom Fields</li>
                <li>Campaign Assignment</li>
                <li>Notes</li>
              </ul>
              <p>
                Users remain responsible for ensuring they have the legal right to upload and process such
                information.
              </p>

              <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">D. Campaign Information</h3>
              <p>We may process campaign-related information including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Email Templates</li>
                <li>AI-Generated Content</li>
                <li>Subject Lines</li>
                <li>Personalization Variables</li>
                <li>Campaign Settings</li>
                <li>Scheduling Preferences</li>
                <li>Email Attachments</li>
                <li>Follow-up Sequences</li>
              </ul>

              <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">E. Email Tracking Data</h3>
              <p>Where enabled by the user, PrimeInbox may collect campaign analytics such as:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Email Delivery Status</li>
                <li>Email Opens</li>
                <li>Link Clicks</li>
                <li>Bounce Information</li>
                <li>Unsubscribe Requests</li>
                <li>Campaign Performance Metrics</li>
              </ul>
              <p>
                Tracking features are intended to help users measure campaign effectiveness and must be used in
                compliance with applicable laws.
              </p>

              <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">F. Payment Information</h3>
              <p>PrimeInbox does not store:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Credit Card Numbers</li>
                <li>Debit Card Numbers</li>
                <li>CVV</li>
                <li>UPI PIN</li>
                <li>Internet Banking Credentials</li>
              </ul>
              <p>Payments are securely processed through authorized third-party payment gateways.</p>
              <p>We may retain:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Transaction ID</li>
                <li>Payment Status</li>
                <li>Subscription Information</li>
                <li>Invoice Details</li>
              </ul>

              <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">G. Technical Information</h3>
              <p>When using PrimeInbox, we automatically collect:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>IP Address</li>
                <li>Browser Type</li>
                <li>Device Information</li>
                <li>Operating System</li>
                <li>Language</li>
                <li>Time Zone</li>
                <li>Session Logs</li>
                <li>Error Logs</li>
              </ul>

              <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">H. Uploaded Files</h3>
              <p>Users may upload files such as:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>CSV Lead Lists</li>
                <li>Email Attachments</li>
                <li>Company Logos</li>
                <li>Images</li>
                <li>Documents</li>
              </ul>
              <p>
                Uploaded files are stored only for providing platform functionality and remain under the
                user&apos;s control.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">2. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Create and manage your account.</li>
                <li>Provide AI-powered email campaign services.</li>
                <li>Manage campaigns.</li>
                <li>Generate personalized email content.</li>
                <li>Process subscription payments.</li>
                <li>Provide customer support.</li>
                <li>Improve platform functionality.</li>
                <li>Detect abuse or fraudulent activity.</li>
                <li>Secure our services.</li>
                <li>Comply with legal obligations.</li>
              </ul>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">3. AI-Generated Content</h2>
              <p>
                PrimeInbox provides AI-assisted features for generating email content, subject lines, and messaging
                suggestions. Users remain solely responsible for reviewing, editing, and approving AI-generated
                content before sending emails. PrimeInbox does not guarantee the accuracy, legality, or
                effectiveness of AI-generated content.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">4. Customer Data Ownership</h2>
              <p>Users retain ownership of:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Lead Lists</li>
                <li>Email Templates</li>
                <li>Campaign Data</li>
                <li>Uploaded Files</li>
                <li>Customer Information</li>
              </ul>
              <p>
                PrimeInbox acts as a technology service provider and processes such information solely for providing
                the services requested by users.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">5. Email Compliance</h2>
              <p>
                Users are responsible for ensuring that email campaigns comply with applicable laws and regulations,
                including anti-spam and privacy requirements. PrimeInbox does not send campaigns on behalf of users
                without user initiation or configuration and is not responsible for the content of campaigns created
                by users.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">6. Cookies</h2>
              <p>PrimeInbox uses cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Maintain secure login sessions</li>
                <li>Remember user preferences</li>
                <li>Improve website functionality</li>
                <li>Analyze usage</li>
                <li>Enhance platform security</li>
              </ul>
              <p>Users may manage cookie preferences through their browser settings.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">7. Data Sharing</h2>
              <p>We do not sell or rent personal information.</p>
              <p>
                Information may be shared only with trusted service providers necessary for operating the platform,
                such as:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Payment Gateway Providers</li>
                <li>Cloud Infrastructure Providers</li>
                <li>Email Delivery Services</li>
                <li>Analytics Providers</li>
                <li>Customer Support Providers</li>
                <li>Government Authorities where legally required</li>
              </ul>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">8. Data Security</h2>
              <p>We implement reasonable administrative, technical, and organizational safeguards including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>HTTPS Encryption</li>
                <li>Secure Authentication</li>
                <li>Password Hashing</li>
                <li>Access Controls</li>
                <li>Infrastructure Monitoring</li>
                <li>Database Security</li>
                <li>Regular Software Updates</li>
              </ul>
              <p>
                Although we strive to protect your information, no online platform can guarantee absolute security.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">9. Data Retention</h2>
              <p>We retain information only for as long as necessary to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide the Platform</li>
                <li>Meet contractual obligations</li>
                <li>Comply with legal requirements</li>
                <li>Resolve disputes</li>
                <li>Enforce agreements</li>
              </ul>
              <p>
                Users may request deletion of their account and associated data, subject to applicable legal and
                operational requirements.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">10. Third-Party Integrations</h2>
              <p>PrimeInbox may integrate with third-party services, including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>SMTP Providers</li>
                <li>Email Service Providers</li>
                <li>Payment Gateways</li>
                <li>Cloud Storage Services</li>
                <li>AI Service Providers</li>
                <li>Analytics Services</li>
              </ul>
              <p>Each provider operates under its own privacy policy and terms.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">11. International Data Transfers</h2>
              <p>
                If you access PrimeInbox from outside India, your information may be processed and stored in
                jurisdictions where our infrastructure or service providers operate.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">12. Children&apos;s Privacy</h2>
              <p>
                PrimeInbox is intended for business users and individuals who are at least 18 years of age. We do not
                knowingly collect personal information from children.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">13. Your Rights</h2>
              <p>Subject to applicable law, you may request to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access your personal information.</li>
                <li>Correct inaccurate information.</li>
                <li>Update account details.</li>
                <li>Export your data.</li>
                <li>Delete your account.</li>
                <li>Withdraw consent where applicable.</li>
              </ul>
              <p>Requests may be submitted using the contact details below.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">14. Policy Updates</h2>
              <p>
                PrimeInbox may update this Privacy Policy periodically. The latest version will always be published
                on this page with the revised effective date.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">15. Contact Us</h2>
              <p>
                For any questions regarding this Privacy Policy or our data handling practices, please contact:
              </p>
              <ul className="list-none pl-0 space-y-1">
                <li><strong className="text-zinc-900">PrimeInbox Support</strong></li>
                <li>Website: <a href="https://primeinbox.online" className="text-primary font-semibold hover:underline">https://primeinbox.online</a></li>
                <li>Email: <a href="mailto:contact.primeinbox@gmail.com" className="text-primary font-semibold hover:underline">contact.primeinbox@gmail.com</a></li>
                <li>Business Hours: Monday – Saturday, 9:00 AM – 6:00 PM (IST)</li>
              </ul>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">16. Consent</h2>
              <p>
                By accessing or using PrimeInbox, you acknowledge that you have read, understood, and agreed to this
                Privacy Policy.
              </p>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";

export default function SecurityPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-32 pb-16 relative z-10">
        <Container className="max-w-4xl">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950">Security Policy</h1>
              <p className="text-sm font-semibold text-zinc-500">
                Effective Date: July 1, 2026 · Last Updated: July 1, 2026
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                A PRODUCT OF BRIGHTWAVE DIGITAL PRODUCTS LLP.
              </p>
            </div>

            <div className="prose prose-zinc max-w-none text-zinc-650 space-y-6 text-sm md:text-base leading-relaxed">
              <p>
                At PrimeInbox, safeguarding our customers&apos; information is one of our highest priorities. We are
                committed to implementing appropriate technical, administrative, and organizational measures to help
                protect customer data, maintain platform reliability, and ensure secure access to our services.
              </p>
              <p>
                This Security Policy outlines the security practices followed by PrimeInbox to protect our platform and
                customer information.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">1. Our Commitment</h2>
              <p>PrimeInbox is committed to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Protecting customer information from unauthorized access.</li>
                <li>Maintaining the confidentiality of business data.</li>
                <li>Securing communication between users and our platform.</li>
                <li>Continuously improving our security practices.</li>
                <li>Monitoring and responding to security threats.</li>
              </ul>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">2. Secure Infrastructure</h2>
              <p>PrimeInbox operates on modern cloud infrastructure designed to provide:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>High availability</li>
                <li>Reliable performance</li>
                <li>Secure networking</li>
                <li>Infrastructure monitoring</li>
                <li>Regular software updates</li>
                <li>System redundancy where applicable</li>
              </ul>
              <p>Our infrastructure is maintained with security best practices to help reduce operational risks.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">3. Secure Communication</h2>
              <p>
                All communication between users and PrimeInbox is protected using HTTPS (SSL/TLS) encryption. Encrypted
                communication helps safeguard sensitive information exchanged between users and our servers from
                interception or unauthorized access.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">4. Account Security</h2>
              <p>PrimeInbox implements multiple layers of account protection, including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Secure user authentication</li>
                <li>Encrypted password storage</li>
                <li>Session management</li>
                <li>Role-based access controls</li>
                <li>Login verification mechanisms</li>
                <li>Automatic session expiration where applicable</li>
              </ul>
              <p>Users are responsible for maintaining the confidentiality of their login credentials.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">5. Password Protection</h2>
              <p>
                User passwords are never stored in plain text. Passwords are securely hashed before being stored in our
                systems. We recommend users:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Create strong, unique passwords.</li>
                <li>Avoid sharing passwords.</li>
                <li>Change passwords periodically.</li>
                <li>Report suspected unauthorized access immediately.</li>
              </ul>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">6. Data Protection</h2>
              <p>
                PrimeInbox uses reasonable technical and organizational safeguards to help protect customer information,
                including:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access controls</li>
                <li>Secure databases</li>
                <li>Encrypted communications</li>
                <li>Application-level security measures</li>
                <li>Routine software updates</li>
                <li>Security monitoring</li>
              </ul>
              <p>
                Access to customer information is restricted to authorized personnel who require it for operational
                purposes.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">7. Payment Security</h2>
              <p>PrimeInbox does not store or process sensitive payment credentials such as:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Credit Card Numbers</li>
                <li>Debit Card Numbers</li>
                <li>CVV</li>
                <li>UPI PIN</li>
                <li>Internet Banking Credentials</li>
              </ul>
              <p>Payments are processed securely through trusted third-party payment gateway providers.</p>
              <p>
                PrimeInbox may retain payment-related records such as transaction IDs, invoices, subscription status, and
                billing history for operational and legal purposes.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">8. AI Features &amp; Customer Content</h2>
              <p>
                PrimeInbox offers AI-assisted features for generating email content and campaign suggestions.
                Customer-generated content, lead data, uploaded files, and campaign information remain under the
                customer&apos;s control. AI-generated content is intended to assist users and should always be reviewed
                before being used in live campaigns.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">9. Email &amp; SMTP Security</h2>
              <p>PrimeInbox allows customers to connect third-party SMTP providers. Users are responsible for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Protecting SMTP credentials.</li>
                <li>Maintaining secure SMTP configurations.</li>
                <li>Configuring SPF, DKIM, and DMARC records where appropriate.</li>
                <li>Managing email-sending permissions.</li>
              </ul>
              <p>
                PrimeInbox does not access or disclose SMTP credentials except as necessary to provide the requested
                functionality.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">10. File Security</h2>
              <p>PrimeInbox allows users to upload files such as:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>CSV Lead Lists</li>
                <li>Images</li>
                <li>Logos</li>
                <li>Email Attachments</li>
                <li>Documents</li>
              </ul>
              <p>
                Uploaded files are stored securely for use within the platform and are accessible only to authorized
                users within the respective account or workspace.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">11. Access Control</h2>
              <p>
                PrimeInbox supports role-based access controls to help organizations manage user permissions effectively.
                Depending on assigned roles, users may be granted access to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Campaign Management</li>
                <li>CRM &amp; Leads</li>
                <li>Templates</li>
                <li>Analytics</li>
                <li>Billing</li>
                <li>Team Management</li>
                <li>Administrative Settings</li>
              </ul>
              <p>This helps ensure users only access information relevant to their responsibilities.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">12. Monitoring &amp; Maintenance</h2>
              <p>To maintain a secure and reliable platform, we perform ongoing monitoring of:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Platform availability</li>
                <li>Performance metrics</li>
                <li>Application errors</li>
                <li>Infrastructure health</li>
                <li>Security events</li>
              </ul>
              <p>Regular maintenance and updates are carried out to improve security, stability, and performance.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">13. Data Backup &amp; Recovery</h2>
              <p>
                PrimeInbox performs regular backup procedures designed to support business continuity and assist in
                recovering data in the event of unforeseen incidents. Backup and recovery processes are reviewed
                periodically to maintain operational resilience.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">14. Third-Party Services</h2>
              <p>PrimeInbox integrates with trusted third-party providers for services such as:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Payment Processing</li>
                <li>SMTP &amp; Email Delivery</li>
                <li>Cloud Hosting</li>
                <li>Artificial Intelligence Services</li>
                <li>Analytics</li>
                <li>Customer Support Tools</li>
              </ul>
              <p>Each third-party provider maintains its own security policies and practices.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">15. Security Incident Response</h2>
              <p>
                If a security incident affecting PrimeInbox is identified, we will take appropriate steps to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Investigate the issue.</li>
                <li>Contain and mitigate the impact.</li>
                <li>Restore affected services where applicable.</li>
                <li>Notify affected users when required by applicable law.</li>
                <li>Implement corrective measures to help prevent similar incidents.</li>
              </ul>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">16. User Responsibilities</h2>
              <p>Users play an important role in maintaining account security. Users should:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Keep passwords confidential.</li>
                <li>Use strong authentication credentials.</li>
                <li>Keep browsers and operating systems updated.</li>
                <li>Secure devices used to access PrimeInbox.</li>
                <li>Avoid sharing account credentials.</li>
                <li>Notify PrimeInbox immediately if suspicious activity is detected.</li>
              </ul>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">17. Platform Availability</h2>
              <p>
                PrimeInbox is designed to provide reliable access to services; however, temporary interruptions may occur
                due to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Scheduled maintenance</li>
                <li>Security updates</li>
                <li>Infrastructure upgrades</li>
                <li>Network issues</li>
                <li>Third-party service outages</li>
                <li>Circumstances beyond our reasonable control</li>
              </ul>
              <p>We work to minimize downtime and restore services as quickly as possible.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">18. Reporting Security Issues</h2>
              <p>
                If you believe you have discovered a security vulnerability or suspicious activity related to PrimeInbox,
                please contact us promptly. Please include:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Description of the issue</li>
                <li>Steps to reproduce (if applicable)</li>
                <li>Supporting screenshots or logs</li>
                <li>Contact details for follow-up</li>
              </ul>
              <p>We appreciate responsible disclosure and will investigate all legitimate security reports.</p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">19. Policy Updates</h2>
              <p>
                PrimeInbox may update this Security Policy periodically to reflect improvements in our security practices,
                operational changes, or legal requirements. The latest version will always be published on this page with
                the revised effective date.
              </p>

              <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">20. Contact Us</h2>
              <p>
                For security-related questions or to report a potential security issue, please contact:
              </p>
              <ul className="list-none pl-0 space-y-1">
                <li><strong className="text-zinc-900">PrimeInbox Security Team</strong></li>
                <li>Website: <a href="https://primeinbox.online" className="text-primary font-semibold hover:underline">https://primeinbox.online</a></li>
                <li>Email: <a href="mailto:contact.primeinbox@gmail.com" className="text-primary font-semibold hover:underline">contact.primeinbox@gmail.com</a></li>
                <li>Business Hours: Monday – Saturday, 9:00 AM – 6:00 PM (IST)</li>
              </ul>

              <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3">
                <p className="font-bold text-zinc-900">Our Security Principles</p>
                <p>At PrimeInbox, we are committed to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Protecting customer information.</li>
                  <li>Maintaining a secure and reliable platform.</li>
                  <li>Following secure software development practices.</li>
                  <li>Continuously improving our security posture.</li>
                  <li>Responding responsibly to security concerns.</li>
                  <li>Supporting safe and compliant business communication.</li>
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

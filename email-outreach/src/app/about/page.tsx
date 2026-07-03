"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { GlowCard } from "@/components/ui/glow-card";
import { SlideUp } from "@/components/animations/slide-up";
import { Shield, Rocket, Target, Sparkles, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

export default function AboutPage() {
  // Calculator State
  const [domains, setDomains] = useState(4);
  const [volume, setVolume] = useState(3000);
  const [customization, setCustomization] = useState(60); // % of personalization

  // Deliverability Calculations
  const totalVolume = domains * volume;
  
  // Calculate deliverability score based on volume per domain and customization
  // 1. High volume per domain decreases deliverability
  const volPerDomainPenalty = Math.max(0, (volume - 2000) / 150);
  // 2. High customization increases deliverability/reply rates
  const customizationBonus = (customization - 30) * 0.15;
  // 3. Too few domains for high volume increases penalty
  const domainShortagePenalty = totalVolume > 8000 && domains < 3 ? 8 : 0;

  const deliverability = Math.max(
    55,
    Math.min(99.4, 98.5 - volPerDomainPenalty + customizationBonus - domainShortagePenalty)
  );

  // Spam Risk Level
  let spamRisk = "Low";
  let riskColor = "text-emerald-500 bg-emerald-50/50 border-emerald-100";
  if (deliverability < 82) {
    spamRisk = "High Risk";
    riskColor = "text-red-500 bg-red-50/50 border-red-100";
  } else if (deliverability < 92) {
    spamRisk = "Moderate";
    riskColor = "text-amber-500 bg-amber-50/50 border-amber-100";
  }

  // Estimated Responses (Assuming average 12% baseline response on technical outreach, scaled by personalization)
  const baseReplyRate = 0.08;
  const personalizationMultiplier = customization / 50;
  const replyRate = baseReplyRate * personalizationMultiplier * (deliverability / 100);
  const estimatedReplies = Math.round(totalVolume * replyRate);

  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      
      <section className="relative pt-36 pb-24 overflow-hidden bg-transparent z-10">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <Container className="relative z-10">
          <div className="text-center mb-16">
            <SlideUp delay={0.2} yOffset={30}>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-zinc-100 border border-zinc-200/80 text-primary">
                Our Story & Vision
              </div>
              <h1 className="max-w-4xl mx-auto text-4xl md:text-5xl lg:text-6xl leading-[1.1] font-extrabold tracking-tight text-zinc-900 mb-6">
                Empowering developer platforms to grow <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-650 font-extrabold">scalable pipelines.</span>
              </h1>
            </SlideUp>

            <SlideUp delay={0.3} yOffset={20}>
              <p className="max-w-2xl mx-auto text-sm md:text-base text-zinc-500 leading-relaxed font-semibold">
                Founded in 2024, PrimeInbox was built to bridge the gap between developer relations and sales ops. We help B2B developer-first startups turn community engagement into qualified sales pipeline.
              </p>
            </SlideUp>
          </div>

          {/* Interactive Calculator Section */}
          <div className="max-w-5xl mx-auto mb-20">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 mb-2">
                Outreach Deliverability Simulator
              </h2>
              <p className="text-xs md:text-sm text-zinc-500 max-w-xl mx-auto font-medium">
                Adjust the parameters below to simulate your sending health score, deliverability risks, and reply rates using SMTP rotation.
              </p>
            </div>

            <GlowCard className="border border-zinc-200/60 overflow-hidden" glowColor="rgba(59, 130, 246, 0.04)">
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200">
                {/* Sliders Control Panel */}
                <div className="lg:col-span-7 p-6 md:p-8 space-y-6 bg-white/45">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="text-base font-bold text-zinc-900">Campaign Simulator Controls</h3>
                  </div>

                  {/* Slider 1 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-zinc-700">Sending Domains</label>
                      <span className="font-extrabold text-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{domains} domains</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={domains}
                      onChange={(e) => setDomains(Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <p className="text-[10px] text-zinc-400 font-medium">Cycling your outreach across more domains reduces single-domain footprint.</p>
                  </div>

                  {/* Slider 2 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-zinc-700">Volume per Domain / month</label>
                      <span className="font-extrabold text-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{volume.toLocaleString()} emails</span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="10000"
                      step="500"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <p className="text-[10px] text-zinc-400 font-medium">Keep daily volumes under 150 emails per domain to protect sender reputation.</p>
                  </div>

                  {/* Slider 3 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-zinc-700">AI Customization Level</label>
                      <span className="font-extrabold text-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{customization}% unique content</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={customization}
                      onChange={(e) => setCustomization(Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <p className="text-[10px] text-zinc-400 font-medium">Using templates with unique variables prevents templates from triggering spam filters.</p>
                  </div>
                </div>

                {/* Results Screen */}
                <div className="lg:col-span-5 p-6 md:p-8 flex flex-col justify-between bg-zinc-50/50">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                      <h4 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">Health Projection</h4>
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${deliverability > 90 ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${deliverability > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500">Live Simulation</span>
                      </div>
                    </div>

                    {/* Stats Layout */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Deliverability Score</p>
                        <p className="text-3xl font-extrabold text-zinc-900 mt-1">{deliverability.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Spam Risk</p>
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold mt-2 ${riskColor}`}>
                          {spamRisk}
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-zinc-200" />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Total Emails / mo</p>
                        <p className="text-lg font-bold text-zinc-800 mt-1">{totalVolume.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Est. Monthly Replies</p>
                        <p className="text-lg font-bold text-zinc-800 mt-1 flex items-center gap-1.5">
                          {estimatedReplies}
                          <span className="text-[10px] text-emerald-500 font-semibold">(~{(replyRate * 100).toFixed(1)}%)</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-3 rounded-xl border border-zinc-200/50 bg-white text-[11px] font-medium text-zinc-450 leading-relaxed flex items-start gap-2.5">
                    {deliverability > 92 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Healthy Setup!</strong> Cycling domains ensures low volume per inbox. AI customization makes filters happy and replies climb.</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span><strong>Caution:</strong> Daily volumes are too high or customization is low. Consider adding domains or generating unique sequences to improve scores.</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </GlowCard>
          </div>

          {/* Grid of Core Values */}
          <div>
            <h2 className="text-center text-xl font-bold tracking-tight text-zinc-900 mb-8">Our Core Principles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
              <GlowCard className="h-full border border-zinc-200/50" glowColor="rgba(59, 130, 246, 0.05)">
                <div className="p-8 flex flex-col h-full justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200/60 flex items-center justify-center text-primary mb-6">
                      <Target className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-zinc-900">Developer-First</h3>
                    <p className="text-xs md:text-sm text-zinc-500 leading-relaxed font-semibold">
                      We know developers hate spam. Our tools ensure you send tailored, meaningful, and context-rich messages that respect developer time.
                    </p>
                  </div>
                </div>
              </GlowCard>

              <GlowCard className="h-full border border-zinc-200/50" glowColor="rgba(6, 182, 212, 0.05)">
                <div className="p-8 flex flex-col h-full justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200/60 flex items-center justify-center text-cyan-600 mb-6">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-zinc-900">Deliverability Focus</h3>
                    <p className="text-xs md:text-sm text-zinc-500 leading-relaxed font-semibold">
                      Through advanced SMTP rotation, multi-inbox setup, and auto-warmups, we prioritize deliverability so you land in the primary inbox.
                    </p>
                  </div>
                </div>
              </GlowCard>

              <GlowCard className="h-full border border-zinc-200/50" glowColor="rgba(99, 102, 241, 0.05)">
                <div className="p-8 flex flex-col h-full justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200/60 flex items-center justify-center text-indigo-600 mb-6">
                      <Rocket className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-zinc-900">Revenue Oriented</h3>
                    <p className="text-xs md:text-sm text-zinc-500 leading-relaxed font-semibold">
                      We tie outreach to actual business metrics. Track opens, links, replies, and opportunities generated from your campaigns in real-time.
                    </p>
                  </div>
                </div>
              </GlowCard>
            </div>
          </div>
        </Container>
      </section>

      {/* About Us Content */}
      <section className="relative pb-24 z-10">
        <Container className="max-w-4xl">
          <div className="prose prose-zinc max-w-none text-zinc-650 space-y-6 text-sm md:text-base leading-relaxed">
            <div className="space-y-2 not-prose mb-4">
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950">About Us</h2>
            </div>

            <p>
              Welcome to PrimeInbox – an AI-powered Email Outreach &amp; Sales Engagement Platform built to help
              businesses connect with prospects, generate leads, and grow through smarter email communication.
            </p>
            <p>
              PrimeInbox combines artificial intelligence, automation, and modern email infrastructure into a single
              cloud-based platform that enables businesses to create personalized campaigns, automate follow-ups, manage
              leads, and analyze campaign performance with ease.
            </p>
            <p>
              Whether you&apos;re a startup, sales team, marketing agency, freelancer, consultant, or enterprise
              organization, PrimeInbox provides the tools needed to streamline outbound communication and improve
              productivity.
            </p>

            <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">Our Mission</h2>
            <p>
              Our mission is to empower businesses with intelligent, secure, and easy-to-use email outreach tools that
              simplify communication, save time, and help build meaningful business relationships.
            </p>
            <p>
              We believe technology should eliminate repetitive tasks, allowing sales and marketing teams to focus on
              building connections and closing opportunities.
            </p>

            <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">What We Offer</h2>
            <p>
              PrimeInbox provides a comprehensive suite of features designed to modernize email outreach and customer
              engagement, including:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>AI-Powered Email Writing</li>
              <li>Cold Email Campaign Management</li>
              <li>Automated Follow-up Sequences</li>
              <li>Smart Personalization</li>
              <li>Contact &amp; Lead Management (CRM)</li>
              <li>Bulk Contact Import (CSV)</li>
              <li>Email Templates</li>
              <li>Team Collaboration</li>
              <li>SMTP Integration</li>
              <li>Campaign Scheduling</li>
              <li>Open &amp; Click Tracking</li>
              <li>Campaign Analytics &amp; Reports</li>
              <li>File &amp; Attachment Management</li>
              <li>Multi-user Workspace Support</li>
            </ul>

            <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">Who Uses PrimeInbox?</h2>
            <p>
              PrimeInbox is designed for businesses and professionals who rely on email communication to generate leads,
              nurture relationships, and grow their business. Our platform is suitable for:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Sales Teams</li>
              <li>Marketing Agencies</li>
              <li>SaaS Companies</li>
              <li>Startups</li>
              <li>Small &amp; Medium Businesses (SMBs)</li>
              <li>Enterprises</li>
              <li>Freelancers</li>
              <li>Business Consultants</li>
              <li>Recruitment Agencies</li>
              <li>Real Estate Companies</li>
              <li>IT Service Providers</li>
              <li>Digital Marketing Professionals</li>
              <li>Business Development Teams</li>
              <li>B2B Organizations</li>
            </ul>

            <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">Why Choose PrimeInbox?</h2>
            <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">AI-Powered Productivity</h3>
            <p>
              Create personalized email campaigns in minutes using intelligent AI-assisted content generation and
              optimization tools.
            </p>
            <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">Smart Email Automation</h3>
            <p>
              Automate follow-ups, schedule campaigns, and reduce repetitive manual work while maintaining personalized
              communication.
            </p>
            <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">Secure Cloud Platform</h3>
            <p>
              PrimeInbox is a secure cloud-based platform accessible from anywhere, allowing users to manage campaigns and
              business communications without installing additional software.
            </p>
            <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">Campaign Analytics</h3>
            <p>Track important campaign metrics such as:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email Delivery</li>
              <li>Opens</li>
              <li>Clicks</li>
              <li>Replies</li>
              <li>Unsubscribes</li>
              <li>Campaign Performance</li>
            </ul>
            <p>These insights help users improve future campaigns through data-driven decisions.</p>
            <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">Team Collaboration</h3>
            <p>
              Invite team members, assign responsibilities, and manage outreach activities from a centralized workspace
              designed for collaboration and efficiency.
            </p>
            <h3 className="text-base font-bold text-zinc-900 mt-6 mb-2">Flexible SMTP Integration</h3>
            <p>
              PrimeInbox allows users to connect their preferred SMTP providers, giving businesses greater flexibility and
              control over email delivery.
            </p>

            <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">7-Day Free Trial</h2>
            <p>
              We believe every business should experience the platform before making a purchasing decision. That&apos;s why
              every new PrimeInbox account includes a 7-day free trial, allowing users to explore eligible premium
              features, test workflows, and evaluate the platform before subscribing.
            </p>
            <p>No long-term commitment is required during the trial period.</p>

            <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">Our Vision</h2>
            <p>
              Our vision is to become one of the most trusted AI-powered email outreach platforms by helping businesses
              communicate more effectively, automate repetitive tasks, and build lasting customer relationships through
              responsible and intelligent technology.
            </p>

            <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">Our Core Values</h2>
            <p>Everything we build is guided by our core values:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-zinc-900">Innovation</strong> – We continuously improve our platform by adopting modern technologies and AI-powered capabilities.</li>
              <li><strong className="text-zinc-900">Simplicity</strong> – Powerful software should be easy to use. We focus on intuitive workflows that help users get started quickly.</li>
              <li><strong className="text-zinc-900">Security</strong> – Protecting customer information and maintaining a secure platform remain top priorities.</li>
              <li><strong className="text-zinc-900">Reliability</strong> – We are committed to delivering dependable services that businesses can rely on every day.</li>
              <li><strong className="text-zinc-900">Transparency</strong> – We believe in clear pricing, honest communication, and straightforward policies.</li>
              <li><strong className="text-zinc-900">Customer Success</strong> – Our goal is to provide tools that help businesses improve productivity and achieve better communication outcomes.</li>
            </ul>

            <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">Customer Support</h2>
            <p>Our dedicated support team assists customers with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Account Setup</li>
              <li>Subscription Assistance</li>
              <li>SMTP Configuration</li>
              <li>Campaign Guidance</li>
              <li>Technical Support</li>
              <li>Billing Questions</li>
              <li>Feature Requests</li>
              <li>General Enquiries</li>
            </ul>
            <p>We continually work to improve PrimeInbox based on customer feedback and evolving business needs.</p>

            <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">Our Commitment</h2>
            <p>PrimeInbox is committed to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Delivering reliable cloud software.</li>
              <li>Protecting customer data.</li>
              <li>Continuously improving platform performance.</li>
              <li>Providing responsive customer support.</li>
              <li>Building long-term relationships with our users.</li>
              <li>Developing responsible AI-powered business tools.</li>
            </ul>

            <h2 className="text-xl font-bold text-zinc-900 mt-8 mb-4">Contact Information</h2>
            <p>If you would like to learn more about PrimeInbox or have any questions, please contact us.</p>
            <ul className="list-none pl-0 space-y-1">
              <li><strong className="text-zinc-900">PrimeInbox</strong></li>
              <li>Website: <a href="https://primeinbox.online" className="text-primary font-semibold hover:underline">https://primeinbox.online</a></li>
              <li>Email: <a href="mailto:contact.primeinbox@gmail.com" className="text-primary font-semibold hover:underline">contact.primeinbox@gmail.com</a></li>
              <li>Business Hours: Monday – Saturday, 9:00 AM – 6:00 PM (IST)</li>
            </ul>
          </div>

          <div className="mt-12 rounded-2xl border border-zinc-200/60 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 p-8 md:p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 mb-3">
              Join Thousands of Businesses Growing with Smarter Email Outreach
            </h2>
            <p className="max-w-2xl mx-auto text-sm md:text-base text-zinc-500 leading-relaxed font-medium">
              PrimeInbox is built for organizations that want to simplify outreach, improve engagement, and scale
              communication with confidence. From intelligent email creation to campaign analytics and automation, our
              platform helps businesses focus on building meaningful professional relationships while we handle the
              technology behind the scenes.
            </p>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}

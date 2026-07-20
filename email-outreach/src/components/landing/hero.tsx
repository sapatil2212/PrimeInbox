"use client";

import { useRef, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Container } from "@/components/layout/container";
import Link from "next/link";
import { SlideUp } from "@/components/animations/slide-up";
import {
  LayoutDashboard, Send, Users, BarChart3, BookOpen,
  Key, CreditCard, Search, Plus,
  TrendingUp, Clock, HeartPulse, Activity, ArrowRight, ArrowUpRight,
  Wand2, Repeat, Download, LayoutTemplate, Mail
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

const HERO_MARQUEE_ITEMS_RAW = [
  { label: "AI Copywriter & Sequencer", icon: Wand2 },
  { label: "Multi-Account Sending", icon: Repeat },
  { label: "CSV Header Mapper", icon: Download },
  { label: "Drag-and-Drop Editor", icon: LayoutTemplate },
  { label: "Campaign Analytics", icon: BarChart3 },
  { label: "Collaborative Workspaces", icon: Users },
  { label: "Domain DKIM Security", icon: Key },
  { label: "One-Click Unsubscribe", icon: Mail },
  { label: "Open & Click Tracking", icon: Activity },
  { label: "Scheduled Sending", icon: Clock },
];

const HERO_MARQUEE_ITEMS = [...HERO_MARQUEE_ITEMS_RAW, ...HERO_MARQUEE_ITEMS_RAW];

// Lazy-load recharts — it's ~200kb and only visible below the fold in the dashboard mockup
const LazyChart = lazy(() => import("recharts").then((mod) => ({
  default: function HeroChart() {
    const { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } = mod;
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSends" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
          <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={false}
            contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px", fontSize: "11px" }}
            labelStyle={{ color: "#18181b", fontSize: "11px", fontWeight: "bold" }}
            itemStyle={{ color: "#4f46e5", fontSize: "11px" }}
          />
          <Area type="monotone" dataKey="sends" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSends)" name="Emails Sent" activeDot={false} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }
})));

const chartData = [
  { date: "Mon", sends: 1200, opens: 820, clicks: 180 },
  { date: "Tue", sends: 2100, opens: 1240, clicks: 290 },
  { date: "Wed", sends: 1800, opens: 1010, clicks: 240 },
  { date: "Thu", sends: 3200, opens: 1980, clicks: 420 },
  { date: "Fri", sends: 2800, opens: 1640, clicks: 360 },
  { date: "Sat", sends: 4100, opens: 2440, clicks: 510 },
];

const navLinks = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Campaigns", icon: Send },
  { label: "Leads", icon: Users },
  { label: "Templates", icon: BookOpen },
  { label: "SMTP Accounts", icon: Key },
  { label: "Reports", icon: BarChart3 },
  { label: "Billing", icon: CreditCard },
];

const statCards = [
  { icon: Send, iconColor: "text-indigo-500", label: "Total Sent", value: "15,200", sub: "Emails delivered", subIcon: TrendingUp, subIconColor: "text-emerald-600" },
  { icon: BarChart3, iconColor: "text-emerald-500", label: "Open Rate", value: "68.4%", sub: "Click rate: 14.2%" },
  { icon: Key, iconColor: "text-amber-500", label: "Active Senders", value: "8", sub: "Connected accounts", subIcon: HeartPulse, subIconColor: "text-emerald-600" },
  { icon: Clock, iconColor: "text-indigo-500", label: "Today's Queue", value: "1,240", sub: "Active campaigns: 4" },
];

const recentActivity = [
  { campaign: "Product Newsletter", lead: "alex@acme.io", message: "Email delivered", status: "SUCCESS", time: "10:24" },
  { campaign: "Onboarding Series", lead: "mia@scale.dev", message: "Opened email", status: "SUCCESS", time: "10:18" },
  { campaign: "Follow-up #2", lead: "ben@hubly.co", message: "Link clicked", status: "SUCCESS", time: "09:57" },
  { campaign: "Monthly Update", lead: "noah@vex.app", message: "Bounced — invalid", status: "FAILED", time: "09:41" },
];

export function HeroSection() {
  // Scroll-driven "laptop screen opening" animation for the dashboard.
  const flipRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: flipRef,
    offset: ["start 0.85", "center 0.55"],
  });

  // Hinge at the bottom: starts tilted back like a closing laptop lid, then lays flat.
  const rotateX = useTransform(scrollYProgress, [0, 1], [72, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.86, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.35], [0.4, 1]);

  return (
    <section className="relative pt-24 pb-16 md:pt-36 lg:pt-52 overflow-hidden bg-transparent z-10">

      {/* ===== Clean, lightweight background ===== */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-white">
        {/* Subtle neutral grid, faded out to all edges */}
        <div
          className="absolute inset-0 opacity-100"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(15,23,42,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.07) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 65% at 50% 40%, black 0%, rgba(0,0,0,0.6) 55%, transparent 90%)",
            maskImage:
              "radial-gradient(ellipse 70% 65% at 50% 40%, black 0%, rgba(0,0,0,0.6) 55%, transparent 90%)",
          }}
        />

        {/* Bottom fade into page */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
      </div>

      <Container className="relative z-10 text-center flex flex-col items-center">
        {/* Hero Title */}
        <SlideUp delay={0.2} yOffset={30}>
          <h1 className="max-w-5xl mx-auto text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-6xl leading-[1.1] md:leading-[1.05] font-extrabold tracking-tight text-zinc-900 mb-4 md:mb-6 px-2">
            Run Email Campaigns That <br className="hidden sm:block" /> Actually <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-650 font-extrabold">Land &amp; Convert.</span>
          </h1>
        </SlideUp>

        {/* Subtitle */}
        <SlideUp delay={0.3} yOffset={20}>
          <p className="max-w-2xl mx-auto text-sm md:text-lg text-zinc-500 mb-7 md:mb-8 leading-relaxed px-4">
            PrimeInbox helps you launch personalized email campaigns, distribute sending across multiple connected accounts for reliable deliverability, and track opens and clicks — all from one platform.
          </p>
        </SlideUp>

        {/* Action CTAs - compact side-by-side on mobile */}
        <SlideUp delay={0.4} yOffset={10} className="flex flex-row items-center justify-center gap-2 sm:gap-4 mb-8 md:mb-10 relative z-20 w-full px-4 sm:px-0">
          <Link href="/signup" className="flex-1 sm:flex-none max-w-[180px] sm:max-w-none">
            <ShimmerButton 
              className="w-full sm:w-auto h-9 sm:h-10 px-4 sm:px-8 rounded-full text-xs sm:text-sm font-bold bg-zinc-900 text-white hover:bg-black whitespace-nowrap" 
              shimmerColor="#3B82F6"
            >
              Get Started
            </ShimmerButton>
          </Link>
          
          <Link href="/login" className="flex-1 sm:flex-none max-w-[140px] sm:max-w-none">
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto h-9 sm:h-10 px-4 sm:px-6 rounded-full text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 border border-zinc-200/80 backdrop-blur-sm transition-all whitespace-nowrap"
            >
              Log in <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 text-zinc-500 hover:text-zinc-950" />
            </Button>
          </Link>
        </SlideUp>

        {/* Dashboard Showcase - flips open like a laptop screen on scroll */}
        <div
          ref={flipRef}
          className="relative max-w-[1100px] mx-auto z-10 px-4 md:px-0"
          style={{ perspective: "1800px" }}
        >
          <motion.div
            style={{
              rotateX,
              scale,
              opacity,
              transformOrigin: "center bottom",
              transformStyle: "preserve-3d",
              willChange: "transform",
            }}
          >

          {/* Outer Frame - fades to transparent at the bottom via mask */}
          <div
            className="relative rounded-xl md:rounded-[2rem] p-1.5 md:p-2 bg-zinc-50 backdrop-blur-xl overflow-hidden text-left flex flex-col h-[420px] sm:h-[520px] md:h-[620px] select-none pointer-events-none"
            style={{
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 55%, transparent 98%)",
              maskImage:
                "linear-gradient(to bottom, black 0%, black 55%, transparent 98%)",
            }}
          >

            {/* Dashboard Inner Container - mirrors the real /dashboard layout */}
            <div className="flex-1 flex overflow-hidden rounded-xl md:rounded-[1.6rem] bg-zinc-50 relative select-none w-full h-full">

              {/* Sidebar - white, matching dashboard-layout-shell */}
              <div className="hidden md:flex w-64 flex-col bg-white border-r border-zinc-200/80 p-6 shrink-0">
                {/* Logo */}
                <div className="flex items-center mb-8">
                  <img src="/logo/primeinbox-logo.png" alt="PrimeInbox" className="h-9 w-auto object-contain" />
                </div>

                {/* Nav */}
                <nav className="flex-1 space-y-1">
                  {navLinks.map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold border ${
                        item.active
                          ? "bg-indigo-50 text-indigo-650 border-indigo-100/50"
                          : "text-zinc-650 border-transparent"
                      }`}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 ${item.active ? "text-indigo-600" : "text-zinc-450"}`} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </nav>

                {/* Workspace widget */}
                <div className="mt-4 p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl shadow-inner">
                  <div className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">Workspace</div>
                  <div className="font-bold text-sm text-zinc-850 truncate mt-0.5">Acme Inc.</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-zinc-500 truncate">Plan: PRO</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-500/10 text-indigo-650 rounded-md uppercase border border-indigo-500/10">Active</span>
                  </div>
                </div>

                {/* User footer */}
                <div className="border-t border-zinc-200/80 pt-4 mt-4 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200/80 shrink-0">
                    <img src="https://i.pravatar.cc/100?img=1" alt="Sarah" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-800 truncate">Sarah Lin</div>
                    <div className="text-[10px] text-zinc-500 truncate">sarah@acme.io</div>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Top Navbar */}
                <header className="h-14 md:h-16 bg-white/60 border-b border-zinc-200/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between shrink-0">
                  <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400 font-bold">
                    <span>PrimeInbox</span>
                    <span>/</span>
                    <span className="text-zinc-800">Overview</span>
                  </div>
                  <div className="flex items-center gap-3 ml-auto">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200 text-[10px] md:text-xs text-zinc-650 font-semibold">
                      <Search className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Search campaigns...</span>
                      <kbd className="hidden md:inline-block px-1.5 py-0.5 bg-zinc-50 border border-zinc-200 rounded font-mono text-[9px]">Ctrl K</kbd>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-zinc-200 overflow-hidden shrink-0">
                      <img src="https://i.pravatar.cc/100?img=1" alt="Sarah" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-4 md:p-8 flex-1 overflow-hidden flex flex-col gap-4 md:gap-6">
                  {/* Overview header */}
                  <div className="flex items-center justify-between shrink-0">
                    <div>
                      <h2 className="text-lg md:text-2xl font-black tracking-tight text-zinc-900">Overview</h2>
                      <p className="text-[10px] md:text-sm text-zinc-500 font-medium hidden sm:block">Real-time indicators of your campaign performance and deliverability.</p>
                    </div>
                    <div className="h-8 md:h-9 px-3 md:px-5 rounded-lg text-[10px] md:text-xs font-bold bg-indigo-600 text-white flex items-center gap-1.5 shrink-0">
                      <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">Create Campaign</span>
                    </div>
                  </div>

                  {/* Stat cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 shrink-0">
                    {statCards.map((card) => (
                      <div key={card.label} className="border border-zinc-200 bg-white rounded-xl p-2.5 md:p-4 space-y-1 md:space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] md:text-xs font-bold text-zinc-450 uppercase tracking-wider truncate">{card.label}</span>
                          <card.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 shrink-0 ${card.iconColor}`} />
                        </div>
                        <div className="text-xl md:text-3xl font-black text-zinc-800">{card.value}</div>
                        <p className="text-[8px] md:text-[10px] text-zinc-500 font-semibold flex items-center gap-1 leading-tight">
                          {card.subIcon && <card.subIcon className={`w-3 h-3 shrink-0 ${card.subIconColor}`} />}
                          <span className="truncate">{card.sub}</span>
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Charts row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-5 flex-1 min-h-0">
                    {/* Sending Activity area chart */}
                    <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-4 md:p-5 flex-col gap-3 hidden sm:flex">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs md:text-sm font-bold text-zinc-900 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-indigo-600" /> Sending Activity
                        </h3>
                        <span className="text-[10px] text-zinc-500 font-semibold">Last 7 days</span>
                      </div>
                      <div className="flex-1 min-h-0 w-full">
                        <Suspense fallback={
                          <div className="h-full w-full flex items-center justify-center">
                            <div className="h-full w-full rounded-lg bg-gradient-to-t from-indigo-50/50 to-transparent animate-pulse" />
                          </div>
                        }>
                          <LazyChart />
                        </Suspense>
                      </div>
                    </div>

                    {/* Setup / Quick actions panel */}
                    <div className="bg-white border border-zinc-200 rounded-xl p-4 md:p-5 flex flex-col gap-3 flex-1 overflow-hidden">
                      <h3 className="text-xs md:text-sm font-bold text-zinc-900 shrink-0">Setup Campaign Engine</h3>
                      <p className="text-[10px] md:text-xs text-zinc-500 font-medium leading-relaxed hidden md:block">
                        Configure SMTP accounts, build lists, and upload leads to start sending.
                      </p>
                      <div className="flex flex-col gap-2 md:gap-3 pt-1">
                        {[
                          "1. Connect SMTP accounts",
                          "2. Upload target lead list",
                          "3. Build email sequence",
                        ].map((step) => (
                          <div key={step} className="w-full h-8 md:h-10 rounded-lg bg-zinc-50 border border-zinc-200 text-[10px] md:text-xs font-bold text-zinc-600 flex items-center justify-between px-3 md:px-4">
                            <span className="truncate">{step}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-400 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent activity table */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-4 md:p-5 flex-col gap-3 shrink-0 hidden md:flex">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-zinc-900">Recent Activity</h3>
                      <span className="text-[10px] text-indigo-600 font-extrabold flex items-center gap-0.5">
                        All campaigns <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider border-b border-zinc-100">
                          <th className="pb-2 font-semibold">Campaign</th>
                          <th className="pb-2 font-semibold">Lead</th>
                          <th className="pb-2 font-semibold">Activity</th>
                          <th className="pb-2 font-semibold">Status</th>
                          <th className="pb-2 font-semibold text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {recentActivity.map((act, i) => (
                          <tr key={i} className="text-zinc-600">
                            <td className="py-2 font-bold text-zinc-800">{act.campaign}</td>
                            <td className="py-2 font-mono text-zinc-500">{act.lead}</td>
                            <td className="py-2">{act.message}</td>
                            <td className="py-2">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${
                                act.status === "SUCCESS"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/10"
                                  : "bg-red-500/10 text-red-600 border-red-500/10"
                              }`}>
                                {act.status}
                              </span>
                            </td>
                            <td className="py-2 text-right text-zinc-400 font-semibold">{act.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

          </div>
          </motion.div>
        </div>

        {/* Infinite Scrolling Features Marquee */}
        <div className="w-full mt-4 relative overflow-hidden">
          {/* Faint Edge Masking */}
          <div className="absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          
          <style>{`
            @keyframes heroMarquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-hero-marquee {
              animation: heroMarquee 30s linear infinite;
            }
          `}</style>
          
          <div className="flex w-max gap-8 animate-hero-marquee px-4 select-none">
            {HERO_MARQUEE_ITEMS.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-zinc-450 hover:text-zinc-800 transition-colors">
                <item.icon className="w-4 h-4 shrink-0 text-zinc-350" />
                <span className="text-xs font-semibold whitespace-nowrap">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

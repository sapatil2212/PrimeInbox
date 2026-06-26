"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Container } from "@/components/layout/container";
import Link from "next/link";
import { SlideUp } from "@/components/animations/slide-up";
import {
  LayoutDashboard, Send, Users, BarChart3,
  Settings, LifeBuoy, Bell, Search, CheckCircle2,
  TrendingUp, Sparkles, ArrowRight, Zap
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

const chartData = [
  { name: "Jan", opens: 1200, clicks: 800 },
  { name: "Feb", opens: 2100, clicks: 1200 },
  { name: "Mar", opens: 1800, clicks: 1000 },
  { name: "Apr", opens: 3200, clicks: 1900 },
  { name: "May", opens: 2800, clicks: 1600 },
  { name: "Jun", opens: 4100, clicks: 2400 },
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
    <section className="relative pt-28 pb-16 md:pt-44 lg:pt-48 overflow-hidden bg-transparent z-10">

      {/* ===== Modern flowing gradient background ===== */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Animated color-shifting base wash */}
        <motion.div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(120deg, #eef2ff 0%, #ffffff 35%, #faf5ff 60%, #ffffff 100%)",
            backgroundSize: "300% 300%",
          }}
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Slowly rotating + breathing conic aurora */}
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-[-30%] h-[120vh] w-[120vh] -translate-x-1/2 rounded-full blur-[70px]"
          style={{
            background:
              "conic-gradient(from 0deg, #6366f1, #22d3ee, #a855f7, #ec4899, #6366f1)",
          }}
          animate={{
            rotate: 360,
            opacity: [0.06, 0.12, 0.06],
            scale: [1, 1.08, 1],
          }}
          transition={{
            rotate: { duration: 40, repeat: Infinity, ease: "linear" },
            opacity: { duration: 10, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 14, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        {/* Flowing color orbs */}
        <motion.div
          aria-hidden
          className="absolute -left-24 top-10 h-[20rem] w-[20rem] md:h-[28rem] md:w-[28rem] rounded-full bg-gradient-to-br from-blue-300/25 to-indigo-400/25 blur-3xl"
          animate={{ x: [0, 120, 0], y: [0, 60, 0], scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -right-24 top-0 h-[18rem] w-[18rem] md:h-[26rem] md:w-[26rem] rounded-full bg-gradient-to-br from-fuchsia-300/20 to-purple-400/20 blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, 80, 0], scale: [1, 1.2, 1], opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute left-1/3 top-1/2 h-[16rem] w-[16rem] md:h-[24rem] md:w-[24rem] rounded-full bg-gradient-to-br from-cyan-200/20 to-teal-300/20 blur-3xl"
          animate={{ x: [0, 80, 0], y: [0, -70, 0], scale: [1, 1.1, 1], opacity: [0.5, 0.75, 0.5] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Grid lines, brightest at center and fading out to all edges */}
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(99,102,241,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.12) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            WebkitMaskImage:
              "radial-gradient(ellipse 45% 45% at 50% 45%, black 0%, rgba(0,0,0,0.4) 45%, transparent 75%)",
            maskImage:
              "radial-gradient(ellipse 45% 45% at 50% 45%, black 0%, rgba(0,0,0,0.4) 45%, transparent 75%)",
          }}
        />

        {/* Bottom fade into page */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
      </div>

      <Container className="relative z-10 text-center flex flex-col items-center">
        {/* Hero Title */}
        <SlideUp delay={0.2} yOffset={30}>
          <h1 className="max-w-5xl mx-auto text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-6xl leading-[1.1] md:leading-[1.05] font-extrabold tracking-tight text-zinc-900 mb-4 md:mb-6 px-2">
            Turn Your DevRel Program <br className="hidden sm:block" /> Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-650 font-extrabold">Revenue Growth.</span>
          </h1>
        </SlideUp>

        {/* Subtitle */}
        <SlideUp delay={0.3} yOffset={20}>
          <p className="max-w-2xl mx-auto text-sm md:text-lg text-zinc-500 mb-7 md:mb-8 leading-relaxed px-4">
            From engagement tracking to pipeline acceleration, PrimeInbox keeps your developer relations organized in one platform.
          </p>
        </SlideUp>

        {/* Action CTAs - compact side-by-side on mobile */}
        <SlideUp delay={0.4} yOffset={10} className="flex flex-row items-center justify-center gap-2 sm:gap-4 mb-8 md:mb-10 relative z-20 w-full px-4 sm:px-0">
          <Link href="/signup" className="flex-1 sm:flex-none max-w-[180px] sm:max-w-none">
            <ShimmerButton 
              className="w-full sm:w-auto h-10 sm:h-12 px-4 sm:px-8 rounded-full text-xs sm:text-sm font-bold bg-zinc-900 text-white hover:bg-black whitespace-nowrap" 
              shimmerColor="#3B82F6"
            >
              14 days free trial
            </ShimmerButton>
          </Link>
          
          <Link href="/login" className="flex-1 sm:flex-none max-w-[140px] sm:max-w-none">
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto h-10 sm:h-12 px-4 sm:px-6 rounded-full text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 border border-zinc-200/80 backdrop-blur-sm transition-all whitespace-nowrap"
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

            {/* Dashboard Inner Container - Non-interactive, scales down on mobile to show full desktop layout */}
            <div 
              className="flex-1 flex overflow-hidden rounded-xl md:rounded-[1.6rem] bg-white relative select-none origin-top-left"
              style={{
                transform: 'scale(0.85)',
                transformOrigin: 'top left',
                width: '117.65%',
                height: '117.65%',
              }}
            >

              {/* Sidebar: Interactive Gradient Sidebar - Always visible */}
              <div className="w-[220px] flex flex-col bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white p-5 shrink-0 relative overflow-hidden">
                {/* Animated background pattern */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
                
                <div className="flex items-center gap-2 mb-10 relative z-10">
                  <div 
                    className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-lg tracking-tight text-white drop-shadow-sm">PrimeInbox</span>
                </div>

                <nav className="flex flex-col gap-1.5 flex-1 relative z-10">
                  {[
                    { icon: LayoutDashboard, label: "Dashboard", active: true },
                    { icon: Send, label: "Campaigns" },
                    { icon: Users, label: "Prospects" },
                    { icon: BarChart3, label: "Reports" },
                  ].map((item, i) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-xs ${
                        item.active
                          ? "bg-white/20 backdrop-blur-sm text-white"
                          : "text-white/70"
                      }`}
                    >
                      <item.icon className="w-4 h-4" /> {item.label}
                    </div>
                  ))}
                  
                  <div className="mt-auto space-y-1.5">
                    {[
                      { icon: Settings, label: "Settings" },
                      { icon: LifeBuoy, label: "Support" },
                    ].map((item, i) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 font-semibold text-xs w-full"
                      >
                        <item.icon className="w-4 h-4" /> {item.label}
                      </div>
                    ))}
                  </div>
                </nav>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col bg-[#FAFBFD]">
                {/* Header - Non-interactive */}
                <header className="h-16 bg-white px-6 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 text-zinc-700 bg-gradient-to-r from-emerald-50 to-green-50 px-3 py-1.5 rounded-lg text-xs font-semibold">
                    <div>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    System Active
                  </div>
                  <div className="flex items-center gap-3.5">
                    <div className="text-zinc-500 p-1.5 rounded-lg">
                      <Search className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-zinc-500 relative p-1.5 rounded-lg">
                      <Bell className="w-4.5 h-4.5" />
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-600" />
                    </div>
                    <div
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 overflow-hidden"
                    >
                      <img src="https://i.pravatar.cc/100?img=1" alt="Sarah" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </header>

                {/* Dashboard Content - Non-scrollable */}
                <div className="p-6 md:p-8 flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">Welcome back, Sarah!</h2>
                      <p className="text-xs text-zinc-500 font-medium">Your AI automated sequences are performing 18% above target.</p>
                    </div>
                  </div>

                  {/* Metric Panels - Interactive Cards - Always 3 columns */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      {
                        icon: CheckCircle2,
                        iconColor: "text-blue-500",
                        bgGradient: "from-blue-50 to-indigo-50",
                        label: "Emails Sent",
                        value: "15,200",
                        subtitle: "98.9% deliverability rate",
                        delay: 0.2,
                      },
                      {
                        icon: TrendingUp,
                        iconColor: "text-cyan-500",
                        bgGradient: "from-cyan-50 to-teal-50",
                        label: "Open Rate",
                        value: "68.4%",
                        subtitle: "+12% vs industry average",
                        delay: 0.3,
                      },
                      {
                        icon: Zap,
                        iconColor: "text-indigo-500",
                        bgGradient: "from-indigo-50 to-purple-50",
                        label: "Replies",
                        value: "3,250",
                        subtitle: "21.3% reply-to-send ratio",
                        delay: 0.4,
                      },
                    ].map((metric, i) => (
                      <div
                        key={i}
                        className={`bg-gradient-to-br ${metric.bgGradient} p-4.5 rounded-xl flex flex-col`}
                      >
                        <div className="flex items-center gap-2 mb-2 text-zinc-500">
                          <div>
                            <metric.icon className={`w-4 h-4 ${metric.iconColor}`} />
                          </div>
                          <span className="text-[10px] font-bold tracking-wide uppercase">{metric.label}</span>
                        </div>
                        <div className="text-2xl font-extrabold text-zinc-900">
                          {metric.value}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1 font-semibold">{metric.subtitle}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Chart */}
                    <div className="lg:col-span-2 bg-white p-5 rounded-xl flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-zinc-900">Outreach Performance</h3>
                        <div className="text-[10px] bg-gradient-to-r from-green-50 to-emerald-50 rounded-full px-3 py-1 text-green-700 font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Live Metrics
                        </div>
                      </div>
                      <div className="h-[160px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="chartOpens" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="chartClicks" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0, 0, 0, 0.04)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B' }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "white",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                fontSize: "11px",
                                padding: "8px 12px",
                              }}
                            />
                            <Area type="monotone" dataKey="opens" stroke="#2563EB" strokeWidth={3} fill="url(#chartOpens)" />
                            <Area type="monotone" dataKey="clicks" stroke="#06B6D4" strokeWidth={3} fill="url(#chartClicks)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex gap-6 mt-3 justify-center text-[10px] font-semibold">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
                          <span className="text-zinc-600">Opens</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                          <span className="text-zinc-600">Clicks</span>
                        </div>
                      </div>
                    </div>

                    {/* Activity List */}
                    <div className="bg-white p-5 rounded-xl flex flex-col justify-between">
                      <h3 className="text-sm font-bold text-zinc-900 mb-4">Recent Activity</h3>
                      <div className="space-y-3.5 flex-1">
                        {[
                          { title: "Campaign Launched", desc: "Q3 DevRel Outreach", val: "+340", color: "text-blue-600" },
                          { title: "New Integration", desc: "GitHub Webhook Sync", val: "Active", color: "text-green-600" },
                          { title: "Follow-ups Sent", desc: "Batch #44", val: "120", color: "text-cyan-600" },
                          { title: "Reply Detected", desc: "Positive Sentiment", val: "Review", color: "text-indigo-600" },
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-lg group"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${item.color.replace("text-", "bg-")}`}
                              />
                              <div>
                                <p className="text-zinc-800 group-hover:text-zinc-900 transition-colors">{item.title}</p>
                                <p className="text-[10px] text-zinc-400 font-medium">{item.desc}</p>
                              </div>
                            </div>
                            <span className={`${item.color} font-bold`}>{item.val}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-[10px] font-bold text-indigo-600 mt-4 text-right w-full flex items-center justify-end gap-1">
                        View All
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

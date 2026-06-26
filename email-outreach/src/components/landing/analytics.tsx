"use client";

import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideUp } from "@/components/animations/slide-up";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, TrendingUp } from "lucide-react";

const data = [
  { name: "Mon", opens: 4000, clicks: 2400 },
  { name: "Tue", opens: 3000, clicks: 1398 },
  { name: "Wed", opens: 2000, clicks: 9800 },
  { name: "Thu", opens: 2780, clicks: 3908 },
  { name: "Fri", opens: 1890, clicks: 4800 },
  { name: "Sat", opens: 2390, clicks: 3800 },
  { name: "Sun", opens: 3490, clicks: 4300 },
];

const METRICS = [
  { label: "Open Rate", value: "68.4%", trend: "+12.5%", positive: true },
  { label: "Click Rate", value: "14.2%", trend: "+5.2%", positive: true },
  { label: "Reply Rate", value: "8.1%", trend: "+2.4%", positive: true },
  { label: "Bounce Rate", value: "0.2%", trend: "-0.1%", positive: false },
];

export function AnalyticsSection() {
  return (
    <section className="py-28 bg-transparent relative z-10">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Text Description */}
          <div>
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-zinc-100 border border-zinc-200/80 text-primary">
                Advanced Tracking
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-zinc-900 leading-tight">
                Insights that drive DevRel revenue
              </h2>
              <p className="text-base md:text-lg text-zinc-500 mb-8 leading-relaxed font-semibold">
                Go beyond vanity metrics. Track exactly what's working and what's not with real-time, actionable analytics that map developer engagement to sales conversions.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {METRICS.map((metric, i) => (
                  <div 
                    key={i} 
                    className="bg-white p-4.5 rounded-xl border border-zinc-200/50 hover:border-zinc-300 transition-all group cursor-default shadow-sm"
                  >
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{metric.label}</p>
                    <div className="flex items-end gap-2 mt-2">
                      <span className="text-2xl font-extrabold text-zinc-900 group-hover:text-primary transition-colors">{metric.value}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                        metric.positive 
                          ? "bg-emerald-50/70 text-emerald-700 border border-emerald-500/10" 
                          : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                      }`}>
                        <TrendingUp className="w-2.5 h-2.5" />
                        {metric.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Glowing Analytics Panel Visual */}
          <SlideUp className="w-full">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-primary" /> Active Campaign Conversion
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-semibold">Opens vs Clicks over the last 7 days</p>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-full text-zinc-600 font-bold uppercase tracking-wider">
                  Live Feed <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                </div>
              </div>

              {/* Chart Grid */}
              <div className="h-[260px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0, 0, 0, 0.03)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        borderColor: 'rgba(0,0,0,0.06)', 
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#09090B',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                      }}
                      itemStyle={{ color: '#09090B' }}
                    />
                    <Area type="monotone" dataKey="opens" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOpens)" />
                    <Area type="monotone" dataKey="clicks" stroke="#06B6D4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorClicks)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </SlideUp>

        </div>
      </Container>
    </section>
  );
}

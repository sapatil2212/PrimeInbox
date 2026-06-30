"use client";

import { useState } from "react";
import { Container } from "@/components/layout/container";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideUp } from "@/components/animations/slide-up";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

const CHART_DATA = [
  { name: "Mon", opens: 58, clicks: 10.2, replies: 5.1, bounces: 0.5 },
  { name: "Tue", opens: 62, clicks: 11.5, replies: 6.2, bounces: 0.4 },
  { name: "Wed", opens: 65, clicks: 13.0, replies: 7.5, bounces: 0.3 },
  { name: "Thu", opens: 61, clicks: 12.1, replies: 6.8, bounces: 0.3 },
  { name: "Fri", opens: 68, clicks: 14.2, replies: 8.1, bounces: 0.2 },
  { name: "Sat", opens: 64, clicks: 11.8, replies: 7.0, bounces: 0.2 },
  { name: "Sun", opens: 68.4, clicks: 13.5, replies: 7.8, bounces: 0.2 },
];

const METRICS = [
  { id: "opens",   label: "Open Rate",   value: "68.4%", trend: "+12.5%", positive: true,  color: "#2563EB" },
  { id: "clicks",  label: "Click Rate",  value: "14.2%", trend: "+5.2%",  positive: true,  color: "#06B6D4" },
  { id: "replies", label: "Reply Rate",  value: "8.1%",  trend: "+2.4%",  positive: true,  color: "#8B5CF6" },
  { id: "bounces", label: "Bounce Rate", value: "0.2%",  trend: "-0.1%",  positive: false, color: "#EF4444" },
];

type MetricId = "opens" | "clicks" | "replies" | "bounces";

export function AnalyticsSection() {
  const [activeMetric, setActiveMetric] = useState<MetricId>("opens");

  const activeMetricInfo = METRICS.find((m) => m.id === activeMetric)!;

  return (
    <section className="py-16 bg-transparent relative z-10">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — Text + metric selector cards */}
          <div>
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-zinc-100 border border-zinc-200/80 text-primary">
                Advanced Tracking
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-zinc-900 leading-tight">
                Insights that drive DevRel revenue
              </h2>
              <p className="text-sm md:text-base text-zinc-500 mb-8 leading-relaxed font-normal">
                Go beyond vanity metrics. Track exactly what's working and what's not with real-time,
                actionable analytics that map developer engagement to sales conversions.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {METRICS.map((metric) => {
                  const isSelected = activeMetric === metric.id;
                  return (
                    <button
                      key={metric.id}
                      onClick={() => setActiveMetric(metric.id as MetricId)}
                      style={isSelected ? { borderColor: metric.color + "55" } : {}}
                      className={`text-left bg-white p-3 rounded-xl border transition-all duration-200 group ${
                        isSelected
                          ? "bg-zinc-50/30 scale-[1.01]"
                          : "border-zinc-200/60 hover:border-zinc-300"
                      }`}
                    >
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{metric.label}</p>
                      <div className="flex items-end gap-2 mt-1.5 justify-between">
                        <span
                          className="text-lg font-extrabold transition-colors duration-200"
                          style={{ color: isSelected ? metric.color : "#18181b" }}
                        >
                          {metric.value}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                            metric.positive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          <TrendingUp className="w-2.5 h-2.5" />
                          {metric.trend}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </FadeIn>
          </div>

          {/* Right — Single persistent chart panel */}
          <SlideUp className="w-full">
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-500/5 via-transparent to-transparent pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-zinc-100">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 transition-colors duration-300" style={{ color: activeMetricInfo.color }} />
                    Campaign Performance
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Live comparison · all metrics</p>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-full text-zinc-600 font-bold uppercase tracking-wider">
                  Live <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block ml-1" />
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mb-4">
                {METRICS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveMetric(m.id as MetricId)}
                    className="flex items-center gap-1.5 transition-opacity duration-200"
                    style={{ opacity: activeMetric === m.id ? 1 : 0.35 }}
                  >
                    <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: m.color }} />
                    <span className="text-[9px] font-semibold text-zinc-600">{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Single chart — all 4 Areas always rendered, opacity controlled */}
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gOpens" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#06B6D4" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gReplies" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gBounces" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      cursor={false}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e4e4e7",
                        borderRadius: "10px",
                        fontSize: "11px",
                        boxShadow: "none",
                      }}
                      formatter={(value) => [`${value}%`]}
                    />

                    {/* All 4 areas — inactive ones fade out via strokeOpacity/fillOpacity */}
                    <Area
                      isAnimationActive={false}
                      type="monotone"
                      dataKey="opens"
                      stroke="#2563EB"
                      strokeWidth={activeMetric === "opens" ? 2.5 : 1}
                      strokeOpacity={activeMetric === "opens" ? 1 : 0.12}
                      fill="url(#gOpens)"
                      fillOpacity={activeMetric === "opens" ? 1 : 0}
                      activeDot={false}
                    />
                    <Area
                      isAnimationActive={false}
                      type="monotone"
                      dataKey="clicks"
                      stroke="#06B6D4"
                      strokeWidth={activeMetric === "clicks" ? 2.5 : 1}
                      strokeOpacity={activeMetric === "clicks" ? 1 : 0.12}
                      fill="url(#gClicks)"
                      fillOpacity={activeMetric === "clicks" ? 1 : 0}
                      activeDot={false}
                    />
                    <Area
                      isAnimationActive={false}
                      type="monotone"
                      dataKey="replies"
                      stroke="#8B5CF6"
                      strokeWidth={activeMetric === "replies" ? 2.5 : 1}
                      strokeOpacity={activeMetric === "replies" ? 1 : 0.12}
                      fill="url(#gReplies)"
                      fillOpacity={activeMetric === "replies" ? 1 : 0}
                      activeDot={false}
                    />
                    <Area
                      isAnimationActive={false}
                      type="monotone"
                      dataKey="bounces"
                      stroke="#EF4444"
                      strokeWidth={activeMetric === "bounces" ? 2.5 : 1}
                      strokeOpacity={activeMetric === "bounces" ? 1 : 0.12}
                      fill="url(#gBounces)"
                      fillOpacity={activeMetric === "bounces" ? 1 : 0}
                      activeDot={false}
                    />
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

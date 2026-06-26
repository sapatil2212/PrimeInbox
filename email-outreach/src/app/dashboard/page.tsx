"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { 
  Send, 
  BarChart3, 
  Users, 
  Key, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  HeartPulse,
  Activity,
  Plus
} from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from "recharts";

interface StatsData {
  totalSends: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
  activeCampaigns: number;
  activeSmtps: number;
  smtpHealth: number;
  todayQueue: number;
}

interface RecentActivity {
  id: string;
  action: string;
  status: string;
  message: string;
  createdAt: string;
  campaign: { name: string };
  lead: { email: string };
}

interface DailySendItem {
  date: string;
  sends: number;
  opens: number;
  replies: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [chartData, setChartData] = useState<DailySendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) {
          throw new Error("Failed to fetch dashboard metrics");
        }
        const data = await res.json();
        setStats(data.stats);
        setActivities(data.recentActivity);
        setChartData(data.dailySends);
      } catch (err: any) {
        toast.error(err.message || "Failed to load dashboard metrics");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-48 bg-zinc-900 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-900 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 lg:col-span-2 bg-zinc-900 rounded-xl" />
          <div className="h-80 bg-zinc-900 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-8">
      
      {/* Welcome Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">
            Overview
          </h1>
          <p className="text-sm text-zinc-500 font-medium">Real-time indicators of your outreach performance and deliverability.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/campaigns/create">
            <ShimmerButton 
              className="h-9 px-5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
              shimmerColor="#818cf8"
            >
              <Plus className="w-4 h-4" /> Create Campaign
            </ShimmerButton>
          </Link>
        </div>
      </header>

      {/* Stats Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <GlowCard className="border border-zinc-200 bg-white !rounded-xl" glowColor="rgba(99, 102, 241, 0.02)">
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-450 uppercase tracking-wider">Total Sent</span>
              <Send className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-3xl font-black text-zinc-800">{stats?.totalSends || 0}</div>
            <p className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" /> Outbound emails dispatched
            </p>
          </div>
        </GlowCard>

        <GlowCard className="border border-zinc-200 bg-white !rounded-xl" glowColor="rgba(99, 102, 241, 0.02)">
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-450 uppercase tracking-wider">Open Rate</span>
              <BarChart3 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-zinc-800">{stats?.openRate || 0}%</div>
            <p className="text-[10px] text-zinc-500 font-semibold">
              Reply rate: <span className="text-indigo-600 font-bold">{stats?.replyRate || 0}%</span>
            </p>
          </div>
        </GlowCard>

        <GlowCard className="border border-zinc-200 bg-white !rounded-xl" glowColor="rgba(99, 102, 241, 0.02)">
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-450 uppercase tracking-wider">Active Senders</span>
              <Key className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-zinc-800">{stats?.activeSmtps || 0}</div>
            <p className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
              <HeartPulse className="w-3 h-3 text-emerald-600" /> Health avg: {stats?.smtpHealth.toFixed(1) || 100}%
            </p>
          </div>
        </GlowCard>

        <GlowCard className="border border-zinc-200 bg-white !rounded-xl" glowColor="rgba(99, 102, 241, 0.02)">
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-450 uppercase tracking-wider">Today's Queue</span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-3xl font-black text-zinc-800">{stats?.todayQueue || 0}</div>
            <p className="text-[10px] text-zinc-500 font-semibold">
              Active campaigns: <span className="text-emerald-600 font-bold">{stats?.activeCampaigns || 0}</span>
            </p>
          </div>
        </GlowCard>

      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Sends Area Chart */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" /> Sending Activity
            </h3>
            <span className="text-[10px] text-zinc-500 font-semibold">Last 7 days</span>
          </div>
          <div className="h-64 w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSends" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px" }}
                    labelStyle={{ color: "#18181b", fontSize: "11px", fontWeight: "bold" }}
                    itemStyle={{ color: "#4f46e5", fontSize: "11px" }}
                  />
                  <Area type="monotone" dataKey="sends" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSends)" name="Emails Sent" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Rate Conversion Chart */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Conversion Rates
            </h3>
            <span className="text-[10px] text-zinc-500 font-semibold">Interaction</span>
          </div>
          <div className="h-64 w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px" }}
                    labelStyle={{ color: "#18181b", fontSize: "11px", fontWeight: "bold" }}
                    itemStyle={{ fontSize: "11px" }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                  <Line type="monotone" dataKey="opens" stroke="#10b981" strokeWidth={2} activeDot={{ r: 6 }} name="Opens" />
                  <Line type="monotone" dataKey="replies" stroke="#f59e0b" strokeWidth={2} name="Replies" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </section>

      {/* Bottom Row: Recent Activity & Quick Navigation */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Recent logs */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900">Recent Activity</h3>
            <Link href="/dashboard/campaigns" className="text-[10px] text-indigo-600 font-extrabold hover:underline flex items-center gap-0.5">
              All campaigns <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-zinc-100">
              <thead>
                <tr className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="pb-3 font-semibold">Campaign</th>
                  <th className="pb-3 font-semibold">Lead</th>
                  <th className="pb-3 font-semibold">Activity</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {activities.map((act) => (
                  <tr key={act.id} className="text-zinc-600 hover:bg-zinc-50/50">
                    <td className="py-3 font-bold text-zinc-800">{act.campaign?.name}</td>
                    <td className="py-3 font-mono text-zinc-500">{act.lead?.email}</td>
                    <td className="py-3 max-w-[200px] truncate">{act.message}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                        act.status === "SUCCESS" 
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/10" 
                          : "bg-red-500/10 text-red-600 border border-red-500/10"
                      }`}>
                        {act.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-zinc-400 font-semibold">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {activities.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-zinc-400 font-bold">
                      No outreach activity logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-zinc-900">Setup Outreach Engine</h3>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">
            Configure SMTP accounts, create lists, and upload lead databases to start sending cold campaigns.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Link href="/dashboard/smtp">
              <button className="w-full h-10 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100/50 text-xs font-bold text-zinc-600 transition-all flex items-center justify-between px-4 cursor-pointer">
                <span>1. Connect SMTP accounts</span>
                <ArrowUpRight className="w-4 h-4 text-zinc-400" />
              </button>
            </Link>
            <Link href="/dashboard/leads">
              <button className="w-full h-10 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100/50 text-xs font-bold text-zinc-600 transition-all flex items-center justify-between px-4 cursor-pointer">
                <span>2. Upload target lead list</span>
                <ArrowUpRight className="w-4 h-4 text-zinc-400" />
              </button>
            </Link>
            <Link href="/dashboard/templates">
              <button className="w-full h-10 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100/50 text-xs font-bold text-zinc-600 transition-all flex items-center justify-between px-4 cursor-pointer">
                <span>3. Build email sequence template</span>
                <ArrowUpRight className="w-4 h-4 text-zinc-400" />
              </button>
            </Link>
          </div>
        </div>

      </section>

    </div>
  );
}

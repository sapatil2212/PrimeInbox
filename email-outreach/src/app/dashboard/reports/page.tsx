"use client";

import { useEffect, useState } from"react";
import { toast } from"sonner";
import { 
 BarChart3, 
 Send, 
 Mail, 
 Users, 
 Percent, 
 Download, 
 Calendar, 
 Loader2, 
 CheckCircle2, 
 AlertTriangle,
 ArrowUpRight,
 TrendingUp
} from"lucide-react";
import { GlowCard } from"@/components/ui/glow-card";
import { ShimmerButton } from"@/components/ui/shimmer-button";
import {
 AreaChart,
 Area,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 Legend
} from"recharts";

interface ReportSummary {
 sent: number;
 opened: number;
 clicked: number;
 replied: number;
 bounced: number;
 unsubscribed: number;
 openRate: number;
 clickRate: number;
 replyRate: number;
 bounceRate: number;
}

interface CampaignStat {
 id: string;
 name: string;
 status: string;
 createdAt: string;
 leadsCount: number;
 sent: number;
 opened: number;
 clicked: number;
 replied: number;
 bounced: number;
 unsubscribed: number;
 openRate: number;
 clickRate: number;
 replyRate: number;
}

interface SmtpStat {
 id: string;
 host: string;
 fromEmail: string;
 dailyLimit: number;
 currentDailyCount: number;
 healthScore: number;
 status: string;
 totalSent: number;
 totalBounced: number;
}

interface DailySend {
 date: string;
 sends: number;
 opens: number;
 clicks: number;
 replies: number;
}

export default function ReportsPage() {
 const [summary, setSummary] = useState<ReportSummary | null>(null);
 const [campaigns, setCampaigns] = useState<CampaignStat[]>([]);
 const [smtp, setSmtp] = useState<SmtpStat[]>([]);
 const [dailySends, setDailySends] = useState<DailySend[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [timeRange, setTimeRange] = useState("14d");

 const fetchReports = async () => {
 setIsLoading(true);
 try {
 const res = await fetch("/api/reports");
 if (!res.ok) throw new Error("Failed to load reports metadata");
 const data = await res.json();
 setSummary(data.summary);
 setCampaigns(data.campaigns || []);
 setSmtp(data.smtp || []);
 setDailySends(data.dailySends || []);
 } catch (err: any) {
 toast.error(err.message ||"Failed to load reports");
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 fetchReports();
 }, []);

 const exportCampaignCSV = () => {
 if (campaigns.length === 0) return;
 
 const headers = ["Campaign Name","Status","Leads Count","Emails Sent","Opens","Clicks","Replies","Bounces","Unsubscribed","Open Rate %","Click Rate %","Reply Rate %"];
 const rows = campaigns.map(c => [
 c.name,
 c.status,
 c.leadsCount,
 c.sent,
 c.opened,
 c.clicked,
 c.replied,
 c.bounced,
 c.unsubscribed,
 c.openRate,
 c.clickRate,
 c.replyRate
 ]);

 const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
 const blob = new Blob([csvContent], { type:"text/csv;charset=utf-8;" });
 const url = URL.createObjectURL(blob);
 const link = document.createElement("a");
 link.setAttribute("href", url);
 link.setAttribute("download", `campaign_outreach_report_${Date.now()}.csv`);
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 toast.success("Campaign report exported successfully");
 };

 if (isLoading) {
 return (
 <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
 <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
 <p className="text-xs font-bold uppercase tracking-wider">Loading reports dashboard...</p>
 </div>
 );
 }

 return (
 <div className="flex-1 flex flex-col gap-8">
 
 {/* Page Header */}
 <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
 <div>
 <h1 className="text-2xl font-black tracking-tight text-zinc-800">
 Reports & Analytics
 </h1>
 <p className="text-sm text-zinc-500 font-medium">Complete performance breakdown of outreach campaigns and delivery rates.</p>
 </div>
 <div className="flex items-center gap-3">
 <ShimmerButton 
 onClick={exportCampaignCSV}
 className="h-10 px-5 rounded-xl text-xs font-bold bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-800 flex items-center gap-1.5"
 shimmerColor="#e4e4e7"
 >
 <Download className="w-4 h-4" /> Export CSV
 </ShimmerButton>
 </div>
 </header>

 {/* Summary Cards */}
 {summary && (
 <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <GlowCard className="bg-white p-4 flex flex-col gap-1 relative overflow-hidden group border border-zinc-200" glowColor="rgba(99, 102, 241, 0.02)">
 <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-450">Emails Sent</div>
 <div className="text-3xl font-black text-zinc-800 mt-1 flex items-baseline gap-1.5">
 {summary.sent}
 <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> 12%</span>
 </div>
 <p className="text-[10px] text-zinc-500 mt-2 font-medium">Total outreach emails delivered</p>
 <Send className="absolute bottom-4 right-4 w-10 h-10 text-zinc-200/40 group-hover:text-indigo-500/10 transition-colors" />
 </GlowCard>

 <GlowCard className="bg-white p-4 flex flex-col gap-1 relative overflow-hidden group border border-zinc-200" glowColor="rgba(99, 102, 241, 0.02)">
 <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-450">Open Rate</div>
 <div className="text-3xl font-black text-zinc-800 mt-1 flex items-baseline gap-1.5">
 {summary.openRate}%
 <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> 2.1%</span>
 </div>
 <p className="text-[10px] text-zinc-500 mt-2 font-medium">{summary.opened} total message opens</p>
 <Mail className="absolute bottom-4 right-4 w-10 h-10 text-zinc-200/40 group-hover:text-indigo-500/10 transition-colors" />
 </GlowCard>

 <GlowCard className="bg-white p-4 flex flex-col gap-1 relative overflow-hidden group border border-zinc-200" glowColor="rgba(99, 102, 241, 0.02)">
 <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-450">Reply Rate</div>
 <div className="text-3xl font-black text-zinc-800 mt-1 flex items-baseline gap-1.5">
 {summary.replyRate}%
 <span className="text-[10px] text-indigo-600 font-bold">Flat</span>
 </div>
 <p className="text-[10px] text-zinc-500 mt-2 font-medium">{summary.replied} total leads replied</p>
 <Percent className="absolute bottom-4 right-4 w-10 h-10 text-zinc-200/40 group-hover:text-indigo-500/10 transition-colors" />
 </GlowCard>

 <GlowCard className="bg-white p-4 flex flex-col gap-1 relative overflow-hidden group border border-zinc-200" glowColor="rgba(99, 102, 241, 0.02)">
 <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-450">Bounce Rate</div>
 <div className="text-3xl font-black text-zinc-800 mt-1 flex items-baseline gap-1.5">
 {summary.bounceRate}%
 <span className="text-[10px] text-red-600 font-bold">-0.8%</span>
 </div>
 <p className="text-[10px] text-zinc-500 mt-2 font-medium">{summary.bounced} rejected sends</p>
 <AlertTriangle className="absolute bottom-4 right-4 w-10 h-10 text-zinc-200/40 group-hover:text-indigo-500/10 transition-colors" />
 </GlowCard>
 </section>
 )}

 {/* Chart Section */}
 {dailySends.length > 0 && (
 <section className="bg-white border border-zinc-200 rounded-xl p-4">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h3 className="font-bold text-base text-zinc-800">Daily Performance Timeline</h3>
 <p className="text-xs text-zinc-500 mt-0.5">Sends, opens, and replies over the past 14 days.</p>
 </div>
 <div className="flex items-center gap-1.5 bg-zinc-50 p-1.5 rounded-xl border border-zinc-200">
 {["7d","14d"].map((range) => (
 <button
 key={range}
 onClick={() => setTimeRange(range)}
 className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-colors ${
 timeRange === range ?"bg-indigo-600 text-white" :"text-zinc-500 hover:text-zinc-700"
 }`}
 >
 {range}
 </button>
 ))}
 </div>
 </div>

 <div className="h-72 w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={timeRange ==="7d" ? dailySends.slice(-7) : dailySends}>
 <defs>
 <linearGradient id="sendsG" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
 <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="opensG" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
 <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
 <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
 <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
 <Tooltip 
 contentStyle={{ backgroundColor:"#ffffff", borderColor:"#e4e4e7", borderRadius:"12px", color:"#18181b", boxShadow:"0 10px 15px -3px rgba(0,0,0,0.05)" }} 
 labelStyle={{ fontWeight:"bold", fontSize:"11px", marginBottom:"4px" }}
 itemStyle={{ fontSize:"10px" }}
 />
 <Legend wrapperStyle={{ fontSize:"10px", marginTop:"10px" }} />
 <Area name="Sends" type="monotone" dataKey="sends" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#sendsG)" />
 <Area name="Opens" type="monotone" dataKey="opens" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#opensG)" />
 <Area name="Replies" type="monotone" dataKey="replies" stroke="#818cf8" strokeWidth={2} fill="none" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </section>
 )}

 {/* Grid: Campaigns and SMTP Accounts */}
 <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
 
 {/* Campaign Reports */}
 <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-4">
 <div>
 <h3 className="font-bold text-base text-zinc-800">Campaign Ratios</h3>
 <p className="text-xs text-zinc-550 mt-0.5">Performance tracking across current active and draft sequences.</p>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full border-collapse text-left text-xs text-zinc-650">
 <thead>
 <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase text-[9px] tracking-wider">
 <th className="pb-3">Name</th>
 <th className="pb-3 text-center">Status</th>
 <th className="pb-3 text-center">Sent</th>
 <th className="pb-3 text-center">Open Rate</th>
 <th className="pb-3 text-center">Reply Rate</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-100">
 {campaigns.map((camp) => (
 <tr key={camp.id} className="hover:bg-zinc-50/50">
 <td className="py-3 font-bold text-zinc-800">{camp.name}</td>
 <td className="py-3 text-center">
 <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
 camp.status ==="RUNNING" ?"bg-emerald-500/10 text-emerald-600 border border-emerald-500/10" :
 camp.status ==="PAUSED" ?"bg-amber-500/10 text-amber-600 border border-amber-500/10" :
"bg-zinc-100 text-zinc-500 border border-zinc-200"
 }`}>
 {camp.status}
 </span>
 </td>
 <td className="py-3 text-center font-semibold text-zinc-600">{camp.sent}</td>
 <td className="py-3 text-center font-bold text-zinc-800">
 {camp.openRate}%
 </td>
 <td className="py-3 text-center font-bold text-zinc-800">
 {camp.replyRate}%
 </td>
 </tr>
 ))}
 {campaigns.length === 0 && (
 <tr>
 <td colSpan={5} className="py-6 text-center text-zinc-450">No campaigns found.</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* SMTP Reports */}
 <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-4">
 <div>
 <h3 className="font-bold text-base text-zinc-800">SMTP Delivery Health</h3>
 <p className="text-xs text-zinc-550 mt-0.5">Rotational pool diagnostic metrics and limits consumption.</p>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full border-collapse text-left text-xs text-zinc-650">
 <thead>
 <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase text-[9px] tracking-wider">
 <th className="pb-3">SMTP Profile</th>
 <th className="pb-3 text-center">Health</th>
 <th className="pb-3 text-center">Daily sends</th>
 <th className="pb-3 text-center">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-100">
 {smtp.map((account) => (
 <tr key={account.id} className="hover:bg-zinc-50/50">
 <td className="py-3">
 <div className="font-bold text-zinc-800">{account.fromEmail}</div>
 <div className="text-[10px] text-zinc-500 mt-0.5">{account.host}</div>
 </td>
 <td className="py-3 text-center">
 <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
 account.healthScore >= 90 ?"bg-emerald-500/10 text-emerald-600" :
 account.healthScore >= 70 ?"bg-amber-500/10 text-amber-600" :
"bg-red-500/10 text-red-600"
 }`}>
 {account.healthScore}%
 </span>
 </td>
 <td className="py-3 text-center font-semibold text-zinc-600">
 {account.currentDailyCount} / {account.dailyLimit}
 </td>
 <td className="py-3 text-center">
 <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
 account.status ==="ACTIVE" ?"bg-emerald-500/10 text-emerald-600 border border-emerald-500/10" :
"bg-red-500/10 text-red-650 border border-red-500/10"
 }`}>
 {account.status}
 </span>
 </td>
 </tr>
 ))}
 {smtp.length === 0 && (
 <tr>
 <td colSpan={4} className="py-6 text-center text-zinc-450">No SMTP accounts configured.</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 </section>

 </div>
 );
}

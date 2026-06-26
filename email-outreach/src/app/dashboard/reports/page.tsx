"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/feedback";
import {
  Send,
  Mail,
  Percent,
  Download,
  Loader2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  FileType,
  ChevronDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
} from "recharts";
import { cn } from "@/lib/utils";

type RangeKey = "7d" | "14d" | "30d" | "90d";

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

interface Deltas {
  sent: number;
  opened: number;
  replied: number;
  bounced: number;
}

interface CampaignStat {
  id: string;
  name: string;
  status: string;
  leadsCount: number;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
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

interface ReportPayload {
  summary: ReportSummary;
  deltas: Deltas;
  funnel: { stage: string; value: number }[];
  statusDistribution: { name: string; value: number }[];
  campaigns: CampaignStat[];
  smtp: SmtpStat[];
  dailySends: DailySend[];
}

const STATUS_COLORS: Record<string, string> = {
  RUNNING: "#10b981",
  PAUSED: "#f59e0b",
  COMPLETED: "#6366f1",
  DRAFT: "#a1a1aa",
  ARCHIVED: "#d4d4d8",
};

const RANGES: RangeKey[] = ["7d", "14d", "30d", "90d"];

export default function ReportsPage() {
  const [data, setData] = useState<ReportPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>("14d");
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const fetchReports = async (r: RangeKey) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports?range=${r}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      toast.error(err.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleExport = async (format: "xlsx" | "pdf" | "docx") => {
    setExportOpen(false);
    setExporting(format);
    try {
      const res = await fetch(`/api/reports/export?format=${format}&range=${range}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics_report_${range}_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setExporting(null);
    }
  };

  const campaignComparison = useMemo(() => {
    if (!data) return [];
    return [...data.campaigns]
      .sort((a, b) => b.sent - a.sent)
      .slice(0, 6)
      .map((c) => ({
        name: c.name.length > 14 ? c.name.slice(0, 13) + "…" : c.name,
        openRate: c.openRate,
        replyRate: c.replyRate,
      }));
  }, [data]);

  if (isLoading && !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
        <p className="text-xs font-bold uppercase tracking-wider">Loading analytics...</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, deltas } = data;

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Reports & Analytics</h1>
          <p className="text-sm text-zinc-500 font-medium">
            Real-time performance across campaigns, engagement, and delivery health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Range selector */}
          <div className="flex items-center gap-1 bg-zinc-100/70 p-1 rounded-xl">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                  range === r ? "bg-white text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                )}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen((o) => !o)}
              disabled={!!exporting}
              className="h-10 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-all disabled:opacity-60"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-zinc-200 rounded-xl shadow-xl z-20 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                <ExportItem icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />} label="Excel (.xlsx)" onClick={() => handleExport("xlsx")} />
                <ExportItem icon={<FileText className="w-4 h-4 text-red-600" />} label="PDF (.pdf)" onClick={() => handleExport("pdf")} />
                <ExportItem icon={<FileType className="w-4 h-4 text-indigo-600" />} label="Word (.docx)" onClick={() => handleExport("docx")} />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Emails Sent" value={summary.sent.toLocaleString()} delta={deltas.sent} icon={<Send className="w-5 h-5" />} sub="Total in period" />
        <KpiCard label="Open Rate" value={`${summary.openRate}%`} delta={deltas.opened} icon={<Mail className="w-5 h-5" />} sub={`${summary.opened.toLocaleString()} opens`} />
        <KpiCard label="Reply Rate" value={`${summary.replyRate}%`} delta={deltas.replied} icon={<Percent className="w-5 h-5" />} sub={`${summary.replied.toLocaleString()} replies`} />
        <KpiCard label="Bounce Rate" value={`${summary.bounceRate}%`} delta={deltas.bounced} icon={<AlertTriangle className="w-5 h-5" />} sub={`${summary.bounced.toLocaleString()} bounced`} invertDelta />
      </section>

      {/* Timeline */}
      <Panel title="Performance Timeline" subtitle={`Daily sends, opens, clicks and replies (${range}).`}>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.dailySends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gSends" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gOpens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey="date" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ fontWeight: 700, fontSize: 11 }} itemStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Area name="Sends" type="monotone" dataKey="sends" stroke="#6366f1" strokeWidth={2} fill="url(#gSends)" />
              <Area name="Opens" type="monotone" dataKey="opens" stroke="#10b981" strokeWidth={2} fill="url(#gOpens)" />
              <Area name="Clicks" type="monotone" dataKey="clicks" stroke="#f59e0b" strokeWidth={2} fill="none" />
              <Area name="Replies" type="monotone" dataKey="replies" stroke="#818cf8" strokeWidth={2} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Funnel + Status distribution */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Panel title="Engagement Funnel" subtitle="Conversion from sent to replied.">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.funnel} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                  <XAxis type="number" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="stage" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} width={70} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f4f4f5" }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={26}>
                    {data.funnel.map((_, i) => (
                      <Cell key={i} fill={["#6366f1", "#10b981", "#f59e0b", "#818cf8"][i] || "#6366f1"} />
                    ))}
                    <LabelList dataKey="value" position="right" fontSize={11} fill="#3f3f46" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title="Campaign Status" subtitle="Distribution by state.">
          <div className="h-64 w-full">
            {data.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {data.statusDistribution.map((s, i) => (
                      <Cell key={i} fill={STATUS_COLORS[s.name] || "#a1a1aa"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </Panel>
      </section>

      {/* Campaign comparison */}
      <Panel title="Top Campaigns — Open vs Reply Rate" subtitle="Highest-volume campaigns compared.">
        <div className="h-72 w-full">
          {campaignComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignComparison} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f4f4f5" }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar name="Open Rate" dataKey="openRate" fill="#10b981" radius={[6, 6, 0, 0]} barSize={18} />
                <Bar name="Reply Rate" dataKey="replyRate" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </Panel>

      {/* Tables */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel title="Campaign Performance" subtitle="Per-campaign lifetime metrics.">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="pb-3 px-1">Name</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-center">Sent</th>
                  <th className="pb-3 text-center">Open</th>
                  <th className="pb-3 text-center">Reply</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/50">
                    <td className="py-2.5 px-1 font-bold text-zinc-800 max-w-[160px] truncate">{c.name}</td>
                    <td className="py-2.5 text-center">
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
                        style={{
                          backgroundColor: (STATUS_COLORS[c.status] || "#a1a1aa") + "1a",
                          color: STATUS_COLORS[c.status] || "#71717a",
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-center font-semibold">{c.sent}</td>
                    <td className="py-2.5 text-center font-bold text-emerald-600">{c.openRate}%</td>
                    <td className="py-2.5 text-center font-bold text-indigo-600">{c.replyRate}%</td>
                  </tr>
                ))}
                {data.campaigns.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-zinc-400">No campaigns found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="SMTP Delivery Health" subtitle="Pool diagnostics and limit usage.">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="pb-3 px-1">Profile</th>
                  <th className="pb-3 text-center">Health</th>
                  <th className="pb-3 text-center">Daily</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.smtp.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/50">
                    <td className="py-2.5 px-1">
                      <div className="font-bold text-zinc-800 max-w-[160px] truncate">{s.fromEmail}</div>
                      <div className="text-[10px] text-zinc-400">{s.host}</div>
                    </td>
                    <td className="py-2.5 text-center">
                      <span
                        className={cn(
                          "font-bold px-1.5 py-0.5 rounded text-[10px]",
                          s.healthScore >= 90 ? "bg-emerald-500/10 text-emerald-600" : s.healthScore >= 70 ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"
                        )}
                      >
                        {s.healthScore}%
                      </span>
                    </td>
                    <td className="py-2.5 text-center font-semibold">{s.currentDailyCount}/{s.dailyLimit}</td>
                    <td className="py-2.5 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                          s.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                        )}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.smtp.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-400">No SMTP accounts configured.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
    </div>
  );
}

/* ------------------------------- Components ------------------------------- */

const tooltipStyle = {
  backgroundColor: "#ffffff",
  borderColor: "#e4e4e7",
  borderRadius: 12,
  fontSize: 11,
  boxShadow: "0 10px 25px -8px rgba(0,0,0,0.15)",
} as const;

function ExportItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-all"
    >
      {icon}
      {label}
    </button>
  );
}

function KpiCard({
  label,
  value,
  delta,
  icon,
  sub,
  invertDelta,
}: {
  label: string;
  value: string;
  delta: number;
  icon: React.ReactNode;
  sub: string;
  invertDelta?: boolean;
}) {
  // For bounce rate, a positive delta is bad (invert color logic).
  const isGood = invertDelta ? delta <= 0 : delta >= 0;
  const up = delta >= 0;
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col gap-1 relative overflow-hidden group hover:border-indigo-200 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">{label}</span>
        <span className="text-zinc-300 group-hover:text-indigo-400 transition-colors">{icon}</span>
      </div>
      <div className="text-3xl font-black text-zinc-900 mt-1">{value}</div>
      <div className="flex items-center gap-2 mt-1">
        <span
          className={cn(
            "text-[10px] font-bold flex items-center gap-0.5",
            isGood ? "text-emerald-600" : "text-red-600"
          )}
        >
          {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(delta)}%
        </span>
        <span className="text-[10px] text-zinc-400 font-medium">{sub}</span>
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="font-extrabold text-zinc-900 text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-zinc-500 font-medium mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-2">
      <TrendingUp className="w-7 h-7" />
      <p className="text-xs font-semibold">No data for this period yet.</p>
    </div>
  );
}

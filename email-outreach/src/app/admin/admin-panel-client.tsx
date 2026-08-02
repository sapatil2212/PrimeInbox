"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast, confirmDialog } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import {
  Building,
  Users,
  Send,
  Loader2,
  Clock,
  BadgeCheck,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Repeat,
  CreditCard,
  Download,
  ArrowRight,
  FileText,
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  createdAt: string;
  users: number;
  campaigns: number;
}

interface HealthInfo {
  database: { status: string; latency: string };
  redis: { status: string; host: string; port: number };
  queue: { pendingJobs: number; workerStatus: string };
}

interface StatsData {
  companiesCount: number;
  usersCount: number;
  campaignsCount: number;
  smtpCount: number;
  totalRevenue: number;
  mrr: number;
  activeSubscriptionsCount: number;
  successPaymentsCount: number;
  failedPaymentsCount: number;
  totalPaymentsCount: number;
  activeMandatesCount: number;
  planDistribution: Record<string, number>;
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  companyName: string;
  slug: string;
  amount: number;
  currency: string;
  status: string;
  pdfUrl?: string;
  zohoTransactionId?: string;
  createdAt: string;
}

interface PaymentItem {
  id: string;
  transactionId: string;
  companyName: string;
  slug: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  createdAt: string;
}

const PLAN_COLORS: Record<string, string> = {
  BRONZE: "#f59e0b",
  SILVER: "#9ca3af",
  GOLD: "#eab308",
  PLATINUM: "#6366f1",
  FREE: "#3b82f6",
};

export function AdminPanelClient() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentItem[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantQuery, setTenantQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const fetchAdminData = async () => {
    try {
      const statsRes = await fetch("/api/admin/stats");
      if (!statsRes.ok) throw new Error("Failed to load admin stats");
      const statsData = await statsRes.json();
      setStats(statsData.stats);
      setHealth(statsData.health);
      setTenants(statsData.tenants || []);
      setRecentPayments(statsData.recentPayments || []);
      setRecentInvoices(statsData.recentInvoices || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(() => fetchAdminData(), 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(tenantQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(tenantQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400 mx-auto mb-2" />
          <p className="text-[10px] font-bold uppercase text-zinc-400">Loading admin metrics...</p>
        </div>
      </div>
    );
  }

  // Format Plan Distribution data for Recharts Pie Chart
  const planPieData = stats?.planDistribution
    ? Object.entries(stats.planDistribution).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  // Payment Breakdown Data for Bar Chart
  const paymentBreakdownData = stats
    ? [
        { name: "Successful Payments", count: stats.successPaymentsCount, fill: "#10b981" },
        { name: "Failed Payments", count: stats.failedPaymentsCount, fill: "#ef4444" },
        { name: "Active Mandates", count: stats.activeMandatesCount, fill: "#6366f1" },
      ]
    : [];

  // Platform usage data
  const platformUsageData = stats
    ? [
        { category: "Workspaces", count: stats.companiesCount },
        { category: "Active Subs", count: stats.activeSubscriptionsCount },
        { category: "Users", count: stats.usersCount },
        { category: "Campaigns", count: stats.campaignsCount },
        { category: "SMTP Accounts", count: stats.smtpCount },
      ]
    : [];

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-lg md:text-xl font-bold text-zinc-900">Admin Overview</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Platform metrics, interactive charts, and Zoho Payments revenue analytics
        </p>
      </div>

      {/* Zoho Payments Financial & Revenue Overview */}
      {stats && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Zoho Payments &amp; Revenue Overview
            </h2>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Live Gateway Metrics
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-violet-900 to-zinc-900 text-white rounded-xl p-4 flex flex-col justify-between shadow-md">
              <div className="flex items-center justify-between text-violet-200">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Revenue</span>
                <IndianRupee className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black">₹{stats.totalRevenue.toLocaleString("en-IN")}</span>
                <p className="text-[10px] text-zinc-300 font-medium mt-0.5">Collected via Zoho Payments</p>
              </div>
            </div>

            <div className="bg-white border border-zinc-200/70 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Active Subs</span>
                <BadgeCheck className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-zinc-900">{stats.activeSubscriptionsCount || 0}</span>
                <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Paying customers</p>
              </div>
            </div>

            <div className="bg-white border border-zinc-200/70 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Successful Payments</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-zinc-900">{stats.successPaymentsCount}</span>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Completed transactions</p>
              </div>
            </div>

            <div className="bg-white border border-zinc-200/70 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Active Mandates</span>
                <Repeat className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-zinc-900">{stats.activeMandatesCount}</span>
                <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Recurring auto-pay mandates</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Interactive Analytics & Charts Section */}
      {stats && mounted && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Chart 1: Subscription Plan Distribution (Pie/Donut) */}
          <div className="bg-white border border-zinc-200/70 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-indigo-600" />
                  Subscription Plans
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">Workspaces grouped by pricing tier</p>
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      name && percent !== undefined ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                    }
                  >
                    {planPieData.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={PLAN_COLORS[entry.name] || "#6366f1"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderColor: "#27272a",
                      color: "#ffffff",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-3 justify-center pt-2 border-t border-zinc-100">
              {planPieData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PLAN_COLORS[item.name] || "#6366f1" }}
                  />
                  {item.name}: <span className="font-bold text-zinc-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Payment Gateway Status Breakdown (Bar Chart) */}
          <div className="bg-white border border-zinc-200/70 rounded-xl p-5 flex flex-col justify-between">
            <div className="mb-2">
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Payment & Mandate Metrics
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Gateway status breakdown</p>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentBreakdownData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#71717a" }} interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: "#71717a" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderColor: "#27272a",
                      color: "#ffffff",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {paymentBreakdownData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-around pt-2 border-t border-zinc-100 text-[11px] text-zinc-500">
              <div>
                Total Txns: <span className="font-bold text-zinc-900">{stats.totalPaymentsCount}</span>
              </div>
              <div>
                Success Rate:{" "}
                <span className="font-bold text-emerald-600">
                  {stats.totalPaymentsCount > 0
                    ? `${((stats.successPaymentsCount / stats.totalPaymentsCount) * 100).toFixed(0)}%`
                    : "100%"}
                </span>
              </div>
            </div>
          </div>

          {/* Chart 3: Platform Overview Comparative Chart */}
          <div className="bg-white border border-zinc-200/70 rounded-xl p-5 flex flex-col justify-between">
            <div className="mb-2">
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-600" />
                Platform Scale Overview
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Total counts across resources</p>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformUsageData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="category" tick={{ fontSize: 9, fill: "#71717a" }} interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: "#71717a" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderColor: "#27272a",
                      color: "#ffffff",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="text-right pt-2 border-t border-zinc-100">
              <Link
                href="/admin/tenants"
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-end gap-1"
              >
                View all tenants <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Platform Core Metrics */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Platform Usage Metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-zinc-200/70 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Workspaces</p>
              <p className="text-xl font-black text-zinc-900 mt-1">{stats?.companiesCount || 0}</p>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Building className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-zinc-200/70 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Total Users</p>
              <p className="text-xl font-black text-zinc-900 mt-1">{stats?.usersCount || 0}</p>
            </div>
            <div className="p-2.5 bg-violet-50 text-violet-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-zinc-200/70 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Campaigns</p>
              <p className="text-xl font-black text-zinc-900 mt-1">{stats?.campaignsCount || 0}</p>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Send className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-zinc-200/70 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">SMTP Accounts</p>
              <p className="text-xl font-black text-zinc-900 mt-1">{stats?.smtpCount || 0}</p>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <Send className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* Recent Payments Section */}
      <section className="bg-white border border-zinc-200/70 rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Recent Payment Transactions
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Live transactions from Zoho Payments gateway</p>
          </div>
          <Link
            href="/admin/transactions"
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase text-[9px] tracking-wider">
                <th className="pb-2.5">Transaction ID</th>
                <th className="pb-2.5">Workspace</th>
                <th className="pb-2.5">Plan</th>
                <th className="pb-2.5 text-right">Amount</th>
                <th className="pb-2.5 text-center">Status</th>
                <th className="pb-2.5 text-center">Provider</th>
                <th className="pb-2.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recentPayments.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="py-2.5 font-mono text-[10px] font-bold text-zinc-800">
                    {p.transactionId}
                  </td>
                  <td className="py-2.5">
                    <p className="font-bold text-zinc-900">{p.companyName}</p>
                    <p className="text-[9px] text-zinc-400">/{p.slug}</p>
                  </td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {p.plan}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-black text-zinc-900">
                    ₹{p.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 text-center">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wider",
                        p.status === "SUCCESS"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      )}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-center text-xs font-semibold text-zinc-500 uppercase">{p.provider}</td>
                  <td className="py-2.5 text-right text-[10px] text-zinc-400 font-medium">
                    {new Date(p.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
              {recentPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-zinc-400">
                    No payments recorded yet. Online checkout transactions will appear here automatically.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Invoices mini list */}
      {recentInvoices.length > 0 && (
        <section className="bg-white border border-zinc-200/70 rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Recent Invoices
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Latest 5 invoices with PDF download</p>
            </div>
            <Link
              href="/admin/transactions"
              className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[11px]">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="pb-2.5">Invoice #</th>
                  <th className="pb-2.5">Workspace</th>
                  <th className="pb-2.5 text-right">Amount</th>
                  <th className="pb-2.5 text-center">Status</th>
                  <th className="pb-2.5 text-center">Zoho Tx ID</th>
                  <th className="pb-2.5 text-right">Date</th>
                  <th className="pb-2.5 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-2.5 font-mono text-[10px] font-bold text-indigo-700">{inv.invoiceNumber}</td>
                    <td className="py-2.5">
                      <p className="font-bold text-zinc-900">{inv.companyName}</p>
                      <p className="text-[9px] text-zinc-400">/{inv.slug}</p>
                    </td>
                    <td className="py-2.5 text-right font-black text-zinc-900">₹{inv.amount.toLocaleString("en-IN")}</td>
                    <td className="py-2.5 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase",
                          inv.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-center font-mono text-[9px] text-zinc-600">
                      {inv.zohoTransactionId?.slice(-12) || "—"}
                    </td>
                    <td className="py-2.5 text-right text-[10px] text-zinc-400">
                      {new Date(inv.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-2.5 text-right">
                      <a
                        href={`/api/admin/invoices/${inv.id}/pdf`}
                        download
                        className="flex items-center justify-end gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <Download className="w-3 h-3" /> PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/feedback";
import {
  Loader2,
  Search,
  RefreshCw,
  CreditCard,
  Repeat,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  X,
  FileText,
  Download,
  RotateCcw,
  Ban,
  TrendingUp,
  Users,
} from "lucide-react";

type MandateStatus = "ACTIVE" | "REVOKED" | "PENDING_REAUTH" | null;
type SubStatus = "ACTIVE" | "CANCELLED" | "CANCELLING" | "INACTIVE" | null;

interface Subscription {
  companyId: string;
  companyName: string;
  slug: string;
  plan: string;
  planName: string;
  planPrice: number;
  subscriptionStatus: string;
  subscription: {
    id: string;
    status: string;
    periodStart: string;
    periodEnd: string;
    zohoCustomerId?: string;
    zohoSubscriptionId?: string;
  } | null;
  mandate: {
    id: string;
    zohoMandateId: string;
    zohoCustomerId: string;
    planId: string;
    amount: number;
    paymentMode?: string;
    status: MandateStatus;
    lastChargedAt?: string;
    nextChargeAt?: string;
  } | null;
  lastPayment: {
    id: string;
    transactionId: string;
    amount: number;
    status: string;
    createdAt: string;
  } | null;
  latestInvoice: {
    id: string;
    invoiceNumber: string;
    amount: number;
    status: string;
    pdfUrl?: string;
  } | null;
  userCount: number;
  createdAt: string;
}

const PLAN_COLORS: Record<string, string> = {
  BRONZE: "bg-amber-50 text-amber-700 border-amber-200",
  SILVER: "bg-zinc-100 text-zinc-700 border-zinc-300",
  GOLD: "bg-yellow-50 text-yellow-700 border-yellow-300",
  PLATINUM: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  CANCELLING: "bg-orange-50 text-orange-700 border-orange-200",
  INACTIVE: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

// ── Action Modal ────────────────────────────────────────────────────────────
function ActionModal({
  sub,
  action,
  onClose,
  onSuccess,
}: {
  sub: Subscription;
  action: "change_plan" | "cancel" | "reactivate";
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [newPlan, setNewPlan] = useState(sub.plan);
  const [effective, setEffective] = useState<"immediate" | "period_end">("period_end");
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: sub.companyId,
          action,
          newPlan: action === "change_plan" ? newPlan : undefined,
          effective,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      toast.success(data.message || "Done");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    change_plan: "Change Subscription Plan",
    cancel: "Cancel Subscription",
    reactivate: "Reactivate Subscription",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h3 className="font-bold text-sm text-zinc-900">{titles[action]}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200/70">
            <p className="text-[10px] font-bold text-zinc-400 uppercase mb-0.5">Workspace</p>
            <p className="font-bold text-zinc-900 text-sm">{sub.companyName}</p>
            <p className="text-[11px] text-zinc-400 font-medium">/{sub.slug}</p>
          </div>

          {action === "change_plan" && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">New Plan</label>
              <div className="grid grid-cols-2 gap-2">
                {["BRONZE", "SILVER", "GOLD", "PLATINUM"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setNewPlan(p)}
                    className={cn(
                      "px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all",
                      newPlan === p
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-400"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                    )}
                  >
                    {p === "BRONZE" && "🥉 "}
                    {p === "SILVER" && "🥈 "}
                    {p === "GOLD" && "🥇 "}
                    {p === "PLATINUM" && "💎 "}
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {action === "cancel" && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">Effective</label>
              <div className="flex gap-2">
                {[
                  { val: "immediate" as const, label: "Immediately" },
                  { val: "period_end" as const, label: "End of Period" },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setEffective(opt.val)}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl border text-[11px] font-bold transition-all",
                      effective === opt.val
                        ? "border-red-400 bg-red-50 text-red-700 ring-1 ring-red-300"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {effective === "immediate" && (
                <p className="text-[10px] text-red-600 mt-2 font-medium">
                  ⚠ Plan will immediately downgrade to BRONZE.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">Reason / Note</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Internal reason for this action…"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-[11px] text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 resize-none font-medium"
            />
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-5">
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-xl border border-zinc-200 text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={cn(
              "flex-1 h-9 rounded-xl text-[11px] font-bold text-white transition-all flex items-center justify-center gap-2",
              action === "cancel"
                ? "bg-red-600 hover:bg-red-700"
                : action === "reactivate"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-indigo-600 hover:bg-indigo-700",
              loading && "opacity-60 cursor-not-allowed"
            )}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {action === "change_plan" ? "Change Plan" : action === "cancel" ? "Cancel Subscription" : "Reactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function SubscriptionsClient() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modal, setModal] = useState<{
    sub: Subscription;
    action: "change_plan" | "cancel" | "reactivate";
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscriptions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubscriptions(data.subscriptions || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const downloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    const res = await fetch(`/api/admin/invoices/${invoiceId}/pdf`);
    if (!res.ok) { toast.error("Failed to generate PDF"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = subscriptions
    .filter((s) => {
      const q = query.toLowerCase();
      return !q || s.companyName.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q);
    })
    .filter((s) => planFilter === "ALL" || s.plan === planFilter)
    .filter((s) => statusFilter === "ALL" || s.subscriptionStatus === statusFilter);

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.subscriptionStatus === "ACTIVE").length,
    mandated: subscriptions.filter((s) => s.mandate?.status === "ACTIVE").length,
    revenue: subscriptions.filter((s) => s.subscriptionStatus === "ACTIVE" && s.planPrice > 0)
      .reduce((sum, s) => sum + s.planPrice, 0),
  };

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-zinc-900">Subscription Management</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Manage all tenant subscriptions, plans, and billing</p>
        </div>
        <button
          onClick={fetchData}
          className="h-8 px-3.5 rounded-xl bg-white border border-zinc-200 text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1.5 self-start transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Workspaces", value: stats.total, icon: Users, color: "text-indigo-600" },
          { label: "Active Subscriptions", value: stats.active, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Active Mandates", value: stats.mandated, icon: Repeat, color: "text-blue-600" },
          { label: "MRR", value: `₹${stats.revenue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-amber-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-zinc-200/70 rounded-xl p-4 flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-zinc-50 border border-zinc-100", s.color)}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase">{s.label}</p>
              <p className="text-lg font-black text-zinc-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-zinc-200/70 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search workspace or slug…"
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-300"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-8 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] font-bold text-zinc-700 focus:outline-none"
          >
            <option value="ALL">All Plans</option>
            {["BRONZE", "SILVER", "GOLD", "PLATINUM"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] font-bold text-zinc-700 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            {["ACTIVE", "CANCELLED", "CANCELLING", "INACTIVE"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/60">
                {["Workspace", "Plan", "Sub Status", "Mandate", "Next Charge", "Last Payment", "Invoice", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-zinc-400 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-zinc-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-400 text-[11px]">
                    No subscriptions found.
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((s) => (
                  <tr key={s.companyId} className="hover:bg-zinc-50/50 transition-colors group">
                    {/* Workspace */}
                    <td className="px-4 py-3">
                      <p className="font-bold text-zinc-900 text-[11px]">{s.companyName}</p>
                      <p className="text-[10px] text-zinc-400 font-medium">/{s.slug}</p>
                      <p className="text-[9px] text-zinc-300">{s.userCount} users</p>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-bold border",
                          PLAN_COLORS[s.plan] || "bg-zinc-100 text-zinc-600 border-zinc-200"
                        )}
                      >
                        {s.plan}
                      </span>
                      {s.planPrice > 0 && (
                        <p className="text-[9px] text-zinc-400 mt-0.5">₹{s.planPrice}/mo</p>
                      )}
                    </td>

                    {/* Subscription Status */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-bold border",
                          STATUS_COLORS[s.subscriptionStatus] || "bg-zinc-100 text-zinc-600 border-zinc-200"
                        )}
                      >
                        {s.subscriptionStatus}
                      </span>
                      {s.subscription?.periodEnd && (
                        <p className="text-[9px] text-zinc-400 mt-0.5">
                          Until {new Date(s.subscription.periodEnd).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </td>

                    {/* Mandate */}
                    <td className="px-4 py-3">
                      {s.mandate ? (
                        <div>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[9px] font-bold border flex items-center gap-1 w-fit",
                              s.mandate.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : s.mandate.status === "REVOKED"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            )}
                          >
                            {s.mandate.status === "ACTIVE" ? (
                              <Repeat className="w-2.5 h-2.5" />
                            ) : (
                              <AlertCircle className="w-2.5 h-2.5" />
                            )}
                            {s.mandate.status}
                          </span>
                          <p className="text-[9px] text-zinc-400 mt-0.5">{s.mandate.paymentMode || "—"}</p>
                          <p className="text-[9px] text-zinc-300 font-mono">
                            {s.mandate.zohoMandateId?.slice(-8) || "—"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[9px] text-zinc-400">No mandate</span>
                      )}
                    </td>

                    {/* Next Charge */}
                    <td className="px-4 py-3 text-[11px] text-zinc-700 font-semibold">
                      {s.mandate?.nextChargeAt
                        ? new Date(s.mandate.nextChargeAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>

                    {/* Last Payment */}
                    <td className="px-4 py-3">
                      {s.lastPayment ? (
                        <div>
                          <span
                            className={cn(
                              "text-[9px] font-bold",
                              s.lastPayment.status === "SUCCESS" ? "text-emerald-600" : "text-red-600"
                            )}
                          >
                            {s.lastPayment.status === "SUCCESS" ? "✓" : "✗"} ₹{s.lastPayment.amount}
                          </span>
                          <p className="text-[9px] text-zinc-400">
                            {new Date(s.lastPayment.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[9px] text-zinc-400">—</span>
                      )}
                    </td>

                    {/* Invoice */}
                    <td className="px-4 py-3">
                      {s.latestInvoice ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-mono text-zinc-600">{s.latestInvoice.invoiceNumber}</span>
                          <button
                            onClick={() => downloadPdf(s.latestInvoice!.id, s.latestInvoice!.invoiceNumber)}
                            className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            <Download className="w-3 h-3" /> PDF
                          </button>
                        </div>
                      ) : (
                        <span className="text-[9px] text-zinc-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setModal({ sub: s, action: "change_plan" })}
                          title="Change Plan"
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-zinc-400 hover:text-indigo-600 transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                        {s.subscriptionStatus !== "CANCELLED" ? (
                          <button
                            onClick={() => setModal({ sub: s, action: "cancel" })}
                            title="Cancel Subscription"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setModal({ sub: s, action: "reactivate" })}
                            title="Reactivate Subscription"
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {modal && (
        <ActionModal
          sub={modal.sub}
          action={modal.action}
          onClose={() => setModal(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast, confirmDialog } from "@/components/ui/feedback";
import { Loader2, Search, CreditCard, X, Eye, Pencil, Trash2 } from "lucide-react";
import { PLANS } from "@/lib/plans";

interface Tenant {
  id: string;
  name: string;
  businessType: string | null;
  slug: string;
  plan: string;
  status: string;
  createdAt: string;
  users: number;
  campaigns: number;
  leads: number;
  smtpAccounts: number;
}

interface TenantDetail {
  id: string;
  name: string;
  businessType: string | null;
  workspaceSlug: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
  billingSub: { status: string; currentPeriodStart: string; currentPeriodEnd: string } | null;
  users: { id: string; name: string; email: string; role: string; status: string; createdAt: string }[];
  _count: { users: number; campaigns: number; leads: number; smtpAccounts: number; templates: number };
}

const STATUS_OPTIONS = ["ACTIVE", "TRIALING", "SUSPENDED", "EXPIRED"];

const PAYMENT_METHODS = ["Bank Transfer", "UPI", "Cash", "Cheque", "Other"];

export function TenantsClient() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  // Upgrade modal state
  const [target, setTarget] = useState<Tenant | null>(null);
  const [planId, setPlanId] = useState("GOLD");
  const [method, setMethod] = useState("Bank Transfer");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [durationDays, setDurationDays] = useState(30);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // View modal
  const [viewId, setViewId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TenantDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<Tenant | null>(null);
  const [editName, setEditName] = useState("");
  const [editBusinessType, setEditBusinessType] = useState("");
  const [editPlan, setEditPlan] = useState("SILVER");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => setMounted(true), []);

  const fetchTenants = async () => {
    try {
      const res = await fetch("/api/admin/tenants");
      if (!res.ok) throw new Error("Failed to load tenants");
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load tenants");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const openUpgrade = (t: Tenant) => {
    setTarget(t);
    const known = PLANS.find((p) => p.id === t.plan);
    setPlanId(known?.id || "GOLD");
    setMethod("Bank Transfer");
    setReference("");
    setAmount(String(known?.price ?? PLANS.find((p) => p.id === "GOLD")!.price));
    setDurationDays(30);
    setNote("");
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/tenants/${target.id}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          method,
          reference,
          amount: amount === "" ? undefined : Number(amount),
          durationDays: Number(durationDays),
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update plan");
      toast.success(data.message || "Plan updated");
      setTarget(null);
      fetchTenants();
    } catch (err: any) {
      toast.error(err.message || "Failed to update plan");
    } finally {
      setIsSaving(false);
    }
  };

  // Keep the amount field in sync when the plan changes
  const onPlanChange = (id: string) => {
    setPlanId(id);
    const p = PLANS.find((pl) => pl.id === id);
    setAmount(id === "FREE" ? "0" : String(p?.price ?? ""));
  };

  const openView = async (t: Tenant) => {
    setViewId(t.id);
    setDetail(null);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/tenants/${t.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load tenant");
      setDetail(data.tenant);
    } catch (err: any) {
      toast.error(err.message || "Failed to load tenant details");
      setViewId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openEdit = (t: Tenant) => {
    setEditTarget(t);
    setEditName(t.name);
    setEditBusinessType(t.businessType || "");
    setEditPlan(PLANS.find((p) => p.id === t.plan)?.id || "SILVER");
    setEditStatus(STATUS_OPTIONS.includes(t.status) ? t.status : "ACTIVE");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setIsEditing(true);
    try {
      const res = await fetch(`/api/admin/tenants/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          businessType: editBusinessType || null,
          subscriptionPlan: editPlan,
          subscriptionStatus: editStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update tenant");
      toast.success("Tenant updated");
      setEditTarget(null);
      fetchTenants();
    } catch (err: any) {
      toast.error(err.message || "Failed to update tenant");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async (t: Tenant) => {
    const ok = await confirmDialog({
      title: "Delete tenant?",
      description: `"${t.name}" and ALL its users, campaigns, leads, and data will be permanently deleted. This cannot be undone.`,
      confirmText: "Delete tenant",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/tenants/${t.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete tenant");
      toast.success(data.message || "Tenant deleted");
      fetchTenants();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete tenant");
    }
  };

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.slug.toLowerCase().includes(query.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-zinc-900">Tenants</h1>
          <p className="text-xs text-zinc-400 mt-0.5">{tenants.length} registered workspaces</p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tenants..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-full sm:w-56 pl-8 pr-3 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-300"
          />
        </div>
      </div>

      <div className="bg-white border border-zinc-200/70 rounded-xl p-5 overflow-x-auto">
        <table className="w-full border-collapse text-left text-[11px] text-zinc-600">
          <thead>
            <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase text-[9px] tracking-wider">
              <th className="pb-2.5">Company</th>
              <th className="pb-2.5">Slug</th>
              <th className="pb-2.5 text-center">Plan</th>
              <th className="pb-2.5 text-center">Status</th>
              <th className="pb-2.5 text-center">Users</th>
              <th className="pb-2.5 text-center">Campaigns</th>
              <th className="pb-2.5 text-center">Leads</th>
              <th className="pb-2.5 text-right">Created</th>
              <th className="pb-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="py-2.5 font-bold text-zinc-900">{t.name}</td>
                <td className="py-2.5 font-semibold text-zinc-500">/{t.slug}</td>
                <td className="py-2.5 text-center">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200/60">
                    {t.plan}
                  </span>
                </td>
                <td className="py-2.5 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${
                      t.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : t.status === "TRIALING"
                        ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                        : "bg-amber-50 text-amber-600 border-amber-100"
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="py-2.5 text-center font-semibold text-zinc-700">{t.users}</td>
                <td className="py-2.5 text-center font-semibold text-zinc-700">{t.campaigns}</td>
                <td className="py-2.5 text-center font-semibold text-zinc-700">{t.leads}</td>
                <td className="py-2.5 text-right text-zinc-500">
                  {new Date(t.createdAt).toLocaleDateString()}
                </td>
                <td className="py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openView(t)}
                      title="View details"
                      className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-500 hover:text-indigo-600 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEdit(t)}
                      title="Edit tenant"
                      className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openUpgrade(t)}
                      title="Manual plan upgrade"
                      className="p-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      title="Delete tenant"
                      className="p-1.5 rounded-lg border border-transparent hover:border-red-200 hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-zinc-400">
                  No tenants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Manual upgrade modal */}
      {target && mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => !isSaving && setTarget(null)}
          >
            <form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleUpgrade}
              className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" /> Manual Plan Upgrade
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">
                    {target.name} · current: <span className="font-bold">{target.plan}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTarget(null)}
                  className="text-zinc-400 hover:text-zinc-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Plan</label>
                  <select
                    value={planId}
                    onChange={(e) => onPlanChange(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-indigo-300"
                  >
                    {PLANS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.price}/mo)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Payment Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-indigo-300"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-indigo-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Duration (days)</label>
                  <input
                    type="number"
                    min={1}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full h-9 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-indigo-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Payment Reference / Txn ID</label>
                <input
                  type="text"
                  placeholder="e.g. NEFT ref, UPI txn id, receipt no."
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-indigo-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Note (optional)</label>
                <input
                  type="text"
                  placeholder="Internal note for the audit log"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-indigo-300"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setTarget(null)}
                  className="h-9 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                  Apply Upgrade
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* View detail modal */}
      {viewId && mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setViewId(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600" /> Tenant Details
                </h3>
                <button onClick={() => setViewId(null)} className="text-zinc-400 hover:text-zinc-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingDetail || !detail ? (
                <div className="py-10 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-base font-black text-zinc-900">{detail.name}</h4>
                    <p className="text-xs text-zinc-500 font-semibold">/{detail.workspaceSlug}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      ["Plan", detail.subscriptionPlan],
                      ["Status", detail.subscriptionStatus],
                      ["Business Type", detail.businessType || "—"],
                      ["Trial Ends", detail.trialEndsAt ? new Date(detail.trialEndsAt).toLocaleDateString() : "—"],
                      ["Created", new Date(detail.createdAt).toLocaleDateString()],
                      [
                        "Renews",
                        detail.billingSub
                          ? new Date(detail.billingSub.currentPeriodEnd).toLocaleDateString()
                          : "—",
                      ],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">{k}</div>
                        <div className="font-bold text-zinc-800 mt-0.5">{v}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      ["Users", detail._count.users],
                      ["Campaigns", detail._count.campaigns],
                      ["Leads", detail._count.leads],
                      ["SMTP", detail._count.smtpAccounts],
                    ].map(([k, v]) => (
                      <div key={k} className="border border-zinc-100 rounded-lg py-2">
                        <div className="text-lg font-black text-zinc-900">{v}</div>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">{k}</div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Members ({detail.users.length})
                    </div>
                    <div className="divide-y divide-zinc-100 border border-zinc-100 rounded-lg max-h-48 overflow-y-auto">
                      {detail.users.map((u) => (
                        <div key={u.id} className="flex items-center justify-between px-3 py-2 text-xs">
                          <div className="min-w-0">
                            <div className="font-bold text-zinc-800 truncate">{u.name}</div>
                            <div className="text-zinc-400 truncate">{u.email}</div>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 uppercase shrink-0">
                            {u.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Edit tenant modal */}
      {editTarget && mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => !isEditing && setEditTarget(null)}
          >
            <form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleEdit}
              className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-indigo-600" /> Edit Tenant
                </h3>
                <button type="button" onClick={() => setEditTarget(null)} className="text-zinc-400 hover:text-zinc-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Company Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full h-9 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-indigo-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Business Type</label>
                <input
                  type="text"
                  value={editBusinessType}
                  onChange={(e) => setEditBusinessType(e.target.value)}
                  placeholder="—"
                  className="w-full h-9 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-indigo-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Plan</label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-indigo-300"
                  >
                    {PLANS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-indigo-300"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-[10px] text-zinc-400 font-medium">
                Note: editing the plan/status here does not record a payment. Use the card icon for manual paid upgrades.
              </p>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="h-9 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-60"
                >
                  {isEditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
    </div>
  );
}

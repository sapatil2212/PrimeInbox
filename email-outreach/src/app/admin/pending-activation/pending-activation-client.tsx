"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "@/components/ui/feedback";
import { Loader2, Search, X, BadgeCheck, Clock, Mail } from "lucide-react";
import { PLANS, getPlan } from "@/lib/plans";

interface PendingTenant {
  id: string;
  name: string;
  businessType: string | null;
  slug: string;
  plan: string;
  status: string;
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
  ownerContact: string | null;
  users: number;
}

const PAYMENT_METHODS = ["Bank Transfer", "UPI", "Cash", "Cheque", "Other"];

export function PendingActivationClient() {
  const [pending, setPending] = useState<PendingTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  // Activation modal state
  const [target, setTarget] = useState<PendingTenant | null>(null);
  const [planId, setPlanId] = useState("SILVER");
  const [method, setMethod] = useState("Bank Transfer");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [durationDays, setDurationDays] = useState(30);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => setMounted(true), []);

  const fetchPending = async () => {
    try {
      const res = await fetch("/api/admin/pending-activations");
      if (!res.ok) throw new Error("Failed to load pending activations");
      const data = await res.json();
      setPending(data.pending || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load pending activations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const openActivate = (t: PendingTenant) => {
    setTarget(t);
    const known = getPlan(t.plan);
    setPlanId(known?.id || "SILVER");
    setMethod("Bank Transfer");
    setReference("");
    setAmount(String(known?.price ?? ""));
    setDurationDays(30);
    setNote("");
  };

  const onPlanChange = (id: string) => {
    setPlanId(id);
    const p = getPlan(id);
    setAmount(String(p?.price ?? ""));
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/tenants/${target.id}/activate`, {
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
      if (!res.ok) throw new Error(data.error || "Failed to activate workspace");
      toast.success(data.message || "Workspace activated");
      setTarget(null);
      fetchPending();
    } catch (err: any) {
      toast.error(err.message || "Failed to activate workspace");
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = pending.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.slug.toLowerCase().includes(query.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(query.toLowerCase())
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
          <h1 className="text-lg md:text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" /> Pending Activation
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {pending.length} workspace{pending.length === 1 ? "" : "s"} awaiting paid activation
          </p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-full sm:w-64 pl-8 pr-3 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-300"
          />
        </div>
      </div>

      <div className="bg-white border border-zinc-200/70 rounded-xl p-5 overflow-x-auto">
        <table className="w-full border-collapse text-left text-[11px] text-zinc-600">
          <thead>
            <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase text-[9px] tracking-wider">
              <th className="pb-2.5">Company</th>
              <th className="pb-2.5">Owner</th>
              <th className="pb-2.5">Email</th>
              <th className="pb-2.5 text-center">Plan</th>
              <th className="pb-2.5 text-center">Status</th>
              <th className="pb-2.5 text-right">Registered</th>
              <th className="pb-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="py-2.5 font-bold text-zinc-900">
                  {t.name}
                  <span className="block font-semibold text-zinc-400">/{t.slug}</span>
                </td>
                <td className="py-2.5 font-semibold text-zinc-700">{t.ownerName}</td>
                <td className="py-2.5 font-semibold text-zinc-500">{t.ownerEmail}</td>
                <td className="py-2.5 text-center">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200/60">
                    {t.plan}
                  </span>
                </td>
                <td className="py-2.5 text-center">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold border bg-amber-50 text-amber-600 border-amber-100">
                    PENDING
                  </span>
                </td>
                <td className="py-2.5 text-right text-zinc-500">
                  {new Date(t.createdAt).toLocaleDateString()}
                </td>
                <td className="py-2.5 text-right">
                  <button
                    onClick={() => openActivate(t)}
                    title="Mark as paid and activate this workspace"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold transition-colors"
                  >
                    <BadgeCheck className="w-3.5 h-3.5" /> Paid &amp; Activate
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-zinc-400 font-semibold">
                  No workspaces are pending activation.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Activation modal */}
      {target && mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => !isSaving && setTarget(null)}
          >
            <form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleActivate}
              className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-red-600" /> Paid &amp; Activate
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">
                    {target.name} · {target.ownerEmail}
                  </p>
                </div>
                <button type="button" onClick={() => setTarget(null)} className="text-zinc-400 hover:text-zinc-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-lg bg-indigo-50/60 border border-indigo-100 px-3 py-2 text-[11px] font-semibold text-indigo-700 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                An activation email with a login link &amp; plan details will be sent to the owner.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Plan</label>
                  <select
                    value={planId}
                    onChange={(e) => onPlanChange(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-indigo-300"
                  >
                    {PLANS.filter((p) => !p.free).map((p) => (
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
                  className="h-9 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                  Paid &amp; Activate
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
    </div>
  );
}

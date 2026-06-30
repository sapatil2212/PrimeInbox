"use client";

import { useEffect, useState } from "react";
import { toast, confirmDialog } from "@/components/ui/feedback";
import {
  Ban,
  Loader2,
  Search,
  Plus,
  MailX,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { cn } from "@/lib/utils";

interface Suppression {
  id: string;
  email: string;
  reason: string;
  createdAt: string;
}

interface Counts {
  total: number;
  unsubscribed: number;
  bounced: number;
}

const REASON_STYLES: Record<string, string> = {
  UNSUBSCRIBED: "bg-amber-50 text-amber-700 border-amber-200",
  BOUNCED: "bg-red-50 text-red-700 border-red-200",
  MANUAL: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export default function UnsubscribesPage() {
  const [items, setItems] = useState<Suppression[]>([]);
  const [counts, setCounts] = useState<Counts>({ total: 0, unsubscribed: 0, bounced: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/unsubscribes");
      if (!res.ok) throw new Error("Failed to load suppression list");
      const data = await res.json();
      setItems(data.suppressions || []);
      setCounts(data.counts || { total: 0, unsubscribed: 0, bounced: 0 });
    } catch (err: any) {
      toast.error(err.message || "Failed to load suppression list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch("/api/unsubscribes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add email");
      toast.success(data.message || "Email added to suppression list");
      setNewEmail("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add email");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (s: Suppression) => {
    const ok = await confirmDialog({
      title: "Remove from suppression list?",
      description: `"${s.email}" will be able to receive emails from your campaigns again.`,
      confirmText: "Remove & re-allow",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/unsubscribes?id=${encodeURIComponent(s.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove entry");
      toast.success(data.message || "Removed from suppression list");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove entry");
    }
  };

  const filtered = items.filter((s) =>
    s.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 flex items-center gap-2">
            <Ban className="w-6 h-6 text-red-600" /> Unsubscribes
          </h1>
          <p className="text-sm text-zinc-500 font-medium">
            Emails on this list are blacklisted — campaigns will never send to them.
          </p>
        </div>
      </header>

      {/* Stat cards */}
      <section className="grid grid-cols-3 gap-3">
        <div className="border border-zinc-200 bg-white rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
            <Ban className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Blocked</span>
          </div>
          <div className="text-2xl font-black text-zinc-900">{counts.total}</div>
        </div>
        <div className="border border-zinc-200 bg-white rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-amber-500 mb-1">
            <MailX className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Unsubscribed</span>
          </div>
          <div className="text-2xl font-black text-zinc-900">{counts.unsubscribed}</div>
        </div>
        <div className="border border-zinc-200 bg-white rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-red-500 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Bounced</span>
          </div>
          <div className="text-2xl font-black text-zinc-900">{counts.bounced}</div>
        </div>
      </section>

      {/* Add + search controls */}
      <section className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            type="email"
            placeholder="Add email to blacklist..."
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="h-9 w-full sm:w-64 px-3 rounded-lg bg-white border border-zinc-200 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-indigo-300"
          />
          <ShimmerButton
            type="submit"
            disabled={isAdding}
            className="h-9 px-4 rounded-lg text-xs font-bold bg-zinc-900 text-white hover:bg-black flex items-center gap-1.5 shrink-0"
            shimmerColor="#ef4444"
          >
            {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add
          </ShimmerButton>
        </form>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search emails..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full sm:w-56 pl-8 pr-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-300"
          />
        </div>
      </section>

      {/* Table */}
      <section className="bg-white border border-zinc-200 rounded-xl p-5 overflow-x-auto">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          </div>
        ) : (
          <table className="w-full text-left text-xs text-zinc-600">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase text-[9px] tracking-wider">
                <th className="pb-3">Email</th>
                <th className="pb-3 text-center">Reason</th>
                <th className="pb-3 text-right">Date</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50/50">
                  <td className="py-3 font-mono font-semibold text-zinc-800">{s.email}</td>
                  <td className="py-3 text-center">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border",
                        REASON_STYLES[s.reason] || REASON_STYLES.MANUAL
                      )}
                    >
                      {s.reason}
                    </span>
                  </td>
                  <td className="py-3 text-right text-zinc-500">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleRemove(s)}
                      title="Remove from list & allow sending again"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:border-emerald-200 hover:bg-emerald-50 text-zinc-500 hover:text-emerald-600 text-[10px] font-bold transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Re-allow
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-zinc-400 font-semibold">
                    {query ? "No matching emails." : "No unsubscribed or blacklisted emails yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

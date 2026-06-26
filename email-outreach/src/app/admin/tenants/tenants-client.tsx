"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";

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

export function TenantsClient() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

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
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                    {t.status}
                  </span>
                </td>
                <td className="py-2.5 text-center font-semibold text-zinc-700">{t.users}</td>
                <td className="py-2.5 text-center font-semibold text-zinc-700">{t.campaigns}</td>
                <td className="py-2.5 text-center font-semibold text-zinc-700">{t.leads}</td>
                <td className="py-2.5 text-right text-zinc-500">
                  {new Date(t.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-zinc-400">
                  No tenants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Plug, UserCog, Server } from "lucide-react";
import { cn } from "@/lib/utils";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin: string | null;
  timezone: string;
  language: string;
}

interface Platform {
  environment: string;
  nodeVersion: string;
  platform: string;
}

interface Integration {
  key: string;
  configured: boolean;
}

export function SettingsClient() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) throw new Error("Failed to load settings");
        const data = await res.json();
        setAdmin(data.admin);
        setPlatform(data.platform);
        setIntegrations(data.integrations || []);
      } catch (err: any) {
        toast.error(err.message || "Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-zinc-900">Settings</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Admin profile and platform configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Admin profile */}
        {admin && (
          <section className="bg-white border border-zinc-200/70 rounded-xl p-5">
            <h3 className="font-bold text-sm text-zinc-900 mb-4 flex items-center gap-1.5">
              <UserCog className="w-3.5 h-3.5 text-zinc-400" /> Admin Profile
            </h3>
            <div className="space-y-3 text-[11px]">
              {[
                { label: "Name", value: admin.name },
                { label: "Email", value: admin.email },
                { label: "Role", value: admin.role.replace("_", " ") },
                { label: "Timezone", value: admin.timezone },
                { label: "Language", value: admin.language },
                {
                  label: "Last Login",
                  value: admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : "—",
                },
                { label: "Member Since", value: new Date(admin.createdAt).toLocaleDateString() },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-zinc-100 pb-2 last:border-0">
                  <span className="font-semibold text-zinc-400 uppercase text-[9px] tracking-wider">
                    {row.label}
                  </span>
                  <span className="font-bold text-zinc-700">{row.value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="space-y-5">
          {/* Platform info */}
          {platform && (
            <section className="bg-white border border-zinc-200/70 rounded-xl p-5">
              <h3 className="font-bold text-sm text-zinc-900 mb-4 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-zinc-400" /> Platform
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-50 border border-zinc-200/60 rounded-lg p-3">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Env</span>
                  <p className="text-[11px] font-bold text-zinc-700 mt-0.5 capitalize">{platform.environment}</p>
                </div>
                <div className="bg-zinc-50 border border-zinc-200/60 rounded-lg p-3">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Node</span>
                  <p className="text-[11px] font-bold text-zinc-700 mt-0.5">{platform.nodeVersion}</p>
                </div>
                <div className="bg-zinc-50 border border-zinc-200/60 rounded-lg p-3">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">OS</span>
                  <p className="text-[11px] font-bold text-zinc-700 mt-0.5">{platform.platform}</p>
                </div>
              </div>
            </section>
          )}

          {/* Integrations */}
          <section className="bg-white border border-zinc-200/70 rounded-xl p-5">
            <h3 className="font-bold text-sm text-zinc-900 mb-4 flex items-center gap-1.5">
              <Plug className="w-3.5 h-3.5 text-zinc-400" /> Integrations
            </h3>
            <div className="space-y-2">
              {integrations.map((it) => (
                <div
                  key={it.key}
                  className="flex items-center justify-between bg-zinc-50 border border-zinc-200/60 rounded-lg px-3 py-2"
                >
                  <span className="text-[11px] font-semibold text-zinc-700">{it.key}</span>
                  <span
                    className={cn(
                      "flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider",
                      it.configured ? "text-emerald-600" : "text-zinc-400"
                    )}
                  >
                    {it.configured ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Configured
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> Not Set
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

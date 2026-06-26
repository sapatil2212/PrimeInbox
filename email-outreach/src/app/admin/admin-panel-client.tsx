"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Building,
  Users,
  Send,
  Key,
  Activity,
  Database,
  Loader2,
  Trash2,
  Play,
  Terminal,
  Server,
  Clock,
} from "lucide-react";

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

interface LogItem {
  id: string;
  level: string;
  service: string;
  message: string;
  createdAt: string;
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
}

export function AdminPanelClient() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantQuery, setTenantQuery] = useState("");
  const [logFilter, setLogFilter] = useState("ALL");

  const fetchAdminData = async () => {
    try {
      const statsRes = await fetch("/api/admin/stats");
      if (!statsRes.ok) throw new Error("Failed to load admin stats");
      const statsData = await statsRes.json();
      setStats(statsData.stats);
      setHealth(statsData.health);
      setTenants(statsData.tenants || []);

      const logsRes = await fetch("/api/admin/logs");
      if (!logsRes.ok) throw new Error("Failed to load system logs");
      const logsData = await logsRes.json();
      setLogs(logsData.logs || []);
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

  const handleAction = async (actionType: "flush_queue" | "trigger_health") => {
    if (actionType === "flush_queue" && !confirm("Flush queue?")) return;

    try {
      const res = await fetch("/api/admin/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType }),
      });
      if (!res.ok) throw new Error("Failed to execute action");
      const data = await res.json();
      toast.success(data.message || "Action completed");
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    }
  };

  const filteredTenants = tenants.filter((t) =>
    t.name.toLowerCase().includes(tenantQuery.toLowerCase()) ||
    t.slug.toLowerCase().includes(tenantQuery.toLowerCase())
  );

  const filteredLogs = logs.filter((l) => logFilter === "ALL" || l.level === logFilter);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400 mx-auto mb-2" />
          <p className="text-[10px] font-bold uppercase text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-lg md:text-xl font-bold text-zinc-900">Admin Overview</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Monitor system health and platform metrics</p>
      </div>

      {/* Health Status Cards */}
      {health && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white border border-zinc-200/70 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60 text-emerald-500">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Database</h4>
                <p className="text-xs font-bold text-zinc-900 mt-0.5">{health.database.status}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-zinc-400 font-bold block uppercase">Latency</span>
              <span className="text-[11px] font-bold text-zinc-600">{health.database.latency}</span>
            </div>
          </div>

          <div className="bg-white border border-zinc-200/70 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60 text-indigo-500">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Redis Cache</h4>
                <p className="text-xs font-bold text-zinc-900 mt-0.5">{health.redis.status}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-zinc-400 font-bold block uppercase">Port</span>
              <span className="text-[11px] font-bold text-zinc-600">{health.redis.port}</span>
            </div>
          </div>

          <div className="bg-white border border-zinc-200/70 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60 text-amber-500">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Send Queue</h4>
                <p className="text-xs font-bold text-zinc-900 mt-0.5">{health.queue.workerStatus}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-zinc-400 font-bold block uppercase">Backlog</span>
              <span className="text-[11px] font-bold text-zinc-600">{health.queue.pendingJobs} jobs</span>
            </div>
          </div>
        </section>
      )}

      {/* Stats Cards */}
      {stats && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-zinc-200/70 rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Building className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Tenants</span>
            </div>
            <span className="text-xl font-bold text-zinc-900">{stats.companiesCount}</span>
            <p className="text-[9px] text-zinc-400 font-medium">Active workspaces</p>
          </div>

          <div className="bg-white border border-zinc-200/70 rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Users</span>
            </div>
            <span className="text-xl font-bold text-zinc-900">{stats.usersCount}</span>
            <p className="text-[9px] text-zinc-400 font-medium">Total platform users</p>
          </div>

          <div className="bg-white border border-zinc-200/70 rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Send className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Campaigns</span>
            </div>
            <span className="text-xl font-bold text-zinc-900">{stats.campaignsCount}</span>
            <p className="text-[9px] text-zinc-400 font-medium">Active sequences</p>
          </div>

          <div className="bg-white border border-zinc-200/70 rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Key className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">SMTP Accounts</span>
            </div>
            <span className="text-xl font-bold text-zinc-900">{stats.smtpCount}</span>
            <p className="text-[9px] text-zinc-400 font-medium">Connected servers</p>
          </div>
        </section>
      )}

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Tenant Registry */}
        <div className="xl:col-span-2 bg-white border border-zinc-200/70 rounded-xl p-5 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-zinc-900">Workspace Registry</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">All registered tenant workspaces</p>
            </div>
            <input
              type="text"
              placeholder="Filter workspaces..."
              value={tenantQuery}
              onChange={(e) => setTenantQuery(e.target.value)}
              className="h-8 w-full sm:w-44 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-300"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[11px] text-zinc-600">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="pb-2.5">Company</th>
                  <th className="pb-2.5">Slug</th>
                  <th className="pb-2.5 text-center">Plan</th>
                  <th className="pb-2.5 text-center">Status</th>
                  <th className="pb-2.5 text-right">Users</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredTenants.map((t) => (
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
                    <td className="py-2.5 text-right font-semibold text-zinc-700">{t.users}</td>
                  </tr>
                ))}
                {filteredTenants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-zinc-400">No workspaces found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Control Panel */}
        <div className="bg-white border border-zinc-200/70 rounded-xl p-5 flex flex-col gap-5">
          <div>
            <h3 className="font-bold text-sm text-zinc-900">System Controls</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Administrative actions</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-lg flex flex-col gap-1.5">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Trash2 className="w-3 h-3" /> Queue Management
              </span>
              <p className="text-[10px] text-zinc-500 leading-relaxed">Flush the sending backlog to cancel frozen runs</p>
              <button
                onClick={() => handleAction("flush_queue")}
                className="mt-1.5 h-8 px-3 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-[11px] font-bold text-zinc-600 hover:text-zinc-900 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Flush Queue
              </button>
            </div>

            <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-lg flex flex-col gap-1.5">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Play className="w-3 h-3" /> Health Check
              </span>
              <p className="text-[10px] text-zinc-500 leading-relaxed">Run diagnostic telemetry across services</p>
              <button
                onClick={() => handleAction("trigger_health")}
                className="mt-1.5 h-8 px-3 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-[11px] font-bold text-zinc-600 hover:text-zinc-900 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3 h-3" /> Run Diagnostic
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Log Stream */}
      <section className="bg-white border border-zinc-200/70 rounded-xl p-5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
              System Logs <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Real-time platform activity stream</p>
          </div>

          <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-lg border border-zinc-200/70">
            {["ALL", "INFO", "WARN", "ERROR"].map((filter) => (
              <button
                key={filter}
                onClick={() => setLogFilter(filter)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider uppercase transition-colors cursor-pointer",
                  logFilter === filter
                    ? "bg-white text-zinc-700 border border-zinc-200"
                    : "text-zinc-400 hover:text-zinc-700"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-3.5 font-mono text-[10px] max-h-72 overflow-y-auto divide-y divide-zinc-900/40">
          {filteredLogs.map((log) => (
            <div key={log.id} className="py-2 flex flex-col sm:flex-row sm:items-center gap-2 select-text">
              <span className="text-zinc-500 shrink-0 flex items-center gap-1.5">
                <Clock className="w-2.5 h-2.5" />
                {new Date(log.createdAt).toLocaleTimeString()}
              </span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shrink-0",
                  log.level === "ERROR"
                    ? "bg-red-950/50 text-red-400/90 border border-red-900/30"
                    : log.level === "WARN"
                    ? "bg-amber-950/50 text-amber-400/90 border border-amber-900/30"
                    : "bg-zinc-900 text-zinc-400"
                )}
              >
                {log.level}
              </span>
              <span className="text-zinc-500 shrink-0 font-semibold uppercase text-[8px] border border-zinc-800 px-1.5 py-0.5 rounded bg-zinc-900/30">
                {log.service}
              </span>
              <span className="text-zinc-300 ml-1 leading-relaxed break-all">{log.message}</span>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="py-6 text-center text-zinc-500">No logs available.</div>
          )}
        </div>
      </section>
    </div>
  );
}

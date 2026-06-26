"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/feedback";
import { Loader2, Database, Server, Activity, Cpu, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthData {
  database: { status: string; latency: string };
  redis: { status: string; host: string; port: number };
  queue: { workerStatus: string; queued: number; processing: number; failed: number; sent: number };
  smtp: { active: number; paused: number; rateLimited: number; blocked: number; invalid: number };
  system: {
    uptime: number;
    nodeVersion: string;
    platform: string;
    memoryUsedMb: number;
    memoryTotalMb: number;
  };
}

function StatusDot({ healthy }: { healthy: boolean }) {
  return (
    <span
      className={cn(
        "w-2 h-2 rounded-full inline-block",
        healthy ? "bg-emerald-500" : "bg-zinc-300"
      )}
    />
  );
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

export function HealthClient() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/health");
      if (!res.ok) throw new Error("Failed to load system health");
      const data = await res.json();
      setHealth(data.health);
    } catch (err: any) {
      toast.error(err.message || "Failed to load system health");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !health) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-zinc-900">System Health</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Live diagnostics, refreshed every 15s</p>
      </div>

      {/* Core services */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border border-zinc-200/70 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-zinc-500">
              <Database className="w-4 h-4 text-zinc-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Database</span>
            </div>
            <StatusDot healthy={health.database.status === "HEALTHY"} />
          </div>
          <p className="text-sm font-bold text-zinc-900">{health.database.status}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Latency {health.database.latency}</p>
        </div>

        <div className="bg-white border border-zinc-200/70 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-zinc-500">
              <Server className="w-4 h-4 text-zinc-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Redis Cache</span>
            </div>
            <StatusDot healthy={health.redis.status === "HEALTHY"} />
          </div>
          <p className="text-sm font-bold text-zinc-900">{health.redis.status}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            {health.redis.host}:{health.redis.port}
          </p>
        </div>

        <div className="bg-white border border-zinc-200/70 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-zinc-500">
              <Activity className="w-4 h-4 text-zinc-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Worker</span>
            </div>
            <StatusDot healthy={health.queue.workerStatus === "ACTIVE"} />
          </div>
          <p className="text-sm font-bold text-zinc-900">{health.queue.workerStatus}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">{health.queue.queued} jobs queued</p>
        </div>
      </section>

      {/* Queue breakdown */}
      <section className="bg-white border border-zinc-200/70 rounded-xl p-5">
        <h3 className="font-bold text-sm text-zinc-900 mb-3">Queue Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Queued", value: health.queue.queued },
            { label: "Processing", value: health.queue.processing },
            { label: "Failed", value: health.queue.failed },
            { label: "Sent", value: health.queue.sent },
          ].map((item) => (
            <div key={item.label} className="bg-zinc-50 border border-zinc-200/60 rounded-lg p-3">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                {item.label}
              </span>
              <p className="text-lg font-bold text-zinc-900 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SMTP health */}
      <section className="bg-white border border-zinc-200/70 rounded-xl p-5">
        <h3 className="font-bold text-sm text-zinc-900 mb-3 flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-zinc-400" /> SMTP Accounts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Active", value: health.smtp.active },
            { label: "Paused", value: health.smtp.paused },
            { label: "Rate Limited", value: health.smtp.rateLimited },
            { label: "Blocked", value: health.smtp.blocked },
            { label: "Invalid", value: health.smtp.invalid },
          ].map((item) => (
            <div key={item.label} className="bg-zinc-50 border border-zinc-200/60 rounded-lg p-3">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                {item.label}
              </span>
              <p className="text-lg font-bold text-zinc-900 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* System runtime */}
      <section className="bg-white border border-zinc-200/70 rounded-xl p-5">
        <h3 className="font-bold text-sm text-zinc-900 mb-3 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-zinc-400" /> Runtime
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-50 border border-zinc-200/60 rounded-lg p-3">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Uptime</span>
            <p className="text-sm font-bold text-zinc-900 mt-0.5">{formatUptime(health.system.uptime)}</p>
          </div>
          <div className="bg-zinc-50 border border-zinc-200/60 rounded-lg p-3">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Memory</span>
            <p className="text-sm font-bold text-zinc-900 mt-0.5">
              {health.system.memoryUsedMb}/{health.system.memoryTotalMb} MB
            </p>
          </div>
          <div className="bg-zinc-50 border border-zinc-200/60 rounded-lg p-3">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Node</span>
            <p className="text-sm font-bold text-zinc-900 mt-0.5">{health.system.nodeVersion}</p>
          </div>
          <div className="bg-zinc-50 border border-zinc-200/60 rounded-lg p-3">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Platform</span>
            <p className="text-sm font-bold text-zinc-900 mt-0.5">{health.system.platform}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

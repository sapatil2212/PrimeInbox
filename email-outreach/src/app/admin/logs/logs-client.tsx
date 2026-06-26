"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Terminal, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogItem {
  id: string;
  level: string;
  service: string;
  message: string;
  createdAt: string;
}

export function LogsClient() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [query, setQuery] = useState("");

  const load = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/logs");
      if (!res.ok) throw new Error("Failed to load logs");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load logs");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const services = ["ALL", ...Array.from(new Set(logs.map((l) => l.service)))];

  const filtered = logs.filter((l) => {
    const matchLevel = levelFilter === "ALL" || l.level === levelFilter;
    const matchService = serviceFilter === "ALL" || l.service === serviceFilter;
    const matchQuery = l.message.toLowerCase().includes(query.toLowerCase());
    return matchLevel && matchService && matchQuery;
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-zinc-900 flex items-center gap-1.5">
            System Logs <Terminal className="w-4 h-4 text-zinc-400" />
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">{logs.length} recent entries</p>
        </div>
        <button
          onClick={() => load(false)}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-zinc-600")} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-lg border border-zinc-200/70">
          {["ALL", "INFO", "WARN", "ERROR"].map((f) => (
            <button
              key={f}
              onClick={() => setLevelFilter(f)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider uppercase transition-colors cursor-pointer",
                levelFilter === f
                  ? "bg-white text-zinc-700 border border-zinc-200"
                  : "text-zinc-400 hover:text-zinc-700"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-lg border border-zinc-200/70 overflow-x-auto">
          {services.map((s) => (
            <button
              key={s}
              onClick={() => setServiceFilter(s)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider uppercase transition-colors cursor-pointer whitespace-nowrap",
                serviceFilter === s
                  ? "bg-white text-zinc-700 border border-zinc-200"
                  : "text-zinc-400 hover:text-zinc-700"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search messages..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 lg:ml-auto w-full lg:w-56 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-300"
        />
      </div>

      {/* Log console */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3.5 font-mono text-[10px] max-h-[60vh] overflow-y-auto divide-y divide-zinc-900/40">
        {filtered.map((log) => (
          <div key={log.id} className="py-2 flex flex-col sm:flex-row sm:items-center gap-2 select-text">
            <span className="text-zinc-500 shrink-0 flex items-center gap-1.5">
              <Clock className="w-2.5 h-2.5" />
              {new Date(log.createdAt).toLocaleString()}
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
        {filtered.length === 0 && (
          <div className="py-6 text-center text-zinc-500">No logs matching filters.</div>
        )}
      </div>
    </div>
  );
}

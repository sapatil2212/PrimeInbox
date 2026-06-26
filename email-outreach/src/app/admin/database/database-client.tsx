"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Database, HardDrive, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableInfo {
  name: string;
  rows: number;
  group: string;
}

interface DbData {
  status: string;
  latency: string;
  provider: string;
  host: string;
  totalRows: number;
  tables: TableInfo[];
}

export function DatabaseClient() {
  const [data, setData] = useState<DbData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/database");
        if (!res.ok) throw new Error("Failed to load database info");
        const json = await res.json();
        setData(json.database);
      } catch (err: any) {
        toast.error(err.message || "Failed to load database info");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  const maxRows = Math.max(...data.tables.map((t) => t.rows), 1);

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-zinc-900">Database</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Connection status and table metrics</p>
      </div>

      {/* Connection cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-zinc-200/70 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Database className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Status</span>
          </div>
          <p className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
            <span
              className={cn(
                "w-2 h-2 rounded-full inline-block",
                data.status === "HEALTHY" ? "bg-emerald-500" : "bg-zinc-300"
              )}
            />
            {data.status}
          </p>
        </div>
        <div className="bg-white border border-zinc-200/70 rounded-xl p-4">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Latency</span>
          <p className="text-sm font-bold text-zinc-900 mt-1">{data.latency}</p>
        </div>
        <div className="bg-white border border-zinc-200/70 rounded-xl p-4">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Provider</span>
          <p className="text-sm font-bold text-zinc-900 mt-1 uppercase">{data.provider}</p>
        </div>
        <div className="bg-white border border-zinc-200/70 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Total Rows</span>
          </div>
          <p className="text-sm font-bold text-zinc-900 mt-0.5">{data.totalRows.toLocaleString()}</p>
        </div>
      </section>

      {/* Tables */}
      <section className="bg-white border border-zinc-200/70 rounded-xl p-5">
        <h3 className="font-bold text-sm text-zinc-900 mb-4 flex items-center gap-1.5">
          <Table2 className="w-3.5 h-3.5 text-zinc-400" /> Table Row Counts
        </h3>
        <div className="space-y-2.5">
          {data.tables.map((t) => (
            <div key={t.name} className="flex items-center gap-3">
              <div className="w-40 shrink-0">
                <span className="text-[11px] font-bold text-zinc-700">{t.name}</span>
                <span className="text-[9px] text-zinc-400 ml-1.5">{t.group}</span>
              </div>
              <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-400 rounded-full transition-all"
                  style={{ width: `${Math.max((t.rows / maxRows) * 100, 2)}%` }}
                />
              </div>
              <span className="w-16 text-right text-[11px] font-bold text-zinc-700">
                {t.rows.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast, confirmDialog } from "@/components/ui/feedback";
import {
  Plus,
  Search,
  Play,
  Pause,
  Copy,
  Trash2,
  ArrowUpRight,
  Loader2,
  FolderOpen,
  Send,
  MailOpen,
  MessageSquare,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Users,
} from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { cn } from "@/lib/utils";

type CampaignStatus = "DRAFT" | "RUNNING" | "PAUSED" | "COMPLETED" | "ARCHIVED";

interface CampaignItem {
  id: string;
  name: string;
  status: CampaignStatus;
  dailySendLimit: number;
  timezone: string;
  createdAt: string;
  _count: { leads: number; emailEvents: number };
  stats: {
    sent: number;
    open: number;
    click: number;
    reply: number;
    bounce: number;
    openRate: number;
    clickRate: number;
    replyRate: number;
    bounceRate: number;
    progress: number;
    totalLeads: number;
    activeLeads: number;
  };
}

const STATUS_STYLES: Record<CampaignStatus, string> = {
  RUNNING: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PAUSED: "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DRAFT: "bg-zinc-100 text-zinc-600 border-zinc-200",
  ARCHIVED: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

type FilterKey = "all" | "RUNNING" | "COMPLETED" | "DRAFT";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (!res.ok) throw new Error("Failed to load campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns);
    } catch (err: any) {
      toast.error(err.message || "Failed to load campaigns list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleToggleStatus = async (id: string, name: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/campaigns/${id}/toggle`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update campaign");
      toast.success(`Campaign "${name}" is now ${data.status}`);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message || "Status change failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleDuplicate = async (id: string, name: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/campaigns/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to duplicate campaign");
      toast.success(`Duplicated "${name}"`);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message || "Duplication failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirmDialog({
      title: "Delete campaign?",
      description: `"${name}" and all its metrics, logs, and progress will be permanently deleted. This cannot be undone.`,
      confirmText: "Delete",
    });
    if (!ok) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete campaign");
      toast.success(`Deleted "${name}"`);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message || "Deletion failed");
    } finally {
      setBusyId(null);
    }
  };

  const summary = useMemo(() => {
    const totalSent = campaigns.reduce((sum, c) => sum + c.stats.sent, 0);
    return {
      total: campaigns.length,
      running: campaigns.filter((c) => c.status === "RUNNING").length,
      completed: campaigns.filter((c) => c.status === "COMPLETED").length,
      totalSent,
    };
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    return campaigns
      .filter((c) => (filter === "all" ? true : c.status === filter))
      .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [campaigns, filter, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm font-semibold text-zinc-500">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  const filterTabs: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: campaigns.length },
    { key: "RUNNING", label: "Running", count: summary.running },
    { key: "COMPLETED", label: "Completed", count: summary.completed },
    { key: "DRAFT", label: "Drafts", count: campaigns.filter((c) => c.status === "DRAFT").length },
  ];

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Campaigns</h1>
          <p className="text-sm text-zinc-500 font-medium">
            Create, launch, and track automated outbound email sequences.
          </p>
        </div>
        <Link href="/dashboard/campaigns/create">
          <ShimmerButton
            className="h-10 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
            shimmerColor="#818cf8"
          >
            <Plus className="w-4 h-4" /> New Campaign
          </ShimmerButton>
        </Link>
      </header>

      {/* Summary stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={<BarChart3 className="w-4 h-4" />} label="Total campaigns" value={summary.total} tone="zinc" />
        <SummaryCard icon={<Play className="w-4 h-4" />} label="Running" value={summary.running} tone="emerald" />
        <SummaryCard icon={<CheckCircle2 className="w-4 h-4" />} label="Completed" value={summary.completed} tone="indigo" />
        <SummaryCard icon={<Send className="w-4 h-4" />} label="Emails sent" value={summary.totalSent} tone="violet" />
      </section>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-1 bg-zinc-100/70 p-1 rounded-xl w-fit">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                filter === tab.key
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              {tab.label}
              <span className={cn("text-[10px] font-bold", filter === tab.key ? "text-indigo-600" : "text-zinc-400")}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3.5 py-2 sm:max-w-xs w-full">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-0 outline-none text-sm text-zinc-800 placeholder-zinc-400 w-full font-medium"
          />
        </div>
      </div>

      {/* Listing */}
      {filteredCampaigns.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCampaigns.map((camp) => (
            <CampaignCard
              key={camp.id}
              camp={camp}
              busy={busyId === camp.id}
              onToggle={() => handleToggleStatus(camp.id, camp.name)}
              onDuplicate={() => handleDuplicate(camp.id, camp.name)}
              onDelete={() => handleDelete(camp.id, camp.name)}
            />
          ))}
        </section>
      ) : (
        <section className="bg-white border border-zinc-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="font-extrabold text-zinc-800 text-base">No campaigns found</h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
              {searchQuery || filter !== "all"
                ? "No campaigns match your current filter."
                : "You haven't created any outreach campaigns yet. Launch your first one now."}
            </p>
          </div>
          {!searchQuery && filter === "all" && (
            <Link href="/dashboard/campaigns/create">
              <ShimmerButton
                className="h-10 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                shimmerColor="#818cf8"
              >
                Create Campaign
              </ShimmerButton>
            </Link>
          )}
        </section>
      )}
    </div>
  );
}

/* ------------------------------- Components ------------------------------- */

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "zinc" | "emerald" | "indigo" | "violet";
}) {
  const tones: Record<string, string> = {
    zinc: "text-zinc-500 bg-zinc-100",
    emerald: "text-emerald-600 bg-emerald-50",
    indigo: "text-indigo-600 bg-indigo-50",
    violet: "text-violet-600 bg-violet-50",
  };
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center gap-3.5">
      <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", tones[tone])}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xl font-black text-zinc-900 leading-none">{value.toLocaleString()}</div>
        <div className="text-[11px] font-semibold text-zinc-500 mt-1 truncate">{label}</div>
      </div>
    </div>
  );
}

function CampaignCard({
  camp,
  busy,
  onToggle,
  onDuplicate,
  onDelete,
}: {
  camp: CampaignItem;
  busy: boolean;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const isCompleted = camp.status === "COMPLETED";
  const isRunning = camp.status === "RUNNING";
  const canToggle = camp.status !== "COMPLETED" && camp.status !== "ARCHIVED";

  return (
    <div className="group bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col gap-4 hover:border-indigo-200 hover:shadow-[0_4px_24px_-12px_rgba(99,102,241,0.3)] transition-all">
      {/* Title + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/dashboard/campaigns/${camp.id}`}
            className="font-extrabold text-zinc-900 text-[15px] leading-tight hover:text-indigo-600 transition-colors line-clamp-1"
          >
            {camp.name}
          </Link>
          <p className="text-[11px] text-zinc-400 font-semibold mt-1 flex items-center gap-1.5">
            <Users className="w-3 h-3" /> {camp.stats.totalLeads} leads · {camp.timezone}
          </p>
        </div>
        <span
          className={cn(
            "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border shrink-0",
            STATUS_STYLES[camp.status]
          )}
        >
          {camp.status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          <span>Progress</span>
          <span className={isCompleted ? "text-indigo-600" : "text-zinc-600"}>{camp.stats.progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isCompleted ? "bg-indigo-500" : isRunning ? "bg-emerald-500" : "bg-zinc-300"
            )}
            style={{ width: `${camp.stats.progress}%` }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-1 border-y border-zinc-100 py-3">
        <Metric icon={<Send className="w-3 h-3" />} label="Sent" value={camp.stats.sent} color="text-zinc-700" />
        <Metric icon={<MailOpen className="w-3 h-3" />} label="Opens" value={`${camp.stats.openRate}%`} color="text-emerald-600" />
        <Metric icon={<MessageSquare className="w-3 h-3" />} label="Replies" value={`${camp.stats.replyRate}%`} color="text-violet-600" />
        <Metric icon={<AlertTriangle className="w-3 h-3" />} label="Bounce" value={`${camp.stats.bounceRate}%`} color="text-amber-600" />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-1.5">
          {canToggle ? (
            <button
              onClick={onToggle}
              disabled={busy}
              className={cn(
                "p-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50",
                isRunning
                  ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
              )}
              title={isRunning ? "Pause campaign" : camp.status === "DRAFT" ? "Start campaign" : "Resume campaign"}
            >
              {busy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isRunning ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span
              className="p-2 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600 flex items-center"
              title="Campaign completed"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          )}

          <button
            onClick={onDuplicate}
            disabled={busy}
            className="p-2 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-white text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer disabled:opacity-50"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onDelete}
            disabled={busy}
            className="p-2 rounded-lg border border-transparent hover:border-red-200 hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-all cursor-pointer disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <Link
          href={`/dashboard/campaigns/${camp.id}`}
          className={cn(
            "text-[11px] font-extrabold flex items-center gap-1 px-3 py-2 rounded-lg transition-all",
            isCompleted
              ? "bg-indigo-600 text-white hover:bg-indigo-500"
              : "text-indigo-600 hover:bg-indigo-50"
          )}
        >
          {isCompleted ? (
            <>
              <BarChart3 className="w-3.5 h-3.5" /> View report
            </>
          ) : (
            <>
              View details <ArrowUpRight className="w-3.5 h-3.5" />
            </>
          )}
        </Link>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-0.5">
      <span className="text-zinc-300">{icon}</span>
      <span className={cn("text-sm font-extrabold leading-none mt-0.5", color)}>{value}</span>
      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">{label}</span>
    </div>
  );
}

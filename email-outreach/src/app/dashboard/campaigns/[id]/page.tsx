"use client";

import { useEffect, useState, use } from"react";
import { useRouter } from"next/navigation";
import Link from"next/link";
import { toast } from"sonner";
import { 
 ArrowLeft, 
 Play, 
 Pause, 
 Send, 
 BarChart3, 
 Users, 
 Clock, 
 MessageSquare, 
 TrendingUp, 
 Loader2,
 Trash2,
 BookOpen,
 History,
 FileText
} from"lucide-react";
import { GlowCard } from"@/components/ui/glow-card";
import { ShimmerButton } from"@/components/ui/shimmer-button";
import { cn } from"@/lib/utils";

interface StepItem {
 id: string;
 stepNumber: number;
 delayDays: number;
 template: {
 id: string;
 name: string;
 subject: string;
 };
}

interface LeadProgress {
 leadId: string;
 status: string;
 currentStepNumber: number;
 lastSentAt: string | null;
 nextSendAt: string;
 lead: {
 id: string;
 email: string;
 firstName: string | null;
 lastName: string | null;
 companyName: string | null;
 };
}

interface CampaignLog {
 id: string;
 action: string;
 status: string;
 message: string;
 createdAt: string;
 lead?: { email: string };
}

interface NoteItem {
 id: string;
 note: string;
 createdAt: string;
 user: { name: string };
}

interface CampaignDetail {
 id: string;
 name: string;
 status: string;
 dailySendLimit: number;
 delayMin: number;
 delayMax: number;
 timezone: string;
 weekendSending: boolean;
 trackingOpens: boolean;
 trackingClicks: boolean;
 trackingReplies: boolean;
 trackingUnsub: boolean;
 steps: StepItem[];
 notes: NoteItem[];
}

interface StatsData {
 sent: number;
 open: number;
 click: number;
 reply: number;
 bounce: number;
 openRate: number;
 clickRate: number;
 replyRate: number;
 bounceRate: number;
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const router = useRouter();
 const { id } = use(params);

 const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
 const [stats, setStats] = useState<StatsData | null>(null);
 const [leads, setLeads] = useState<LeadProgress[]>([]);
 const [logs, setLogs] = useState<CampaignLog[]>([]);
 const [activeTab, setActiveTab] = useState<"steps" |"leads" |"logs" |"notes">("steps");
 const [isLoading, setIsLoading] = useState(true);

 // Notes state
 const [newNote, setNewNote] = useState("");
 const [isSavingNote, setIsSavingNote] = useState(false);

 const fetchCampaignDetail = async () => {
 try {
 const res = await fetch(`/api/campaigns/${id}`);
 if (!res.ok) {
 throw new Error("Failed to load campaign details");
 }
 const data = await res.json();
 setCampaign(data.campaign);
 setStats(data.stats);
 setLeads(data.leads);
 setLogs(data.logs);
 } catch (err: any) {
 toast.error(err.message ||"Failed to load campaign details");
 router.push("/dashboard/campaigns");
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 fetchCampaignDetail();
 }, [id]);

 const handleToggleStatus = async () => {
 if (!campaign) return;
 try {
 const res = await fetch(`/api/campaigns/${id}/toggle`, {
 method:"POST",
 });
 if (!res.ok) {
 throw new Error("Failed to toggle campaign status");
 }
 const data = await res.json();
 toast.success(`Campaign is now ${data.status}`);
 setCampaign((prev) => prev ? { ...prev, status: data.status } : null);
 } catch (err: any) {
 toast.error(err.message ||"Failed to change status");
 }
 };

 const handleAddNote = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newNote.trim()) return;
 setIsSavingNote(true);

 try {
 const res = await fetch(`/api/campaigns/${id}/notes`, {
 method:"POST",
 headers: {"Content-Type":"application/json" },
 body: JSON.stringify({ note: newNote }),
 });

 if (!res.ok) {
 throw new Error("Failed to add note");
 }

 toast.success("Note added successfully");
 setNewNote("");
 fetchCampaignDetail();
 } catch (err: any) {
 toast.error(err.message ||"Failed to save note");
 } finally {
 setIsSavingNote(false);
 }
 };

 const handleDeleteCampaign = async () => {
 if (!campaign) return;
 if (!confirm(`Are you sure you want to delete campaign"${campaign.name}"? This will delete all sent metrics, logs, and progression data.`)) {
 return;
 }

 try {
 const res = await fetch(`/api/campaigns/${id}`, {
 method:"DELETE",
 });

 if (!res.ok) {
 throw new Error("Failed to delete campaign");
 }

 toast.success("Campaign deleted successfully");
 router.push("/dashboard/campaigns");
 } catch (err: any) {
 toast.error(err.message ||"Failed to delete campaign");
 }
 };

 if (isLoading) {
 return (
 <div className="flex-1 flex items-center justify-center min-h-[50vh]">
 <div className="text-center space-y-4">
 <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
 <p className="text-sm font-semibold text-zinc-450">Loading campaign details...</p>
 </div>
 </div>
 );
 }

 if (!campaign || !stats) return null;

 return (
 <div className="flex-1 flex flex-col gap-8">
 
 {/* Header controls */}
 <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-150 pb-6 shrink-0">
 <div className="flex items-center gap-3">
 <Link href="/dashboard/campaigns">
 <button className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 cursor-pointer">
 <ArrowLeft className="w-4 h-4" />
 </button>
 </Link>
 <div>
 <h1 className="text-xl font-black text-zinc-800">{campaign.name}</h1>
 <p className="text-xs text-zinc-500 font-semibold mt-0.5">Timezone: {campaign.timezone} • Limits: {campaign.dailySendLimit}/day</p>
 </div>
 </div>

 <div className="flex items-center gap-3 select-none">
 <button 
 onClick={handleToggleStatus}
 className={cn(
"h-10 px-5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer",
 campaign.status ==="RUNNING"
 ?"bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
 :"bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
 )}
 >
 {campaign.status ==="RUNNING" ? (
 <>
 <Pause className="w-3.5 h-3.5" /> Pause Campaign
 </>
 ) : (
 <>
 <Play className="w-3.5 h-3.5" /> Resume Campaign
 </>
 )}
 </button>

 <button 
 onClick={handleDeleteCampaign}
 className="h-10 px-4 rounded-xl border border-transparent hover:border-red-200 hover:bg-red-50 text-zinc-400 hover:text-red-655 transition-all cursor-pointer"
 title="Delete campaign"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </header>

 {/* Quick stats panel */}
 <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 
 <GlowCard className="border border-zinc-200 bg-white" glowColor="rgba(99, 102, 241, 0.02)">
 <div className="p-4 space-y-1">
 <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Sent</div>
 <div className="text-2xl font-black text-zinc-800">{stats.sent}</div>
 <div className="text-[9px] text-zinc-500 font-bold">outbound emails</div>
 </div>
 </GlowCard>

 <GlowCard className="border border-zinc-200 bg-white" glowColor="rgba(99, 102, 241, 0.02)">
 <div className="p-4 space-y-1">
 <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Open Rate</div>
 <div className="text-2xl font-black text-emerald-650">{stats.openRate}%</div>
 <div className="text-[9px] text-zinc-500 font-bold">{stats.open} total opens</div>
 </div>
 </GlowCard>

 <GlowCard className="border border-zinc-200 bg-white" glowColor="rgba(99, 102, 241, 0.02)">
 <div className="p-4 space-y-1">
 <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Click Rate</div>
 <div className="text-2xl font-black text-indigo-650">{stats.clickRate}%</div>
 <div className="text-[9px] text-zinc-500 font-bold">{stats.click} total clicks</div>
 </div>
 </GlowCard>

 <GlowCard className="border border-zinc-200 bg-white" glowColor="rgba(99, 102, 241, 0.02)">
 <div className="p-4 space-y-1">
 <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Reply Rate</div>
 <div className="text-2xl font-black text-amber-650">{stats.replyRate}%</div>
 <div className="text-[9px] text-zinc-500 font-bold">{stats.reply} total replies</div>
 </div>
 </GlowCard>

 </section>

 {/* Tabs list */}
 <div className="flex border-b border-zinc-150 gap-6 select-none shrink-0">
 <button 
 onClick={() => setActiveTab("steps")}
 className={cn(
"pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer",
 activeTab ==="steps" ?"border-indigo-650 text-indigo-655 font-bold" :"border-transparent text-zinc-500 hover:text-zinc-700"
 )}
 >
 <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Steps Sequence</span>
 </button>
 <button 
 onClick={() => setActiveTab("leads")}
 className={cn(
"pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer",
 activeTab ==="leads" ?"border-indigo-650 text-indigo-655 font-bold" :"border-transparent text-zinc-500 hover:text-zinc-700"
 )}
 >
 <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Campaign Leads ({leads.length})</span>
 </button>
 <button 
 onClick={() => setActiveTab("logs")}
 className={cn(
"pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer",
 activeTab ==="logs" ?"border-indigo-650 text-indigo-655 font-bold" :"border-transparent text-zinc-500 hover:text-zinc-700"
 )}
 >
 <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Audit Logs</span>
 </button>
 <button 
 onClick={() => setActiveTab("notes")}
 className={cn(
"pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer",
 activeTab ==="notes" ?"border-indigo-655 text-indigo-655 font-bold" :"border-transparent text-zinc-500 hover:text-zinc-700"
 )}
 >
 <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Team Notes</span>
 </button>
 </div>

 {/* Tabs contents */}
 <div className="flex-1 flex flex-col min-h-[300px]">
 {/* STEPS SEQUENCE TAB */}
 {activeTab ==="steps" && (
 <div className="space-y-4">
 <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Campaign Email Steps Flow</h3>
 <div className="space-y-4">
 {campaign.steps.map((step) => (
 <div key={step.id} className="p-4 bg-white border border-zinc-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-4">
 <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center font-bold text-xs text-indigo-655">
 {step.stepNumber}
 </div>
 <div>
 <h4 className="text-xs font-bold text-zinc-800">Step {step.stepNumber}: {step.template.name}</h4>
 <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Subject: {step.template.subject}</p>
 </div>
 </div>
 <span className="text-[10px] px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-650 font-bold shrink-0">
 {step.stepNumber === 1 ?"Sent immediately" : `Wait ${step.delayDays} days after previous step`}
 </span>
 </div>
 ))}
 {campaign.steps.length === 0 && (
 <div className="text-center py-12 text-zinc-400 text-xs font-bold border border-zinc-200 bg-white rounded-xl border-dashed">
 No steps configured in this campaign.
 </div>
 )}
 </div>
 </div>
 )}

 {/* LEADS PROGRESS TAB */}
 {activeTab ==="leads" && (
 <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs divide-y divide-zinc-100">
 <thead>
 <tr className="text-zinc-500 font-bold bg-zinc-50/50">
 <th className="p-4 font-semibold">Lead Info</th>
 <th className="p-4 font-semibold">Current Step</th>
 <th className="p-4 font-semibold">Outreach Status</th>
 <th className="p-4 font-semibold">Last Sent</th>
 <th className="p-4 font-semibold">Next Action Time</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-100">
 {leads.map((l) => (
 <tr key={l.leadId} className="text-zinc-700">
 <td className="p-4">
 <div className="font-bold text-zinc-800">{l.lead.firstName ? `${l.lead.firstName} ${l.lead.lastName ||""}` :"No Name"}</div>
 <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{l.lead.email}</div>
 </td>
 <td className="p-4 font-bold text-zinc-800">Step {l.currentStepNumber}</td>
 <td className="p-4">
 <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
 l.status ==="COMPLETED" 
 ?"bg-indigo-50 text-indigo-750 border-indigo-250" 
 : l.status ==="REPLIED"
 ?"bg-amber-50 text-amber-705 border-amber-250"
 : l.status ==="FAILING"
 ?"bg-red-50 text-red-750 border-red-250"
 :"bg-zinc-50 text-zinc-650 border border-zinc-250"
 }`}>
 {l.status}
 </span>
 </td>
 <td className="p-4 text-zinc-600 font-semibold">
 {l.lastSentAt ? new Date(l.lastSentAt).toLocaleDateString() :"Never"}
 </td>
 <td className="p-4 text-zinc-600 font-semibold">
 {l.status ==="COMPLETED" ?"Campaign Finished" : new Date(l.nextSendAt).toLocaleString()}
 </td>
 </tr>
 ))}
 {leads.length === 0 && (
 <tr>
 <td colSpan={5} className="text-center py-10 text-zinc-400 text-xs font-bold">
 No leads associated with this campaign.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* AUDIT LOGS TAB */}
 {activeTab ==="logs" && (
 <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden p-4 space-y-4">
 <h4 className="text-xs font-bold text-zinc-550 uppercase tracking-wider">Execution Log Stream</h4>
 <div className="divide-y divide-zinc-100 max-h-96 overflow-y-auto pr-1">
 {logs.map((log) => (
 <div key={log.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
 <div className="space-y-0.5">
 <p className="font-bold text-zinc-800">
 {log.action} 
 <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
 log.status ==="SUCCESS" ?"bg-emerald-50 text-emerald-700 border-emerald-200" :"bg-red-50 text-red-700 border-red-200"
 }`}>
 {log.status}
 </span>
 </p>
 <p className="text-[10px] text-zinc-600 leading-relaxed max-w-xl">{log.message}</p>
 {log.lead && <p className="text-[9px] text-zinc-500 font-mono mt-0.5">To: {log.lead.email}</p>}
 </div>
 <span className="text-[10px] text-zinc-500 font-semibold shrink-0">
 {new Date(log.createdAt).toLocaleString()}
 </span>
 </div>
 ))}
 {logs.length === 0 && (
 <div className="text-center py-10 text-zinc-400 text-xs font-bold">
 No logs recorded for this campaign.
 </div>
 )}
 </div>
 </div>
 )}

 {/* TEAM NOTES TAB */}
 {activeTab ==="notes" && (
 <div className="space-y-6">
 <form onSubmit={handleAddNote} className="space-y-3">
 <textarea 
 placeholder="Type your campaign update note here..."
 value={newNote}
 onChange={(e) => setNewNote(e.target.value)}
 rows={3}
 className="w-full p-4 rounded-xl bg-zinc-50 border border-zinc-200 focus:border-indigo-550 focus:bg-white focus:outline-none text-xs text-zinc-800"
 />
 <button 
 type="submit"
 disabled={isSavingNote || !newNote.trim()}
 className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-bold text-white cursor-pointer select-none"
 >
 {isSavingNote ?"Saving Note..." :"Add Note"}
 </button>
 </form>

 <div className="space-y-4">
 <h4 className="text-xs font-bold text-zinc-550 uppercase tracking-wider">Collaborator Notes History</h4>
 <div className="space-y-3">
 {campaign.notes.map((note) => (
 <div key={note.id} className="p-4 bg-zinc-50/50 border border-zinc-200 rounded-xl space-y-1.5">
 <div className="flex justify-between items-center text-[10px]">
 <span className="font-bold text-indigo-650">{note.user.name}</span>
 <span className="text-zinc-500 font-semibold">{new Date(note.createdAt).toLocaleString()}</span>
 </div>
 <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">{note.note}</p>
 </div>
 ))}
 {campaign.notes.length === 0 && (
 <div className="text-center py-10 text-zinc-400 text-xs font-bold">
 No notes recorded. Write notes to share updates with the team.
 </div>
 )}
 </div>
 </div>
 </div>
 )}

 </div>

 </div>
 );
}

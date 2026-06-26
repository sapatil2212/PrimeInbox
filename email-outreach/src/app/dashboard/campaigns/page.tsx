"use client";

import { useEffect, useState } from"react";
import Link from"next/link";
import { toast } from"sonner";
import { 
 Plus, 
 Search, 
 Send, 
 BarChart3, 
 Play, 
 Pause, 
 Copy, 
 Trash2, 
 Sparkles,
 ArrowUpRight,
 Loader2,
 FolderOpen
} from"lucide-react";
import { GlowCard } from"@/components/ui/glow-card";
import { ShimmerButton } from"@/components/ui/shimmer-button";
import { cn } from"@/lib/utils";

interface CampaignItem {
 id: string;
 name: string;
 status:"DRAFT" |"RUNNING" |"PAUSED" |"COMPLETED" |"ARCHIVED";
 dailySendLimit: number;
 timezone: string;
 createdAt: string;
 _count: {
 leads: number;
 emailEvents: number;
 };
 stats: {
 sent: number;
 open: number;
 click: number;
 reply: number;
 openRate: number;
 replyRate: number;
 };
}

export default function CampaignsPage() {
 const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
 const [searchQuery, setSearchQuery] = useState("");
 const [isLoading, setIsLoading] = useState(true);

 const fetchCampaigns = async () => {
 try {
 const res = await fetch("/api/campaigns");
 if (!res.ok) {
 throw new Error("Failed to load campaigns");
 }
 const data = await res.json();
 setCampaigns(data.campaigns);
 } catch (err: any) {
 toast.error(err.message ||"Failed to load campaigns list");
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 fetchCampaigns();
 }, []);

 const handleToggleStatus = async (id: string, name: string) => {
 try {
 const res = await fetch(`/api/campaigns/${id}/toggle`, {
 method:"POST",
 });
 if (!res.ok) {
 throw new Error("Failed to toggle campaign status");
 }
 const data = await res.json();
 toast.success(`Campaign"${name}" updated to ${data.status}`);
 fetchCampaigns();
 } catch (err: any) {
 toast.error(err.message ||"Status change failed");
 }
 };

 const handleDuplicate = async (id: string, name: string) => {
 try {
 const res = await fetch(`/api/campaigns/${id}/duplicate`, {
 method:"POST",
 });
 if (!res.ok) {
 throw new Error("Failed to duplicate campaign");
 }
 toast.success(`Duplicated campaign:"Copy of ${name}"`);
 fetchCampaigns();
 } catch (err: any) {
 toast.error(err.message ||"Duplication failed");
 }
 };

 const handleDelete = async (id: string, name: string) => {
 if (!confirm(`Are you sure you want to delete campaign"${name}"? This action cannot be undone.`)) {
 return;
 }
 try {
 const res = await fetch(`/api/campaigns/${id}`, {
 method:"DELETE",
 });
 if (!res.ok) {
 throw new Error("Failed to delete campaign");
 }
 toast.success(`Deleted campaign"${name}"`);
 fetchCampaigns();
 } catch (err: any) {
 toast.error(err.message ||"Deletion failed");
 }
 };

 const filteredCampaigns = campaigns.filter((camp) =>
 camp.name.toLowerCase().includes(searchQuery.toLowerCase())
 );

 if (isLoading) {
 return (
 <div className="flex-1 flex items-center justify-center min-h-[50vh]">
 <div className="text-center space-y-4">
 <Loader2 className="w-10 h-10 animate-spin text-indigo-655 mx-auto" />
 <p className="text-sm font-semibold text-zinc-500">Loading campaigns...</p>
 </div>
 </div>
 );
 }

 return (
 <div className="flex-1 flex flex-col gap-8">
 
 {/* Header */}
 <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h1 className="text-2xl font-black tracking-tight text-zinc-800">
 Campaigns
 </h1>
 <p className="text-sm text-zinc-500 font-medium">Create and optimize automated outbound email sequences.</p>
 </div>
 <div className="flex items-center gap-3">
 <Link href="/dashboard/campaigns/create">
 <ShimmerButton 
 className="h-10 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
 shimmerColor="#818cf8"
 >
 <Plus className="w-4 h-4" /> New Campaign
 </ShimmerButton>
 </Link>
 </div>
 </header>

 {/* Search Filter Bar */}
 <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-4 py-2 max-w-md shrink-0">
 <Search className="w-4 h-4 text-zinc-400" />
 <input 
 type="text" 
 placeholder="Filter campaigns by name..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="bg-transparent border-0 outline-none text-sm text-zinc-800 placeholder-zinc-400 w-full font-semibold"
 />
 </div>

 {/* Campaigns Listing Grid */}
 {filteredCampaigns.length > 0 ? (
 <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredCampaigns.map((camp) => (
 <GlowCard key={camp.id} className="border border-zinc-200 bg-white" glowColor="rgba(99, 102, 241, 0.02)">
 <div className="p-4 flex flex-col h-full gap-4">
 
 {/* Title & Status */}
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0">
 <h3 className="font-extrabold text-zinc-800 text-base truncate hover:text-indigo-650">
 <Link href={`/dashboard/campaigns/${camp.id}`}>
 {camp.name}
 </Link>
 </h3>
 <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Leads: {camp._count.leads} • Timezone: {camp.timezone}</p>
 </div>
 
 <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
 camp.status ==="RUNNING" 
 ?"bg-emerald-50 text-emerald-700 border-emerald-200"
 : camp.status ==="PAUSED"
 ?"bg-amber-50 text-amber-700 border-amber-200"
 : camp.status ==="COMPLETED"
 ?"bg-indigo-50 text-indigo-700 border-indigo-200"
 :"bg-zinc-50 text-zinc-600 border-zinc-200"
 }`}>
 {camp.status}
 </span>
 </div>

 {/* Main stats layout */}
 <div className="grid grid-cols-3 border-y border-zinc-100 py-3.5 my-1 text-center divide-x divide-zinc-100">
 <div>
 <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Sent</div>
 <div className="text-base font-extrabold text-zinc-800 mt-1">{camp.stats.sent}</div>
 </div>
 <div>
 <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Opens</div>
 <div className="text-base font-extrabold text-emerald-650 mt-1">{camp.stats.openRate}%</div>
 </div>
 <div>
 <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Replies</div>
 <div className="text-base font-extrabold text-amber-650 mt-1">{camp.stats.replyRate}%</div>
 </div>
 </div>

 {/* Quick actions panel */}
 <div className="flex items-center justify-between gap-3 pt-2 mt-auto">
 <div className="flex items-center gap-2">
 <button 
 onClick={() => handleToggleStatus(camp.id, camp.name)}
 className={cn(
"p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
 camp.status ==="RUNNING"
 ?"bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
 :"bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
 )}
 title={camp.status ==="RUNNING" ?"Pause Campaign" :"Resume Campaign"}
 >
 {camp.status ==="RUNNING" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
 </button>

 <button 
 onClick={() => handleDuplicate(camp.id, camp.name)}
 className="p-2 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white text-zinc-500 hover:text-zinc-750 transition-all cursor-pointer"
 title="Duplicate Campaign"
 >
 <Copy className="w-3.5 h-3.5" />
 </button>

 <button 
 onClick={() => handleDelete(camp.id, camp.name)}
 className="p-2 rounded-xl border border-transparent hover:border-red-200 hover:bg-red-50 text-zinc-400 hover:text-red-655 transition-all cursor-pointer"
 title="Delete Campaign"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>

 <Link href={`/dashboard/campaigns/${camp.id}`} className="text-[10px] text-indigo-650 hover:text-indigo-755 font-extrabold hover:underline flex items-center gap-0.5">
 View analytics <ArrowUpRight className="w-3.5 h-3.5" />
 </Link>
 </div>

 </div>
 </GlowCard>
 ))}
 </section>
 ) : (
 <section className="bg-white border border-zinc-200 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-5">
 <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400">
 <FolderOpen className="w-6 h-6" />
 </div>
 <div className="space-y-1.5 max-w-md">
 <h3 className="font-extrabold text-zinc-800 text-base">No campaigns found</h3>
 <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
 {searchQuery ?"No campaigns match your filter search query." :"You haven't created any outreach campaigns yet. Launch your first campaign wizard now!"}
 </p>
 </div>
 {!searchQuery && (
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

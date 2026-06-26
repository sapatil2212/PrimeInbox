"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { toast, confirmDialog } from "@/components/ui/feedback";
import { 
  Plus, 
  Search, 
  Key, 
  Trash2, 
  CheckCircle, 
  Loader2,
  RefreshCw,
  Sliders,
  AlertTriangle,
  Play,
  Pause,
  Server,
  Layers,
  Activity,
  Heart,
  Sparkles,
  X
} from "lucide-react";
import { GlowCard } from"@/components/ui/glow-card";
import { ShimmerButton } from"@/components/ui/shimmer-button";
import { cn } from"@/lib/utils";
import { getPlanLimits } from"@/lib/plans";

interface SmtpAccountItem {
 id: string;
 host: string;
 port: number;
 username: string;
 secureType: string;
 fromName: string;
 fromEmail: string;
 replyTo: string | null;
 dailyLimit: number;
 hourlyLimit: number;
 currentDailyCount: number;
 currentHourlyCount: number;
 status:"ACTIVE" |"PAUSED" |"INVALID_CREDENTIALS" |"RATE_LIMITED" |"BLOCKED";
 healthScore: number;
 errorLog: string | null;
 priority: number;
 rotationWeight: number;
}

interface SmtpGroupItem {
 id: string;
 name: string;
 description: string | null;
 _count: {
 accounts: number;
 };
}

export default function SmtpPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [accounts, setAccounts] = useState<SmtpAccountItem[]>([]);
  const [groups, setGroups] = useState<SmtpGroupItem[]>([]);
  const [smtpLimit, setSmtpLimit] = useState<number | null>(null);
 const [searchQuery, setSearchQuery] = useState("");
 const [activeView, setActiveView] = useState<"accounts" |"groups">("accounts");
 
 const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
 const [isLoadingGroups, setIsLoadingGroups] = useState(true);
 const [testingAccountId, setTestingAccountId] = useState<string | null>(null);

 // Add Account dialog
 const [addAccountOpen, setAddAccountOpen] = useState(false);
 const [host, setHost] = useState("");
 const [port, setPort] = useState(587);
 const [username, setUsername] = useState("");
 const [password, setPassword] = useState("");
 const [secureType, setSecureType] = useState("TLS");
 const [fromName, setFromName] = useState("");
 const [fromEmail, setFromEmail] = useState("");
 const [replyTo, setReplyTo] = useState("");
 const [dailyLimit, setDailyLimit] = useState(200);
 const [hourlyLimit, setHourlyLimit] = useState(25);
 const [priority, setPriority] = useState(1);
 const [rotationWeight, setRotationWeight] = useState(1);

 // Optional app-level DKIM signing (advanced)
 const [dkimDomain, setDkimDomain] = useState("");
 const [dkimSelector, setDkimSelector] = useState("");
 const [dkimPrivateKey, setDkimPrivateKey] = useState("");

 // Add Group dialog
 const [addGroupOpen, setAddGroupOpen] = useState(false);
 const [groupName, setGroupName] = useState("");
 const [groupDesc, setGroupDesc] = useState("");
 const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

 const fetchAccounts = async () => {
 setIsLoadingAccounts(true);
 try {
 const res = await fetch("/api/smtp/accounts");
 if (!res.ok) throw new Error("Failed to load SMTP accounts");
 const data = await res.json();
 setAccounts(data.accounts || []);
 } catch (err: any) {
 toast.error(err.message ||"Failed to load SMTP accounts");
 } finally {
 setIsLoadingAccounts(false);
 }
 };

 const fetchGroups = async () => {
 setIsLoadingGroups(true);
 try {
 const res = await fetch("/api/smtp/groups");
 if (!res.ok) throw new Error("Failed to load SMTP pools");
 const data = await res.json();
 setGroups(data.groups || []);
 } catch (err: any) {
 toast.error(err.message ||"Failed to load SMTP pools");
 } finally {
 setIsLoadingGroups(false);
 }
 };

 useEffect(() => {
 fetchAccounts();
 fetchGroups();
 (async () => {
 try {
 const res = await fetch("/api/auth/session");
 if (res.ok) {
 const data = await res.json();
 setSmtpLimit(getPlanLimits(data.user?.company?.subscriptionPlan).smtpLimit);
 }
 } catch {
 /* ignore */
 }
 })();
 }, []);

 const handleAddAccount = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!host || !port || !username || !password || !fromName || !fromEmail) {
 toast.error("Please fill in all required SMTP connection credentials.");
 return;
 }

 try {
 const res = await fetch("/api/smtp/accounts", {
 method:"POST",
 headers: {"Content-Type":"application/json" },
 body: JSON.stringify({
 host,
 port: Number(port),
 username,
 password,
 secureType,
 fromName,
 fromEmail,
 replyTo: replyTo || null,
 dailyLimit: Number(dailyLimit),
 hourlyLimit: Number(hourlyLimit),
 priority: Number(priority),
 rotationWeight: Number(rotationWeight),
 dkimDomain: dkimDomain.trim() || null,
 dkimSelector: dkimSelector.trim() || null,
 dkimPrivateKey: dkimPrivateKey.trim() || null,
 }),
 });

 if (!res.ok) {
 const errorData = await res.json();
 throw new Error(errorData.error ||"Failed to register SMTP");
 }

 toast.success(`Successfully connected SMTP: ${fromEmail}`);
 setAddAccountOpen(false);
 
 // Clear forms
 setHost("");
 setUsername("");
 setPassword("");
 setFromName("");
 setFromEmail("");
 setReplyTo("");
 setDkimDomain("");
 setDkimSelector("");
 setDkimPrivateKey("");
 
 fetchAccounts();
 } catch (err: any) {
 toast.error(err.message ||"Connection registry failed");
 }
 };

 const handleTestConnection = async (id: string, email: string) => {
 setTestingAccountId(id);
 toast.info(`Running SMTP verification handshake for ${email}...`);

 try {
 const res = await fetch(`/api/smtp/accounts/${id}/test`, {
 method:"POST",
 });
 const data = await res.json();

 if (!res.ok) {
 throw new Error(data.details || data.error ||"Connection verify failed");
 }

 toast.success(data.message || `SMTP account ${email} is active and verified!`);
 fetchAccounts();
 } catch (err: any) {
 toast.error(`SMTP Verification Failed: ${err.message}`);
 fetchAccounts(); // Reload to show new error logs
 } finally {
 setTestingAccountId(null);
 }
 };

  const handleDeleteAccount = async (id: string, email: string) => {
    await confirmDialog({
      title: "Delete SMTP account?",
      description: `${email} will be removed and can no longer send campaigns.`,
      confirmText: "Delete",
      successTitle: "Deleted!",
      successDescription: `SMTP account ${email} has been removed.`,
      onConfirm: async () => {
        const res = await fetch(`/api/smtp/accounts/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to delete SMTP account");
        }
        fetchAccounts();
      },
    });
  };

 const handleToggleStatus = async (id: string, currentStatus: string, email: string) => {
 const nextStatus = currentStatus ==="ACTIVE" ?"PAUSED" :"ACTIVE";
 try {
 const res = await fetch(`/api/smtp/accounts/${id}`, {
 method:"PUT",
 headers: {"Content-Type":"application/json" },
 body: JSON.stringify({ status: nextStatus }),
 });
 if (!res.ok) throw new Error("Failed to update status");

 toast.success(`SMTP Account ${email} is now ${nextStatus}`);
 fetchAccounts();
 } catch (err: any) {
 toast.error(err.message ||"Failed to toggle status");
 }
 };

 const handleCreateGroup = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!groupName.trim()) return;

 try {
 const res = await fetch("/api/smtp/groups", {
 method:"POST",
 headers: {"Content-Type":"application/json" },
 body: JSON.stringify({
 name: groupName,
 description: groupDesc,
 smtpAccountIds: selectedAccountIds,
 }),
 });
 if (!res.ok) throw new Error("Failed to create SMTP group pool");

 toast.success(`Created SMTP pool"${groupName}"`);
 setGroupName("");
 setGroupDesc("");
 setSelectedAccountIds([]);
 setAddGroupOpen(false);
 
 fetchGroups();
 } catch (err: any) {
 toast.error(err.message ||"Failed to create SMTP pool");
 }
 };

 const handleAccountSelectToggle = (id: string) => {
 setSelectedAccountIds((prev) =>
 prev.includes(id) ? prev.filter((accId) => accId !== id) : [...prev, id]
 );
 };

 const filteredAccounts = accounts.filter(
 (acc) =>
 acc.fromEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
 acc.host.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="flex-1 flex flex-col gap-8">
 
  {/* Header */}
  <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
    <div>
      <h1 className="text-2xl font-black tracking-tight text-zinc-900">
        SMTP Manager
      </h1>
      <p className="text-sm text-zinc-500 font-medium mt-0.5">
        Add, pools group, and verify cold outreach outbound email credentials.
      </p>
    </div>
    <div className="flex items-center gap-2.5">
      {/* Shifted Search Input */}
      {activeView === "accounts" && (
        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 w-60">
          <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Filter by email or host..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-0 outline-none text-xs text-zinc-800 placeholder-zinc-400 w-full font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {activeView === "accounts" ? (
        <button 
          onClick={() => setAddAccountOpen(true)}
          className="h-9 px-4 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white flex items-center gap-1.5 border border-zinc-950 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add SMTP Account
        </button>
      ) : (
        <button 
          onClick={() => setAddGroupOpen(true)}
          className="h-9 px-4 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white flex items-center gap-1.5 border border-zinc-950 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Create SMTP Pool
        </button>
      )}
    </div>
  </header>

  {/* Tabs */}
  <div className="flex border-b border-zinc-200 gap-6 select-none shrink-0">
    <button 
      onClick={() => setActiveView("accounts")}
      className={cn(
        "pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer",
        activeView === "accounts" 
          ? "border-zinc-900 text-zinc-900 font-black" 
          : "border-transparent text-zinc-500 hover:text-zinc-800"
      )}
    >
      <span className="flex items-center gap-1.5"><Server className="w-3.5 h-3.5" /> SMTP Accounts ({accounts.length})</span>
    </button>
    <button 
      onClick={() => setActiveView("groups")}
      className={cn(
        "pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer",
        activeView === "groups" 
          ? "border-zinc-900 text-zinc-900 font-black" 
          : "border-transparent text-zinc-500 hover:text-zinc-800"
      )}
    >
      <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Rotational Pools ({groups.length})</span>
    </button>
  </div>

  {/* View Contents */}
  {activeView === "accounts" ? (
    isLoadingAccounts ? (
      <div className="flex-1 flex items-center justify-center min-h-[30vh]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-700" />
      </div>
 ) : filteredAccounts.length > 0 ? (
 <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredAccounts.map((acc) => {
 const isTesting = testingAccountId === acc.id;
 
 return (
 <GlowCard key={acc.id} className="border border-zinc-200 bg-white" glowColor="rgba(99, 102, 241, 0.05)">
 <div className="p-4 flex flex-col h-full gap-4">
 
 {/* Header info */}
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0">
 <h3 className="font-extrabold text-zinc-800 text-sm truncate" title={acc.fromEmail}>
 {acc.fromEmail}
 </h3>
 <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Sender: {acc.fromName} • Host: {acc.host}</p>
 </div>

 <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
 acc.status ==="ACTIVE"
 ?"bg-emerald-50 text-emerald-700 border border-emerald-100"
 : acc.status ==="PAUSED"
 ?"bg-amber-50 text-amber-750 border border-amber-100"
 :"bg-red-55/10 text-red-600 border border-red-200/55"
 }`}>
 {acc.status}
 </span>
 </div>

 {/* Limits bar progress */}
 <div className="space-y-1.5 text-xs border-y border-zinc-100 py-3.5 my-0.5">
 <div className="flex justify-between items-center text-[10px] font-semibold text-zinc-500">
 <span>Daily Limit Sends</span>
 <span>{acc.currentDailyCount} / {acc.dailyLimit}</span>
 </div>
 <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
 <div 
 className="bg-zinc-900 h-full transition-all duration-300"
 style={{ width: `${Math.min((acc.currentDailyCount / acc.dailyLimit) * 100, 100)}%` }}
 />
 </div>
 </div>

 {/* Health score and metrics */}
 <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold select-none">
 <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500 fill-red-500/10" /> Health Score: {acc.healthScore}%</span>
 <span>Priority: P{acc.priority}</span>
 </div>

 {/* Logs if failed */}
 {acc.errorLog && (
 <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-[9px] text-red-750 font-semibold leading-relaxed flex gap-1.5 items-start">
 <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-600" />
 <div className="truncate max-w-full" title={acc.errorLog}>{acc.errorLog}</div>
 </div>
 )}

 {/* Actions bar */}
 <div className="flex items-center justify-between pt-2 border-t border-zinc-100 mt-auto">
 <div className="flex items-center gap-2">
 <button
 onClick={() => handleToggleStatus(acc.id, acc.status, acc.fromEmail)}
 className={cn(
"p-2 rounded-xl border text-xs font-bold transition-all flex items-center cursor-pointer",
 acc.status ==="ACTIVE"
 ?"bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
 :"bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
 )}
 title={acc.status ==="ACTIVE" ?"Pause Account" :"Resume Account"}
 >
 {acc.status ==="ACTIVE" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
 </button>
 
 <button
 onClick={() => handleTestConnection(acc.id, acc.fromEmail)}
 disabled={isTesting}
 className="p-2 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white text-zinc-500 hover:text-indigo-650 transition-all flex items-center cursor-pointer disabled:opacity-40"
 title="Run SMTP handshake diagnosis"
 >
 {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
 </button>
 </div>

 <button
 onClick={() => handleDeleteAccount(acc.id, acc.fromEmail)}
 className="p-2 rounded-xl border border-transparent hover:border-red-500/10 hover:bg-red-500/5 text-zinc-450 hover:text-red-650 transition-all cursor-pointer"
 title="Delete account"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>

 </div>
 </GlowCard>
 );
 })}
 </section>
 ) : (
 <section className="bg-white border border-zinc-200 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-5">
 <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 shadow-inner">
 <Server className="w-6 h-6" />
 </div>
 <div className="space-y-1.5 max-w-md">
 <h3 className="font-extrabold text-zinc-800 text-base">No SMTP accounts connected</h3>
 <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
 Before launching outreach campaigns, configure SMTP credentials to enable automated rotational sending pools.
 </p>
 </div>
  <button 
  onClick={() => setAddAccountOpen(true)}
  className="h-10 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-950 text-xs font-bold text-white transition-colors cursor-pointer"
  >
  Add SMTP Account
  </button>
 </section>
 )
 ) : (
 isLoadingGroups ? (
 <div className="flex-1 flex items-center justify-center min-h-[30vh]">
 <Loader2 className="w-8 h-8 animate-spin text-zinc-700" />
 </div>
 ) : groups.length > 0 ? (
 <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {groups.map((group) => (
 <GlowCard key={group.id} className="border border-zinc-200 bg-white" glowColor="rgba(99, 102, 241, 0.05)">
 <div className="p-4 flex flex-col h-full gap-4">
 <div className="flex items-start justify-between">
 <div>
 <h3 className="font-extrabold text-zinc-800 text-sm">{group.name}</h3>
 <p className="text-xs text-zinc-500 font-semibold mt-0.5">{group.description ||"No description provided."}</p>
 </div>
 <span className="text-[10px] px-2 py-0.5 bg-zinc-50 border border-zinc-200 text-zinc-650 font-bold rounded-lg shrink-0">
 {group._count.accounts} senders
 </span>
 </div>
 </div>
 </GlowCard>
 ))}
 </section>
 ) : (
 <section className="bg-white border border-zinc-200 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-5">
 <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 shadow-inner">
 <Layers className="w-6 h-6" />
 </div>
 <div className="space-y-1.5 max-w-md">
 <h3 className="font-extrabold text-zinc-800 text-base">No SMTP Pools configured</h3>
 <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
 Group multiple email addresses together in rotational send pools to divide outbound sending limits.
 </p>
 </div>
  <button 
  onClick={() => setAddGroupOpen(true)}
  className="h-10 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-950 text-xs font-bold text-white transition-colors cursor-pointer"
  >
  Create SMTP Pool
  </button>
 </section>
 )
 )}

  {/* DIALOG 1: Add SMTP Account Modal */}
  {addAccountOpen && isMounted && createPortal(
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setAddAccountOpen(false)}>
  <form 
  onSubmit={handleAddAccount}
  className="w-full max-w-lg bg-white border border-zinc-200 rounded-xl shadow-2xl p-5 space-y-4 flex flex-col overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
  onClick={(e) => e.stopPropagation()}
  >
  <div className="flex items-center justify-between border-b border-zinc-100 pb-2 shrink-0">
  <h3 className="font-bold text-zinc-700 text-sm flex items-center gap-1.5"><Key className="w-4 h-4 text-indigo-600" /> Connect SMTP Account</h3>
  <button type="button" onClick={() => setAddAccountOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="w-4 h-4" /></button>
  </div>

  {smtpLimit !== null && accounts.length >= smtpLimit && (
  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 shrink-0">
  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
  <p className="text-[11px] font-semibold text-amber-700 leading-relaxed">
  Your plan allows up to {smtpLimit} SMTP sender {smtpLimit === 1 ? "account" : "accounts"}. Upgrade your plan to add more.
  </p>
  </div>
  )}

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
  <div className="space-y-1">
  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">SMTP Host *</label>
  <input 
  type="text" 
  placeholder="smtp.gmail.com" 
  value={host}
  onChange={(e) => setHost(e.target.value)}
  className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 font-medium"
  required
  />
  </div>

  <div className="space-y-1">
  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">SMTP Port *</label>
  <input 
  type="number" 
  value={port}
  onChange={(e) => setPort(parseInt(e.target.value) || 587)}
  className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 font-medium"
  required
  />
  </div>

  <div className="space-y-1">
  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Username / Auth Email *</label>
  <input 
  type="email" 
  placeholder="sender@domain.com"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 font-medium"
  required
  />
  </div>

  <div className="space-y-1">
  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">App Password *</label>
  <input 
  type="password" 
  placeholder="••••••••••••••••"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 font-medium"
  required
  />
  </div>

  <div className="space-y-1">
  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Secure Protocol *</label>
  <select 
  value={secureType}
  onChange={(e) => setSecureType(e.target.value)}
  className="w-full h-8 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 font-medium"
  >
  <option value="TLS">STARTTLS (587) - Recommended</option>
  <option value="SSL">SSL / SMTPS (465)</option>
  <option value="NONE">Unencrypted (25)</option>
  </select>
  </div>

  <div className="space-y-1">
  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">From Header Name *</label>
  <input 
  type="text" 
  placeholder="e.g. John Doe"
  value={fromName}
  onChange={(e) => setFromName(e.target.value)}
  className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 font-medium"
  required
  />
  </div>

  <div className="space-y-1">
  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">From Header Email *</label>
  <input 
  type="email" 
  placeholder="e.g. john@domain.com"
  value={fromEmail}
  onChange={(e) => setFromEmail(e.target.value)}
  className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 font-medium"
  required
  />
  </div>

  <div className="space-y-1">
  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Reply-To Address (Optional)</label>
  <input 
  type="email" 
  placeholder="e.g. support@domain.com"
  value={replyTo}
  onChange={(e) => setReplyTo(e.target.value)}
  className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 font-medium"
  />
  </div>

  <div className="space-y-1">
  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Daily Send Limit</label>
  <input 
  type="number" 
  value={dailyLimit}
  onChange={(e) => setDailyLimit(parseInt(e.target.value) || 200)}
  className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 font-medium"
  />
  </div>

  <div className="space-y-1">
  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Hourly Send Limit</label>
  <input 
  type="number" 
  value={hourlyLimit}
  onChange={(e) => setHourlyLimit(parseInt(e.target.value) || 25)}
  className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 font-medium"
  />
  </div>

  <div className="space-y-1">
  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Rotation Weight (1-10)</label>
  <input 
  type="number" 
  min={1}
  max={10}
  value={rotationWeight}
  onChange={(e) => setRotationWeight(parseInt(e.target.value) || 1)}
  className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 font-medium"
  />
  </div>

  <div className="space-y-1">
  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Priority Level (1-10)</label>
  <input 
  type="number" 
  min={1}
  max={10}
  value={priority}
  onChange={(e) => setPriority(parseInt(e.target.value) || 1)}
  className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 font-medium"
  />
  </div>
  </div>

  {/* Optional: App-level DKIM signing (advanced) */}
  <details className="border border-zinc-200 rounded-xl bg-zinc-50/50 group">
  <summary className="cursor-pointer list-none px-3 py-2.5 text-[10px] font-bold text-zinc-600 uppercase tracking-wider flex items-center justify-between">
  <span>Advanced: DKIM signing (optional)</span>
  <span className="text-zinc-400 group-open:rotate-180 transition-transform">▾</span>
  </summary>
  <div className="px-3 pb-3 pt-1 space-y-3">
  <p className="text-[10px] text-zinc-500 leading-relaxed">
  Only needed for raw SMTP servers that don't sign mail themselves. Managed providers (Gmail, SES, SendGrid, Mailgun) already sign — leave blank for those. Requires a matching DNS TXT record at <code className="text-indigo-600">selector._domainkey.domain</code>.
  </p>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
  <div className="space-y-1">
  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">DKIM Domain</label>
  <input
  type="text"
  placeholder="yourdomain.com"
  value={dkimDomain}
  onChange={(e) => setDkimDomain(e.target.value)}
  className="w-full h-8 px-2.5 rounded-lg bg-white border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 font-medium"
  />
  </div>
  <div className="space-y-1">
  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">DKIM Selector</label>
  <input
  type="text"
  placeholder="primeinbox"
  value={dkimSelector}
  onChange={(e) => setDkimSelector(e.target.value)}
  className="w-full h-8 px-2.5 rounded-lg bg-white border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 font-medium"
  />
  </div>
  </div>
  <div className="space-y-1">
  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">DKIM Private Key (PEM)</label>
  <textarea
  placeholder={"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}
  value={dkimPrivateKey}
  onChange={(e) => setDkimPrivateKey(e.target.value)}
  rows={3}
  className="w-full p-2.5 rounded-lg bg-white border border-zinc-200 text-[11px] text-zinc-700 font-mono focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
  />
  <p className="text-[9px] text-zinc-400">Stored encrypted (AES-256-GCM). Never returned to the browser.</p>
  </div>
  </div>
  </details>

  <div className="border-t border-zinc-100 pt-4 flex items-center justify-end gap-3 shrink-0 select-none">
  <button 
  type="button" 
  onClick={() => setAddAccountOpen(false)}
  className="h-9 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-650 transition-colors cursor-pointer"
  >
  Cancel
  </button>
  {smtpLimit !== null && accounts.length >= smtpLimit ? (
  <button 
  type="button"
  onClick={() => { setAddAccountOpen(false); router.push("/dashboard/billing"); }}
  className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-700 text-xs font-bold text-white transition-colors cursor-pointer"
  >
  Upgrade Plan
  </button>
  ) : (
  <button 
  type="submit"
  className="h-9 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white transition-colors cursor-pointer"
  >
  Connect SMTPS
  </button>
  )}
  </div>
  </form>
  </div>, document.body
  )}


 {/* DIALOG 2: Create SMTP Group Pool */}
 {addGroupOpen && isMounted && createPortal(
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setAddGroupOpen(false)}>
  <form 
  onSubmit={handleCreateGroup}
  className="w-full max-w-md bg-white border border-zinc-200 rounded-xl shadow-2xl p-5 space-y-4 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
  onClick={(e) => e.stopPropagation()}
  >
  <div className="flex items-center justify-between border-b border-zinc-100 pb-2 shrink-0">
  <h3 className="font-bold text-zinc-700 text-sm">Create SMTP Rotational Pool</h3>
  <button type="button" onClick={() => setAddGroupOpen(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer"><X className="w-4 h-4" /></button>
  </div>

  <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px]">
  <div className="space-y-1.5">
  <label className="text-xs font-bold text-zinc-500">Pool Name</label>
  <input 
  type="text" 
  placeholder="e.g. Sales Outbound Pool" 
  value={groupName}
  onChange={(e) => setGroupName(e.target.value)}
  className="w-full h-10 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:outline-none"
  required
  />
  </div>

  <div className="space-y-1.5">
  <label className="text-xs font-bold text-zinc-500">Pool Description (Optional)</label>
  <textarea 
  placeholder="Describe pool usage..." 
  value={groupDesc}
  onChange={(e) => setGroupDesc(e.target.value)}
  rows={2}
  className="w-full p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:outline-none"
  />
  </div>

  <div className="space-y-2">
  <label className="text-xs font-bold text-zinc-500">Select Accounts for Pool</label>
  <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/50 max-h-40 overflow-y-auto pr-1 space-y-2 select-none">
  {accounts.map(acc => {
  const isSelected = selectedAccountIds.includes(acc.id);
  return (
  <div 
  key={acc.id}
  onClick={() => handleAccountSelectToggle(acc.id)}
  className={cn(
  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer text-xs font-semibold",
  isSelected ? "border-indigo-100 bg-indigo-50/80 text-indigo-600" : "border-transparent text-zinc-550 hover:bg-zinc-100"
  )}
  >
  <input 
  type="checkbox" 
  checked={isSelected}
  onChange={() => {}} // Controlled by div click
  className="rounded border-zinc-200 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
  />
  <span className="truncate">{acc.fromEmail}</span>
  </div>
  );
  })}
  {accounts.length === 0 && (
  <div className="text-center text-zinc-400 text-xs py-4 font-bold">Please add an SMTP account first.</div>
  )}
  </div>
  </div>
  </div>

  <div className="border-t border-zinc-100 pt-4 flex items-center justify-end gap-3 shrink-0 select-none">
  <button 
  type="button" 
  onClick={() => setAddGroupOpen(false)}
  className="h-9 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-650 transition-colors cursor-pointer"
  >
  Cancel
  </button>
  <button 
  type="submit"
  disabled={!groupName.trim() || selectedAccountIds.length === 0}
  className="h-9 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 border border-zinc-950 text-xs font-bold text-white transition-colors cursor-pointer"
  >
  Create Pool
  </button>
  </div>
  </form>
  </div>, document.body
  )}

 </div>
 );
}

// Custom X component removed

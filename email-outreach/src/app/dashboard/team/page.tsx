"use client";

import { useEffect, useState } from"react";
import { toast } from"sonner";
import { 
 Users, 
 UserPlus, 
 Trash2, 
 Loader2,
 Shield,
 X,
 Mail,
 UserCheck
} from"lucide-react";
import { GlowCard } from"@/components/ui/glow-card";
import { ShimmerButton } from"@/components/ui/shimmer-button";
import { cn } from"@/lib/utils";

interface TeamMember {
 id: string;
 name: string;
 email: string;
 role: string;
 status: string;
 createdAt: string;
}

export default function TeamPage() {
 const [members, setMembers] = useState<TeamMember[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [inviteOpen, setInviteOpen] = useState(false);
 const [inviteEmail, setInviteEmail] = useState("");
 const [inviteRole, setInviteRole] = useState("USER");
 const [isInviting, setIsInviting] = useState(false);

 const fetchMembers = async () => {
 setIsLoading(true);
 try {
 const res = await fetch("/api/team/members");
 if (!res.ok) throw new Error("Failed to load team members");
 const data = await res.json();
 setMembers(data.members || []);
 } catch (err: any) {
 toast.error(err.message ||"Failed to load team listing");
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 fetchMembers();
 }, []);

 const handleInvite = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!inviteEmail.trim()) return;
 setIsInviting(true);

 try {
 const res = await fetch("/api/team/invite", {
 method:"POST",
 headers: {"Content-Type":"application/json" },
 body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
 });

 if (!res.ok) {
 const errorData = await res.json();
 throw new Error(errorData.error ||"Failed to send invitation");
 }

 toast.success(`Invitation successfully sent to ${inviteEmail}!`);
 setInviteEmail("");
 setInviteOpen(false);
 fetchMembers();
 } catch (err: any) {
 toast.error(err.message ||"Failed to send invite");
 } finally {
 setIsInviting(false);
 }
 };

 const handleRemoveMember = async (id: string, name: string) => {
 if (!confirm(`Are you sure you want to remove ${name} from the team?`)) return;

 try {
 const res = await fetch(`/api/team/members?id=${id}`, {
 method:"DELETE",
 });
 if (!res.ok) throw new Error("Failed to remove member");

 toast.success(`Removed team member ${name}`);
 fetchMembers();
 } catch (err: any) {
 toast.error(err.message ||"Failed to remove member");
 }
 };

 return (
 <div className="flex-1 flex flex-col gap-8">
 
 {/* Header */}
 <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
 <div>
 <h1 className="text-2xl font-black tracking-tight text-zinc-800">
 Team Management
 </h1>
 <p className="text-sm text-zinc-500 font-medium">Invite colleagues, assign granular permissions, and track active member details.</p>
 </div>
 <div className="flex items-center gap-3">
 <ShimmerButton 
 onClick={() => setInviteOpen(true)}
 className="h-10 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
 shimmerColor="#818cf8"
 >
 <UserPlus className="w-4 h-4" /> Invite Member
 </ShimmerButton>
 </div>
 </header>

 {/* Grid listing */}
 {isLoading ? (
 <div className="flex-1 flex items-center justify-center min-h-[30vh]">
 <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
 </div>
 ) : members.length > 0 ? (
 <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs divide-y divide-zinc-100">
 <thead>
 <tr className="text-zinc-500 font-bold bg-zinc-50/50">
 <th className="p-4 font-semibold">User Info</th>
 <th className="p-4 font-semibold">Granular Role</th>
 <th className="p-4 font-semibold">Account Status</th>
 <th className="p-4 font-semibold">Date Connected</th>
 <th className="p-4 font-semibold text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-100">
 {members.map((m) => (
 <tr key={m.id} className="text-zinc-700">
 <td className="p-4">
 <div className="font-bold text-zinc-800">{m.name}</div>
 <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{m.email}</div>
 </td>
 <td className="p-4 font-bold text-zinc-800 flex items-center gap-1">
 <Shield className="w-3.5 h-3.5 text-indigo-600" /> {m.role}
 </td>
 <td className="p-4">
 <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
 m.status ==="ACTIVE" 
 ?"bg-emerald-50 text-emerald-700 border-emerald-200" 
 :"bg-amber-50 text-amber-700 border-amber-200"
 }`}>
 {m.status}
 </span>
 </td>
 <td className="p-4 text-zinc-650 font-semibold">
 {new Date(m.createdAt).toLocaleDateString()}
 </td>
 <td className="p-4 text-right">
 {m.role !=="OWNER" && (
 <button
 onClick={() => handleRemoveMember(m.id, m.name)}
 className="p-1.5 rounded-lg border border-transparent hover:border-red-200 hover:bg-red-50 text-zinc-400 hover:text-red-655 transition-all cursor-pointer"
 title="Revoke member permissions"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 ) : (
 <div className="text-center py-12 text-zinc-500 font-semibold">No members found.</div>
 )}

 {/* DIALOG: Invite Modal */}
 {inviteOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setInviteOpen(false)}>
 <form 
 onSubmit={handleInvite}
 className="w-full max-w-md bg-white border border-zinc-200 rounded-xl shadow-2xl p-4 space-y-5 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="flex items-center justify-between border-b border-zinc-100 pb-2 shrink-0">
 <h3 className="font-extrabold text-zinc-800 text-base flex items-center gap-1.5"><UserPlus className="w-4 h-4 text-indigo-600" /> Invite Collaborator</h3>
 <button type="button" onClick={() => setInviteOpen(false)} className="text-zinc-400 hover:text-zinc-655"><X className="w-4 h-4" /></button>
 </div>

 <div className="space-y-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-zinc-500">Email Address</label>
 <input 
 type="email" 
 placeholder="colleague@company.com" 
 value={inviteEmail}
 onChange={(e) => setInviteEmail(e.target.value)}
 className="w-full h-10 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:bg-white focus:outline-none"
 required
 autoFocus
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-bold text-zinc-500">Workspace Role</label>
 <select 
 value={inviteRole}
 onChange={(e) => setInviteRole(e.target.value)}
 className="w-full h-10 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:bg-white focus:outline-none"
 >
 <option value="ADMIN">Administrator (Full Access)</option>
 <option value="MANAGER">Manager (Edit Campaigns & Leads)</option>
 <option value="USER">User (Compose Drafts Only)</option>
 </select>
 </div>
 </div>

 <div className="border-t border-zinc-100 pt-4 flex items-center justify-end gap-3 shrink-0 select-none">
 <button 
 type="button" 
 onClick={() => setInviteOpen(false)}
 className="h-9 px-4 rounded-xl border border-zinc-250 hover:bg-zinc-50 text-xs font-bold text-zinc-650 transition-colors"
 >
 Cancel
 </button>
 <button 
 type="submit"
 disabled={isInviting || !inviteEmail.trim()}
 className="h-9 px-4 rounded-xl bg-indigo-650 hover:bg-indigo-550 disabled:opacity-40 text-xs font-bold text-white transition-colors flex items-center gap-1"
 >
 {isInviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
 Send Invite
 </button>
 </div>
 </form>
 </div>
 )}

 </div>
 );
}

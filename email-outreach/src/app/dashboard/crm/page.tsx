"use client";

import { useEffect, useState } from"react";
import { toast } from"sonner";
import { 
 Building, 
 UserPlus, 
 Trash2, 
 Loader2,
 X,
 Phone,
 Mail,
 MapPin,
 TrendingUp,
 Award,
 AlertCircle,
 HelpCircle,
 Briefcase
} from"lucide-react";
import { GlowCard } from"@/components/ui/glow-card";
import { ShimmerButton } from"@/components/ui/shimmer-button";
import { cn } from"@/lib/utils";

interface ContactItem {
 id: string;
 firstName: string | null;
 lastName: string | null;
 email: string;
 phone: string | null;
 title: string | null;
 status: string;
 notes: string | null;
 crmCompany: { name: string } | null;
}

export default function CrmPage() {
 const [contacts, setContacts] = useState<ContactItem[]>([]);
 const [isLoading, setIsLoading] = useState(true);

 // Form state
 const [addContactOpen, setAddContactOpen] = useState(false);
 const [firstName, setFirstName] = useState("");
 const [lastName, setLastName] = useState("");
 const [email, setEmail] = useState("");
 const [phone, setPhone] = useState("");
 const [title, setTitle] = useState("");
 const [companyName, setCompanyName] = useState("");
 const [status, setStatus] = useState("PROSPECT");
 const [notes, setNotes] = useState("");
 const [isSaving, setIsSaving] = useState(false);

 const fetchContacts = async () => {
 setIsLoading(true);
 try {
 const res = await fetch("/api/crm/contacts");
 if (!res.ok) throw new Error("Failed to load contacts");
 const data = await res.json();
 setContacts(data.contacts || []);
 } catch (err: any) {
 toast.error(err.message ||"Failed to load CRM listing");
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 fetchContacts();
 }, []);

 const handleAddContact = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!email.trim() || !firstName.trim()) return;
 setIsSaving(true);

 try {
 const res = await fetch("/api/crm/contacts", {
 method:"POST",
 headers: {"Content-Type":"application/json" },
 body: JSON.stringify({
 firstName,
 lastName,
 email,
 phone,
 title,
 companyName,
 status,
 notes,
 }),
 });

 if (!res.ok) throw new Error("Failed to add CRM contact");

 toast.success(`Successfully added CRM contact: ${firstName}`);
 setFirstName("");
 setLastName("");
 setEmail("");
 setPhone("");
 setTitle("");
 setCompanyName("");
 setStatus("PROSPECT");
 setNotes("");
 setAddContactOpen(false);
 fetchContacts();
 } catch (err: any) {
 toast.error(err.message ||"Failed to create contact");
 } finally {
 setIsSaving(false);
 }
 };

 const handleDeleteContact = async (id: string, name: string) => {
 if (!confirm(`Are you sure you want to delete CRM contact ${name}?`)) return;

 try {
 const res = await fetch(`/api/crm/contacts?id=${id}`, {
 method:"DELETE",
 });
 if (!res.ok) throw new Error("Failed to delete contact");

 toast.success(`Deleted CRM contact: ${name}`);
 fetchContacts();
 } catch (err: any) {
 toast.error(err.message ||"Failed to delete contact");
 }
 };

 // Pipeline count summary calculations
 const countByStage = (stage: string) => {
 return contacts.filter(c => c.status === stage).length;
 };

 return (
 <div className="flex-1 flex flex-col gap-8">
 
 {/* Header */}
 <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
 <div>
 <h1 className="text-2xl font-black tracking-tight text-zinc-800">
 CRM Contacts
 </h1>
 <p className="text-sm text-zinc-500 font-medium">Pipeline tracking dashboard connecting campaign leads with deal cycles.</p>
 </div>
 <div className="flex items-center gap-3">
 <ShimmerButton 
 onClick={() => setAddContactOpen(true)}
 className="h-10 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
 shimmerColor="#818cf8"
 >
 <UserPlus className="w-4 h-4" /> Add CRM Contact
 </ShimmerButton>
 </div>
 </header>

 {/* Pipeline Summary Cards */}
 <section className="grid grid-cols-2 sm:grid-cols-5 gap-4 select-none">
 {[
 { label:"Prospects", stage:"PROSPECT", color:"text-zinc-500" },
 { label:"Contacted", stage:"CONTACTED", color:"text-indigo-600" },
 { label:"Warm", stage:"WARM", color:"text-amber-600" },
 { label:"Won", stage:"WON", color:"text-emerald-600" },
 { label:"Lost", stage:"LOST", color:"text-red-600" },
 ].map(stageInfo => (
 <GlowCard key={stageInfo.stage} className="border border-zinc-200/85 bg-white" glowColor="rgba(99, 102, 241, 0.05)">
 <div className="p-4 space-y-1 text-center">
 <div className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">{stageInfo.label}</div>
 <div className={cn("text-2xl font-black mt-1", stageInfo.color)}>{countByStage(stageInfo.stage)}</div>
 </div>
 </GlowCard>
 ))}
 </section>

 {/* Grid listing */}
 {isLoading ? (
 <div className="flex-1 flex items-center justify-center min-h-[30vh]">
 <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
 </div>
 ) : contacts.length > 0 ? (
 <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs divide-y divide-zinc-100">
 <thead>
 <tr className="text-zinc-500 font-bold bg-zinc-50/50">
 <th className="p-4 font-semibold">Contact Info</th>
 <th className="p-4 font-semibold">Company Name</th>
 <th className="p-4 font-semibold">Job Title</th>
 <th className="p-4 font-semibold">Deal Stage</th>
 <th className="p-4 font-semibold text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-100">
 {contacts.map((c) => (
 <tr key={c.id} className="text-zinc-600 hover:bg-zinc-50/40">
 <td className="p-4">
 <div className="font-bold text-zinc-800">{c.firstName} {c.lastName ||""}</div>
 <div className="text-[10px] text-zinc-450 font-mono mt-0.5">{c.email}</div>
 </td>
 <td className="p-4 font-bold text-zinc-800 flex items-center gap-1">
 <Building className="w-3.5 h-3.5 text-zinc-400" /> {c.crmCompany?.name ||"—"}
 </td>
 <td className="p-4 text-zinc-500 font-semibold">{c.title ||"—"}</td>
 <td className="p-4">
 <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
 c.status ==="WON" 
 ?"bg-emerald-50 text-emerald-700 border border-emerald-200" 
 : c.status ==="WARM"
 ?"bg-amber-50 text-amber-700 border border-amber-200"
 : c.status ==="LOST"
 ?"bg-red-550/10 text-red-600 border border-red-200/50"
 :"bg-zinc-100 text-zinc-650 border border-zinc-200"
 }`}>
 {c.status}
 </span>
 </td>
 <td className="p-4 text-right">
 <button
 onClick={() => handleDeleteContact(c.id, `${c.firstName} ${c.lastName ||""}`)}
 className="p-1.5 rounded-lg border border-transparent hover:border-red-500/15 hover:bg-red-500/5 text-zinc-400 hover:text-red-600 transition-all cursor-pointer"
 title="Remove contact"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 ) : (
 <div className="text-center py-12 text-zinc-400 font-medium border border-zinc-200 border-dashed rounded-xl">No contacts found in pipeline.</div>
 )}

 {/* DIALOG: Add Contact Modal */}
 {addContactOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setAddContactOpen(false)}>
 <form 
 onSubmit={handleAddContact}
 className="w-full max-w-lg bg-white border border-zinc-200 rounded-xl shadow-2xl p-4 space-y-4 flex flex-col overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="flex items-center justify-between border-b border-zinc-100 pb-2 shrink-0">
 <h3 className="font-extrabold text-zinc-800 text-base flex items-center gap-1.5"><Building className="w-4 h-4 text-indigo-650" /> Add CRM Contact</h3>
 <button type="button" onClick={() => setAddContactOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-4 h-4" /></button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-1">
 <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider">First Name *</label>
 <input 
 type="text" 
 placeholder="e.g. John" 
 value={firstName}
 onChange={(e) => setFirstName(e.target.value)}
 className="w-full h-9 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:outline-none"
 required
 />
 </div>

 <div className="space-y-1">
 <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider">Last Name</label>
 <input 
 type="text" 
 placeholder="e.g. Doe" 
 value={lastName}
 onChange={(e) => setLastName(e.target.value)}
 className="w-full h-9 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:outline-none"
 />
 </div>

 <div className="space-y-1">
 <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider">Email Address *</label>
 <input 
 type="email" 
 placeholder="john.doe@company.com" 
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="w-full h-9 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:outline-none"
 required
 />
 </div>

 <div className="space-y-1">
 <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider">Phone Number</label>
 <input 
 type="text" 
 placeholder="+1 (555) 123-4567" 
 value={phone}
 onChange={(e) => setPhone(e.target.value)}
 className="w-full h-9 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:outline-none"
 />
 </div>

 <div className="space-y-1">
 <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider">Job Title</label>
 <input 
 type="text" 
 placeholder="e.g. VP of Sales" 
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 className="w-full h-9 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:outline-none"
 />
 </div>

 <div className="space-y-1">
 <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider">Company Name</label>
 <input 
 type="text" 
 placeholder="e.g. Acme Corp" 
 value={companyName}
 onChange={(e) => setCompanyName(e.target.value)}
 className="w-full h-9 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:outline-none"
 />
 </div>

 <div className="space-y-1 col-span-2">
 <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider">Deal Pipeline Stage</label>
 <select 
 value={status}
 onChange={(e) => setStatus(e.target.value)}
 className="w-full h-9 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:outline-none"
 >
 <option value="PROSPECT">Prospect Lead</option>
 <option value="CONTACTED">Contacted Outreach</option>
 <option value="WARM">Warm Pipeline</option>
 <option value="WON">Closed Won Deal</option>
 <option value="LOST">Closed Lost</option>
 </select>
 </div>

 <div className="space-y-1 col-span-2">
 <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider">Contact Notes</label>
 <textarea 
 placeholder="Add internal pipeline updates..." 
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 rows={2}
 className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:outline-none"
 />
 </div>
 </div>

 <div className="border-t border-zinc-100 pt-4 flex items-center justify-end gap-3 shrink-0 select-none">
 <button 
 type="button" 
 onClick={() => setAddContactOpen(false)}
 className="h-9 px-4 rounded-xl border border-zinc-250 hover:bg-zinc-50 text-xs font-bold text-zinc-650 transition-colors"
 >
 Cancel
 </button>
 <button 
 type="submit"
 disabled={isSaving || !email.trim() || !firstName.trim()}
 className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-bold text-white transition-colors"
 >
 Create Contact
 </button>
 </div>
 </form>
 </div>
 )}

 </div>
 );
}

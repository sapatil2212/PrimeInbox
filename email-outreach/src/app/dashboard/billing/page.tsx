"use client";

import { useEffect, useState } from"react";
import { toast } from"sonner";
import { 
 CreditCard, 
 Check, 
 HelpCircle, 
 Loader2, 
 AlertCircle, 
 FileText, 
 ArrowUpRight,
 TrendingUp,
 Receipt
} from"lucide-react";
import { GlowCard } from"@/components/ui/glow-card";
import { ShimmerButton } from"@/components/ui/shimmer-button";

interface Subscription {
 status: string;
 currentPeriodStart: string;
 currentPeriodEnd: string;
 stripePriceId: string;
}

interface Invoice {
 id: string;
 invoiceNumber: string;
 amount: number;
 currency: string;
 status: string;
 createdAt: string;
}

export default function BillingPage() {
 const [activePlan, setActivePlan] = useState("FREE");
 const [subscription, setSubscription] = useState<Subscription | null>(null);
 const [invoices, setInvoices] = useState<Invoice[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [isUpdating, setIsUpdating] = useState(false);

 const fetchBillingInfo = async () => {
 try {
 const res = await fetch("/api/billing");
 if (!res.ok) throw new Error("Failed to load billing metrics");
 const data = await res.json();
 setSubscription(data.subscription);
 setInvoices(data.invoices || []);
 setActivePlan(data.plan ||"FREE");
 } catch (err: any) {
 toast.error(err.message ||"Failed to load billing status");
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 fetchBillingInfo();
 }, []);

 const handlePlanChange = async (planName: string, amount: number) => {
 setIsUpdating(true);
 try {
 const res = await fetch("/api/billing", {
 method:"POST",
 headers: {"Content-Type":"application/json" },
 body: JSON.stringify({ plan: planName, amount }),
 });

 if (!res.ok) throw new Error("Failed to process payment/subscription upgrade");
 const data = await res.json();
 
 toast.success(`Plan updated successfully to ${planName}!`);
 fetchBillingInfo();
 } catch (err: any) {
 toast.error(err.message ||"Upgrade failed.");
 } finally {
 setIsUpdating(false);
 }
 };

 const plans = [
 {
 name:"FREE",
 price: 0,
 description:"Perfect for testing outreach flow capabilities.",
 features: [
"100 sends monthly limit",
"1 connected SMTP Account",
"Basic email builder",
"Email analytics summaries"
 ],
 limitText:"100 sends/mo"
 },
 {
 name:"STARTER",
 price: 29,
 description:"Ideal for small teams launching initial cold sequences.",
 features: [
"5,000 sends monthly limit",
"5 connected SMTP Accounts",
"Smart round-robin rotation",
"AI Studio generation (50 credits/mo)"
 ],
 limitText:"5,000 sends/mo"
 },
 {
 name:"PRO",
 price: 79,
 description:"Our most popular tier for high-converting sales pipelines.",
 features: [
"25,000 sends monthly limit",
"25 connected SMTP Accounts",
"Weighted & Priority rotation",
"Full AI Sequence generator (Unlimited)",
"Open & Reply Sniffer tracking",
"CRM Pipeline Sync"
 ],
 recommended: true,
 limitText:"25,000 sends/mo"
 },
 {
 name:"ENTERPRISE",
 price: 199,
 description:"Enterprise scalability for agency-level scale outreach.",
 features: [
"Unlimited monthly sends",
"Unlimited SMTP Accounts",
"Custom tracking domains",
"Dedicated workspace priority queues",
"Priority 24/7 Support SLA"
 ],
 limitText:"Unlimited sends"
 }
 ];

 if (isLoading) {
 return (
 <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
 <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
 <p className="text-xs font-bold uppercase tracking-wider">Loading subscriptions dashboard...</p>
 </div>
 );
 }

 return (
 <div className="flex-1 flex flex-col gap-8">
 
 {/* Page Header */}
 <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
 <div>
 <h1 className="text-2xl font-black tracking-tight text-zinc-800">
 Billing & Plans
 </h1>
 <p className="text-sm text-zinc-500 font-medium">Manage your subscription packages, invoice history, and outreach sending limits.</p>
 </div>
 </header>

 {/* Subscription Info Card */}
 {subscription && (
 <section className="bg-white border border-zinc-200/85 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
 <div>
 <div className="flex items-center gap-2">
 <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-50 text-indigo-650 border border-indigo-100 rounded-md uppercase">
 {activePlan} PLAN
 </span>
 <span className="text-xs font-bold text-zinc-500">Status: <span className="text-emerald-600 uppercase font-black">{subscription.status}</span></span>
 </div>
 <p className="text-zinc-650 text-xs font-semibold mt-2">
 Your next renewal date is <span className="text-zinc-800 font-bold">{new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { dateStyle:"long" })}</span>
 </p>
 </div>
 <div>
 <span className="text-zinc-450 text-[10px] uppercase font-bold tracking-wider">Current rate</span>
 <div className="text-2xl font-black text-zinc-800 mt-0.5">
 ${plans.find(p => p.name === activePlan)?.price || 0}<span className="text-xs text-zinc-500 font-medium">/mo</span>
 </div>
 </div>
 </section>
 )}

 {/* Interactive Plans Grid */}
 <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
 {plans.map((plan) => {
 const isCurrent = activePlan === plan.name;
 return (
 <GlowCard 
 key={plan.name} 
 className={`p-4 rounded-xl border transition-all flex flex-col justify-between relative ${
 plan.recommended ?"border-indigo-600/60 shadow-indigo-600/5" :"border-zinc-200"
 }`}
 >
 {plan.recommended && (
 <div className="absolute -top-3 right-6 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-extrabold text-[9px] uppercase tracking-wider shadow">
 Recommended
 </div>
 )}
 
 <div>
 <h3 className="font-extrabold text-lg text-zinc-800">{plan.name}</h3>
 <p className="text-[11px] text-zinc-500 mt-1 min-h-[32px] font-medium">{plan.description}</p>
 
 <div className="mt-4 flex items-baseline gap-1">
 <span className="text-3xl font-black text-zinc-800">${plan.price}</span>
 <span className="text-xs text-zinc-500 font-semibold">/mo</span>
 </div>
 
 <div className="mt-2 text-[10px] text-indigo-650 font-extrabold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/50 inline-block">
 {plan.limitText}
 </div>

 <div className="mt-6 border-t border-zinc-100 pt-4 space-y-2.5">
 {plan.features.map((feature, i) => (
 <div key={i} className="flex gap-2 items-start text-xs text-zinc-600 font-medium">
 <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
 <span>{feature}</span>
 </div>
 ))}
 </div>
 </div>

 <div className="mt-8">
 {isCurrent ? (
 <button 
 disabled 
 className="w-full h-10 rounded-xl bg-zinc-100 text-zinc-400 text-xs font-bold border border-zinc-200 cursor-default"
 >
 Current Active Plan
 </button>
 ) : (
 <ShimmerButton
 disabled={isUpdating}
 onClick={() => handlePlanChange(plan.name, plan.price)}
 className={`w-full h-10 rounded-xl text-xs font-bold transition-all ${
 plan.recommended 
 ?"bg-indigo-600 hover:bg-indigo-500 text-white" 
 :"bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 hover:text-zinc-800"
 }`}
 shimmerColor={plan.recommended ?"#818cf8" :"#e4e4e7"}
 >
 {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Select ${plan.name}`}
 </ShimmerButton>
 )}
 </div>
 </GlowCard>
 );
 })}
 </section>

 {/* Invoice History Table */}
 <section className="bg-white border border-zinc-200 rounded-xl p-4">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h3 className="font-bold text-base text-zinc-800 flex items-center gap-2">
 Invoice History <Receipt className="w-4 h-4 text-indigo-600" />
 </h3>
 <p className="text-xs text-zinc-500 mt-0.5">Browse past payments, dynamic bills, and statements download logs.</p>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full border-collapse text-left text-xs text-zinc-600">
 <thead>
 <tr className="border-b border-zinc-100 text-zinc-500 font-bold uppercase text-[9px] tracking-wider">
 <th className="pb-3">Invoice Number</th>
 <th className="pb-3">Date</th>
 <th className="pb-3">Amount</th>
 <th className="pb-3">Status</th>
 <th className="pb-3 text-right">Receipt</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-100">
 {invoices.map((inv) => (
 <tr key={inv.id} className="hover:bg-zinc-50/50">
 <td className="py-3.5 font-bold text-zinc-800">{inv.invoiceNumber}</td>
 <td className="py-3.5 text-zinc-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
 <td className="py-3.5 font-semibold text-zinc-700">${inv.amount.toFixed(2)} USD</td>
 <td className="py-3.5">
 <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
 {inv.status}
 </span>
 </td>
 <td className="py-3.5 text-right">
 <button 
 onClick={() => toast.success("Downloading simulated PDF invoice...")}
 className="text-indigo-600 hover:text-indigo-700 font-bold text-xs inline-flex items-center gap-1 hover:underline"
 >
 <FileText className="w-3.5 h-3.5" /> PDF
 </button>
 </td>
 </tr>
 ))}
 {invoices.length === 0 && (
 <tr>
 <td colSpan={5} className="py-6 text-center text-zinc-400 font-semibold">No invoices recorded yet.</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </section>

 </div>
 );
}

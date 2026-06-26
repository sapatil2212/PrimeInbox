"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/feedback";
import {
  Loader2,
  Receipt,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { CheckoutPlans } from "@/components/billing/checkout-plans";
import { getPlan } from "@/lib/plans";
import { cn } from "@/lib/utils";

interface Subscription {
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface TrialInfo {
  blocked: boolean;
  onTrial: boolean;
  isPaid: boolean;
  daysLeft: number;
  status: string;
}

export default function BillingPage() {
  const [activePlan, setActivePlan] = useState("FREE");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [trial, setTrial] = useState<TrialInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBillingInfo = async () => {
    try {
      const res = await fetch("/api/billing");
      if (!res.ok) throw new Error("Failed to load billing metrics");
      const data = await res.json();
      setSubscription(data.subscription);
      setInvoices(data.invoices || []);
      setActivePlan(data.plan || "FREE");
      setTrial(data.trial || null);
    } catch (err: any) {
      toast.error(err.message || "Failed to load billing status");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
        <p className="text-xs font-bold uppercase tracking-wider">Loading subscription...</p>
      </div>
    );
  }

  const planMeta = getPlan(activePlan);
  const isPaid = trial?.isPaid;

  return (
    <div className="flex-1 flex flex-col gap-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900">Billing & Plans</h1>
        <p className="text-sm text-zinc-500 font-medium">
          Manage your subscription, payment history, and outreach sending limits.
        </p>
      </header>

      {/* Status card */}
      <section
        className={cn(
          "rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
          trial?.onTrial
            ? "border-indigo-200 bg-indigo-50/50"
            : isPaid
            ? "border-emerald-200 bg-emerald-50/40"
            : "border-amber-200 bg-amber-50/50"
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              isPaid ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"
            )}
          >
            {isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-zinc-900">{planMeta?.name || activePlan} plan</span>
              <span
                className={cn(
                  "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                  isPaid ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                )}
              >
                {trial?.status || "ACTIVE"}
              </span>
            </div>
            <p className="text-xs text-zinc-600 font-semibold mt-1">
              {isPaid && subscription
                ? `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { dateStyle: "long" })}`
                : trial?.onTrial
                ? `Free trial — ${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} remaining. Subscribe to keep access.`
                : "Your trial has ended. Subscribe to a plan to continue."}
            </p>
          </div>
        </div>
        {planMeta && (
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Current rate</span>
            <div className="text-2xl font-black text-zinc-900">
              ₹{planMeta.price}
              <span className="text-xs text-zinc-500 font-medium">/mo</span>
            </div>
          </div>
        )}
      </section>

      {/* Plans */}
      <section>
        <h2 className="text-sm font-extrabold text-zinc-900 mb-1">Choose a plan</h2>
        <p className="text-xs text-zinc-500 font-medium mb-5">
          {isPaid
            ? "Upgrade or change your subscription anytime."
            : planMeta
            ? `Your selected plan (${planMeta.name}) is highlighted below — subscribe to activate it.`
            : "Select a plan to activate your account."}
        </p>
        <CheckoutPlans currentPlan={activePlan} isPaid={!!isPaid} onSuccess={fetchBillingInfo} />
      </section>

      {/* Invoices */}
      <section className="bg-white border border-zinc-200 rounded-2xl p-5">
        <div className="mb-5">
          <h3 className="font-extrabold text-sm text-zinc-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600" /> Invoice History
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5 font-medium">Past payments and statements.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase text-[9px] tracking-wider">
                <th className="pb-3">Invoice</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-50/50">
                  <td className="py-3 font-bold text-zinc-800">{inv.invoiceNumber}</td>
                  <td className="py-3 text-zinc-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 font-semibold text-zinc-700">
                    {inv.currency?.toLowerCase() === "inr" ? "₹" : "$"}
                    {inv.amount.toFixed(2)}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-zinc-400 font-semibold">
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

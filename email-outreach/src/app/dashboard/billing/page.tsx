"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/feedback";
import {
  Loader2,
  Receipt,
  Clock,
  CheckCircle2,
  Download,
  Repeat,
  AlertCircle,
  CreditCard,
  XCircle,
  FileText,
} from "lucide-react";
import { CheckoutPlans } from "@/components/billing/checkout-plans";
import { getPlan } from "@/lib/plans";
import { cn } from "@/lib/utils";

interface Subscription {
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

interface Payment {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  createdAt: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  pdfUrl?: string;
  createdAt: string;
  payments?: Payment[];
}

interface Mandate {
  id: string;
  zohoMandateId: string;
  paymentMode?: string;
  status: string;
  amount: number;
  lastChargedAt?: string;
  nextChargeAt?: string;
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
  const [mandate, setMandate] = useState<Mandate | null>(null);
  const [trial, setTrial] = useState<TrialInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchBillingInfo = async () => {
    try {
      const res = await fetch("/api/billing");
      if (!res.ok) throw new Error("Failed to load billing metrics");
      const data = await res.json();
      setSubscription(data.subscription);
      setInvoices(data.invoices || []);
      setMandate(data.mandate || null);
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

  const downloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    setDownloadingId(invoiceId);
    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/pdf`);
      if (!res.ok) {
        throw new Error("Failed to generate invoice PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Invoice PDF downloaded");
    } catch (err: any) {
      toast.error(err.message || "Failed to download PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
        <p className="text-xs font-bold uppercase tracking-wider">Loading subscription & billing details...</p>
      </div>
    );
  }

  const planMeta = getPlan(activePlan);
  const isPaid = trial?.isPaid;

  return (
    <div className="flex-1 flex flex-col gap-8 max-w-6xl mx-auto w-full pb-10">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900">Billing & Plans</h1>
        <p className="text-sm text-zinc-500 font-medium">
          Manage your subscription, auto-pay mandate, transaction history, and download official invoice PDFs.
        </p>
      </header>

      {/* Status card */}
      <section
        className={cn(
          "rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm",
          trial?.onTrial
            ? "border-indigo-200 bg-indigo-50/50"
            : isPaid
            ? "border-emerald-200 bg-emerald-50/40"
            : "border-amber-200 bg-amber-50/50"
        )}
      >
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
              isPaid ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white"
            )}
          >
            {isPaid ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-zinc-900">{planMeta?.name || activePlan} Plan</span>
              <span
                className={cn(
                  "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border",
                  isPaid
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-indigo-100 text-indigo-800 border-indigo-200"
                )}
              >
                {trial?.status || "ACTIVE"}
              </span>
            </div>
            <p className="text-xs text-zinc-600 font-semibold mt-1">
              {isPaid && subscription
                ? `Subscription active until ${new Date(subscription.currentPeriodEnd).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}`
                : "Subscribe to a plan to activate full workspace outreach features."}
            </p>
          </div>
        </div>
        {planMeta && (
          <div className="text-right sm:border-l sm:border-zinc-200/80 sm:pl-6">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">Current plan price</span>
            <div className="text-2xl font-black text-zinc-900 mt-0.5">
              ₹{planMeta.price.toLocaleString("en-IN")}
              <span className="text-xs text-zinc-500 font-medium">/mo</span>
            </div>
          </div>
        )}
      </section>

      {/* Auto-Pay Mandate Info (If enrolled) */}
      {mandate && (
        <section className="bg-gradient-to-r from-indigo-900 to-zinc-900 rounded-2xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300 shrink-0">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Auto-Pay Mandate Enrolled</h3>
                <span
                  className={cn(
                    "text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase border",
                    mandate.status === "ACTIVE"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  )}
                >
                  {mandate.status}
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Payment mode: <strong className="text-white">{mandate.paymentMode || "Mandate Auto-Pay"}</strong>
                {mandate.nextChargeAt && (
                  <span className="ml-3">
                    Next auto-charge:{" "}
                    <strong className="text-white">
                      {new Date(mandate.nextChargeAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="text-right font-mono text-xs text-indigo-300 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
            Mandate ID: <span className="text-white font-bold">{mandate.zohoMandateId}</span>
          </div>
        </section>
      )}

      {/* Choose a plan */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-black text-zinc-900">Subscription Plans</h2>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            {isPaid
              ? "Upgrade or change your subscription tier anytime."
              : "Select a pricing plan to activate your workspace with auto-pay support."}
          </p>
        </div>
        <CheckoutPlans currentPlan={activePlan} isPaid={!!isPaid} onSuccess={fetchBillingInfo} />
      </section>

      {/* Invoices & Transactions Table */}
      <section className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-zinc-100">
          <div>
            <h3 className="font-extrabold text-base text-zinc-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              Invoices & Transaction History
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">
              View official billing statements, Zoho transaction reference numbers, and download invoice PDFs.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase text-[9px] tracking-wider bg-zinc-50/70">
                <th className="py-3 px-4 rounded-l-lg">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Zoho Transaction ID</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right rounded-r-lg">Invoice PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {invoices.map((inv) => {
                const lastPayment = inv.payments?.[0];
                return (
                  <tr key={inv.id} className="hover:bg-zinc-50/60 transition-colors">
                    {/* Invoice Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                      {inv.invoiceNumber}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-zinc-600 font-medium whitespace-nowrap">
                      {new Date(inv.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      <br />
                      <span className="text-[10px] text-zinc-400">
                        {new Date(inv.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-black text-zinc-900 text-sm">
                      ₹{inv.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Transaction ID */}
                    <td className="py-3.5 px-4 font-mono text-zinc-700">
                      {lastPayment?.transactionId ? (
                        <span className="bg-zinc-100 text-zinc-800 px-2 py-1 rounded text-[11px] font-semibold border border-zinc-200/60">
                          {lastPayment.transactionId}
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Provider / Payment Method */}
                    <td className="py-3.5 px-4 text-zinc-600 font-semibold uppercase text-[11px]">
                      {lastPayment?.provider || mandate?.paymentMode || "Online"}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase border inline-flex items-center gap-1",
                          inv.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : inv.status === "FAILED"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                      >
                        {inv.status === "PAID" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : inv.status === "FAILED" ? (
                          <XCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {inv.status}
                      </span>
                    </td>

                    {/* Action PDF Download */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => downloadPdf(inv.id, inv.invoiceNumber)}
                        disabled={downloadingId === inv.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all border border-indigo-200/60 shadow-2xs disabled:opacity-50"
                      >
                        {downloadingId === inv.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        Download PDF
                      </button>
                    </td>
                  </tr>
                );
              })}

              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-400 font-semibold">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                    No invoices or transactions found for this workspace.
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

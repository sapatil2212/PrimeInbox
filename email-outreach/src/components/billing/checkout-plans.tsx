"use client";

import { useState } from "react";
import { Check, X, Loader2, Sparkles, RefreshCw, ShieldCheck, CreditCard } from "lucide-react";
import { toast } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/plans";

declare global {
  interface Window {
    ZPayments?: any;
  }
}

function loadZohoScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.ZPayments) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://static.zohocdn.com/zpay/zpay-js/v1/zpayments.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CheckoutPlans({
  currentPlan,
  isPaid,
  onSuccess,
  prefill,
}: {
  currentPlan?: string;
  isPaid?: boolean;
  onSuccess?: () => void;
  prefill?: { name?: string; email?: string; contact?: string };
}) {
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (busyPlan) return; // Prevent double-click
    setBusyPlan(planId);
    try {
      // 1. Create payment session
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const resText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(resText);
      } catch {
        if (res.status === 401) {
          throw new Error("Your session has expired. Please refresh and log in again.");
        }
        if (res.status === 404) {
          throw new Error("Checkout service unavailable (404). Please refresh the page.");
        }
        throw new Error("Invalid response from server. Please try again.");
      }

      if (!res.ok) throw new Error(data.error || "Failed to start checkout");

      // 2. Load Zoho Payments script
      const ok = await loadZohoScript();
      if (!ok) throw new Error("Could not load payment gateway. Check your connection.");

      // 3. Initialize Zoho Payments instance
      const instance = new window.ZPayments({
        account_id: data.accountId,
        domain: "IN",
        otherOptions: {
          api_key: data.apiKey,
        },
      });

      // 4. Open checkout widget with clear recurring mandate description
      try {
        const response = await instance.requestPaymentMethod({
          payments_session_id: data.paymentsSessionId,
          amount: String(data.amount),
          currency_code: data.currency,
          description: `Auto-Recurring Monthly Subscription to ${data.planName || planId} Plan (₹${data.amount}/month)`,
        });

        // 5. Verify payment on server
        if (response && response.payment_id) {
          const verifyRes = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId: response.payment_id,
              paymentsSessionId: data.paymentsSessionId,
              planId,
            }),
          });
          
          const verifyText = await verifyRes.text();
          let verifyData: any = {};
          try {
            verifyData = JSON.parse(verifyText);
          } catch {
            throw new Error("Server returned invalid response during payment verification.");
          }

          if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");
          toast.success(verifyData.message || "Monthly Auto-Pay Subscription activated!");
          onSuccess?.();
        }
      } catch (widgetError: any) {
        // Widget was closed/cancelled by the user, or payment failed
        if (
          widgetError?.message?.includes("cancelled") ||
          widgetError?.message?.includes("closed") ||
          widgetError?.code === "PAYMENT_CANCELLED"
        ) {
          toast.error("Payment setup was cancelled");
        } else if (widgetError?.message?.includes("verification failed")) {
          throw widgetError;
        } else {
          toast.error(widgetError?.message || "Payment could not be completed");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLANS.map((plan) => {
          const isEnrolled = currentPlan === plan.id;
          const isActivePaid = isEnrolled && !!isPaid;
          const busy = busyPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border p-5 transition-all",
                isEnrolled
                  ? "border-emerald-400 bg-emerald-50/30 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10"
                  : plan.popular
                  ? "border-indigo-300 bg-white shadow-lg shadow-indigo-500/5"
                  : "border-zinc-200 bg-white"
              )}
            >
              {isEnrolled ? (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> Active Auto-Pay Plan
                </span>
              ) : plan.popular ? (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Most Popular
                </span>
              ) : null}
              
              <h3 className="text-lg font-black text-zinc-900">{plan.name}</h3>
              
              <div className="mt-2 flex items-baseline gap-1">
                {plan.free ? (
                  <span className="text-3xl font-black text-zinc-900">Free</span>
                ) : (
                  <>
                    <span className="text-3xl font-black text-zinc-900">₹{plan.price}</span>
                    <span className="text-xs text-zinc-500 font-semibold">/month</span>
                  </>
                )}
              </div>

              {!plan.free && (
                <div className="mt-1 text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 shrink-0" />
                  <span>Auto-renews monthly • Cancel anytime</span>
                </div>
              )}

              <ul className="mt-5 space-y-2.5 flex-1">
                {plan.features.map((f, i) => {
                  const isObj = typeof f === "object";
                  const included = isObj ? f.included : true;
                  const text = isObj ? f.text : f;
                  return (
                    <li
                      key={i}
                      className={cn(
                        "flex items-start gap-2 text-xs font-semibold",
                        included ? "text-zinc-600" : "text-zinc-400"
                      )}
                    >
                      {included ? (
                        <Check className={cn("w-4 h-4 shrink-0 mt-0.5", isEnrolled ? "text-emerald-600" : plan.popular ? "text-indigo-600" : "text-zinc-400")} />
                      ) : (
                        <X className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                      )}
                      <span>{text}</span>
                    </li>
                  );
                })}
              </ul>

              {plan.free ? (
                <div className="mt-6 h-11 rounded-xl text-xs font-bold flex items-center justify-center bg-zinc-50 border border-zinc-200 text-zinc-500">
                  {isEnrolled ? "Current Free Plan" : "Free Plan"}
                </div>
              ) : (
                <button
                  disabled={isActivePaid || busy}
                  onClick={() => handleSubscribe(plan.id)}
                  className={cn(
                    "mt-6 h-11 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:cursor-default",
                    isActivePaid
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : isEnrolled
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : plan.popular
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                      : "bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700"
                  )}
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isActivePaid ? (
                    "Active Auto-Pay Plan"
                  ) : isEnrolled ? (
                    `Enable Auto-Pay — ₹${plan.price}/mo`
                  ) : (
                    `Start Auto-Pay — ₹${plan.price}/mo`
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Auto-Pay Guarantee & Payment Mode Info Footer */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-xs text-indigo-900 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>
            <strong>Seamless Auto-Renewal:</strong> Supports <strong>Credit Cards, Debit Cards, UPI AutoPay, & Netbanking e-Mandates</strong>.
            You will receive a 24-hour pre-debit alert before each monthly billing cycle.
          </span>
        </div>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold shrink-0 text-[11px]">
          <CreditCard className="w-4 h-4" />
          <span>Cards • UPI • Netbanking</span>
        </div>
      </div>
    </div>
  );
}

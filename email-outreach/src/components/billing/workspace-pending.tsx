"use client";

import { useRouter } from "next/navigation";
import { Clock, LogOut, Mail } from "lucide-react";
import { toast } from "@/components/ui/feedback";

export function WorkspacePending({
  planName,
  email,
}: {
  planName?: string;
  email?: string;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to log out");
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6 border border-indigo-100">
          <Clock className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-zinc-900">
          Your workspace is pending activation
        </h1>
        <p className="text-sm text-zinc-500 font-medium mt-3 leading-relaxed">
          Thanks for registering with PrimeInbox{planName ? ` on the ${planName} plan` : ""}. Your
          account is currently being reviewed and will be activated shortly. We&apos;ll send a
          confirmation email with your login link and plan details to{" "}
          <span className="font-bold text-zinc-700">{email || "your registered email"}</span> as soon
          as it&apos;s ready.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-600">
          <Mail className="w-4 h-4 text-indigo-500" />
          Need help? contact.primeinbox@gmail.com
        </div>

        <div>
          <button
            onClick={handleLogout}
            className="mt-8 inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>
      </div>
    </div>
  );
}

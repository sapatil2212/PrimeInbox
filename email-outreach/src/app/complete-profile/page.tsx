"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/components/ui/feedback";
import { GlowCard } from "@/components/ui/glow-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Mail, Globe, Clock, Palette, Loader2, ArrowRight } from "lucide-react";

const completeProfileSchema = z.object({
  timezone: z.string().min(1, "Please select your timezone"),
  language: z.string().min(1, "Please select your preferred language"),
  theme: z.string().min(1, "Please select a theme preference"),
});

type CompleteProfileValues = z.infer<typeof completeProfileSchema>;

export default function CompleteProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteProfileValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      timezone: "UTC",
      language: "en",
      theme: "dark",
    },
  });

  const onSubmit = async (data: CompleteProfileValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile settings.");
      }

      toast.success("Profile onboarding completed!");
      
      // Redirect to main dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to complete onboarding.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-[460px] my-12">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <img src="/logo/primeinbox-logo.png" alt="PrimeInbox Logo" className="h-9 w-auto group-hover:scale-105 transition-all" />
          </Link>
          <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Complete your profile</h2>
          <p className="text-xs text-zinc-500 font-semibold mt-1">Configure your workspace defaults to get started.</p>
        </div>

        <GlowCard className="border border-zinc-200/50 shadow-none" glowColor="rgba(59, 130, 246, 0.05)">
          <div className="p-8">
            <form className="flex flex-col gap-5 text-left" onSubmit={handleSubmit(onSubmit)}>
              {/* Timezone */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="timezone" className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" /> Timezone
                </label>
                <select
                  id="timezone"
                  {...register("timezone")}
                  className="h-11 px-3 w-full rounded-xl border border-zinc-200 bg-white text-zinc-800 text-sm font-semibold focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                >
                  <option value="UTC">UTC (GMT+00:00)</option>
                  <option value="America/New_York">Eastern Time (EST, GMT-05:00)</option>
                  <option value="America/Chicago">Central Time (CST, GMT-06:00)</option>
                  <option value="America/Denver">Mountain Time (MST, GMT-07:00)</option>
                  <option value="America/Los_Angeles">Pacific Time (PST, GMT-08:00)</option>
                  <option value="Europe/London">London (GMT+00:00)</option>
                  <option value="Europe/Paris">Paris (CET, GMT+01:00)</option>
                  <option value="Asia/Kolkata">India (IST, GMT+05:30)</option>
                  <option value="Asia/Tokyo">Tokyo (JST, GMT+09:00)</option>
                  <option value="Australia/Sydney">Sydney (AEST, GMT+10:00)</option>
                </select>
                {errors.timezone && <p className="text-[11px] font-bold text-red-500 mt-0.5">{errors.timezone.message}</p>}
              </div>

              {/* Language */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="language" className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-zinc-400" /> Language
                </label>
                <select
                  id="language"
                  {...register("language")}
                  className="h-11 px-3 w-full rounded-xl border border-zinc-200 bg-white text-zinc-800 text-sm font-semibold focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Español (Spanish)</option>
                  <option value="fr">Français (French)</option>
                  <option value="de">Deutsch (German)</option>
                </select>
                {errors.language && <p className="text-[11px] font-bold text-red-500 mt-0.5">{errors.language.message}</p>}
              </div>

              {/* Theme */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="theme" className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-zinc-400" /> Theme Preference
                </label>
                <select
                  id="theme"
                  {...register("theme")}
                  className="h-11 px-3 w-full rounded-xl border border-zinc-200 bg-white text-zinc-800 text-sm font-semibold focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                >
                  <option value="dark">Sleek Dark Mode (Default)</option>
                  <option value="light">Clean Light Mode</option>
                  <option value="system">System Settings</option>
                </select>
                {errors.theme && <p className="text-[11px] font-bold text-red-500 mt-0.5">{errors.theme.message}</p>}
              </div>

              <ShimmerButton 
                type="submit"
                disabled={isLoading}
                className="h-11 w-full mt-2 rounded-xl text-sm font-bold bg-zinc-900 text-white hover:bg-black flex items-center justify-center gap-2"
                shimmerColor="#3B82F6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Configuration...
                  </>
                ) : (
                  <>
                    Complete Onboarding <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </ShimmerButton>
            </form>
          </div>
        </GlowCard>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/components/ui/feedback";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { GlowCard } from "@/components/ui/glow-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DemoScheduler } from "@/components/ui/demo-scheduler";
import { SlideUp } from "@/components/animations/slide-up";
import { businessTypes } from "@/lib/business-types";
import {
  Mail,
  Globe,
  User,
  Briefcase,
  Building2,
  Phone,
  PhoneCall,
  Loader2,
  Wand2,
  Repeat,
  LayoutTemplate,
  BarChart,
} from "lucide-react";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const contactSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid work email"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  businessType: z.string().min(1, "Please select a business type"),
  contactNo: z.string().min(6, "Contact number must be at least 6 characters"),
  whatsappNo: z.string().optional(),
  demoDate: z.string().min(1, "Please choose a demo date"),
  demoTime: z.string().regex(TIME_RE, "Please choose a valid demo time"),
  message: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      companyName: "",
      businessType: "",
      contactNo: "",
      whatsappNo: "",
      demoDate: "",
      demoTime: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/demo-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          company: data.companyName,
          businessType: data.businessType,
          contactNo: data.contactNo,
          whatsappNo: data.whatsappNo || null,
          demoDate: data.demoDate,
          demoTime: data.demoTime,
          message: data.message || "",
          source: "contact_form",
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "Failed to submit enquiry");

      toast.success("Demo request submitted! We'll be in touch shortly.");
      reset();
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />

      <section className="relative pt-36 pb-20 overflow-hidden bg-transparent z-10">
        <Container className="relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <SlideUp delay={0.2} yOffset={30}>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-zinc-100 border border-zinc-200/80 text-primary">
                Book a Demo
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl leading-[1.1] font-extrabold tracking-tight text-zinc-900 mb-6">
                See PrimeInbox in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-650 font-extrabold">action.</span>
              </h1>
              <p className="text-sm md:text-base text-zinc-500 leading-relaxed font-semibold">
                Tell us about your team and pick a time that works. Our specialists will walk you through outreach automation, deliverability, and AI-powered sequences.
              </p>
            </SlideUp>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-stretch">
            {/* Contact Info & Features */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <GlowCard className="border border-zinc-200/50 h-full" glowColor="rgba(59, 130, 246, 0.05)">
                <div className="flex flex-col h-full divide-y divide-zinc-200">
                  {/* Contact Information */}
                  <div className="p-8">
                    <h3 className="text-xl font-bold mb-6 text-zinc-900">Contact Information</h3>
                    <div className="flex flex-col gap-6">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-primary shrink-0">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Contact</p>
                          <a href="tel:+919168081355" className="text-xs font-semibold text-zinc-800 hover:text-primary transition-colors">+91 9168 08 1355</a>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Email</p>
                          <a href="mailto:contact.primeinbox@gmail.com" className="text-xs font-semibold text-zinc-800 hover:text-primary transition-colors break-all">contact.primeinbox@gmail.com</a>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                          <Globe className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Location</p>
                          <p className="text-xs font-semibold text-zinc-800">Pune, Maharashtra, India</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Platform Features */}
                  <div className="p-8">
                    <h3 className="text-xl font-bold mb-6 text-zinc-900">Platform Features</h3>
                    <div className="flex flex-col gap-5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200/60 flex items-center justify-center text-zinc-600 shrink-0">
                          <Wand2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-800">AI Email Generator</h4>
                          <p className="text-[11px] font-medium text-zinc-400 mt-0.5 leading-relaxed">
                            Highly personalized developer-focused cold outreach copy at scale.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200/60 flex items-center justify-center text-zinc-600 shrink-0">
                          <Repeat className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-800">SMTP Rotation</h4>
                          <p className="text-[11px] font-medium text-zinc-400 mt-0.5 leading-relaxed">
                            Cycle sending domains & accounts to maximize inbox deliverability.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200/60 flex items-center justify-center text-zinc-600 shrink-0">
                          <LayoutTemplate className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-800">Visual Campaign Builder</h4>
                          <p className="text-[11px] font-medium text-zinc-400 mt-0.5 leading-relaxed">
                            Build complex multi-step user sequence paths visually.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200/60 flex items-center justify-center text-zinc-650 shrink-0">
                          <BarChart className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-800">Real-time Analytics</h4>
                          <p className="text-[11px] font-medium text-zinc-400 mt-0.5 leading-relaxed">
                            Track opens, clicks, and reply sentiment in real time.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GlowCard>
            </div>

            {/* Demo Booking Form */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <GlowCard className="border border-zinc-200/50 h-full" glowColor="rgba(59, 130, 246, 0.05)">
                <div className="p-8">
                  <h3 className="text-xl font-bold mb-1.5 text-zinc-900">Book a demo</h3>
                  <p className="text-xs text-zinc-500 font-semibold mb-6">
                    Pick a time and we'll confirm via email.
                  </p>

                  <form className="flex flex-col gap-3 text-left" onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                      {/* Full Name */}
                      <div className="flex flex-col gap-1">
                        <label htmlFor="name" className="text-[11px] font-bold text-zinc-500">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                          <input
                            type="text"
                            id="name"
                            placeholder="Enter name"
                            {...register("name")}
                            className="h-10 pl-10 pr-4 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-xs placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                          />
                        </div>
                        {errors.name && <p className="text-[10px] font-bold text-red-500 mt-0.5">{errors.name.message}</p>}
                      </div>

                      {/* Work Email */}
                      <div className="flex flex-col gap-1">
                        <label htmlFor="email" className="text-[11px] font-bold text-zinc-500">Work Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                          <input
                            type="email"
                            id="email"
                            placeholder="Enter business email"
                            {...register("email")}
                            className="h-10 pl-10 pr-4 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-xs placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                          />
                        </div>
                        {errors.email && <p className="text-[10px] font-bold text-red-500 mt-0.5">{errors.email.message}</p>}
                      </div>

                      {/* Company Name */}
                      <div className="flex flex-col gap-1">
                        <label htmlFor="companyName" className="text-[11px] font-bold text-zinc-500">Company Name</label>
                        <div className="relative">
                          <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                          <input
                            type="text"
                            id="companyName"
                            placeholder="Enter company name"
                            {...register("companyName")}
                            className="h-10 pl-10 pr-4 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-xs placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                          />
                        </div>
                        {errors.companyName && <p className="text-[10px] font-bold text-red-500 mt-0.5">{errors.companyName.message}</p>}
                      </div>

                      {/* Business Type */}
                      <Controller
                        name="businessType"
                        control={control}
                        render={({ field }) => (
                          <SearchableSelect
                            options={businessTypes}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select business type"
                            label="Business Type"
                            error={errors.businessType?.message}
                            icon={<Building2 className="w-3.5 h-3.5" />}
                          />
                        )}
                      />

                      {/* Contact Number */}
                      <div className="flex flex-col gap-1">
                        <label htmlFor="contactNo" className="text-[11px] font-bold text-zinc-500">Contact Number*</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                          <input
                            type="text"
                            id="contactNo"
                            placeholder="Enter contact number"
                            {...register("contactNo")}
                            className="h-10 pl-10 pr-4 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-xs placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                          />
                        </div>
                        {errors.contactNo && <p className="text-[10px] font-bold text-red-500 mt-0.5">{errors.contactNo.message}</p>}
                      </div>

                      {/* WhatsApp Number */}
                      <div className="flex flex-col gap-1">
                        <label htmlFor="whatsappNo" className="text-[11px] font-bold text-zinc-500 flex items-center justify-between">
                          <span>WhatsApp Number</span>
                          <span className="text-[9px] text-zinc-400 font-medium lowercase">optional</span>
                        </label>
                        <div className="relative">
                          <PhoneCall className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                          <input
                            type="text"
                            id="whatsappNo"
                            placeholder="Enter WhatsApp number (optional)"
                            {...register("whatsappNo")}
                            className="h-10 pl-10 pr-4 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-xs placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                          />
                        </div>
                        {errors.whatsappNo && <p className="text-[10px] font-bold text-red-500 mt-0.5">{errors.whatsappNo.message}</p>}
                      </div>
                    </div>

                    {/* Interactive Demo Scheduler */}
                    <DemoScheduler
                      date={watch("demoDate")}
                      time={watch("demoTime")}
                      onDateChange={(d) => {
                        setValue("demoDate", d, { shouldValidate: true });
                      }}
                      onTimeChange={(t) => {
                        setValue("demoTime", t, { shouldValidate: true });
                      }}
                      dateError={errors.demoDate?.message}
                      timeError={errors.demoTime?.message}
                    />

                    {/* Message (optional) */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="message" className="text-[11px] font-bold text-zinc-500 flex items-center justify-between">
                        <span>Anything else we should know?</span>
                        <span className="text-[9px] text-zinc-400 font-medium lowercase">optional</span>
                      </label>
                      <textarea
                        id="message"
                        rows={3}
                        {...register("message")}
                        placeholder="Tell us about your team size, sending volume, or specific use cases..."
                        className="p-3 rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-xs placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold resize-none"
                      />
                    </div>

                    <ShimmerButton
                      type="submit"
                      disabled={isSubmitting}
                      className="h-11 w-full mt-2 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-black flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      shimmerColor="#3B82F6"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Submitting...
                        </>
                      ) : submitted ? (
                        "Submit Another Request"
                      ) : (
                        "Book My Demo"
                      )}
                    </ShimmerButton>
                  </form>
                </div>
              </GlowCard>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}

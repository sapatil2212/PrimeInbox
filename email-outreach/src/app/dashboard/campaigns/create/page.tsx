"use client";

import { useEffect, useState } from"react";
import Link from"next/link";
import { useRouter } from"next/navigation";
import { toast } from"sonner";
import { 
 ArrowLeft, 
 ArrowRight, 
 Save, 
 Loader2,
 Users,
 BookOpen,
 Key,
 Clock,
 Settings,
 Mail
} from"lucide-react";
import { cn } from"@/lib/utils";

interface DropdownItem {
 id: string;
 name: string;
}

export default function CreateCampaignPage() {
 const router = useRouter();
 const [currentStep, setCurrentStep] = useState(1);
 const [isSaving, setIsSaving] = useState(false);

 // Lists of select options fetched from API
 const [leadLists, setLeadLists] = useState<DropdownItem[]>([]);
 const [templates, setTemplates] = useState<DropdownItem[]>([]);
 const [smtpGroups, setSmtpGroups] = useState<DropdownItem[]>([]);
 const [smtpAccounts, setSmtpAccounts] = useState<DropdownItem[]>([]);

 // Wizard State
 const [name, setName] = useState("");
 const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
 const [selectedTemplateSteps, setSelectedTemplateSteps] = useState<{ stepNumber: number; templateId: string; delayDays: number }[]>([
 { stepNumber: 1, templateId:"", delayDays: 0 }
 ]);
 const [senderMode, setSenderMode] = useState<"pool" | "single">("pool");
 const [smtpGroupId, setSmtpGroupId] = useState("");
 const [smtpAccountId, setSmtpAccountId] = useState("");
 
 // Settings
 const [dailySendLimit, setDailySendLimit] = useState(5);
 const [delayMin, setDelayMin] = useState(30);
 const [delayMax, setDelayMax] = useState(180);
 const [rotationType, setRotationType] = useState("ROUND_ROBIN");
 const [timezone, setTimezone] = useState("UTC");
 const [weekendSending, setWeekendSending] = useState(false);

 // Tracking
 const [trackingOpens, setTrackingOpens] = useState(true);
 const [trackingClicks, setTrackingClicks] = useState(true);
 const [trackingReplies, setTrackingReplies] = useState(true);
 const [trackingUnsub, setTrackingUnsub] = useState(true);

 // Fetch dropdown lists on mount
 useEffect(() => {
 const fetchData = async () => {
 try {
 // Fetch Lead Lists
 const listsRes = await fetch("/api/leads/lists");
 if (listsRes.ok) {
 const data = await listsRes.json();
 setLeadLists(data.lists || []);
 }

 // Fetch Templates
 const templatesRes = await fetch("/api/templates");
 if (templatesRes.ok) {
 const data = await templatesRes.json();
 setTemplates(data.templates || []);
 }

 // Fetch SMTP Groups
 const groupsRes = await fetch("/api/smtp/groups");
 if (groupsRes.ok) {
 const data = await groupsRes.json();
 setSmtpGroups(data.groups || []);
 }

 // Fetch SMTP Accounts
 const accountsRes = await fetch("/api/smtp/accounts");
 if (accountsRes.ok) {
   const data = await accountsRes.json();
   setSmtpAccounts(
     (data.accounts || []).map((acc: any) => ({
       id: acc.id,
       name: `${acc.fromName} <${acc.fromEmail}>`
     }))
   );
 }
 } catch (error) {
 console.error("Error loading dropdown data:", error);
 }
 };
 fetchData();
 }, []);

 const handleNext = () => {
 if (currentStep === 1 && !name.trim()) {
 toast.error("Please enter a campaign name.");
 return;
 }
 if (currentStep === 2 && selectedListIds.length === 0) {
 toast.error("Please select at least one lead list.");
 return;
 }
 if (currentStep === 3) {
 const missingTemplate = selectedTemplateSteps.some(s => !s.templateId);
 if (missingTemplate) {
 toast.error("Please select a template for all steps.");
 return;
 }
 }
 if (currentStep === 4 && senderMode === "single" && !smtpAccountId) {
   toast.error("Please select a sender email account.");
   return;
 }
 setCurrentStep((prev) => prev + 1);
 };

 const handleBack = () => {
 setCurrentStep((prev) => prev - 1);
 };

 const handleSaveCampaign = async () => {
 setIsSaving(true);
 try {
 const payload = {
 name,
 leadListIds: selectedListIds,
 smtpGroupId: senderMode === "pool" ? (smtpGroupId || null) : null,
 smtpAccountId: senderMode === "single" ? (smtpAccountId || null) : null,
 steps: selectedTemplateSteps,
 dailySendLimit,
 delayMin,
 delayMax,
 rotationType,
 timezone,
 weekendSending,
 trackingOpens,
 trackingClicks,
 trackingReplies,
 trackingUnsub,
 };

 const res = await fetch("/api/campaigns", {
 method:"POST",
 headers: {"Content-Type":"application/json" },
 body: JSON.stringify(payload),
 });

 if (!res.ok) {
 const errorData = await res.json();
 throw new Error(errorData.error ||"Failed to create campaign");
 }

 const data = await res.json();
 toast.success("Campaign created successfully!");
 router.push(`/dashboard/campaigns/${data.campaign.id}`);
 } catch (err: any) {
 toast.error(err.message ||"Something went wrong.");
 } finally {
 setIsSaving(false);
 }
 };

 const handleAddStep = () => {
 setSelectedTemplateSteps((prev) => [
 ...prev,
 { stepNumber: prev.length + 1, templateId:"", delayDays: 3 }
 ]);
 };

 const handleRemoveStep = (idx: number) => {
 setSelectedTemplateSteps((prev) => {
 const filtered = prev.filter((_, i) => i !== idx);
 // Re-index step numbers
 return filtered.map((step, i) => ({ ...step, stepNumber: i + 1 }));
 });
 };

 const handleStepTemplateChange = (idx: number, templateId: string) => {
 setSelectedTemplateSteps((prev) => {
 const updated = [...prev];
 updated[idx].templateId = templateId;
 return updated;
 });
 };

 const handleStepDelayChange = (idx: number, delayDays: number) => {
 setSelectedTemplateSteps((prev) => {
 const updated = [...prev];
 updated[idx].delayDays = delayDays;
 return updated;
 });
 };

 const handleListToggle = (listId: string) => {
 setSelectedListIds((prev) =>
 prev.includes(listId) ? prev.filter((id) => id !== listId) : [...prev, listId]
 );
 };

 const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
   const val = Math.min(Number(e.target.value), delayMax - 5);
   setDelayMin(val);
 };

 const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
   const val = Math.max(Number(e.target.value), delayMin + 5);
   setDelayMax(val);
 };

 const stepsHeader = [
 { title:"Campaign General", icon: Mail },
 { title:"Target Leads", icon: Users },
 { title:"Outreach Steps", icon: BookOpen },
 { title:"SMTP Pool", icon: Key },
 { title:"Sending Settings", icon: Clock },
 { title:"Tracking Options", icon: Settings },
 ];

 return (
 <div className="flex-1 flex flex-col max-w-4xl mx-auto gap-8 w-full">
 {/* Header */}
 <header className="flex items-center gap-3">
 <button 
 onClick={() => router.push("/dashboard/campaigns")}
 className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-500 hover:text-zinc-850 transition-all cursor-pointer"
 >
 <ArrowLeft className="w-4 h-4" />
 </button>
 <div>
 <h1 className="text-xl font-black text-zinc-800">Create Campaign Wizard</h1>
 <p className="text-xs text-zinc-500 font-semibold">Sequence setup step {currentStep} of 6</p>
 </div>
 </header>

 {/* Steps indicators */}
 <div className="hidden sm:grid grid-cols-6 border border-zinc-200 bg-zinc-50/50 rounded-xl p-2.5">
 {stepsHeader.map((step, idx) => {
 const StepIcon = step.icon;
 const isActive = currentStep === idx + 1;
 const isCompleted = currentStep > idx + 1;

 return (
 <div 
 key={idx}
 className={cn(
"flex flex-col items-center text-center p-2 rounded-xl border border-transparent select-none",
 isActive &&"bg-indigo-50 border-indigo-200 text-indigo-650 font-bold",
 isCompleted &&"text-emerald-600 font-semibold",
 !isActive && !isCompleted &&"text-zinc-500"
 )}
 >
 <StepIcon className="w-4 h-4" />
 <span className="text-[10px] mt-1.5 font-semibold truncate max-w-full">{step.title}</span>
 </div>
 );
 })}
 </div>

 {/* Main Step Contents */}
 <div className="bg-white border border-zinc-200 rounded-xl p-4 min-h-[350px] flex flex-col justify-between">
 <div className="space-y-6">
 
 {/* STEP 1: General */}
 {currentStep === 1 && (
 <div className="space-y-4">
 <h2 className="text-lg font-bold text-zinc-800">Name your campaign</h2>
 <p className="text-xs text-zinc-500 font-semibold leading-relaxed">Give your campaign a clear, descriptive name to identify it in your outreach listings.</p>
 <div className="space-y-2">
 <label className="text-xs font-bold text-zinc-500">Campaign Name</label>
 <input 
 type="text" 
 placeholder="e.g. Q3 Sales DevRel Campaign"
 value={name}
 onChange={(e) => setName(e.target.value)}
 className="w-full h-11 px-4 rounded-xl bg-zinc-50 border border-zinc-200 focus:border-indigo-550 focus:bg-white focus:outline-none text-sm text-zinc-800"
 />
 </div>
 </div>
 )}

 {/* STEP 2: Lead lists */}
 {currentStep === 2 && (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-lg font-bold text-zinc-800">Select target leads</h2>
 <p className="text-xs text-zinc-500 font-semibold leading-relaxed">Choose one or more target lists containing the leads you wish to contact.</p>
 </div>
 <Link href="/dashboard/leads" className="text-xs text-indigo-650 hover:text-indigo-755 hover:underline font-bold">Manage lists</Link>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
 {leadLists.map((list) => {
 const isChecked = selectedListIds.includes(list.id);
 return (
 <div 
 key={list.id}
 onClick={() => handleListToggle(list.id)}
 className={cn(
"p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 select-none",
 isChecked ?"border-indigo-200 bg-indigo-50 text-indigo-655 font-bold" :"border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-650"
 )}
 >
 <input 
 type="checkbox" 
 checked={isChecked}
 onChange={() => {}} // Controlled by div click
 className="rounded border-zinc-250 text-indigo-650 focus:ring-0 w-4 h-4 cursor-pointer"
 />
 <span className="text-xs font-bold text-zinc-800">{list.name}</span>
 </div>
 );
 })}
 {leadLists.length === 0 && (
 <div className="col-span-2 text-center py-8 text-zinc-400 text-xs font-bold">
 No lead lists found. Create a list and upload leads first.
 </div>
 )}
 </div>
 </div>
 )}

 {/* STEP 3: Sequences */}
 {currentStep === 3 && (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-lg font-bold text-zinc-800">Design sending sequence</h2>
 <p className="text-xs text-zinc-500 font-semibold leading-relaxed">Add templates to compose follow-up sequence steps. Delay days are relative to the previous step.</p>
 </div>
 <button 
 onClick={handleAddStep}
 className="text-xs font-bold text-indigo-650 hover:text-indigo-755 hover:underline"
 >
 + Add Step
 </button>
 </div>

 <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
 {selectedTemplateSteps.map((step, idx) => (
 <div key={idx} className="p-4 bg-zinc-50/50 border border-zinc-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative">
 <div className="flex items-center gap-3 shrink-0">
 <div className="w-6 h-6 rounded-lg bg-white border border-zinc-200 flex items-center justify-center font-bold text-[10px] text-zinc-500">
 {step.stepNumber}
 </div>
 <span className="text-xs font-bold text-zinc-800">Step {step.stepNumber}</span>
 </div>

 <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
 <div className="space-y-1">
 <label className="text-[10px] font-bold text-zinc-500">Email Template</label>
 <select 
 value={step.templateId}
 onChange={(e) => handleStepTemplateChange(idx, e.target.value)}
 className="w-full h-10 px-3 rounded-xl bg-white border border-zinc-200 text-xs text-zinc-800 focus:outline-none"
 >
 <option value="">Select Template...</option>
 {templates.map(t => (
 <option key={t.id} value={t.id}>{t.name}</option>
 ))}
 </select>
 </div>

 {idx > 0 && (
 <div className="space-y-1">
 <label className="text-[10px] font-bold text-zinc-500">Wait Days (Delay)</label>
 <input 
 type="number" 
 min={1} 
 max={30}
 value={step.delayDays}
 onChange={(e) => handleStepDelayChange(idx, parseInt(e.target.value) || 1)}
 className="w-full h-10 px-3 rounded-xl bg-white border border-zinc-200 text-xs text-zinc-800 focus:outline-none"
 />
 </div>
 )}
 </div>

 {idx > 0 && (
 <button 
 onClick={() => handleRemoveStep(idx)}
 className="text-[10px] font-bold text-red-655 hover:text-red-750 hover:underline pt-2 sm:pt-0 shrink-0"
 >
 Remove
 </button>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* STEP 4: SMTP Group / Single Account Selection */}
 {currentStep === 4 && (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-bold text-zinc-800">Select SMTP sender pool</h2>
      <p className="text-xs text-zinc-500 font-semibold leading-relaxed">Choose whether this outreach sequence should send from a single email account or rotate across a pool of accounts.</p>
    </div>

    {/* Sender Mode Toggle */}
    <div className="flex p-0.5 rounded-lg bg-zinc-100 border border-zinc-200/60 w-64 select-none">
      <button 
        type="button"
        onClick={() => setSenderMode("pool")}
        className={cn(
          "flex-1 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer text-center",
          senderMode === "pool" ? "bg-white text-indigo-650 shadow-sm border border-zinc-200/30" : "text-zinc-500 hover:text-zinc-700"
        )}
      >
        Rotational Pool
      </button>
      <button 
        type="button"
        onClick={() => setSenderMode("single")}
        className={cn(
          "flex-1 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer text-center",
          senderMode === "single" ? "bg-white text-indigo-650 shadow-sm border border-zinc-200/30" : "text-zinc-500 hover:text-zinc-700"
        )}
      >
        Single Sender
      </button>
    </div>

    {senderMode === "pool" ? (
      <div className="space-y-1.5 animate-fadeIn">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Sender Group / Pool</label>
        <select 
          value={smtpGroupId}
          onChange={(e) => setSmtpGroupId(e.target.value)}
          className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:bg-white focus:outline-none font-semibold"
        >
          <option value="">All active SMTP accounts (Default)</option>
          {smtpGroups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <p className="text-[10px] text-zinc-400 font-medium">Campaign will rotate emails across active SMTP accounts within the selected group.</p>
      </div>
    ) : (
      <div className="space-y-1.5 animate-fadeIn">
        <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider">SMTP Sender Account</label>
        <select 
          value={smtpAccountId}
          onChange={(e) => setSmtpAccountId(e.target.value)}
          className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:bg-white focus:outline-none font-semibold"
          required
        >
          <option value="">Select a sender email...</option>
          {smtpAccounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name}</option>
          ))}
        </select>
        <p className="text-[10px] text-zinc-400 font-medium">Campaign will send all outreach emails strictly using this single email account.</p>
      </div>
    )}
  </div>
  )}

 {/* STEP 5: Settings */}
 {currentStep === 5 && (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-bold text-zinc-800">Sending configuration</h2>
      <p className="text-xs text-zinc-500 font-semibold leading-relaxed">Adjust daily send limits, delays (anti-spam spacing), and active sending days.</p>
    </div>
    
    <div className="space-y-5 max-w-md">
      {/* Daily Campaign Limit */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider">Daily Campaign Limit</label>
        <input 
          type="number" 
          value={dailySendLimit}
          onChange={(e) => setDailySendLimit(parseInt(e.target.value) || 1)}
          className="w-full h-10 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:bg-white focus:outline-none font-semibold"
          min={1}
        />
        <p className="text-[10px] text-zinc-405 font-semibold">Maximum number of outbound emails this campaign can send per day.</p>
      </div>

      {/* Dual Delay Slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-bold text-zinc-555 uppercase tracking-wider">Anti-spam delay range</label>
          <span className="text-xs font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-md">
            {delayMin}s - {delayMax}s
          </span>
        </div>
        
        <div className="relative h-6 w-full flex items-center select-none">
          {/* Track */}
          <div className="absolute left-0 right-0 h-1.5 bg-zinc-100 border border-zinc-200/50 rounded-full" />
          
          {/* Colored Range */}
          <div 
            className="absolute h-1.5 bg-indigo-500 rounded-full"
            style={{
              left: `${((delayMin - 10) / 290) * 100}%`,
              right: `${100 - ((delayMax - 10) / 290) * 100}%`
            }}
          />
          
          {/* Min Input */}
          <input 
            type="range"
            min="10"
            max="300"
            value={delayMin}
            onChange={handleMinChange}
            className="absolute w-full h-1.5 appearance-none pointer-events-none bg-transparent cursor-pointer z-30 slider-min"
          />
          
          {/* Max Input */}
          <input 
            type="range"
            min="10"
            max="300"
            value={delayMax}
            onChange={handleMaxChange}
            className="absolute w-full h-1.5 appearance-none pointer-events-none bg-transparent cursor-pointer z-30 slider-max"
          />
        </div>
        
        <div className="flex justify-between text-[9px] text-zinc-400 font-bold px-0.5">
          <span>10s</span>
          <span>150s</span>
          <span>300s</span>
        </div>
        <p className="text-[10px] text-zinc-405 font-semibold">Platform will randomize delay (spacing) between each outgoing email to avoid spam filters.</p>
      </div>

      {/* Weekend Sending Checkbox */}
      <div className="pt-2 flex items-center gap-3">
        <input 
          type="checkbox" 
          id="weekend" 
          checked={weekendSending}
          onChange={(e) => setWeekendSending(e.target.checked)}
          className="rounded border-zinc-250 text-indigo-655 focus:ring-0 w-4 h-4 cursor-pointer"
        />
        <label htmlFor="weekend" className="text-xs font-semibold text-zinc-650 cursor-pointer select-none">
          Enable weekend sending (Saturday and Sunday)
        </label>
      </div>
    </div>
    
    <style>{`
      input[type=range].slider-min::-webkit-slider-thumb,
      input[type=range].slider-max::-webkit-slider-thumb {
        pointer-events: auto;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #4f46e5;
        border: 2px solid #ffffff;
        box-shadow: 0 1px 3px rgba(0,0,0,0.25);
        cursor: pointer;
      }
      input[type=range].slider-min::-moz-range-thumb,
      input[type=range].slider-max::-moz-range-thumb {
        pointer-events: auto;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #4f46e5;
        border: 2px solid #ffffff;
        box-shadow: 0 1px 3px rgba(0,0,0,0.25);
        cursor: pointer;
      }
    `}</style>
  </div>
 )}

 {/* STEP 6: Tracking */}
 {currentStep === 6 && (
 <div className="space-y-4">
 <h2 className="text-lg font-bold text-zinc-800">Outreach analytics tracking</h2>
 <p className="text-xs text-zinc-505 font-semibold leading-relaxed">Enable tracking pixels, link redirects, and opt-out unsubscribe signatures.</p>
 
 <div className="space-y-3.5 pt-2">
 <div className="flex items-center gap-3">
 <input 
 type="checkbox" 
 id="trackOpen" 
 checked={trackingOpens}
 onChange={(e) => setTrackingOpens(e.target.checked)}
 className="rounded border-zinc-250 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
 />
 <label htmlFor="trackOpen" className="text-xs font-semibold text-zinc-650 cursor-pointer select-none">
 Track Email Opens (Inject tracking pixel image)
 </label>
 </div>

 <div className="flex items-center gap-3">
 <input 
 type="checkbox" 
 id="trackClick" 
 checked={trackingClicks}
 onChange={(e) => setTrackingClicks(e.target.checked)}
 className="rounded border-zinc-250 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
 />
 <label htmlFor="trackClick" className="text-xs font-semibold text-zinc-650 cursor-pointer select-none">
 Track Link Clicks (Rewrite links to redirects)
 </label>
 </div>

 <div className="flex items-center gap-3">
 <input 
 type="checkbox" 
 id="trackReply" 
 checked={trackingReplies}
 onChange={(e) => setTrackingReplies(e.target.checked)}
 className="rounded border-zinc-250 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
 />
 <label htmlFor="trackReply" className="text-xs font-semibold text-zinc-650 cursor-pointer select-none">
 Track Replies (Thread responses via message headers)
 </label>
 </div>

 <div className="flex items-center gap-3">
 <input 
 type="checkbox" 
 id="trackUnsub" 
 checked={trackingUnsub}
 onChange={(e) => setTrackingUnsub(e.target.checked)}
 className="rounded border-zinc-250 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
 />
 <label htmlFor="trackUnsub" className="text-xs font-semibold text-zinc-650 cursor-pointer select-none">
 Append Unsubscribe Opt-Out Signature
 </label>
 </div>
 </div>
 </div>
 )}

 </div>

 {/* Wizard Footer Controls */}
 <div className="border-t border-zinc-150 pt-6 mt-8 flex items-center justify-between gap-4 shrink-0">
 <button 
 onClick={handleBack}
 disabled={currentStep === 1}
 className="h-10 px-5 rounded-xl border border-zinc-250 hover:bg-zinc-50 disabled:opacity-40 text-zinc-600 transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
 >
 <ArrowLeft className="w-3.5 h-3.5" /> Back
 </button>

 {currentStep === 6 ? (
 <button 
 onClick={handleSaveCampaign}
 disabled={isSaving}
 className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
 >
 {isSaving ? (
 <>
 <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
 </>
 ) : (
 <>
 <Save className="w-3.5 h-3.5" /> Save Campaign
 </>
 )}
 </button>
 ) : (
 <button 
 onClick={handleNext}
 className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
 >
 Next <ArrowRight className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 </div>

 </div>
 );
}

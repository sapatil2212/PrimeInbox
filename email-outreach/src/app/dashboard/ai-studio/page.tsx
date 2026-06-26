"use client";

import { useState } from"react";
import { toast } from"sonner";
import { 
 Sparkles, 
 Send, 
 Copy, 
 Check, 
 FileText, 
 ArrowRight,
 Loader2,
 Bookmark,
 Volume2,
 Users,
 Target
} from"lucide-react";
import { GlowCard } from"@/components/ui/glow-card";
import { ShimmerButton } from"@/components/ui/shimmer-button";
import { cn } from"@/lib/utils";

export default function AiStudioPage() {
 const [type, setType] = useState<"subject" |"email" |"cta" |"sequence">("email");
 const [tone, setTone] = useState("sales");
 const [prompt, setPrompt] = useState("");
 const [companyContext, setCompanyContext] = useState("");
 const [recipientContext, setRecipientContext] = useState("");
 
 const [isGenerating, setIsGenerating] = useState(false);
 const [outputText, setOutputText] = useState("");
 const [isCopied, setIsCopied] = useState(false);
 const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

 const handleGenerate = async () => {
 setIsGenerating(true);
 setOutputText("");
 try {
 const res = await fetch("/api/ai/generate", {
 method:"POST",
 headers: {"Content-Type":"application/json" },
 body: JSON.stringify({
 type,
 tone,
 prompt,
 companyContext,
 recipientContext
 }),
 });

 if (!res.ok) {
 throw new Error("AI Generation failed");
 }

 const data = await res.json();
 setOutputText(data.text);
 toast.success("AI Outreach copy generated!");
 } catch (err: any) {
 toast.error(err.message ||"Failed to generate outreach content");
 } finally {
 setIsGenerating(false);
 }
 };

 const handleCopyToClipboard = () => {
 if (!outputText) return;
 navigator.clipboard.writeText(outputText);
 setIsCopied(true);
 toast.success("Copied to clipboard!");
 setTimeout(() => setIsCopied(false), 2000);
 };

 const handleSaveAsTemplate = async () => {
 if (!outputText) return;
 setIsCreatingTemplate(true);

 try {
 // Parse out subject if sequence or standard subject exists
 let subjectLine ="AI Generated Subject";
 let bodyContent = outputText;

 const subjectMatch = outputText.match(/Subject:\s*(.*)/i);
 if (subjectMatch) {
 subjectLine = subjectMatch[1];
 // Strip out the subject line from the body content
 bodyContent = outputText.replace(/Subject:\s*(.*)/i,"").trim();
 }

 const res = await fetch("/api/templates", {
 method:"POST",
 headers: {"Content-Type":"application/json" },
 body: JSON.stringify({
 name: `AI Copy: ${type} (${tone})`,
 subject: subjectLine,
 bodyHtml: `<div style="font-family: sans-serif; padding: 20px; line-height: 1.5;">\n ${bodyContent.replace(/\n/g,"<br/>")}\n</div>`,
 }),
 });

 if (!res.ok) {
 throw new Error("Failed to save as template");
 }

 toast.success("Saved output as a new Email Template!");
 } catch (err: any) {
 toast.error(err.message ||"Failed to save template");
 } finally {
 setIsCreatingTemplate(false);
 }
 };

 return (
 <div className="flex-1 flex flex-col gap-8">
 
 {/* Header */}
 <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
 <div>
 <h1 className="text-2xl font-black tracking-tight text-zinc-800">
 AI Studio
 </h1>
 <p className="text-sm text-zinc-500 font-medium">Generate high-converting cold email sequences using Google Gemini models.</p>
 </div>
 </header>

 {/* Main Studio split view */}
 <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0 overflow-y-auto">
 
 {/* Input Controls */}
 <div className="space-y-6 lg:border-r lg:border-zinc-150 lg:pr-8">
 
 {/* Goal selection */}
 <div className="space-y-2 select-none">
 <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Outreach Target Output</label>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
 {[
 { key:"email", label:"Cold Email" },
 { key:"sequence", label:"2-Step Sequence" },
 { key:"subject", label:"Subject Lines" },
 { key:"cta", label:"CTA Lines" },
 ].map((opt) => (
 <div
 key={opt.key}
 onClick={() => setType(opt.key as any)}
 className={cn(
"px-3.5 py-3 rounded-xl border text-center text-xs font-bold cursor-pointer transition-all select-none",
 type === opt.key 
 ?"bg-indigo-50 text-indigo-650 border-indigo-200"
 :"bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50 hover:border-zinc-300"
 )}
 >
 {opt.label}
 </div>
 ))}
 </div>
 </div>

 {/* Tone selection */}
 <div className="space-y-2 select-none">
 <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider flex items-center gap-1"><Volume2 className="w-3.5 h-3.5" /> Tone & Persona</label>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
 {[
 { key:"sales", label:"Sales Copy" },
 { key:"professional", label:"Professional" },
 { key:"marketing", label:"Marketing" },
 { key:"friendly", label:"Friendly Warm" },
 ].map((opt) => (
 <div
 key={opt.key}
 onClick={() => setTone(opt.key)}
 className={cn(
"px-3 py-2.5 rounded-xl border text-center text-xs font-bold cursor-pointer transition-all select-none",
 tone === opt.key 
 ?"bg-indigo-50 text-indigo-650 border-indigo-200"
 :"bg-white border-zinc-200 text-zinc-655 hover:bg-zinc-50 hover:border-zinc-300"
 )}
 >
 {opt.label}
 </div>
 ))}
 </div>
 </div>

 {/* Company Details */}
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider flex items-center gap-1"><Target className="w-3.5 h-3.5" /> Your Product / Context</label>
 <textarea 
 placeholder="e.g. We provide an AI-powered email outreach tool that automatically rotates SMTP addresses to achieve 98% deliverability."
 value={companyContext}
 onChange={(e) => setCompanyContext(e.target.value)}
 rows={2}
 className="w-full p-4 rounded-xl bg-zinc-50 border border-zinc-200 focus:border-indigo-550 focus:bg-white focus:outline-none text-xs text-zinc-850"
 />
 </div>

 {/* Recipient Persona */}
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Target Persona</label>
 <textarea 
 placeholder="e.g. Sales leaders, marketing executives, DevRel managers at high-growth software companies."
 value={recipientContext}
 onChange={(e) => setRecipientContext(e.target.value)}
 rows={2}
 className="w-full p-4 rounded-xl bg-zinc-50 border border-zinc-200 focus:border-indigo-550 focus:bg-white focus:outline-none text-xs text-zinc-850"
 />
 </div>

 {/* Custom prompts */}
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Additional Prompt Instructions</label>
 <textarea 
 placeholder="e.g. Highlight our SMTP rotation feature. Focus on the value of booked developer demos."
 value={prompt}
 onChange={(e) => setPrompt(e.target.value)}
 rows={3}
 className="w-full p-4 rounded-xl bg-zinc-50 border border-zinc-200 focus:border-indigo-550 focus:bg-white focus:outline-none text-xs text-zinc-855"
 />
 </div>

 <ShimmerButton 
 onClick={handleGenerate}
 disabled={isGenerating}
 className="w-full h-11 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 select-none"
 shimmerColor="#818cf8"
 >
 {isGenerating ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" /> Generating copywriting copy...
 </>
 ) : (
 <>
 <Sparkles className="w-4 h-4" /> Generate Outreach Copy
 </>
 )}
 </ShimmerButton>

 </div>

 {/* Output Panel */}
 <div className="flex flex-col gap-4">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Generated Copywriting Output</span>
 {outputText && (
 <div className="flex items-center gap-2 select-none">
 <button
 onClick={handleCopyToClipboard}
 className="p-2 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-zinc-750 transition-all cursor-pointer"
 title="Copy to clipboard"
 >
 {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
 </button>

 <button
 onClick={handleSaveAsTemplate}
 disabled={isCreatingTemplate}
 className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 text-[10px] font-bold text-zinc-650 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
 title="Save directly as outreach email template"
 >
 {isCreatingTemplate ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bookmark className="w-3 h-3 text-indigo-600" />}
 Save as Template
 </button>
 </div>
 )}
 </div>

 <div className="flex-1 bg-white border border-zinc-200 rounded-xl p-4 relative overflow-y-auto">
 {outputText ? (
 <pre className="text-xs text-zinc-800 leading-relaxed font-sans whitespace-pre-wrap select-text">
 {outputText}
 </pre>
 ) : (
 <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 text-zinc-400 select-none">
 <Sparkles className="w-8 h-8 text-zinc-250 animate-pulse mb-3" />
 <p className="text-xs font-bold text-zinc-500">Awaiting copy generation</p>
 <p className="text-[10px] text-zinc-400 font-semibold max-w-xs mt-1">Configure parameters on the left and generate copy to review output copy.</p>
 </div>
 )}
 </div>
 </div>

 </div>

 </div>
 );
}

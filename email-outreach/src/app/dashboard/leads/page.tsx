"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { 
 Plus, 
 Search, 
 Upload, 
 Users, 
 Trash2, 
 Download, 
 Sparkles,
 Loader2,
 ListFilter,
 CheckCircle,
 FileSpreadsheet,
 X,
 FileCheck
} from"lucide-react";
import { GlowCard } from"@/components/ui/glow-card";
import { ShimmerButton } from"@/components/ui/shimmer-button";
import { cn } from"@/lib/utils";

interface ListInfo {
 id: string;
 name: string;
 description: string | null;
 createdAt: string;
 count: number;
}

interface LeadItem {
 id: string;
 email: string;
 firstName: string | null;
 lastName: string | null;
 companyName: string | null;
 title: string | null;
 status: string;
}

export default function LeadsPage() {
 const [lists, setLists] = useState<ListInfo[]>([]);
 const [selectedList, setSelectedList] = useState<ListInfo | null>(null);
 const [leads, setLeads] = useState<LeadItem[]>([]);
 const [searchQuery, setSearchQuery] = useState("");
 const [isLoadingLists, setIsLoadingLists] = useState(true);
 const [isLoadingLeads, setIsLoadingLeads] = useState(false);
 const [isMounted, setIsMounted] = useState(false);

 useEffect(() => {
   setIsMounted(true);
 }, []);

 // Dialog states
 const [createListOpen, setCreateListOpen] = useState(false);
 const [newListName, setNewListName] = useState("");
 const [newListDesc, setNewListDesc] = useState("");

 const [importOpen, setImportOpen] = useState(false);
 const [importStep, setImportStep] = useState(1); // 1 = Upload, 2 = Map Columns, 3 = Import
 const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
 const [csvRows, setCsvRows] = useState<string[][]>([]);
 const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
 const [isImporting, setIsImporting] = useState(false);
 const [isParsing, setIsParsing] = useState(false);

 const fetchLists = async (selectFirst = false) => {
 try {
 const res = await fetch("/api/leads/lists");
 if (!res.ok) throw new Error("Failed to load lists");
 const data = await res.json();
 setLists(data.lists || []);
 
 if (selectFirst && data.lists && data.lists.length > 0) {
 handleSelectList(data.lists[0]);
 } else if (data.lists && data.lists.length > 0 && selectedList) {
 // Refresh count for active list
 const updated = data.lists.find((l: any) => l.id === selectedList.id);
 if (updated) setSelectedList(updated);
 }
 } catch (err: any) {
 toast.error(err.message ||"Failed to load lists");
 } finally {
 setIsLoadingLists(false);
 }
 };

 const fetchLeadsForList = async (listId: string) => {
 setIsLoadingLeads(true);
 try {
 const res = await fetch(`/api/leads/lists/${listId}?search=${searchQuery}`);
 if (!res.ok) throw new Error("Failed to load leads");
 const data = await res.json();
 setLeads(data.leads || []);
 } catch (err: any) {
 toast.error(err.message ||"Failed to load leads grid");
 } finally {
 setIsLoadingLeads(false);
 }
 };

 useEffect(() => {
 fetchLists(true);
 }, []);

 useEffect(() => {
 if (selectedList) {
 fetchLeadsForList(selectedList.id);
 }
 }, [selectedList, searchQuery]);

 const handleSelectList = (list: ListInfo) => {
 setSelectedList(list);
 setSearchQuery("");
 };

 const handleCreateList = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newListName.trim()) return;

 try {
 const res = await fetch("/api/leads/lists", {
 method:"POST",
 headers: {"Content-Type":"application/json" },
 body: JSON.stringify({ name: newListName, description: newListDesc }),
 });
 if (!res.ok) throw new Error("Failed to create list");
 
 toast.success(`Created list"${newListName}"`);
 setNewListName("");
 setNewListDesc("");
 setCreateListOpen(false);
 fetchLists(true);
 } catch (err: any) {
 toast.error(err.message ||"Failed to create list");
 }
 };

 const handleDeleteList = async (list: ListInfo) => {
 if (!confirm(`Are you sure you want to delete"${list.name}"? This deletes all associated leads and progress.`)) {
 return;
 }
 try {
 const res = await fetch(`/api/leads/lists/${list.id}`, {
 method:"DELETE",
 });
 if (!res.ok) throw new Error("Failed to delete list");

 toast.success(`Deleted lead list"${list.name}"`);
 setSelectedList(null);
 setLeads([]);
 fetchLists(true);
 } catch (err: any) {
 toast.error(err.message ||"Failed to delete list");
 }
 };

  // File parsing logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const file = target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/leads/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const err = JSON.parse(text);
          throw new Error(err.error || "Failed to parse file");
        } catch (e: any) {
          throw new Error(text.includes("<!DOCTYPE") ? "Server error: Failed to process document format." : "Failed to parse file");
        }
      }

      const data = await res.json();
      
      if (!data.headers || data.headers.length === 0 || !data.rows || data.rows.length === 0) {
        toast.error("No data or emails found in the uploaded file.");
        return;
      }

      setCsvHeaders(data.headers);
      setCsvRows(data.rows);

      // Guess initial mappings
      const initialMap: Record<string, string> = {};
      const fields = ["email","firstName","lastName","companyName","title","phone","website","linkedin","location","country"];
      
      data.headers.forEach((h: string) => {
        const lowerH = h.toLowerCase().replace(/[^a-z]/g, "");
        const matchedField = fields.find(f => f.toLowerCase() === lowerH || (f === "companyName" && lowerH === "company"));
        if (matchedField) {
          initialMap[matchedField] = h;
        }
      });

      setColumnMapping(initialMap);
      setImportStep(2);
    } catch (err: any) {
      toast.error(err.message || "Failed to process the uploaded file.");
    } finally {
      setIsParsing(false);
      // Reset input value so same file can be selected again if needed
      if (target) {
        target.value = "";
      }
    }
  };

 const submitImport = async () => {
 if (!selectedList) return;
 if (!columnMapping["email"]) {
 toast.error("You must map the 'email' field to proceed with the import.");
 return;
 }

 setIsImporting(true);
 try {
 // Map rows to lead objects
 const importedLeads = csvRows.map(row => {
 const lead: any = {};
 Object.entries(columnMapping).forEach(([dbKey, csvHeader]) => {
 const headerIdx = csvHeaders.indexOf(csvHeader);
 if (headerIdx !== -1) {
 lead[dbKey] = row[headerIdx] ||"";
 }
 });
 return lead;
 });

 const res = await fetch("/api/leads/import", {
 method:"POST",
 headers: {"Content-Type":"application/json" },
 body: JSON.stringify({ listId: selectedList.id, leads: importedLeads }),
 });

  if (!res.ok) {
    const text = await res.text();
    try {
      const err = JSON.parse(text);
      throw new Error(err.error || "Failed to process leads import");
    } catch (e: any) {
      throw new Error("Server error while importing leads");
    }
  }
  const data = await res.json();
 
 toast.success(data.message || `Imported ${data.count} leads successfully.`);
 setImportOpen(false);
 setImportStep(1);
 setCsvHeaders([]);
 setCsvRows([]);
 fetchLists();
 fetchLeadsForList(selectedList.id);
 } catch (err: any) {
 toast.error(err.message ||"Failed to process import");
 } finally {
 setIsImporting(false);
 }
 };

 const schemaFields = [
 { key:"email", label:"Email (Required)", required: true },
 { key:"firstName", label:"First Name", required: false },
 { key:"lastName", label:"Last Name", required: false },
 { key:"companyName", label:"Company Name", required: false },
 { key:"title", label:"Job Title", required: false },
 { key:"phone", label:"Phone Number", required: false },
 { key:"website", label:"Company Website", required: false },
 { key:"linkedin", label:"LinkedIn URL", required: false },
 { key:"location", label:"City", required: false },
 { key:"country", label:"Country", required: false },
 ];

 return (
 <div className="flex-1 flex flex-col md:flex-row min-h-0 relative -mx-6 md:-mx-8 -mt-6 md:-mt-8">
 
  {/* Sidebar: Lead Lists */}
  <aside className="w-full md:w-64 flex flex-col gap-4 shrink-0 bg-white border-r border-zinc-100 px-4 pt-6 pb-6 select-none">
  <div className="flex items-center justify-between">
  <h2 className="text-sm font-bold text-zinc-700 flex items-center gap-1.5">
  <Users className="w-4 h-4 text-indigo-600" /> Lead Lists
  </h2>
  <button 
  onClick={() => setCreateListOpen(true)}
  className="p-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-500 hover:text-zinc-700 transition-all cursor-pointer"
  >
  <Plus className="w-4 h-4" />
  </button>
  </div>

  <div className="flex flex-col gap-0.5 overflow-y-auto select-none">
  {lists.map((list) => {
  const isSelected = selectedList?.id === list.id;
  return (
  <div
  key={list.id}
  onClick={() => handleSelectList(list)}
  className={cn(
  "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 group",
  isSelected 
  ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
  : "text-zinc-600 border border-transparent hover:bg-zinc-50 hover:text-zinc-700"
  )}
  >
  <div className="min-w-0">
  <div className="truncate font-bold">{list.name}</div>
  <div className="text-[10px] text-zinc-400 mt-0.5">{list.count} leads</div>
  </div>
  <button 
  onClick={(e) => {
  e.stopPropagation();
  handleDeleteList(list);
  }}
  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-all"
  >
  <Trash2 className="w-3.5 h-3.5" />
  </button>
  </div>
  );
  })}
  {lists.length === 0 && (
  <div className="text-center py-8 text-zinc-400 text-xs font-semibold">No lists found.</div>
  )}
  </div>
 </aside>

 {/* Main Panel: Leads Grid */}
 <section className="flex-1 flex flex-col min-w-0 gap-6 p-6 md:p-8">
 {selectedList ? (
 <>
 {/* Header info */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5 shrink-0">
 <div>
 <h1 className="text-lg font-bold text-zinc-700">{selectedList.name}</h1>
 <p className="text-xs text-zinc-500 font-semibold mt-0.5">{selectedList.description ||"No description provided."}</p>
 </div>
  <div className="flex items-center gap-3">
  {/* Filter controls */}
  <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-4 h-10 w-64 shrink-0 transition-all focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
  <Search className="w-4 h-4 text-zinc-400" />
  <input 
  type="text" 
  placeholder="Search leads..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="bg-transparent border-0 outline-none text-xs text-zinc-700 placeholder-zinc-400 w-full font-semibold"
  />
  </div>
  <button 
  onClick={() => {
  setImportStep(1);
  setImportOpen(true);
  }}
  className="h-10 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-xs font-bold text-zinc-600 hover:text-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
  >
  <Upload className="w-4 h-4" /> Import Leads
  </button>
  </div>
  </div>

 {/* Grid Table */}
 <div className="flex-1 bg-white border border-zinc-200 rounded-xl overflow-y-auto">
 <div className="min-w-full inline-block align-middle">
 <table className="w-full text-left text-xs divide-y divide-zinc-100">
 <thead>
 <tr className="text-zinc-500 font-bold bg-zinc-50/50">
 <th className="p-4 font-semibold">Lead Info</th>
 <th className="p-4 font-semibold">Company</th>
 <th className="p-4 font-semibold">Job Title</th>
 <th className="p-4 font-semibold">Outreach Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-100">
 {leads.map((l) => (
 <tr key={l.id} className="text-zinc-600 hover:bg-zinc-50/40">
 <td className="p-4">
 <div className="font-bold text-zinc-700">{l.firstName ? `${l.firstName} ${l.lastName ||""}` :"No Name"}</div>
 <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{l.email}</div>
 </td>
 <td className="p-4 text-zinc-700 font-bold">{l.companyName ||"—"}</td>
 <td className="p-4 text-zinc-500 font-semibold">{l.title ||"—"}</td>
 <td className="p-4">
 <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
 l.status ==="ACTIVE" 
 ?"bg-emerald-55/10 text-emerald-700 border border-emerald-200" 
 : l.status ==="UNSUBSCRIBED"
 ?"bg-amber-50 text-amber-700 border border-amber-200"
 :"bg-red-50 text-red-750 border border-red-200"
 }`}>
 {l.status}
 </span>
 </td>
 </tr>
 ))}
 {leads.length === 0 && (
 <tr>
 <td colSpan={4} className="text-center py-10 text-zinc-400 font-bold text-xs">
 {isLoadingLeads ?"Loading leads..." :"No leads found in this list. Import CSV to add leads!"}
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
 <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 shadow-inner">
 <Users className="w-6 h-6" />
 </div>
 <div className="space-y-1">
 <h3 className="font-semibold text-zinc-700 text-base">Select or create a list</h3>
 <p className="text-xs text-zinc-500 font-semibold">Choose a lead list from the sidebar or build a new list to manage your targets.</p>
 </div>
 <button 
 onClick={() => setCreateListOpen(true)}
 className="h-10 px-5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 text-xs font-bold transition-colors cursor-pointer"
 >
 Create Lead List
 </button>
 </div>
 )}
 </section>

  {/* DIALOG 1: Create List Modal */}
  {createListOpen && isMounted && createPortal(
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setCreateListOpen(false)}>
  <form 
  onSubmit={handleCreateList}
  className="w-full max-w-md bg-white border border-zinc-200 rounded-xl shadow-2xl p-4 space-y-6 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
  onClick={(e) => e.stopPropagation()}
  >
  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
  <h3 className="font-semibold text-zinc-700 text-base">Create Lead List</h3>
  <button type="button" onClick={() => setCreateListOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-4 h-4" /></button>
  </div>

  <div className="space-y-4">
  <div className="space-y-1.5">
  <label className="text-xs font-bold text-zinc-500">List Name</label>
  <input 
  type="text" 
  placeholder="e.g. Inbound Signups Q3"
  value={newListName}
  onChange={(e) => setNewListName(e.target.value)}
  className="w-full h-10 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 focus:outline-none"
  required
  />
  </div>

  <div className="space-y-1.5">
  <label className="text-xs font-bold text-zinc-500">Description (Optional)</label>
  <textarea 
  placeholder="Add details about target segment..."
  value={newListDesc}
  onChange={(e) => setNewListDesc(e.target.value)}
  rows={2}
  className="w-full p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 focus:outline-none"
  />
  </div>
  </div>

  <div className="border-t border-zinc-100 pt-4 flex items-center justify-end gap-3 select-none">
  <button 
  type="button" 
  onClick={() => setCreateListOpen(false)}
  className="h-10 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-600 transition-colors cursor-pointer"
  >
  Cancel
  </button>
  <button 
  type="submit"
  disabled={!newListName.trim()}
  className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-bold text-white transition-colors cursor-pointer"
  >
  Create List
  </button>
  </div>
  </form>
  </div>, document.body
  )}

  {/* DIALOG 2: CSV Import Modal */}
  {importOpen && isMounted && createPortal(
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setImportOpen(false)}>
  <div 
  className="w-full max-w-xl bg-white border border-zinc-200 rounded-xl shadow-2xl p-4 space-y-6 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
  onClick={(e) => e.stopPropagation()}
  >
  <div className="flex items-center justify-between border-b border-zinc-100 pb-2 shrink-0">
  <h3 className="font-semibold text-zinc-700 text-base">Import Leads to List</h3>
  <button onClick={() => setImportOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="w-4 h-4" /></button>
  </div>

  <div className="flex-1 overflow-y-auto max-h-[350px] space-y-4">
  
  {/* STEP 1: Upload File */}
  {importStep === 1 && (
  <div className="space-y-4">
    <div className="border-2 border-dashed border-zinc-200 hover:border-indigo-300 bg-zinc-50/50 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 relative cursor-pointer overflow-hidden">
    <input 
    type="file" 
    accept=".csv,.xlsx,.xls,.pdf,.doc,.docx"
    onChange={handleFileUpload}
    disabled={isParsing}
    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
    />
    <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400">
    {isParsing ? <Loader2 className="w-6 h-6 animate-spin text-indigo-500" /> : <FileSpreadsheet className="w-6 h-6" />}
    </div>
    <div>
    <p className="text-xs font-bold text-zinc-700">
    {isParsing ? "Extracting emails from document..." : "Drag & drop CSV, Excel, PDF, or Word file"}
    </p>
    <p className="text-[10px] text-zinc-400 mt-1 font-semibold">
    {isParsing ? "This might take a few seconds." : "Supports .csv, .xlsx, .pdf, .docx files up to 10MB."}
    </p>
    </div>
    </div>
    
    <div className="flex flex-col items-center gap-2 pt-2">
      <p className="text-[11px] font-bold text-zinc-500">Need a template? Download a sample file:</p>
      <div className="flex items-center gap-3">
        <a href="/samples/sample.csv" download className="text-[11px] font-bold text-indigo-600 hover:text-indigo-500 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100 cursor-pointer">.CSV</a>
        <a href="/samples/sample.xlsx" download className="text-[11px] font-bold text-indigo-600 hover:text-indigo-500 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100 cursor-pointer">.XLSX</a>
        <a href="/samples/sample.pdf" download className="text-[11px] font-bold text-indigo-600 hover:text-indigo-500 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100 cursor-pointer">.PDF</a>
        <a href="/samples/sample.docx" download className="text-[11px] font-bold text-indigo-600 hover:text-indigo-500 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100 cursor-pointer">.DOCX</a>
      </div>
    </div>
  </div>
  )}

  {/* STEP 2: Map Columns */}
  {importStep === 2 && (
  <div className="space-y-4">
  <div>
  <h4 className="text-sm font-bold text-zinc-700">Map Columns to Database Fields</h4>
  <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold mt-0.5">Select the matching CSV header column for each profile field. Email is strictly required.</p>
  </div>

  <div className="space-y-2 border border-zinc-200/85 bg-zinc-50/50 rounded-xl p-3 max-h-56 overflow-y-auto pr-1">
  {schemaFields.map((field) => (
  <div key={field.key} className="flex items-center justify-between gap-4 py-1 text-xs">
  <span className={cn("font-bold text-zinc-700", field.required &&"text-indigo-600")}>
  {field.label} {field.required &&"*"}
  </span>
  <select
  value={columnMapping[field.key] ||""}
  onChange={(e) => setColumnMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
  className="w-48 h-8 px-2 rounded bg-white border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none"
  >
  <option value="">Don't map</option>
  {csvHeaders.map(h => (
  <option key={h} value={h}>{h}</option>
  ))}
  </select>
  </div>
  ))}
  </div>
  </div>
  )}
  
  {/* STEP 3: Progress/Success */}
  {importStep === 3 && (
  <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
  {isImporting ? (
  <>
  <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
  <div>
  <h4 className="font-semibold text-zinc-700 text-sm">Importing leads...</h4>
  <p className="text-xs text-zinc-500 font-semibold mt-1">Please wait while we process the records.</p>
  </div>
  </>
  ) : (
  <>
  <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
  <CheckCircle className="w-6 h-6" />
  </div>
  <div>
  <h4 className="font-semibold text-zinc-700 text-sm">Import Complete!</h4>
  <p className="text-xs text-zinc-500 font-semibold mt-1">The leads have been successfully added to your list.</p>
  </div>
  </>
  )}
  </div>
  )}
  
  </div>

  {/* Controls */}
  {importStep === 2 && (
  <div className="border-t border-zinc-100 pt-4 flex items-center justify-between gap-3 shrink-0">
  <span className="text-[10px] font-semibold text-zinc-500">{csvRows.length} rows loaded.</span>
  <div className="flex items-center gap-3">
  <button 
  onClick={() => setImportStep(1)}
  className="h-9 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-600 transition-colors cursor-pointer"
  >
  Back
  </button>
  <button 
  onClick={submitImport}
  disabled={isImporting || !columnMapping["email"]}
  className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1"
  >
  {isImporting ? (
  <>
  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing...
  </>
  ) : (
  <>
  <FileCheck className="w-3.5 h-3.5" /> Start Import
  </>
  )}
  </button>
  </div>
  </div>
  )}
  
  </div>
  </div>, document.body
  )}

  </div>
  );
}

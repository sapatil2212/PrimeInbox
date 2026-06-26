"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast, confirmDialog } from "@/components/ui/feedback";
import {
  Plus,
  Search,
  Trash2,
  BookOpen,
  Eye,
  Code,
  Smartphone,
  Laptop,
  Sparkles,
  Loader2,
  Save,
  ArrowLeft,
  X,
  Send,
  Pencil,
  Tag,
  Calendar,
  ChevronRight,
  Copy,
  Edit,
  FolderSync,
} from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { cn } from "@/lib/utils";
import { getPlanLimits } from "@/lib/plans";

interface TemplateItem {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  isDragDrop: boolean;
  createdAt: string;
  updatedAt: string;
  category?: { name: string };
  categoryId: string | null;
}

interface CategoryInfo {
  id: string;
  name: string;
}

const getPreviewHtml = (htmlContent: string) => {
  if (!htmlContent) return "";
  let content = htmlContent;
  const mockValues: Record<string, string> = {
    firstName: "John",
    lastName: "Doe",
    companyName: "Acme Corp",
    email: "john.doe@acme.com",
    website: "acme.com",
    linkedin: "linkedin.com/in/johndoe",
    location: "New York",
    country: "United States",
  };
  
  Object.entries(mockValues).forEach(([key, val]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
    content = content.replace(regex, val);
  });
  
  const styleInject = `
    <style>
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        -ms-overflow-style: none !important;
        scrollbar-width: none !important;
      }
      ::-webkit-scrollbar {
        display: none !important;
      }
    </style>
  `;
  
  if (content.includes("</head>")) {
    content = content.replace("</head>", `${styleInject}</head>`);
  } else {
    content = styleInject + content;
  }
  
  return content;
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [canUseVisualBuilder, setCanUseVisualBuilder] = useState(false);

  const handleCategoryClick = (categoryId: string) => {
    if (activeCategoryTab === categoryId) {
      setActiveCategoryTab("all");
      setSortBy("recent");
    } else {
      setActiveCategoryTab(categoryId);
    }
  };

  const handleSortChange = (val: string) => {
    setSortBy(val);
    if (val === "recent") {
      setActiveCategoryTab("all");
    }
  };

  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewActive, setPreviewActive] = useState(false);

  // Portal mount guard (avoids SSR mismatch)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Preview Modal
  const [previewModalTemplate, setPreviewModalTemplate] = useState<TemplateItem | null>(null);
  const [previewModalMode, setPreviewModalMode] = useState<"desktop" | "mobile">("desktop");

  // Composer Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("<div style=\"font-family: sans-serif; padding: 20px;\">\n  <p>Hello {{firstName}},</p>\n  <p>I noticed your work at {{companyName}} and wanted to reach out...</p>\n  <p>Best regards,<br/>Your Name</p>\n</div>");
  const [categoryId, setCategoryId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Category state
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // AI Generator States
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("sales");
  const [aiCompanyContext, setAiCompanyContext] = useState("");
  const [aiRecipientContext, setAiRecipientContext] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Test Email States
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [smtpAccounts, setSmtpAccounts] = useState<any[]>([]);
  const [testEmail, setTestEmail] = useState("");
  const [testSmtpAccountId, setTestSmtpAccountId] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error("Failed to load templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load templates list");
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/templates/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err: any) {
      console.error("Categories fetch failed:", err);
    }
  };

  const fetchSessionAndSmtp = async () => {
    try {
      const sessionRes = await fetch("/api/auth/session");
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.user?.email) {
          setCurrentUserEmail(sessionData.user.email);
          setTestEmail(sessionData.user.email);
        }
        setCanUseVisualBuilder(getPlanLimits(sessionData.user?.company?.subscriptionPlan).visualBuilder);
      }

      const smtpRes = await fetch("/api/smtp/accounts");
      if (smtpRes.ok) {
        const smtpData = await smtpRes.json();
        setSmtpAccounts(smtpData.accounts || []);
      }
    } catch (err) {
      console.error("Failed to load session or SMTP accounts:", err);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
    fetchSessionAndSmtp();
  }, []);

  // Visual Builder is gated by plan; otherwise go straight to the HTML editor.
  const handleNewTemplate = () => {
    if (canUseVisualBuilder) {
      setIsCreatorModalOpen(true);
    } else {
      handleOpenCreateComposer();
    }
  };

  const handleGenerateAiTemplate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please explain what you want the email template to be about.");
      return;
    }
    setIsGeneratingAi(true);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "email",
          tone: aiTone,
          prompt: aiPrompt,
          companyContext: aiCompanyContext,
          recipientContext: aiRecipientContext,
        }),
      });

      if (!res.ok) throw new Error("AI Generation failed. Check your GEMINI_API_KEY in .env.");

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "AI generation failed");

      const outputText = data.text;

      let subjectLine = "AI Generated Outreach";
      let bodyContent = outputText;

      const subjectMatch = outputText.match(/Subject:\s*(.*)/i);
      if (subjectMatch) {
        subjectLine = subjectMatch[1];
        bodyContent = outputText.replace(/Subject:\s*(.*)/i, "").trim();
      }

      setSubject(subjectLine);
      setBodyHtml(`<div style="font-family: sans-serif; padding: 20px; line-height: 1.5;">\n  ${bodyContent.replace(/\n/g, "<br/>")}\n</div>`);
      setName(`AI: ${aiTone.toUpperCase()} Outreach Template`);

      toast.success("AI email template generated and populated!");
      setIsAiDrawerOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate outreach template");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      toast.error("Please enter a recipient email address.");
      return;
    }
    setIsSendingTest(true);

    try {
      const res = await fetch("/api/templates/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmail.trim(),
          subject,
          bodyHtml,
          smtpAccountId: testSmtpAccountId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send test email");

      toast.success(data.message || "Test email sent successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send test email");
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch("/api/templates/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName }),
      });
      if (!res.ok) throw new Error("Failed to create category");

      toast.success(`Created category "${newCatName}"`);
      setNewCatName("");
      setCreateCategoryOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to create category");
    }
  };

  const handleOpenCreateComposer = () => {
    setEditingId(null);
    setName("");
    setSubject("");
    setBodyHtml("<div style=\"font-family: sans-serif; padding: 20px;\">\n  <p>Hello {{firstName}},</p>\n  <p>I noticed your work at {{companyName}} and wanted to reach out...</p>\n  <p>Best regards,<br/>Your Name</p>\n</div>");
    setCategoryId("");
    setPreviewActive(false);
    setIsComposerOpen(true);
  };

  const handleOpenEditComposer = (template: TemplateItem) => {
    setEditingId(template.id);
    setName(template.name);
    setSubject(template.subject);
    setBodyHtml(template.bodyHtml);
    setCategoryId(template.categoryId || "");
    setPreviewActive(false);
    setIsComposerOpen(true);
  };

  const handleEditClick = (template: TemplateItem) => {
    if (template.isDragDrop) {
      router.push(`/dashboard/templates/builder/${template.id}`);
    } else {
      handleOpenEditComposer(template);
    }
  };

  const handleSaveTemplate = async () => {
    if (!name.trim() || !subject.trim() || !bodyHtml.trim()) {
      toast.error("Please enter a name, subject, and email body.");
      return;
    }
    setIsSaving(true);

    try {
      const payload = {
        name: name.trim(),
        subject: subject.trim(),
        bodyHtml,
        categoryId: categoryId || null,
      };

      const url = editingId ? `/api/templates/${editingId}` : "/api/templates";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save template");
      }

      toast.success(editingId ? "Template updated successfully" : "Created new email template");
      setIsComposerOpen(false);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string, templateName: string) => {
    await confirmDialog({
      title: "Delete template?",
      description: `"${templateName}" will be permanently deleted. This cannot be undone.`,
      confirmText: "Delete",
      successTitle: "Deleted!",
      successDescription: `"${templateName}" has been permanently deleted.`,
      onConfirm: async () => {
        const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to delete template");
        }
        fetchTemplates();
      },
    });
  };

  const handleDuplicateTemplate = async (id: string, templateName: string) => {
    try {
      const res = await fetch(`/api/templates/${id}/duplicate`, { method: "POST" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to duplicate template");
      }
      const data = await res.json();
      toast.success(`Duplicated "${templateName}" as "${data.template.name}"`);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Failed to duplicate template");
    }
  };

  const handleRenameTemplate = async (id: string, oldName: string) => {
    const newName = window.prompt("Rename template to:", oldName);
    if (!newName || !newName.trim() || newName === oldName) return;

    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to rename template");
      }
      toast.success(`Renamed template to "${newName.trim()}"`);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Failed to rename template");
    }
  };

  const handleInsertVariable = (variable: string) => {
    const placeholder = `{{${variable}}}`;
    setBodyHtml((prev) => prev + placeholder);
    toast.info(`Inserted ${placeholder}`);
  };

  const filteredTemplates = templates
    .filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategoryTab === "all" ||
        t.categoryId === activeCategoryTab ||
        (t.category?.name || "").toLowerCase() === activeCategoryTab.toLowerCase();
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "category") {
        const catA = a.category?.name || "";
        const catB = b.category?.name || "";
        return catA.localeCompare(catB);
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      // default: "recent"
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const variablesList = ["firstName", "lastName", "companyName", "email", "website", "linkedin", "location", "country"];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="flex-1 flex flex-col gap-6">

      {!isComposerOpen ? (
        <>
          {/* List View Header */}
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-900">
                Templates
              </h1>
              <p className="text-sm text-zinc-500 font-medium mt-0.5">
                Design responsive HTML templates with dynamic recipient variables.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              {/* Shifted Search Bar */}
              <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 w-60">
                <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-0 outline-none text-xs text-zinc-800 placeholder-zinc-400 w-full font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setCreateCategoryOpen(true)}
                className="h-9 px-4 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Tag className="w-3.5 h-3.5" />
                Add Category
              </button>

              <button
                onClick={handleNewTemplate}
                className="h-9 px-4 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors border border-zinc-950"
              >
                <Plus className="w-3.5 h-3.5" /> Create Template
              </button>
            </div>
          </header>

          {/* Category Filter + Sort Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 border-b border-zinc-150 pb-4">
            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 select-none no-scrollbar flex-1">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCategoryClick(c.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all",
                    activeCategoryTab === c.id
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Sort options */}
            <div className="flex items-center gap-3 shrink-0">
              {filteredTemplates.length > 0 && (
                <span className="text-xs text-zinc-400 font-medium shrink-0">
                  {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""}
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-semibold">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="recent">All Templates</option>
                  <option value="oldest">Oldest Created</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="category">Category</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid listing */}
          {isLoadingTemplates ? (
            <div className="flex-1 flex items-center justify-center min-h-[30vh]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
                <p className="text-xs text-zinc-400 font-medium">Loading templates...</p>
              </div>
            </div>
          ) : filteredTemplates.length > 0 ? (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((t) => (
                <div
                  key={t.id}
                  className="group relative bg-white border border-zinc-200 rounded-2xl flex flex-col overflow-hidden transition-all duration-200 hover:border-indigo-200 hover:shadow-sm"
                >
                  {/* Thumbnail area */}
                  <div className="p-3 pb-0">
                    <div 
                      onClick={() => handleEditClick(t)}
                      className="relative aspect-video rounded-xl bg-zinc-50 border border-zinc-150 flex flex-col justify-between overflow-hidden select-none cursor-pointer group-hover:bg-zinc-100/50 transition-all duration-200 p-3.5"
                    >
                      {/* Scaled Iframe Preview */}
                      <div className="absolute inset-0 w-full h-full overflow-hidden bg-white z-0 pointer-events-none">
                        <iframe
                          srcDoc={getPreviewHtml(t.bodyHtml)}
                          title={`Preview Thumbnail ${t.id}`}
                          className="absolute top-0 left-0 border-0 pointer-events-none origin-top-left"
                          style={{
                            width: "400%",
                            height: "400%",
                            transform: "scale(0.25)",
                          }}
                          sandbox="allow-same-origin"
                        />
                      </div>

                      {/* Foreground Overlay Content */}
                      <div className="relative z-10 flex flex-col h-full justify-between pointer-events-none w-full">
                        <div /> {/* Spacer */}
                        
                        <div className="mt-auto flex items-center justify-between">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase border shadow-sm backdrop-blur-md",
                            t.isDragDrop 
                              ? "bg-indigo-50/90 border-indigo-200 text-indigo-700" 
                              : "bg-amber-50/90 border-amber-200 text-amber-700"
                          )}>
                            {t.isDragDrop ? "Visual Builder" : "HTML Code"}
                          </span>
                        </div>
                      </div>

                      {/* Hover action overlay */}
                      <div className="absolute inset-0 bg-zinc-950/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(t);
                          }}
                          className="h-8 px-3 rounded-lg bg-white hover:bg-zinc-50 text-zinc-900 shadow text-xs font-semibold flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
                          title="Open Template"
                        >
                          <Pencil className="w-3.5 h-3.5 text-zinc-600" />
                          Open
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewModalTemplate(t);
                            setPreviewModalMode("desktop");
                          }}
                          className="h-8 w-8 rounded-full bg-white hover:bg-zinc-50 text-zinc-950 shadow flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-3 flex flex-col h-full gap-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3
                          className="font-bold text-zinc-900 text-sm truncate cursor-pointer hover:text-indigo-600 transition-colors leading-snug"
                          onClick={() => handleEditClick(t)}
                        >
                          {t.name}
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-medium mt-0.5 truncate">
                          {t.subject}
                        </p>
                      </div>

                      {t.category && (
                        <span className="px-2 py-0.5 rounded-md border border-zinc-200 bg-zinc-50 text-[10px] text-zinc-600 font-semibold shrink-0 whitespace-nowrap">
                          {t.category.name}
                        </span>
                      )}
                    </div>

                    {/* Footer actions bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 mt-auto">
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                        <Calendar className="w-3 h-3" />
                        {formatDate(t.createdAt)}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicateTemplate(t.id, t.name)}
                          title="Duplicate Template"
                          className="p-1.5 rounded-lg border border-transparent hover:border-zinc-200 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-700 transition-all cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Rename */}
                        <button
                          onClick={() => handleRenameTemplate(t.id, t.name)}
                          title="Rename Template"
                          className="p-1.5 rounded-lg border border-transparent hover:border-zinc-200 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-700 transition-all cursor-pointer"
                        >
                          <FolderSync className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteTemplate(t.id, t.name)}
                          title="Delete Template"
                          className="p-1.5 rounded-lg border border-transparent hover:border-red-200 hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          ) : (
            <section className="bg-white border border-zinc-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="font-bold text-zinc-900 text-base">
                  {searchQuery ? "No matching templates" : "No templates yet"}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {searchQuery
                    ? `No templates match "${searchQuery}". Try a different search.`
                    : "Create reusable HTML email templates with merge tags for campaign personalization."}
                </p>
              </div>
              {!searchQuery && (
                <button
                  onClick={handleNewTemplate}
                  className="h-9 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5 border border-zinc-950"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create your first template
                </button>
              )}
            </section>
          )}
        </>
      ) : (
        /* COMPOSER VIEW */
        <div className="flex-1 flex flex-col gap-5 w-full h-full min-h-0">

          {/* Composer Header */}
          <header className="flex items-center justify-between border-b border-zinc-150 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsComposerOpen(false)}
                className="p-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-base font-bold text-zinc-900">
                  {editingId ? "Edit Template" : "New Email Template"}
                </h1>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                  Use variables like <code className="bg-zinc-100 px-1 py-0.5 rounded text-indigo-600 font-mono">{"{{firstName}}"}</code> for personalization
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 select-none">
              {/* Editor / Preview Toggle */}
              <div className="flex items-center bg-zinc-100 border border-zinc-200 rounded-lg p-0.5 shrink-0">
                <button
                  onClick={() => setPreviewActive(false)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1",
                    !previewActive ? "bg-white text-zinc-900 border border-zinc-200" : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  <Code className="w-3 h-3" /> Editor
                </button>
                <button
                  onClick={() => setPreviewActive(true)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1",
                    previewActive ? "bg-white text-zinc-900 border border-zinc-200" : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  <Eye className="w-3 h-3" /> Preview
                </button>
              </div>

              <button
                onClick={handleSaveTemplate}
                disabled={isSaving}
                className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors border border-indigo-700/20"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Template
              </button>
            </div>
          </header>

          {/* Editor & Preview Split Panel */}
          <div className="flex-1 flex flex-col md:flex-row gap-5 min-h-0 overflow-hidden">

            {/* Left inputs panel */}
            <div className="w-full md:w-72 space-y-3.5 shrink-0 overflow-y-auto pr-1">

              {/* AI Generate Button */}
              <button
                onClick={() => setIsAiDrawerOpen(true)}
                className="w-full h-9 px-4 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                Generate with AI
              </button>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Template Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sales Follow-up Step 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:bg-white focus:border-indigo-300 focus:outline-none transition-colors font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Email Subject</label>
                <input
                  type="text"
                  placeholder="Quick question for {{firstName}}"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:bg-white focus:border-indigo-300 focus:outline-none transition-colors font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:bg-white focus:border-indigo-300 focus:outline-none transition-colors font-medium appearance-none cursor-pointer"
                >
                  <option value="">No Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Variables */}
              <div className="space-y-1.5 pt-1 select-none">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Insert Variables</label>
                <div className="flex flex-wrap gap-1.5">
                  {variablesList.map((v) => (
                    <button
                      key={v}
                      onClick={() => handleInsertVariable(v)}
                      className="px-2 py-1 rounded-md border border-zinc-200 bg-zinc-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-[10px] font-semibold text-zinc-600 transition-all cursor-pointer font-mono"
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Code Editor or Preview */}
            <div className="flex-1 border border-zinc-200 rounded-2xl bg-white overflow-hidden flex flex-col relative min-h-[500px]">

              {!previewActive ? (
                /* CODE EDITOR */
                <CodeMirror
                  value={bodyHtml}
                  height="100%"
                  extensions={[html()]}
                  theme="light"
                  onChange={(value) => setBodyHtml(value)}
                  className="w-full h-full text-xs outline-none"
                />
              ) : (
                /* PREVIEW PANEL */
                <div className="flex-1 flex flex-col p-4 overflow-hidden">

                  {/* Preview controls */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 shrink-0">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Live HTML Preview</span>
                    <div className="flex items-center border border-zinc-200 rounded-lg p-0.5 bg-zinc-50">
                      <button
                        onClick={() => setPreviewMode("desktop")}
                        className={cn(
                          "p-1.5 rounded text-zinc-400 hover:text-zinc-600 cursor-pointer transition-all",
                          previewMode === "desktop" && "bg-white text-zinc-800 border border-zinc-200"
                        )}
                        title="Desktop Preview"
                      >
                        <Laptop className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPreviewMode("mobile")}
                        className={cn(
                          "p-1.5 rounded text-zinc-400 hover:text-zinc-600 cursor-pointer transition-all",
                          previewMode === "mobile" && "bg-white text-zinc-800 border border-zinc-200"
                        )}
                        title="Mobile Preview"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Render Area */}
                  <div className="flex-1 flex justify-center items-start pt-4 overflow-y-auto">
                    <div
                      className={cn(
                        "bg-white rounded-xl border border-zinc-200 overflow-hidden transition-all duration-300",
                        previewMode === "desktop" ? "w-full max-w-2xl min-h-[300px]" : "w-80 min-h-[450px]"
                      )}
                    >
                      <iframe
                        srcDoc={bodyHtml}
                        title="HTML Live Preview"
                        className="w-full h-96 border-0"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </div>

                  {/* Send Test Email */}
                  <div className="border-t border-zinc-100 pt-3 mt-3 shrink-0 space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Send Test Email
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex-1">
                        <input
                          type="email"
                          placeholder="recipient@example.com"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:bg-white focus:border-indigo-300 focus:outline-none font-medium"
                        />
                      </div>

                      <div className="w-full sm:w-44 shrink-0">
                        <select
                          value={testSmtpAccountId}
                          onChange={(e) => setTestSmtpAccountId(e.target.value)}
                          className="w-full h-9 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 focus:bg-white focus:outline-none font-medium"
                        >
                          <option value="">Default SMTP</option>
                          {smtpAccounts.map((acc: any) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.fromEmail}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={handleSendTestEmail}
                        disabled={isSendingTest || !testEmail}
                        className="h-9 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-700 disabled:opacity-40 text-xs font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors border border-zinc-800"
                      >
                        {isSendingTest ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        Send Test
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── PREVIEW MODAL (portal → renders on document.body) ─── */}
      {mounted && previewModalTemplate && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setPreviewModalTemplate(null)}
        >
          <div
            className="w-full max-w-3xl bg-white border border-zinc-200 rounded-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 shrink-0">
              <div className="min-w-0">
                <h3 className="font-bold text-zinc-900 text-sm truncate">{previewModalTemplate.name}</h3>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5 truncate">
                  Subject: {previewModalTemplate.subject}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {/* Desktop / Mobile toggle */}
                <div className="flex items-center border border-zinc-200 rounded-lg p-0.5 bg-zinc-50">
                  <button
                    onClick={() => setPreviewModalMode("desktop")}
                    className={cn(
                      "p-1.5 rounded text-zinc-400 cursor-pointer transition-all",
                      previewModalMode === "desktop" && "bg-white text-zinc-800 border border-zinc-200"
                    )}
                    title="Desktop"
                  >
                    <Laptop className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewModalMode("mobile")}
                    className={cn(
                      "p-1.5 rounded text-zinc-400 cursor-pointer transition-all",
                      previewModalMode === "mobile" && "bg-white text-zinc-800 border border-zinc-200"
                    )}
                    title="Mobile"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Edit button */}
                <button
                  onClick={() => {
                    setPreviewModalTemplate(null);
                    handleOpenEditComposer(previewModalTemplate);
                  }}
                  className="h-8 px-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>

                {/* Close */}
                <button
                  onClick={() => setPreviewModalTemplate(null)}
                  className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Preview area */}
            <div className="flex-1 overflow-y-auto bg-zinc-50 p-6 flex justify-center items-start">
              <div
                className={cn(
                  "bg-white border border-zinc-200 rounded-xl overflow-hidden transition-all duration-300",
                  previewModalMode === "desktop" ? "w-full max-w-2xl" : "w-80"
                )}
              >
                <iframe
                  srcDoc={getPreviewHtml(previewModalTemplate.bodyHtml)}
                  title={`Preview: ${previewModalTemplate.name}`}
                  className="w-full border-0"
                  style={{ minHeight: "400px", height: "500px" }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 shrink-0 bg-white">
              <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-medium">
                {previewModalTemplate.category && (
                  <span className="px-2 py-0.5 rounded-md border border-zinc-200 bg-zinc-50 text-zinc-600 font-semibold">
                    {previewModalTemplate.category.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(previewModalTemplate.createdAt)}
                </span>
              </div>
              <button
                onClick={() => {
                  setPreviewModalTemplate(null);
                  handleOpenEditComposer(previewModalTemplate);
                }}
                className="h-8 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                Open in Editor <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── AI TEMPLATE GENERATION MODAL (portal → renders on document.body) ─── */}
      {mounted && isAiDrawerOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsAiDrawerOpen(false)}>
          <div
            className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Generate with AI
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Powered by Google Gemini</p>
              </div>
              <button type="button" onClick={() => setIsAiDrawerOpen(false)} className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-700 cursor-pointer transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4 p-5 max-h-[70vh] overflow-y-auto">

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Your Product / Company</label>
                <textarea
                  placeholder="e.g. PrimeInbox is a cold email outreach SaaS featuring automatic SMTP rotation to bypass spam filters."
                  value={aiCompanyContext}
                  onChange={(e) => setAiCompanyContext(e.target.value)}
                  rows={2}
                  className="w-full p-3 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-800 font-medium resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Target Recipient Persona</label>
                <textarea
                  placeholder="e.g. Sales Directors and Growth Leads at B2B tech startups."
                  value={aiRecipientContext}
                  onChange={(e) => setAiRecipientContext(e.target.value)}
                  rows={2}
                  className="w-full p-3 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-800 font-medium resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Tone of Voice</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { key: "sales", label: "Sales" },
                    { key: "professional", label: "Pro" },
                    { key: "marketing", label: "Marketing" },
                    { key: "friendly", label: "Friendly" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setAiTone(opt.key)}
                      className={cn(
                        "py-2 rounded-lg border text-center text-[10px] font-semibold cursor-pointer transition-all",
                        aiTone === opt.key
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  What should this email focus on? <span className="text-red-400">*</span>
                </label>
                <textarea
                  placeholder="e.g. Introduce ourselves and ask for a 10-minute call. Mention our SMTP rotation feature. Use {{firstName}} to personalize."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-indigo-300 focus:bg-white focus:outline-none text-xs text-zinc-800 font-medium resize-none"
                  required
                />
              </div>
            </div>

            <div className="border-t border-zinc-100 px-5 py-3.5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAiDrawerOpen(false)}
                className="h-9 px-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateAiTemplate}
                disabled={isGeneratingAi || !aiPrompt.trim()}
                className="h-9 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors border border-indigo-700/20"
              >
                {isGeneratingAi ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" /> Generate Template</>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── CATEGORY MODAL (portal → renders on document.body) ─── */}
      {mounted && createCategoryOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setCreateCategoryOpen(false)}>
          <form
            onSubmit={handleCreateCategory}
            className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <h3 className="font-bold text-zinc-900 text-sm">New Category</h3>
              <button type="button" onClick={() => setCreateCategoryOpen(false)} className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-700 cursor-pointer transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Category Name</label>
              <input
                type="text"
                placeholder="e.g. Sales Outreach, Follow-ups"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 focus:bg-white focus:border-indigo-300 focus:outline-none font-medium"
                required
                autoFocus
              />
            </div>

            <div className="border-t border-zinc-100 px-5 py-3.5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCreateCategoryOpen(false)}
                className="h-9 px-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newCatName.trim()}
                className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white transition-colors cursor-pointer border border-indigo-700/20"
              >
                Create Category
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* ─── CREATOR CHOICE MODAL (portal → renders on document.body) ─── */}
      {mounted && isCreatorModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsCreatorModalOpen(false)}>
          <div
            className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <h3 className="font-bold text-zinc-900 text-sm">Create New Template</h3>
              <button type="button" onClick={() => setIsCreatorModalOpen(false)} className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-700 cursor-pointer transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className={cn("p-6 grid grid-cols-1 gap-4", canUseVisualBuilder && "sm:grid-cols-2")}>
              {/* Visual Builder Option */}
              {canUseVisualBuilder && (
              <button
                onClick={() => {
                  setIsCreatorModalOpen(false);
                  router.push("/dashboard/templates/builder/new");
                }}
                className="group p-5 rounded-2xl border border-zinc-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/20 text-left transition-all duration-200 cursor-pointer flex flex-col items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100/80 transition-colors">
                  <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 text-sm leading-snug">Visual Builder</h4>
                  <p className="text-[11px] text-zinc-500 font-medium mt-1 leading-normal">
                    Create professional, responsive templates visually without writing HTML.
                  </p>
                </div>
              </button>
              )}

              {/* Code Editor Option */}
              <button
                onClick={() => {
                  setIsCreatorModalOpen(false);
                  handleOpenCreateComposer();
                }}
                className="group p-5 rounded-2xl border border-zinc-200 hover:border-amber-500 bg-white hover:bg-amber-50/20 text-left transition-all duration-200 cursor-pointer flex flex-col items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100/80 transition-colors">
                  <Code className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 text-sm leading-snug">HTML Code Editor</h4>
                  <p className="text-[11px] text-zinc-500 font-medium mt-1 leading-normal">
                    Write raw HTML code directly with autocomplete syntax highlighting.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

"use client";

import React, { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast, confirmDialog } from "@/components/ui/feedback";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Save,
  Eye,
  Laptop,
  Smartphone,
  Tablet,
  Send,
  Loader2,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Heading as HeadingIcon,
  Type,
  Maximize2,
  Lock,
  Unlock,
  EyeOff,
  Settings,
  Sparkles,
  Link as LinkIcon,
  Tag,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Smile,
  Code,
  FolderOpen,
  Info,
  Calendar,
  X,
  FileUp,
  Search,
  Underline,
  ZoomIn,
  ZoomOut,
  Grid,
  LayoutTemplate,
  GripVertical,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { renderDragDropToHtml } from "@/lib/builder-renderer";

interface BlockItem {
  id: string;
  type: string;
  content: any;
}

interface ColumnItem {
  id: string;
  width: string;
  blocks: BlockItem[];
}

interface SectionItem {
  id: string;
  backgroundColor: string;
  backgroundImage: string;
  padding: { top: number; bottom: number; left: number; right: number };
  margin: { top: number; bottom: number };
  borderRadius: number;
  shadow: string;
  visibility: "all" | "desktop" | "mobile";
  isLocked?: boolean;
  isHidden?: boolean;
  columns: ColumnItem[];
}

interface DragDropData {
  version: string;
  globalSettings: {
    fontFamily: string;
    emailWidth: number;
    backgroundColor: string;
    contentBackgroundColor: string;
    brandColors: string[];
    logoUrl: string;
    footerText: string;
    buttonStyle: {
      backgroundColor: string;
      textColor: string;
      borderRadius: number;
      padding: string;
    };
  };
  sections: SectionItem[];
}

const defaultDragDropData: DragDropData = {
  version: "1.0",
  globalSettings: {
    fontFamily: "'Outfit', 'Inter', sans-serif",
    emailWidth: 600,
    backgroundColor: "#f4f4f5",
    contentBackgroundColor: "#ffffff",
    brandColors: ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b"],
    logoUrl: "",
    footerText: "© 2026 PrimeInbox Inc. All rights reserved.",
    buttonStyle: {
      backgroundColor: "#4f46e5",
      textColor: "#ffffff",
      borderRadius: 8,
      padding: "10px 20px"
    }
  },
  sections: [
    {
      id: "section-1",
      backgroundColor: "#ffffff",
      backgroundImage: "",
      padding: { top: 20, bottom: 20, left: 20, right: 20 },
      margin: { top: 0, bottom: 0 },
      borderRadius: 8,
      shadow: "none",
      visibility: "all",
      columns: [
        {
          id: "col-1-1",
          width: "100%",
          blocks: [
            {
              id: "logo-1",
              type: "logo",
              content: {
                url: "https://placehold.co/150x50?text=Brand+Logo",
                alt: "Logo",
                align: "center",
                link: "#",
                height: "40"
              }
            },
            {
              id: "heading-1",
              type: "heading",
              content: {
                text: "Build Gorgeous Emails Visually!",
                level: "h2",
                align: "center",
                style: {
                  fontSize: "26px",
                  fontWeight: "800",
                  color: "#111827",
                  padding: "10px 0px"
                }
              }
            },
            {
              id: "text-1",
              type: "text",
              content: {
                text: "Welcome to PrimeInbox email builder! Drag blocks from the left panel onto the canvas, reorder elements, and edit styles. Click any block or section to edit its properties.",
                align: "center",
                style: {
                  fontSize: "14px",
                  color: "#4b5563",
                  padding: "10px 0px"
                }
              }
            },
            {
              id: "btn-1",
              type: "button",
              content: {
                text: "Get Started Now",
                url: "#",
                align: "center",
                style: {
                  backgroundColor: "#4f46e5",
                  textColor: "#ffffff",
                  borderRadius: 8,
                  padding: "12px 24px"
                }
              }
            }
          ]
        }
      ]
    }
  ]
};

// Interactive DropSlot between blocks
interface DropSlotProps {
  sectionId: string;
  colId: string;
  index: number;
  onBlockDropped: (e: React.DragEvent, sectionId: string, colId: string, targetIndex: number) => void;
  onBlockMoved: (e: React.DragEvent, sectionId: string, colId: string, targetIndex: number) => void;
}

function DropSlot({ sectionId, colId, index, onBlockDropped, onBlockMoved }: DropSlotProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const moveInfo = e.dataTransfer.getData("moveBlockInfo");
        if (moveInfo) {
          onBlockMoved(e, sectionId, colId, index);
        } else {
          onBlockDropped(e, sectionId, colId, index);
        }
      }}
      className={cn(
        "h-2 my-0.5 rounded transition-all duration-150 flex items-center justify-center text-[9px] font-bold text-indigo-650 bg-transparent select-none pointer-events-auto",
        isDragOver && "h-9 my-2.5 border border-dashed border-indigo-400 bg-indigo-50/50"
      )}
    >
      {isDragOver && "Drop element here"}
    </div>
  );
}

const isBgDark = (hexColor: string) => {
  if (!hexColor || !hexColor.startsWith("#")) return false;
  const hex = hexColor.substring(1);
  if (hex.length !== 6 && hex.length !== 3) return false;
  const r = parseInt(hex.length === 6 ? hex.substring(0, 2) : hex[0] + hex[0], 16);
  const g = parseInt(hex.length === 6 ? hex.substring(2, 4) : hex[1] + hex[1], 16);
  const b = parseInt(hex.length === 6 ? hex.substring(4, 6) : hex[2] + hex[2], 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 128;
};

export default function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: templateId } = use(params);

  // Gate the visual builder by plan — Silver-tier plans get the HTML editor only.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) return;
        const data = await res.json();
        const { getPlanLimits } = await import("@/lib/plans");
        if (!getPlanLimits(data.user?.company?.subscriptionPlan).visualBuilder) {
          toast.error("The Visual Builder isn't available on your plan. Upgrade to use it.");
          router.replace("/dashboard/templates");
        }
      } catch {
        /* ignore */
      }
    })();
  }, [router]);

  // States
  const [templateName, setTemplateName] = useState("Untitled Template");
  const [templateSubject, setTemplateSubject] = useState("Outreach Email Subject");
  const [templateCategoryId, setTemplateCategoryId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [dragDropData, setDragDropData] = useState<DragDropData>(defaultDragDropData);

  // Stacks for Undo / Redo
  const [history, setHistory] = useState<DragDropData[]>([defaultDragDropData]);
  const [historyActions, setHistoryActions] = useState<string[]>(["Initial Layout"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);

  // Inspector selection
  const [selectedBlock, setSelectedBlock] = useState<{ sectionId: string; colId: string; blockId: string } | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<"style" | "global">("style");

  // Visual/Preview Modes
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile" | null>(null); // null = canvas edit
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light");

  // Utilities
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modals & Panels
  const [isTestEmailOpen, setIsTestEmailOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [smtpAccounts, setSmtpAccounts] = useState<any[]>([]);
  const [testSmtpAccountId, setTestSmtpAccountId] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Left Sidebar
  const [leftSidebarTab, setLeftSidebarTab] = useState<"templates" | "blocks" | "assets" | "ai" | "styles">("templates");
  const [searchBlockQuery, setSearchBlockQuery] = useState("");

  // AI Assistant states
  const [aiPrompt, setAiPrompt] = useState("");
  const [isEditingAi, setIsEditingAi] = useState(false);

  // Canva features states
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showGridlines, setShowGridlines] = useState<boolean>(true);
  const [isEditingText, setIsEditingText] = useState<boolean>(false);
  const [isRewritingBlockId, setIsRewritingBlockId] = useState<string | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  // Asset manager
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState("");
  const [storageUsage, setStorageUsage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Categories, SMTP Accounts, Assets and Template Data
  useEffect(() => {
    fetchCategories();
    fetchSmtpAccounts();
    fetchAssets();
    if (templateId && templateId !== "new") {
      fetchTemplateDetails();
    } else if (templateId === "new") {
      createNewTemplateInstance();
    }
  }, [templateId]);

  // Re-fetch assets when search query updates
  useEffect(() => {
    fetchAssets();
  }, [assetSearchQuery]);

  // Autosave timer: saves changes every 30 seconds
  useEffect(() => {
    if (!templateId || templateId === "new" || !hasUnsavedChanges) return;

    const timer = setInterval(() => {
      handleSave(true); // silent autosave
    }, 30000);

    return () => clearInterval(timer);
  }, [dragDropData, templateName, templateSubject, templateCategoryId, hasUnsavedChanges]);

  // Undo/Redo state pushing
  const updateStateAndHistory = (newData: DragDropData, actionLabel: string = "Modify Layout") => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    const updatedActions = historyActions.slice(0, historyIndex + 1);
    updatedHistory.push(newData);
    updatedActions.push(actionLabel);
    setHistory(updatedHistory);
    setHistoryActions(updatedActions);
    setHistoryIndex(updatedHistory.length - 1);
    setDragDropData(newData);
    setHasUnsavedChanges(true);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      setDragDropData(history[idx]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      setDragDropData(history[idx]);
    }
  };

  const jumpToHistory = (index: number) => {
    if (index >= 0 && index < history.length) {
      setHistoryIndex(index);
      setDragDropData(history[index]);
      toast.info(`Jumped to: ${historyActions[index]}`);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/templates/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSmtpAccounts = async () => {
    try {
      const res = await fetch("/api/smtp/accounts");
      if (res.ok) {
        const data = await res.json();
        setSmtpAccounts(data.accounts || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAssets = async () => {
    setIsLoadingAssets(true);
    try {
      const res = await fetch(`/api/assets?query=${assetSearchQuery}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.files || []);
        setStorageUsage(data.totalSize || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  const fetchTemplateDetails = async () => {
    try {
      const res = await fetch(`/api/templates/${templateId}`);
      if (!res.ok) throw new Error("Template not found");
      const data = await res.json();
      const template = data.template;
      setTemplateName(template.name);
      setTemplateSubject(template.subject);
      setTemplateCategoryId(template.categoryId || "");
      if (template.isDragDrop && template.dragDropData) {
        let parsed = template.dragDropData;
        if (typeof parsed === "string") parsed = JSON.parse(parsed);
        setDragDropData(parsed);
        setHistory([parsed]);
        setHistoryIndex(0);
      } else {
        const customData = { ...defaultDragDropData };
        customData.sections[0].columns[0].blocks[2].content.text = template.bodyHtml.replace(/<[^>]*>/g, "");
        setDragDropData(customData);
        setHistory([customData]);
        setHistoryIndex(0);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load template");
      router.push("/dashboard/templates");
    }
  };

  const createNewTemplateInstance = async () => {
    try {
      const compiledHtml = renderDragDropToHtml(defaultDragDropData);
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Untitled Email Template",
          subject: "Check this out!",
          categoryId: null,
          isDragDrop: true,
          dragDropData: defaultDragDropData,
          bodyHtml: compiledHtml,
        }),
      });

      if (!res.ok) throw new Error("Could not initialize template");
      const data = await res.json();
      toast.success("Creating new visual workspace...");
      router.replace(`/dashboard/templates/builder/${data.template.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to create template workspace");
      router.push("/dashboard/templates");
    }
  };

  const handleSave = async (silent = false) => {
    if (!silent) setIsSaving(true);
    try {
      const compiledHtml = renderDragDropToHtml(dragDropData);
      const res = await fetch(`/api/templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim(),
          subject: templateSubject.trim(),
          categoryId: templateCategoryId || null,
          isDragDrop: true,
          dragDropData: dragDropData,
          bodyHtml: compiledHtml,
        }),
      });

      if (!res.ok) throw new Error("Failed to save template workspace");

      setHasUnsavedChanges(false);
      if (!silent) {
        toast.success("Template saved successfully");
      }
    } catch (e: any) {
      if (!silent) {
        toast.error(e.message || "Could not save template");
      }
    } finally {
      if (!silent) setIsSaving(false);
    }
  };

  // Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Input editing check
      const activeEl = document.activeElement;
      const isEditingInput = activeEl && (
        activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.tagName === "SELECT" ||
        activeEl.getAttribute("contenteditable") === "true"
      );

      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "Z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && selectedBlock) {
        e.preventDefault();
        duplicateBlock(selectedBlock.sectionId, selectedBlock.colId, selectedBlock.blockId);
        toast.success("Duplicated block");
      }
      if (e.key === "ArrowUp" && selectedBlock && !isEditingInput) {
        e.preventDefault();
        moveBlockUpDown(selectedBlock.sectionId, selectedBlock.colId, selectedBlock.blockId, "up");
      }
      if (e.key === "ArrowDown" && selectedBlock && !isEditingInput) {
        e.preventDefault();
        moveBlockUpDown(selectedBlock.sectionId, selectedBlock.colId, selectedBlock.blockId, "down");
      }
      if (e.key === "Escape") {
        setSelectedBlock(null);
        setSelectedSectionId(null);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedBlock) {
        if (!isEditingInput) {
          e.preventDefault();
          deleteBlock(selectedBlock.sectionId, selectedBlock.colId, selectedBlock.blockId);
          toast.success("Deleted block");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dragDropData, historyIndex, history, templateName, templateSubject, templateCategoryId, selectedBlock]);

  // Asset Uploading
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesUploaded = e.target.files;
    if (!filesUploaded || filesUploaded.length === 0) return;

    const file = filesUploaded[0];
    const formData = new FormData();
    formData.append("file", file);

    const toastId = toast.loading("Uploading image...");
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      toast.success("Image uploaded to assets", { id: toastId });
      fetchAssets();

      if (selectedBlock) {
        const { sectionId, colId, blockId } = selectedBlock;
        const block = findBlock(sectionId, colId, blockId);
        if (block && block.type === "image") {
          updateBlockContent(sectionId, colId, blockId, {
            ...block.content,
            url: data.file.url,
          });
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image", { id: toastId });
    }
  };

  const handleDeleteAsset = async (id: string) => {
    const ok = await confirmDialog({
      title: "Delete asset?",
      description: "This asset will be permanently removed.",
      confirmText: "Delete",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Asset deleted");
      fetchAssets();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete asset");
    }
  };

  // Test Email Sending
  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      toast.error("Please specify a recipient email.");
      return;
    }

    setIsSendingTest(true);
    try {
      const compiledHtml = renderDragDropToHtml(dragDropData);
      const res = await fetch("/api/templates/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmail.trim(),
          subject: templateSubject.trim(),
          bodyHtml: compiledHtml,
          smtpAccountId: testSmtpAccountId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch test");

      toast.success("Test email sent successfully!");
      setIsTestEmailOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to send test email");
    } finally {
      setIsSendingTest(false);
    }
  };

  // Gemini Prompt Editor call
  const handleAiEditLayout = async () => {
    if (!aiPrompt.trim()) return;
    setIsEditingAi(true);

    const toastId = toast.loading("AI is customizing your email layout...");
    try {
      const res = await fetch("/api/ai/edit-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          dragDropData: dragDropData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI layout editing failed");

      updateStateAndHistory(data.dragDropData, "AI Layout Edit");
      setAiPrompt("");
      toast.success("Design updated by AI successfully!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to edit layout with AI", { id: toastId });
    } finally {
      setIsEditingAi(false);
    }
  };

  const handleInlineAiRewrite = async (secId: string, colId: string, blockId: string, actionType: string) => {
    const sec = dragDropData.sections.find((s) => s.id === secId);
    const col = sec?.columns.find((c) => c.id === colId);
    const block = col?.blocks.find((b) => b.id === blockId);
    if (!block) return;

    let originalText = "";
    if (block.type === "heading" || block.type === "text" || block.type === "button") {
      originalText = block.content.text || "";
    } else {
      return;
    }

    setIsRewritingBlockId(blockId);
    const actionDescriptions: Record<string, string> = {
      professional: "rewrite to be highly professional, elegant, and persuasive for business email",
      shorter: "make it very short, concise, and clear",
      longer: "expand it to be more detailed, explanatory, and thorough while keeping it readable",
      event: "rewrite it to be exciting, event-focused, and action-oriented for event invitation",
      outreach: "rewrite it to be a personalized, warm, and highly engaging cold outreach introduction",
      emojis: "enhance with relevant, tasteful emojis to make it friendly",
      translate_en: "translate it to clear, native English",
      translate_es: "translate it to fluent, natural Spanish",
    };

    const actionDesc = actionDescriptions[actionType] || "rewrite and improve this copy";
    const promptMessage = `In the template block with ID '${blockId}', rewrite the text content: "${originalText}" to be ${actionDesc}. Keep the styles, alignment, layout, structure, and all other sections completely unmodified. Just change the text content of this block.`;

    const toastId = toast.loading("Gemini AI is rewriting your copy...");
    try {
      const res = await fetch("/api/ai/edit-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptMessage,
          dragDropData: dragDropData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI rewriting failed");

      updateStateAndHistory(data.dragDropData, `AI Rewrite: ${block.type} to ${actionType}`);
      toast.success("Text rewritten successfully!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to rewrite text with AI", { id: toastId });
    } finally {
      setIsRewritingBlockId(null);
    }
  };

  // Drag and Drop Engine Handlers
  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData("newBlockType", type);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropNewBlock = (
    e: React.DragEvent,
    sectionId: string,
    colId: string,
    targetIndex: number
  ) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData("newBlockType");
    const assetUrl = e.dataTransfer.getData("assetUrl");
    if (!blockType && !assetUrl) return;

    let content: any = {};
    let resolvedBlockType = blockType;

    if (assetUrl) {
      resolvedBlockType = "image";
      content = { url: assetUrl, alt: "Visual Image", align: "center", rounded: 6, padding: "10px 0", link: "", width: "100%" };
    } else {
      if (blockType === "heading") {
        content = { text: "Double click to edit heading", level: "h2", align: "left", style: { fontSize: "22px", fontWeight: "bold", color: "#1f2937", padding: "10px 0" } };
      } else if (blockType === "text") {
        content = { text: "Double click to edit text paragraph.", align: "left", style: { fontSize: "14px", color: "#4b5563", padding: "10px 0" } };
      } else if (blockType === "image") {
        content = { url: "https://placehold.co/600x300?text=Placeholder+Image", alt: "Visual Image", align: "center", rounded: 6, padding: "10px 0", link: "", width: "100%" };
      } else if (blockType === "button") {
        content = { text: "Click Here", url: "#", align: "left", style: { backgroundColor: "#4f46e5", textColor: "#ffffff", borderRadius: 6, padding: "10px 20px" } };
      } else if (blockType === "divider") {
        content = { color: "#e5e7eb", height: 1, padding: "15px 0" };
      } else if (blockType === "spacer") {
        content = { height: 20 };
      } else if (blockType === "logo") {
        content = { url: "https://placehold.co/150x50?text=Logo", alt: "Logo", align: "center", link: "#", height: "40" };
      } else if (blockType === "social") {
        content = { platforms: [
          { name: "Facebook", url: "#", icon: "https://cdn-icons-png.flaticon.com/512/124/124010.png" },
          { name: "Twitter", url: "#", icon: "https://cdn-icons-png.flaticon.com/512/3256/3256013.png" },
          { name: "LinkedIn", url: "#", icon: "https://cdn-icons-png.flaticon.com/512/174/174857.png" }
        ], align: "center", size: "24" };
      } else if (blockType === "footer") {
        content = { text: `© ${new Date().getFullYear()} ${templateName || "My Company"}. All rights reserved.`, unsubText: "If you don't wish to receive these emails, you can unsubscribe below.", align: "center" };
      } else if (blockType === "signature") {
        content = { name: "Sender Name", role: "Founder & CEO", company: "My Company", photo: "", align: "left" };
      } else if (blockType === "html") {
        content = { code: '<div style="padding: 20px; text-align: center; border: 1px dashed #4f46e5; background-color: #f5f3ff; color: #4f46e5; border-radius: 8px;">Custom HTML Block</div>' };
      } else {
        return;
      }
    }

    const newBlock: BlockItem = {
      id: `${resolvedBlockType}-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      type: resolvedBlockType,
      content,
    };

    const nextData = { ...dragDropData };
    const section = nextData.sections.find((s) => s.id === sectionId);
    if (!section) return;

    const column = section.columns.find((c) => c.id === colId);
    if (!column) return;

    column.blocks.splice(targetIndex, 0, newBlock);
    updateStateAndHistory(nextData, `Add ${resolvedBlockType} Block`);
    setSelectedBlock({ sectionId, colId, blockId: newBlock.id });
    setSelectedSectionId(null);
  };

  // Block Sorting and Canvas Moving
  const handleBlockDragStart = (
    e: React.DragEvent,
    sectionId: string,
    colId: string,
    blockId: string
  ) => {
    e.dataTransfer.setData("moveBlockInfo", JSON.stringify({ sectionId, colId, blockId }));
  };

  const handleBlockDropMove = (
    e: React.DragEvent,
    targetSectionId: string,
    targetColId: string,
    targetIndex: number
  ) => {
    e.preventDefault();
    const moveInfoStr = e.dataTransfer.getData("moveBlockInfo");
    if (!moveInfoStr) return;

    const { sectionId: srcSecId, colId: srcColId, blockId } = JSON.parse(moveInfoStr);

    const nextData = { ...dragDropData };
    const srcSec = nextData.sections.find((s) => s.id === srcSecId);
    const srcCol = srcSec?.columns.find((c) => c.id === srcColId);
    const blockIdx = srcCol?.blocks.findIndex((b) => b.id === blockId);

    if (srcCol && blockIdx !== undefined && blockIdx !== -1) {
      const [block] = srcCol.blocks.splice(blockIdx, 1);

      const tarSec = nextData.sections.find((s) => s.id === targetSectionId);
      const tarCol = tarSec?.columns.find((c) => c.id === targetColId);
      if (tarCol) {
        tarCol.blocks.splice(targetIndex, 0, block);
        updateStateAndHistory(nextData, "Reorder Block");
        setSelectedBlock({ sectionId: targetSectionId, colId: targetColId, blockId });
        setSelectedSectionId(null);
      }
    }
  };

  const findBlock = (secId: string, colId: string, blockId: string): BlockItem | null => {
    const sec = dragDropData.sections.find((s) => s.id === secId);
    const col = sec?.columns.find((c) => c.id === colId);
    return col?.blocks.find((b) => b.id === blockId) || null;
  };

  const updateBlockContent = (secId: string, colId: string, blockId: string, content: any) => {
    const nextData = { ...dragDropData };
    const sec = nextData.sections.find((s) => s.id === secId);
    const col = sec?.columns.find((c) => c.id === colId);
    const block = col?.blocks.find((b) => b.id === blockId);
    if (block) {
      block.content = content;
      updateStateAndHistory(nextData, `Edit ${block.type} Block`);
    }
  };

  const deleteBlock = (secId: string, colId: string, blockId: string) => {
    const nextData = { ...dragDropData };
    const sec = nextData.sections.find((s) => s.id === secId);
    const col = sec?.columns.find((c) => c.id === colId);
    if (col) {
      col.blocks = col.blocks.filter((b) => b.id !== blockId);
      updateStateAndHistory(nextData, "Delete Block");
      setSelectedBlock(null);
    }
  };

  const duplicateBlock = (secId: string, colId: string, blockId: string) => {
    const nextData = { ...dragDropData };
    const sec = nextData.sections.find((s) => s.id === secId);
    const col = sec?.columns.find((c) => c.id === colId);
    if (col) {
      const idx = col.blocks.findIndex((b) => b.id === blockId);
      if (idx !== -1) {
        const copy = JSON.parse(JSON.stringify(col.blocks[idx]));
        copy.id = `${copy.type}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
        col.blocks.splice(idx + 1, 0, copy);
        updateStateAndHistory(nextData, `Duplicate ${copy.type} Block`);
        setSelectedBlock({ sectionId: secId, colId, blockId: copy.id });
      }
    }
  };

  const moveBlockUpDown = (secId: string, colId: string, blockId: string, direction: "up" | "down") => {
    const nextData = { ...dragDropData };
    const sec = nextData.sections.find((s) => s.id === secId);
    const col = sec?.columns.find((c) => c.id === colId);
    if (!col) return;
    const idx = col.blocks.findIndex((b) => b.id === blockId);
    if (idx === -1) return;

    if (direction === "up" && idx > 0) {
      const [block] = col.blocks.splice(idx, 1);
      col.blocks.splice(idx - 1, 0, block);
      updateStateAndHistory(nextData, `Move ${block.type} Block Up`);
      setSelectedBlock({ sectionId: secId, colId, blockId });
    } else if (direction === "down" && idx < col.blocks.length - 1) {
      const [block] = col.blocks.splice(idx, 1);
      col.blocks.splice(idx + 1, 0, block);
      updateStateAndHistory(nextData, `Move ${block.type} Block Down`);
      setSelectedBlock({ sectionId: secId, colId, blockId });
    }
  };

  // Section duplication/locking/deletion
  const addSection = (colsCount: number) => {
    const nextData = { ...dragDropData };
    const sectionId = `section-${Date.now()}`;
    const columns: ColumnItem[] = [];

    for (let i = 0; i < colsCount; i++) {
      columns.push({
        id: `col-${sectionId}-${i}`,
        width: colsCount === 1 ? "100%" : colsCount === 2 ? "50%" : "33.33%",
        blocks: [],
      });
    }

    const newSection: SectionItem = {
      id: sectionId,
      backgroundColor: "#ffffff",
      backgroundImage: "",
      padding: { top: 20, bottom: 20, left: 20, right: 20 },
      margin: { top: 0, bottom: 10 },
      borderRadius: 8,
      shadow: "none",
      visibility: "all",
      columns,
    };

    nextData.sections.push(newSection);
    updateStateAndHistory(nextData, "Add Section");
    setSelectedSectionId(sectionId);
    setSelectedBlock(null);
  };

  const deleteSection = (secId: string) => {
    if (dragDropData.sections.length <= 1) {
      toast.warning("You must keep at least one section in the template.");
      return;
    }
    const nextData = { ...dragDropData };
    nextData.sections = nextData.sections.filter((s) => s.id !== secId);
    updateStateAndHistory(nextData, "Delete Section");
    setSelectedSectionId(null);
    setSelectedBlock(null);
  };

  const duplicateSection = (secId: string) => {
    const nextData = { ...dragDropData };
    const idx = nextData.sections.findIndex((s) => s.id === secId);
    if (idx !== -1) {
      const copy = JSON.parse(JSON.stringify(nextData.sections[idx]));
      const suffix = Date.now();
      copy.id = `section-${suffix}`;
      copy.columns.forEach((c: any, cIdx: number) => {
        c.id = `col-${copy.id}-${cIdx}`;
        c.blocks.forEach((b: any) => {
          b.id = `${b.type}-${suffix}-${Math.round(Math.random() * 1000)}`;
        });
      });

      nextData.sections.splice(idx + 1, 0, copy);
      updateStateAndHistory(nextData, "Duplicate Section");
      setSelectedSectionId(copy.id);
      setSelectedBlock(null);
    }
  };

  const moveSection = (secId: string, direction: "up" | "down") => {
    const nextData = { ...dragDropData };
    const idx = nextData.sections.findIndex((s) => s.id === secId);
    if (idx === -1) return;

    if (direction === "up" && idx > 0) {
      const temp = nextData.sections[idx];
      nextData.sections[idx] = nextData.sections[idx - 1];
      nextData.sections[idx - 1] = temp;
      updateStateAndHistory(nextData, "Move Section Up");
    } else if (direction === "down" && idx < nextData.sections.length - 1) {
      const temp = nextData.sections[idx];
      nextData.sections[idx] = nextData.sections[idx + 1];
      nextData.sections[idx + 1] = temp;
      updateStateAndHistory(nextData, "Move Section Down");
    }
  };

  const toggleSectionLock = (secId: string) => {
    const nextData = { ...dragDropData };
    const sec = nextData.sections.find((s) => s.id === secId);
    if (sec) {
      sec.isLocked = !sec.isLocked;
      updateStateAndHistory(nextData, sec.isLocked ? "Lock Section" : "Unlock Section");
    }
  };

  const toggleSectionHide = (secId: string) => {
    const nextData = { ...dragDropData };
    const sec = nextData.sections.find((s) => s.id === secId);
    if (sec) {
      sec.isHidden = !sec.isHidden;
      updateStateAndHistory(nextData, sec.isHidden ? "Hide Section" : "Show Section");
    }
  };

  const addAdvancedPreset = (presetName: string) => {
    const sectionId = `section-${Date.now()}`;
    let newSection: SectionItem;

    if (presetName === "hero-banner") {
      newSection = {
        id: sectionId,
        backgroundColor: "#1e1b4b",
        backgroundImage: "",
        padding: { top: 40, bottom: 40, left: 30, right: 30 },
        margin: { top: 0, bottom: 10 },
        borderRadius: 8,
        shadow: "none",
        visibility: "all",
        columns: [
          {
            id: `col-${sectionId}-0`,
            width: "100%",
            blocks: [
              {
                id: `heading-${Date.now()}-1`,
                type: "heading",
                content: {
                  text: "ENGAGE RECIPIENTS FASTER",
                  level: "h1",
                  align: "center",
                  style: { fontSize: "28px", fontWeight: "800", color: "#ffffff", padding: "10px 0" }
                }
              },
              {
                id: `text-${Date.now()}-2`,
                type: "text",
                content: {
                  text: "This is a premium hero callout banner template block. Drag this prebuilt layout to kickstart conversion layouts.",
                  align: "center",
                  style: { fontSize: "14px", color: "#c7d2fe", padding: "10px 0" }
                }
              },
              {
                id: `btn-${Date.now()}-3`,
                type: "button",
                content: {
                  text: "Grab Offer Now",
                  url: "#",
                  align: "center",
                  style: { backgroundColor: "#6366f1", textColor: "#ffffff", borderRadius: 8, padding: "12px 24px" }
                }
              }
            ]
          }
        ]
      };
    } else if (presetName === "product-card") {
      newSection = {
        id: sectionId,
        backgroundColor: "#ffffff",
        backgroundImage: "",
        padding: { top: 15, bottom: 15, left: 15, right: 15 },
        margin: { top: 0, bottom: 10 },
        borderRadius: 8,
        shadow: "none",
        visibility: "all",
        columns: [
          {
            id: `col-${sectionId}-0`,
            width: "100%",
            blocks: [
              {
                id: `img-${Date.now()}-1`,
                type: "image",
                content: { url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop", alt: "Premium Product", align: "center", rounded: 8, padding: "10px 0", link: "#", width: "100%" }
              },
              {
                id: `heading-${Date.now()}-2`,
                type: "heading",
                content: { text: "Product Smartwatch Pro", level: "h3", align: "left", style: { fontSize: "18px", fontWeight: "700", color: "#1f2937", padding: "5px 0" } }
              },
              {
                id: `text-${Date.now()}-3`,
                type: "text",
                content: { text: "Active health tracking, 7-day battery life, and dynamic notifications pool. Built for productivity.", align: "left", style: { fontSize: "13px", color: "#4b5563", padding: "5px 0" } }
              },
              {
                id: `btn-${Date.now()}-4`,
                type: "button",
                content: { text: "Buy Now - $199", url: "#", align: "left", style: { backgroundColor: "#10b981", textColor: "#ffffff", borderRadius: 6, padding: "8px 16px" } }
              }
            ]
          }
        ]
      };
    } else if (presetName === "quote") {
      newSection = {
        id: sectionId,
        backgroundColor: "#f9fafb",
        backgroundImage: "",
        padding: { top: 25, bottom: 25, left: 30, right: 30 },
        margin: { top: 10, bottom: 10 },
        borderRadius: 6,
        shadow: "none",
        visibility: "all",
        columns: [
          {
            id: `col-${sectionId}-0`,
            width: "100%",
            blocks: [
              {
                id: `text-${Date.now()}-1`,
                type: "text",
                content: {
                  text: '“Using PrimeInbox smtp pools increased our cold email deliverability rates from 45% up to 92% in less than 2 weeks. Highly recommended.”',
                  align: "left",
                  style: { fontSize: "16px", color: "#1f2937", fontWeight: "italic", padding: "5px 0", lineHeight: "1.6" }
                }
              },
              {
                id: `signature-${Date.now()}-2`,
                type: "signature",
                content: { name: "Sarah Connor", role: "VP of Operations", company: "Cyberdyne Systems", align: "left" }
              }
            ]
          }
        ]
      };
    } else {
      toast.error("Unknown layout template");
      return;
    }

    const nextData = { ...dragDropData };
    nextData.sections.push(newSection);
    updateStateAndHistory(nextData);
    setSelectedSectionId(sectionId);
    setSelectedBlock(null);
    toast.success(`Inserted ${presetName.replace("-", " ")} layout preset`);
  };

  const applyTemplatePreset = async (presetName: string) => {
    const ok = await confirmDialog({
      title: "Apply template preset?",
      description: "This will overwrite your current canvas contents. Make sure you have saved any changes.",
      confirmText: "Overwrite canvas",
    });
    if (!ok) return;

    let targetData: DragDropData;

    if (presetName === "cold-outreach") {
      targetData = {
        version: "1.0",
        globalSettings: {
          ...dragDropData.globalSettings,
          emailWidth: 600,
          backgroundColor: "#f4f4f5",
          contentBackgroundColor: "#ffffff",
        },
        sections: [
          {
            id: `section-${Date.now()}-1`,
            backgroundColor: "#ffffff",
            backgroundImage: "",
            padding: { top: 30, bottom: 30, left: 30, right: 30 },
            margin: { top: 0, bottom: 10 },
            borderRadius: 8,
            shadow: "none",
            visibility: "all",
            columns: [
              {
                id: `col-${Date.now()}-1`,
                width: "100%",
                blocks: [
                  {
                    id: `logo-${Date.now()}`,
                    type: "logo",
                    content: {
                      url: dragDropData.globalSettings.logoUrl || "https://placehold.co/150x50?text=Brand+Logo",
                      alt: "Logo",
                      align: "center",
                      link: "#",
                      height: "40"
                    }
                  },
                  { id: `spacer-${Date.now()}-1`, type: "spacer", content: { height: 20 } },
                  {
                    id: `heading-${Date.now()}`,
                    type: "heading",
                    content: {
                      text: "Improve your {{companyName}} outreach response by 2x",
                      level: "h2",
                      align: "left",
                      style: { fontSize: "22px", fontWeight: "800", color: "#111827", padding: "10px 0" }
                    }
                  },
                  {
                    id: `text-${Date.now()}-1`,
                    type: "text",
                    content: {
                      text: "Hi {{firstName}},\n\nI was looking at {{companyName}}'s outbound setups and noticed a few simple improvements that could lift deliverability rates. We recently helped a similar software company increase their book rate to 24%.\n\nAre you open to a brief 10-minute introduction call next Thursday at 3 PM?",
                      align: "left",
                      style: { fontSize: "14px", color: "#374151", padding: "10px 0" }
                    }
                  },
                  { id: `spacer-${Date.now()}-2`, type: "spacer", content: { height: 15 } },
                  {
                    id: `btn-${Date.now()}`,
                    type: "button",
                    content: {
                      text: "Book a 10-Min Chat",
                      url: "#",
                      align: "left",
                      style: { backgroundColor: "#4f46e5", textColor: "#ffffff", borderRadius: 8, padding: "12px 24px" }
                    }
                  },
                  { id: `spacer-${Date.now()}-3`, type: "spacer", content: { height: 25 } },
                  {
                    id: `sig-${Date.now()}`,
                    type: "signature",
                    content: {
                      name: "Sarah Jenkins",
                      role: "VP of Growth",
                      company: "PrimeInbox",
                      photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
                      align: "left"
                    }
                  },
                  {
                    id: `footer-${Date.now()}`,
                    type: "footer",
                    content: {
                      text: "© 2026 PrimeInbox Inc. 123 Business Rd, SF.",
                      unsubText: "If you don't wish to receive these, you can unsubscribe below.",
                      align: "left"
                    }
                  }
                ]
              }
            ]
          }
        ]
      };
    } else if (presetName === "newsletter") {
      targetData = {
        version: "1.0",
        globalSettings: {
          ...dragDropData.globalSettings,
          emailWidth: 600,
          backgroundColor: "#f1f5f9",
          contentBackgroundColor: "#ffffff",
        },
        sections: [
          {
            id: `sec-${Date.now()}-head`,
            backgroundColor: "#ffffff",
            backgroundImage: "",
            padding: { top: 15, bottom: 15, left: 20, right: 20 },
            margin: { top: 0, bottom: 5 },
            borderRadius: 8,
            shadow: "none",
            visibility: "all",
            columns: [
              {
                id: `col-${Date.now()}-head`,
                width: "100%",
                blocks: [
                  {
                    id: `logo-${Date.now()}`,
                    type: "logo",
                    content: {
                      url: "https://placehold.co/150x50?text=Monthly+Digest",
                      alt: "Digest Logo",
                      align: "center",
                      link: "#",
                      height: "35"
                    }
                  },
                  { id: `div-${Date.now()}`, type: "divider", content: { color: "#e2e8f0", height: 1, padding: "10px 0" } }
                ]
              }
            ]
          },
          {
            id: `sec-${Date.now()}-hero`,
            backgroundColor: "#ffffff",
            backgroundImage: "",
            padding: { top: 15, bottom: 20, left: 20, right: 20 },
            margin: { top: 0, bottom: 10 },
            borderRadius: 8,
            shadow: "none",
            visibility: "all",
            columns: [
              {
                id: `col-${Date.now()}-hero`,
                width: "100%",
                blocks: [
                  {
                    id: `img-${Date.now()}`,
                    type: "image",
                    content: {
                      url: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=600&auto=format&fit=crop&q=80",
                      alt: "Summer Update Banner",
                      align: "center",
                      rounded: 8,
                      padding: "10px 0",
                      link: "#",
                      width: "100%"
                    }
                  },
                  {
                    id: `heading-${Date.now()}`,
                    type: "heading",
                    content: {
                      text: "June Edition: Canva UI & AI Editing",
                      level: "h2",
                      align: "center",
                      style: { fontSize: "24px", fontWeight: "800", color: "#0f172a", padding: "15px 0 5px 0" }
                    }
                  },
                  {
                    id: `text-${Date.now()}`,
                    type: "text",
                    content: {
                      text: "We are thrilled to launch our new Visual Email Builder. Now you can scale layouts, edit texts directly on the canvas, select templates, and chat with our Gemini-powered design AI.",
                      align: "center",
                      style: { fontSize: "14px", color: "#475569", padding: "10px 0" }
                    }
                  },
                  {
                    id: `btn-${Date.now()}`,
                    type: "button",
                    content: {
                      text: "Read Release Notes",
                      url: "#",
                      align: "center",
                      style: { backgroundColor: "#0284c7", textColor: "#ffffff", borderRadius: 6, padding: "10px 20px" }
                    }
                  }
                ]
              }
            ]
          },
          {
            id: `sec-${Date.now()}-split`,
            backgroundColor: "#ffffff",
            backgroundImage: "",
            padding: { top: 20, bottom: 20, left: 20, right: 20 },
            margin: { top: 0, bottom: 10 },
            borderRadius: 8,
            shadow: "none",
            visibility: "all",
            columns: [
              {
                id: `col-${Date.now()}-split-1`,
                width: "50%",
                blocks: [
                  {
                    id: `heading-${Date.now()}-c1`,
                    type: "heading",
                    content: {
                      text: "1. Canva Layouts",
                      level: "h3",
                      align: "left",
                      style: { fontSize: "16px", fontWeight: "700", color: "#0f172a", padding: "5px 0" }
                    }
                  },
                  {
                    id: `text-${Date.now()}-c1`,
                    type: "text",
                    content: {
                      text: "Zoom your design stage, align elements, and configure margins with complete control.",
                      align: "left",
                      style: { fontSize: "13px", color: "#4b5563", padding: "5px 0" }
                    }
                  }
                ]
              },
              {
                id: `col-${Date.now()}-split-2`,
                width: "50%",
                blocks: [
                  {
                    id: `heading-${Date.now()}-c2`,
                    type: "heading",
                    content: {
                      text: "2. Inline Typing",
                      level: "h3",
                      align: "left",
                      style: { fontSize: "16px", fontWeight: "700", color: "#0f172a", padding: "5px 0" }
                    }
                  },
                  {
                    id: `text-${Date.now()}-c2`,
                    type: "text",
                    content: {
                      text: "Select a block and edit texts directly on the staging canvas. Zero settings friction.",
                      align: "left",
                      style: { fontSize: "13px", color: "#4b5563", padding: "5px 0" }
                    }
                  }
                ]
              }
            ]
          },
          {
            id: `sec-${Date.now()}-footer`,
            backgroundColor: "#ffffff",
            backgroundImage: "",
            padding: { top: 20, bottom: 20, left: 20, right: 20 },
            margin: { top: 0, bottom: 0 },
            borderRadius: 8,
            shadow: "none",
            visibility: "all",
            columns: [
              {
                id: `col-${Date.now()}-foot`,
                width: "100%",
                blocks: [
                  {
                    id: `social-${Date.now()}`,
                    type: "social",
                    content: {
                      platforms: [
                        { name: "Twitter", url: "#", icon: "https://cdn-icons-png.flaticon.com/512/3256/3256013.png" },
                        { name: "LinkedIn", url: "#", icon: "https://cdn-icons-png.flaticon.com/512/174/174857.png" }
                      ],
                      align: "center",
                      size: "20"
                    }
                  },
                  {
                    id: `foot-${Date.now()}`,
                    type: "footer",
                    content: {
                      text: "© 2026 Monthly Digest. All rights reserved.",
                      unsubText: "Changed your mind? Click below to unsubscribe.",
                      align: "center"
                    }
                  }
                ]
              }
            ]
          }
        ]
      };
    } else if (presetName === "product-launch") {
      targetData = {
        version: "1.0",
        globalSettings: {
          ...dragDropData.globalSettings,
          emailWidth: 600,
          backgroundColor: "#fafafa",
          contentBackgroundColor: "#ffffff",
        },
        sections: [
          {
            id: `sec-${Date.now()}-head`,
            backgroundColor: "#ffffff",
            backgroundImage: "",
            padding: { top: 20, bottom: 10, left: 25, right: 25 },
            margin: { top: 0, bottom: 5 },
            borderRadius: 8,
            shadow: "none",
            visibility: "all",
            columns: [
              {
                id: `col-${Date.now()}-head`,
                width: "100%",
                blocks: [
                  {
                    id: `logo-${Date.now()}`,
                    type: "logo",
                    content: {
                      url: "https://placehold.co/150x50?text=Showcase",
                      alt: "Showcase Logo",
                      align: "center",
                      link: "#",
                      height: "35"
                    }
                  }
                ]
              }
            ]
          },
          {
            id: `sec-${Date.now()}-body`,
            backgroundColor: "#ffffff",
            backgroundImage: "",
            padding: { top: 20, bottom: 30, left: 25, right: 25 },
            margin: { top: 0, bottom: 10 },
            borderRadius: 8,
            shadow: "none",
            visibility: "all",
            columns: [
              {
                id: `col-${Date.now()}-body`,
                width: "100%",
                blocks: [
                  {
                    id: `heading-${Date.now()}`,
                    type: "heading",
                    content: {
                      text: "Meet the Smartwatch Pro.",
                      level: "h2",
                      align: "center",
                      style: { fontSize: "28px", fontWeight: "800", color: "#18181b", padding: "10px 0" }
                    }
                  },
                  {
                    id: `img-${Date.now()}`,
                    type: "image",
                    content: {
                      url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
                      alt: "Smartwatch Product Photo",
                      align: "center",
                      rounded: 12,
                      padding: "15px 0",
                      link: "#",
                      width: "100%"
                    }
                  },
                  {
                    id: `text-${Date.now()}`,
                    type: "text",
                    content: {
                      text: "A masterpiece of engineering and style. Complete fitness tracker, LTE notifications, and up to 7 days of continuous battery life. Made for high performers.",
                      align: "center",
                      style: { fontSize: "14px", color: "#52525b", padding: "10px 0" }
                    }
                  },
                  { id: `spacer-${Date.now()}`, type: "spacer", content: { height: 10 } },
                  {
                    id: `btn-${Date.now()}`,
                    type: "button",
                    content: {
                      text: "Shop Pre-order (Save 20%)",
                      url: "#",
                      align: "center",
                      style: { backgroundColor: "#ea580c", textColor: "#ffffff", borderRadius: 30, padding: "12px 30px" }
                    }
                  }
                ]
              }
            ]
          },
          {
            id: `sec-${Date.now()}-foot`,
            backgroundColor: "#ffffff",
            backgroundImage: "",
            padding: { top: 20, bottom: 20, left: 25, right: 25 },
            margin: { top: 0, bottom: 0 },
            borderRadius: 8,
            shadow: "none",
            visibility: "all",
            columns: [
              {
                id: `col-${Date.now()}-foot`,
                width: "100%",
                blocks: [
                  {
                    id: `footer-${Date.now()}`,
                    type: "footer",
                    content: {
                      text: "© 2026 Showcase Inc. 555 Tech Way, Cupertino, CA.",
                      unsubText: "Unsubscribe from product updates below.",
                      align: "center"
                    }
                  }
                ]
              }
            ]
          }
        ]
      };
    } else {
      return;
    }

    updateStateAndHistory(targetData, `Preset: ${presetName.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}`);
    setSelectedSectionId(null);
    setSelectedBlock(null);
    toast.success("Applied template preset successfully!");
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-50 select-none">
      
      {/* ─── TOP TOOLBAR ─── */}
      <header className="h-14 border-b border-zinc-200 bg-white flex items-center justify-between px-4 shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              if (hasUnsavedChanges) {
                const ok = await confirmDialog({
                  title: "Discard unsaved changes?",
                  description: "You have unsaved changes that will be lost if you exit now.",
                  confirmText: "Exit anyway",
                });
                if (ok) {
                  router.push("/dashboard/templates");
                }
              } else {
                router.push("/dashboard/templates");
              }
            }}
            className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer"
            title="Back to Templates"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value);
                setHasUnsavedChanges(true);
              }}
              className="bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-indigo-500 focus:outline-none text-sm font-bold text-zinc-800 px-1 py-0.5 max-w-xs transition-colors"
              placeholder="Template Name"
            />
            
            <select
              value={templateCategoryId}
              onChange={(e) => {
                setTemplateCategoryId(e.target.value);
                setHasUnsavedChanges(true);
              }}
              className="h-7 rounded border border-zinc-200 bg-zinc-50 text-[10px] text-zinc-600 font-semibold px-2 cursor-pointer focus:outline-none mr-1"
            >
              <option value="">No Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Canvas Width Resizer (Canva-style Resize control) */}
            <div className="relative group/resize flex items-center">
              <button
                className="h-7 rounded border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-[10px] text-zinc-650 font-bold px-2.5 py-0.5 flex items-center gap-1 cursor-pointer transition-colors"
                title="Resize Canvas Width"
              >
                <span>Resize: {dragDropData.globalSettings.emailWidth}px</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              <div className="hidden group-hover/resize:block absolute top-full left-0 mt-1 w-44 bg-white border border-zinc-200 rounded-xl shadow-xl p-2.5 z-[999] select-none text-[11px] font-sans">
                <h5 className="font-bold text-zinc-700 mb-1.5 uppercase text-[9px] tracking-wider">Canvas Presets</h5>
                <div className="flex flex-col gap-1">
                  {[
                    { label: "Mobile Outreach", width: 480 },
                    { label: "Standard Newsletter", width: 600 },
                    { label: "Wide Promotion", width: 700 },
                  ].map((preset) => (
                    <button
                      key={preset.width}
                      onClick={() => {
                        const copy = { ...dragDropData };
                        copy.globalSettings.emailWidth = preset.width;
                        updateStateAndHistory(copy, `Resize width: ${preset.width}px`);
                        toast.success(`Resized canvas to ${preset.width}px`);
                      }}
                      className="w-full text-left p-1.5 rounded hover:bg-zinc-50 text-zinc-650 hover:text-zinc-950 font-semibold cursor-pointer border-0 bg-transparent"
                    >
                      {preset.label} ({preset.width}px)
                    </button>
                  ))}
                </div>
                
                <div className="w-full h-px bg-zinc-150 my-2" />
                
                <div className="space-y-1">
                  <span className="font-bold text-zinc-450 uppercase text-[8px] tracking-wider block">Custom Width (px)</span>
                  <input
                    type="number"
                    value={dragDropData.globalSettings.emailWidth}
                    onChange={(e) => {
                      const val = Math.max(320, Math.min(1200, Number(e.target.value) || 600));
                      const copy = { ...dragDropData };
                      copy.globalSettings.emailWidth = val;
                      updateStateAndHistory(copy, `Custom Resize: ${val}px`);
                    }}
                    className="w-full h-7 px-2 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 bg-zinc-50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Undo/Redo/Autosave status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-zinc-200 rounded-lg p-0.5 bg-zinc-50 shrink-0">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-1 rounded hover:bg-white hover:shadow-sm text-zinc-500 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-1 rounded hover:bg-white hover:shadow-sm text-zinc-500 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            
            <div className="w-px h-3 bg-zinc-200 mx-1" />
            
            <button
              onClick={() => setShowGridlines(!showGridlines)}
              className={cn(
                "p-1 rounded transition-all cursor-pointer border-0 bg-transparent",
                showGridlines ? "text-indigo-650 bg-white shadow-sm" : "text-zinc-400 hover:bg-zinc-150"
              )}
              title={showGridlines ? "Hide Structure Gridlines" : "Show Structure Gridlines"}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>

            {/* Visual History Stack Dropdown */}
            <div className="relative group/history flex items-center">
              <button
                className="p-1 rounded text-zinc-450 hover:text-zinc-700 hover:bg-zinc-150 cursor-pointer border-0 bg-transparent flex items-center animate-in fade-in"
                title="Design Version History"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              <div className="hidden group-hover/history:block absolute top-full right-0 mt-1 w-64 bg-white border border-zinc-200 rounded-xl shadow-xl p-3 z-[999] select-none text-[11px] max-h-72 overflow-y-auto">
                <h5 className="font-bold text-zinc-700 mb-2 uppercase text-[9px] tracking-wider">Design History ({history.length} steps)</h5>
                <div className="flex flex-col gap-1">
                  {historyActions.map((act, index) => {
                    const isCurrent = index === historyIndex;
                    return (
                      <button
                        key={index}
                        onClick={() => jumpToHistory(index)}
                        className={cn(
                          "w-full text-left p-1.5 rounded transition-all cursor-pointer border-0 text-[10px] flex items-center justify-between font-semibold",
                          isCurrent
                            ? "bg-indigo-50 text-indigo-750 font-bold border-l-2 border-indigo-500 rounded-l-none"
                            : "bg-transparent text-zinc-550 hover:bg-zinc-50 hover:text-zinc-800"
                        )}
                      >
                        <span className="truncate max-w-[180px]">{act}</span>
                        <span className="text-[8px] opacity-60">Step {index}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <span className="text-[10px] text-zinc-400 font-bold tracking-wide uppercase select-none">
            {hasUnsavedChanges ? "● Unsaved Changes" : "✓ Saved"}
          </span>
        </div>

        {/* Previews and Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-zinc-200 rounded-lg p-0.5 bg-zinc-50 shrink-0">
            <button
              onClick={() => setPreviewMode(previewMode === "desktop" ? null : "desktop")}
              className={cn(
                "p-1.5 rounded transition-all cursor-pointer",
                previewMode === "desktop" ? "bg-white text-indigo-600 shadow-sm border border-zinc-150" : "text-zinc-500 hover:text-zinc-700"
              )}
              title="Toggle Desktop Preview"
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPreviewMode(previewMode === "tablet" ? null : "tablet")}
              className={cn(
                "p-1.5 rounded transition-all cursor-pointer",
                previewMode === "tablet" ? "bg-white text-indigo-600 shadow-sm border border-zinc-150" : "text-zinc-500 hover:text-zinc-700"
              )}
              title="Toggle Tablet Preview"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPreviewMode(previewMode === "mobile" ? null : "mobile")}
              className={cn(
                "p-1.5 rounded transition-all cursor-pointer",
                previewMode === "mobile" ? "bg-white text-indigo-600 shadow-sm border border-zinc-150" : "text-zinc-500 hover:text-zinc-700"
              )}
              title="Toggle Mobile Preview"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Keyboard Shortcuts Button */}
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="h-8 w-8 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 flex items-center justify-center cursor-pointer transition-colors shadow-sm"
            title="Keyboard Shortcuts Cheatsheet"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
              <line x1="6" y1="8" x2="6" y2="8" />
              <line x1="10" y1="8" x2="10" y2="8" />
              <line x1="14" y1="8" x2="14" y2="8" />
              <line x1="18" y1="8" x2="18" y2="8" />
              <line x1="6" y1="12" x2="6" y2="12" />
              <line x1="10" y1="12" x2="10" y2="12" />
              <line x1="14" y1="12" x2="14" y2="12" />
              <line x1="18" y1="12" x2="18" y2="12" />
              <line x1="7" y1="16" x2="17" y2="16" />
            </svg>
          </button>

          <button
            onClick={() => setIsTestEmailOpen(true)}
            className="h-8 px-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
          >
            <Send className="w-3 h-3 text-zinc-500" />
            Test Send
          </button>

          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="h-8 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm shadow-indigo-100 border border-indigo-700/10"
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save Workspace
          </button>
        </div>
      </header>

      {/* Subject Line Bar */}
      <div className="h-10 border-b border-zinc-150 bg-zinc-50/70 flex items-center px-4 gap-2 shrink-0 z-40">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider select-none shrink-0">Subject Line:</span>
        <input
          type="text"
          value={templateSubject}
          onChange={(e) => {
            setTemplateSubject(e.target.value);
            setHasUnsavedChanges(true);
          }}
          className="flex-1 bg-transparent border-0 outline-none text-xs font-medium text-zinc-700 placeholder-zinc-400"
          placeholder="Outreach Email Subject (e.g. Quick question for {{firstName}})"
        />
        <span className="text-[10px] text-zinc-400 font-semibold bg-white border border-zinc-200 rounded px-1.5 py-0.5">
          Dynamic tags active
        </span>
      </div>

      {/* ─── MAIN WORKSPACE CONTENT ─── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">

        {/* ─── LEFT SIDEBAR ─── */}
        {!previewMode && (
          <div className="flex shrink-0 h-full border-r border-zinc-200 bg-white">
            {/* Canva-Style Vertical Strip Navigation */}
            <div className="w-16 bg-zinc-900 flex flex-col items-center py-4 gap-4 text-white shrink-0 select-none">
              {[
                { tab: "templates", label: "Templates", icon: <LayoutTemplate className="w-5 h-5" /> },
                { tab: "blocks", label: "Elements", icon: <Plus className="w-5 h-5" /> },
                { tab: "assets", label: "Uploads", icon: <ImageIcon className="w-5 h-5" /> },
                { tab: "ai", label: "AI Design", icon: <Sparkles className="w-5 h-5" /> },
                { tab: "styles", label: "Styles", icon: <Palette className="w-5 h-5" /> },
              ].map((item) => {
                const isActive = leftSidebarTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => setLeftSidebarTab(item.tab as any)}
                    className={cn(
                      "w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-150 border-0 bg-transparent text-[9px] font-bold outline-none",
                      isActive
                        ? "bg-zinc-800 text-indigo-400"
                        : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-800/40"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Panel Details */}
            <aside className="w-60 bg-white flex flex-col h-full overflow-hidden select-none border-0">
              <div className="h-12 border-b border-zinc-200 flex items-center px-4 shrink-0 justify-between bg-zinc-50/50">
                <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                  {leftSidebarTab === "templates" && "Layout Presets"}
                  {leftSidebarTab === "blocks" && "Elements Blocks"}
                  {leftSidebarTab === "assets" && "Media Assets"}
                  {leftSidebarTab === "ai" && "Gemini AI Assist"}
                  {leftSidebarTab === "styles" && "Brand Style Kits"}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 select-none min-h-0">
                {leftSidebarTab === "templates" && (
                  <div className="space-y-4">
                    <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3 space-y-1">
                      <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Full Templates</h4>
                      <p className="text-[9px] text-zinc-400 font-semibold leading-normal">
                        Select a layout block to start your design. This overwrites the canvas stage.
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {[
                        {
                          preset: "cold-outreach",
                          title: "Cold Sales Outreach",
                          desc: "Clean outreach template containing centered logo, heading banner, text values, button link, and full signature.",
                          color: "bg-indigo-50 text-indigo-700 border-indigo-150"
                        },
                        {
                          preset: "newsletter",
                          title: "Product Newsletter",
                          desc: "Newsletter layout featuring header layout, showcase image banner, 2-column feature blocks, and social anchors.",
                          color: "bg-emerald-50 text-emerald-700 border-emerald-150"
                        },
                        {
                          preset: "product-launch",
                          title: "Promo Showcase",
                          desc: "Launch your next update with large bold headlines, full width graphics, text body, and pill CTA buttons.",
                          color: "bg-amber-50 text-amber-700 border-amber-150"
                        }
                      ].map((t) => (
                        <button
                          key={t.preset}
                          onClick={() => applyTemplatePreset(t.preset)}
                          className="w-full p-3.5 border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-350 rounded-2xl text-left cursor-pointer transition-all shadow-sm hover:shadow flex flex-col gap-1.5"
                        >
                          <div className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-bold self-start border uppercase tracking-wider", t.color)}>
                            {t.title}
                          </div>
                          <p className="text-[9.5px] text-zinc-500 font-semibold leading-relaxed">
                            {t.desc}
                          </p>
                          <span className="text-[9px] font-bold text-indigo-650 mt-1 hover:underline">Apply Preset Template →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {leftSidebarTab === "blocks" && (
                  <>
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Drag Basic Blocks</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { type: "heading", label: "Heading", icon: <HeadingIcon className="w-4 h-4" /> },
                          { type: "text", label: "Text", icon: <Type className="w-4 h-4" /> },
                          { type: "image", label: "Image", icon: <ImageIcon className="w-4 h-4" /> },
                          { type: "button", label: "Button", icon: <Maximize2 className="w-4 h-4" /> },
                          { type: "logo", label: "Brand Logo", icon: <Sparkles className="w-4 h-4" /> },
                          { type: "divider", label: "Divider", icon: <X className="w-4 h-4 rotate-45" /> },
                          { type: "spacer", label: "Spacer", icon: <ChevronDown className="w-4 h-4" /> },
                          { type: "social", label: "Socials", icon: <Smile className="w-4 h-4" /> },
                          { type: "footer", label: "Footer", icon: <Info className="w-4 h-4" /> },
                          { type: "signature", label: "Signature", icon: <Calendar className="w-4 h-4" /> },
                          { type: "html", label: "Custom HTML", icon: <Code className="w-4 h-4" /> },
                        ].map((b) => (
                          <div
                            key={b.type}
                            draggable
                            onDragStart={(e) => handleDragStart(e, b.type)}
                            className="p-3 bg-zinc-50 border border-zinc-200 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-xl flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing transition-all group duration-150"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 group-hover:text-indigo-600 group-hover:border-indigo-100 shadow-sm transition-colors">
                              {b.icon}
                            </div>
                            <span className="text-[11px] font-semibold text-zinc-650 group-hover:text-indigo-900 text-center">{b.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Visual Layout Presets</h4>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => addAdvancedPreset("hero-banner")}
                          className="w-full p-3 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl text-left cursor-pointer flex items-center gap-3 transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h5 className="text-[11px] font-bold text-zinc-800">Hero Banner Callout</h5>
                            <p className="text-[9px] text-zinc-400 font-medium">Dark background, heading, copy & CTA button.</p>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => addAdvancedPreset("product-card")}
                          className="w-full p-3 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl text-left cursor-pointer flex items-center gap-3 transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h5 className="text-[11px] font-bold text-zinc-800">Product Card</h5>
                            <p className="text-[9px] text-zinc-400 font-medium">Image, title, description, and buy button.</p>
                          </div>
                        </button>
 
                        <button
                          onClick={() => addAdvancedPreset("quote")}
                          className="w-full p-3 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl text-left cursor-pointer flex items-center gap-3 transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <Type className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h5 className="text-[11px] font-bold text-zinc-800">Testimonial Quote Box</h5>
                            <p className="text-[9px] text-zinc-400 font-medium">Quote box with client signature block.</p>
                          </div>
                        </button>
                      </div>
                    </div>
 
                    <div className="space-y-2 pt-2">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Quick Multi-Columns</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => addSection(1)}
                          className="p-2 border border-zinc-200 hover:border-zinc-450 bg-white hover:bg-zinc-50 text-[10px] font-bold text-zinc-705 rounded-lg cursor-pointer text-center"
                        >
                          1 Col
                        </button>
                        <button
                          onClick={() => addSection(2)}
                          className="p-2 border border-zinc-200 hover:border-zinc-450 bg-white hover:bg-zinc-50 text-[10px] font-bold text-zinc-705 rounded-lg cursor-pointer text-center"
                        >
                          2 Cols
                        </button>
                        <button
                          onClick={() => addSection(3)}
                          className="p-2 border border-zinc-200 hover:border-zinc-450 bg-white hover:bg-zinc-50 text-[10px] font-bold text-zinc-705 rounded-lg cursor-pointer text-center"
                        >
                          3 Cols
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {leftSidebarTab === "assets" && (
                  /* ASSET MANAGER */
                  <div className="space-y-4 flex flex-col h-full min-h-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleUploadClick}
                        className="flex-1 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <FileUp className="w-3.5 h-3.5" />
                        Upload Image
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
 
                    <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 shrink-0">
                      <Search className="w-3 h-3 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Search assets..."
                        value={assetSearchQuery}
                        onChange={(e) => setAssetSearchQuery(e.target.value)}
                        className="bg-transparent border-0 outline-none text-[10px] w-full text-zinc-700 placeholder-zinc-400 font-medium"
                      />
                    </div>
 
                    <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-2.5">
                      {isLoadingAssets ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                        </div>
                      ) : assets.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {assets.map((asset) => (
                            <div
                              key={asset.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("assetUrl", asset.url);
                              }}
                              className="group relative aspect-square bg-zinc-50 border border-zinc-150 rounded-lg overflow-hidden flex items-center justify-center select-none cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors"
                            >
                              <img
                                src={asset.url}
                                alt={asset.name}
                                className="object-cover w-full h-full"
                              />
                              
                              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    if (selectedBlock) {
                                      const { sectionId, colId, blockId } = selectedBlock;
                                      const block = findBlock(sectionId, colId, blockId);
                                      if (block && (block.type === "image" || block.type === "logo")) {
                                        updateBlockContent(sectionId, colId, blockId, {
                                          ...block.content,
                                          url: asset.url,
                                        });
                                      } else if (block && block.type === "signature") {
                                        updateBlockContent(sectionId, colId, blockId, {
                                          ...block.content,
                                          photo: asset.url,
                                        });
                                      }
                                      toast.success("Applied asset to selected block!");
                                    } else {
                                      navigator.clipboard.writeText(asset.url);
                                      toast.info("Copied asset link to clipboard!");
                                    }
                                  }}
                                  className="h-6 px-2 rounded bg-white hover:bg-zinc-50 text-[10px] font-semibold text-zinc-900 shadow cursor-pointer border-0"
                                >
                                  {selectedBlock ? "Insert" : "Copy Url"}
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteAsset(asset.id)}
                                  className="p-1 rounded bg-red-650 hover:bg-red-500 text-white shadow cursor-pointer border-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10">
                          <FolderOpen className="w-5 h-5 text-zinc-300 mx-auto mb-2" />
                          <p className="text-[10px] text-zinc-400 font-semibold">No assets found</p>
                        </div>
                      )}
                    </div>
 
                    <div className="border-t border-zinc-155 pt-2 text-[9px] font-bold text-zinc-400 flex flex-col gap-1 shrink-0">
                      <div className="flex justify-between">
                        <span>Quota</span>
                        <span>{Math.round(storageUsage / 1024 / 1024 * 100) / 100} / 50 MB</span>
                      </div>
                      <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-650 h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (storageUsage / (50 * 1024 * 1024)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {leftSidebarTab === "ai" && (
                  /* AI DESIGN ASSISTANT CHAT */
                  <div className="space-y-4 flex flex-col h-full min-h-0 select-text">
                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 space-y-2">
                      <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                        Gemini AI Designer
                      </h4>
                      <p className="text-[10.5px] text-indigo-800 leading-relaxed font-semibold">
                        Instruct Gemini to edit fonts, styles, text, spacing, CTAs, and layout!
                      </p>
                    </div>
 
                    <div className="space-y-2.5">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Instruction Prompt</label>
                      <textarea
                        placeholder="e.g. Set all headings to Bold and red, and button bg to green"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-indigo-300 focus:outline-none text-[11px] text-zinc-800 font-semibold resize-none placeholder-zinc-400"
                        rows={4}
                      />
                      
                      <button
                        onClick={handleAiEditLayout}
                        disabled={isEditingAi || !aiPrompt.trim()}
                        className="w-full h-8 rounded-lg bg-indigo-650 hover:bg-indigo-600 disabled:opacity-40 text-xs font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm border-0"
                      >
                        {isEditingAi ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> Designing...</>
                        ) : (
                          <><Sparkles className="w-3 h-3" /> Customize with AI</>
                        )}
                      </button>
                    </div>
 
                    <div className="bg-zinc-55 rounded-xl p-3 text-[9.5px] text-zinc-500 font-semibold space-y-1.5 leading-relaxed border border-zinc-150">
                      <span className="text-zinc-700 block font-bold">Try asking AI:</span>
                      <ul className="list-disc pl-3.5 space-y-1">
                        <li>"Write sales intro and replace content"</li>
                        <li>"Make button corner radius 15px"</li>
                        <li>"Set canvas width to 620px"</li>
                      </ul>
                    </div>
                  </div>
                )}

                {leftSidebarTab === "styles" && (
                  /* STYLE KITS: PALETTES AND FONT PAIRINGS */
                  <div className="space-y-6 flex flex-col h-full min-h-0 select-none">
                    <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3 space-y-1">
                      <h4 className="text-[10px] font-bold text-zinc-650 uppercase tracking-wider">Style Kits</h4>
                      <p className="text-[9px] text-zinc-400 font-semibold leading-normal">
                        Apply curated color schemes and typography designs instantly across your template.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Color Palettes</h4>
                      <div className="flex flex-col gap-2.5">
                        {[
                          {
                            name: "Warm Sunset",
                            colors: ["#fff7ed", "#ffedd5", "#f97316", "#1e293b"], // bg, content, button, text
                            labels: ["Bg", "Card", "Btn", "Text"]
                          },
                          {
                            name: "Forest Fresh",
                            colors: ["#f0fdf4", "#ffffff", "#16a34a", "#14532d"],
                            labels: ["Bg", "Card", "Btn", "Text"]
                          },
                          {
                            name: "Ocean Breeze",
                            colors: ["#f0f9ff", "#ffffff", "#0284c7", "#0f172a"],
                            labels: ["Bg", "Card", "Btn", "Text"]
                          },
                          {
                            name: "Midnight Tech",
                            colors: ["#0f172a", "#1e293b", "#38bdf8", "#f8fafc"],
                            labels: ["Bg", "Card", "Btn", "Text"]
                          },
                          {
                            name: "Soft Pastels",
                            colors: ["#faf5ff", "#ffffff", "#c084fc", "#3b0764"],
                            labels: ["Bg", "Card", "Btn", "Text"]
                          },
                          {
                            name: "Elegant Charcoal",
                            colors: ["#f4f4f5", "#ffffff", "#18181b", "#27272a"],
                            labels: ["Bg", "Card", "Btn", "Text"]
                          }
                        ].map((pal) => (
                          <button
                            key={pal.name}
                            onClick={() => {
                              const copy = JSON.parse(JSON.stringify(dragDropData));
                              copy.globalSettings.backgroundColor = pal.colors[0];
                              copy.globalSettings.contentBackgroundColor = pal.colors[1];
                              copy.globalSettings.buttonStyle.backgroundColor = pal.colors[2];
                              copy.globalSettings.buttonStyle.textColor = pal.colors[0] === "#0f172a" ? "#0f172a" : "#ffffff";
                              copy.globalSettings.brandColors = [pal.colors[2], pal.colors[3], ...copy.globalSettings.brandColors.slice(2)];
                              
                              // Propagate background colors to sections that match old default
                              copy.sections.forEach((sec: any) => {
                                if (sec.backgroundColor === "#ffffff" || sec.backgroundColor === "#f4f4f5" || sec.backgroundColor === "#0f172a" || sec.backgroundColor === "#1e293b") {
                                  sec.backgroundColor = pal.colors[1];
                                }
                                // Update text and heading colors inside column blocks
                                sec.columns.forEach((col: any) => {
                                  col.blocks.forEach((block: any) => {
                                    if (block.type === "heading" || block.type === "text") {
                                      if (!block.content.style.color || block.content.style.color === "#111827" || block.content.style.color === "#1f2937" || block.content.style.color === "#4b5563" || block.content.style.color === "#ffffff" || block.content.style.color === "#f8fafc") {
                                        block.content.style.color = pal.colors[3];
                                      }
                                    }
                                    if (block.type === "button") {
                                      block.content.style.backgroundColor = pal.colors[2];
                                      block.content.style.textColor = pal.colors[1] === "#ffffff" ? "#ffffff" : pal.colors[0];
                                    }
                                  });
                                });
                              });
                              updateStateAndHistory(copy, `Apply Palette: ${pal.name}`);
                              toast.success(`Applied ${pal.name} Style Kit!`);
                            }}
                            className="w-full p-2.5 border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-350 rounded-xl text-left cursor-pointer transition-all flex flex-col gap-1.5 shadow-xs"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-zinc-750">{pal.name}</span>
                            </div>
                            <div className="flex items-center rounded-lg overflow-hidden h-7 border border-zinc-150">
                              {pal.colors.map((c, cIdx) => (
                                <div
                                  key={cIdx}
                                  className="flex-1 h-full flex items-center justify-center text-[7px] font-bold select-none"
                                  style={{
                                    backgroundColor: c,
                                    color: isBgDark(c) ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)"
                                  }}
                                  title={`${pal.labels[cIdx]}: ${c}`}
                                >
                                  {pal.labels[cIdx]}
                                </div>
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-zinc-150">
                      <h4 className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Typography Systems</h4>
                      <div className="flex flex-col gap-2">
                        {[
                          {
                            name: "Outfit & Inter (Modern)",
                            font: "'Outfit', 'Inter', sans-serif",
                            desc: "Clean geometrical headlines with clean body sans-serif font."
                          },
                          {
                            name: "Space Grotesk & DM Sans (Tech)",
                            font: "'Space Grotesk', 'DM Sans', sans-serif",
                            desc: "Tech style, modern monospaced vibes and highly readable body."
                          },
                          {
                            name: "Playfair & Roboto (Editorial)",
                            font: "'Playfair Display', 'Roboto', serif",
                            desc: "Classic serif headers combined with structured body copy."
                          },
                          {
                            name: "Georgia & Arial (Classic)",
                            font: "Georgia, Arial, sans-serif",
                            desc: "Traditional email formatting, highly compatible across clients."
                          }
                        ].map((fontPair) => (
                          <button
                            key={fontPair.name}
                            onClick={() => {
                              const copy = { ...dragDropData };
                              copy.globalSettings.fontFamily = fontPair.font;
                              updateStateAndHistory(copy, `Change Font: ${fontPair.name}`);
                              toast.success(`Font updated to ${fontPair.name}!`);
                            }}
                            className="w-full p-2.5 border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-350 rounded-xl text-left cursor-pointer transition-all flex flex-col gap-1 shadow-xs"
                          >
                            <span className="text-[10px] font-bold text-zinc-750 block" style={{ fontFamily: fontPair.font }}>
                              {fontPair.name}
                            </span>
                            <span className="text-[8.5px] text-zinc-400 font-semibold">{fontPair.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        {/* ─── CENTER CANVAS ─── */}
        <main
          className="flex-1 overflow-auto flex justify-center items-start py-8 px-4 relative transition-all duration-200 border-0"
          style={{
            backgroundColor: dragDropData.globalSettings.backgroundColor || "#f4f4f5",
            backgroundImage: showGridlines ? `radial-gradient(${
              isBgDark(dragDropData.globalSettings.backgroundColor || "#f4f4f5") 
                ? "rgba(255,255,255,0.12)" 
                : "rgba(0,0,0,0.05)"
            } 1.5px, transparent 1.5px)` : "none",
            backgroundSize: "20px 20px",
          }}
        >
          
          {previewMode ? (
            <div className="flex flex-col items-center gap-4 w-full max-h-[90vh]">
              <div className="flex items-center gap-3 bg-white px-4 py-2 border border-zinc-200 rounded-2xl shadow-sm select-none shrink-0">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Live HTML View</span>
                <div className="w-px h-3 bg-zinc-200" />
                <button
                  onClick={() => setPreviewTheme(previewTheme === "light" ? "dark" : "light")}
                  className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 cursor-pointer"
                >
                  Theme: {previewTheme.toUpperCase()}
                </button>
              </div>

              <div
                className={cn(
                  "border border-zinc-200 overflow-hidden shadow-2xl rounded-2xl transition-all duration-300 bg-white",
                  previewMode === "desktop" ? "w-full max-w-3xl h-[650px]" : previewMode === "tablet" ? "w-[500px] h-[550px]" : "w-80 h-[500px]"
                )}
                style={{
                  backgroundColor: previewTheme === "dark" ? "#1e293b" : "#ffffff",
                }}
              >
                <iframe
                  srcDoc={renderDragDropToHtml(dragDropData)}
                  title="Canvas Live HTML Preview"
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          ) : (
            /* VISUAL CANVAS STAGING GROUND */
            <div
              style={{
                width: "100%",
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.15s ease-out",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                className="w-full bg-white border border-zinc-200 rounded-2xl shadow-sm p-5 pb-16 min-h-[500px] transition-all relative shrink-0"
                style={{
                  fontFamily: dragDropData.globalSettings.fontFamily,
                  backgroundColor: dragDropData.globalSettings.contentBackgroundColor,
                  maxWidth: `${dragDropData.globalSettings.emailWidth}px`,
                }}
                onDragOver={handleCanvasDragOver}
              >
              <div className="absolute top-1 right-2 text-[9px] font-semibold text-zinc-300 pointer-events-none select-none">
                Canvas Email Width: {dragDropData.globalSettings.emailWidth}px
              </div>

              {/* Loop through sections */}
              {dragDropData.sections.map((section, sIdx) => {
                const isSelected = selectedSectionId === section.id;
                
                return (
                  <div
                    key={section.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSectionId(section.id);
                      setSelectedBlock(null);
                      setRightPanelTab("style");
                    }}
                    className={cn(
                      "relative rounded-xl border border-transparent my-2 transition-all group/section hover:border-indigo-300",
                      isSelected && "border-indigo-500 shadow-md ring-1 ring-indigo-500/20"
                    )}
                    style={{
                      backgroundColor: section.backgroundColor,
                      borderRadius: `${section.borderRadius}px`,
                      marginTop: `${section.margin.top}px`,
                      marginBottom: `${section.margin.bottom}px`,
                      padding: `${section.padding.top}px ${section.padding.right}px ${section.padding.bottom}px ${section.padding.left}px`,
                    }}
                  >
                    
                    {/* Section controls */}
                    <div className="absolute -top-3.5 right-4 z-40 bg-indigo-600 text-white rounded-md text-[9px] font-bold px-2 py-1 shadow hidden group-hover/section:flex hover:flex items-center gap-1.5 select-none">
                      <span className="opacity-80">Section</span>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); moveSection(section.id, "up"); }}
                        className="hover:bg-indigo-700 p-0.5 rounded cursor-pointer"
                      >
                        <ChevronUp className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveSection(section.id, "down"); }}
                        className="hover:bg-indigo-700 p-0.5 rounded cursor-pointer"
                      >
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateSection(section.id); }}
                        className="hover:bg-indigo-700 p-0.5 rounded cursor-pointer"
                      >
                        <Copy className="w-2.5 h-2.5" />
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSectionLock(section.id); }}
                        className="hover:bg-indigo-700 p-0.5 rounded cursor-pointer"
                      >
                        {section.isLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSectionHide(section.id); }}
                        className="hover:bg-indigo-700 p-0.5 rounded cursor-pointer"
                      >
                        {section.isHidden ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                        className="hover:bg-red-700 p-0.5 rounded cursor-pointer bg-red-650/80"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {/* Columns representation */}
                    <div className="flex gap-4">
                      {section.columns.map((col) => (
                        <div
                          key={col.id}
                          className="flex-1 min-h-[80px] border border-dashed border-zinc-200 hover:border-indigo-200 rounded-lg p-1.5 transition-all relative"
                          style={{ width: col.width }}
                          onDragOver={handleCanvasDragOver}
                          onDrop={(e) => {
                            e.preventDefault();
                            const moveInfo = e.dataTransfer.getData("moveBlockInfo");
                            const newBlockType = e.dataTransfer.getData("newBlockType");
                            const assetUrl = e.dataTransfer.getData("assetUrl");
                            if (moveInfo) {
                              handleBlockDropMove(e, section.id, col.id, col.blocks.length);
                            } else if (newBlockType || assetUrl) {
                              handleDropNewBlock(e, section.id, col.id, col.blocks.length);
                            }
                          }}
                        >
                          
                          {/* Drop indicator before the first block */}
                          <DropSlot
                            sectionId={section.id}
                            colId={col.id}
                            index={0}
                            onBlockDropped={handleDropNewBlock}
                            onBlockMoved={handleBlockDropMove}
                          />

                          {/* List blocks in column with drop slot below each */}
                          {col.blocks.map((block, bIdx) => {
                            const isBlockSelected =
                              selectedBlock?.sectionId === section.id &&
                              selectedBlock?.colId === col.id &&
                              selectedBlock?.blockId === block.id;

                            return (
                              <React.Fragment key={block.id}>
                                 <div
                                  draggable={!isEditingText}
                                  onDragStart={(e) => handleBlockDragStart(e, section.id, col.id, block.id)}
                                  onDragOver={(e) => {
                                    if (
                                      e.dataTransfer.types.includes("assetUrl") &&
                                      (block.type === "image" || block.type === "logo" || block.type === "signature")
                                    ) {
                                      e.preventDefault();
                                    }
                                  }}
                                  onDragEnter={(e) => {
                                    if (
                                      e.dataTransfer.types.includes("assetUrl") &&
                                      (block.type === "image" || block.type === "logo" || block.type === "signature")
                                    ) {
                                      setDragOverBlockId(block.id);
                                    }
                                  }}
                                  onDragLeave={() => {
                                    setDragOverBlockId((prev) => (prev === block.id ? null : prev));
                                  }}
                                  onDrop={(e) => {
                                    const assetUrl = e.dataTransfer.getData("assetUrl");
                                    if (assetUrl) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setDragOverBlockId(null);
                                      if (block.type === "image" || block.type === "logo") {
                                        updateBlockContent(section.id, col.id, block.id, {
                                          ...block.content,
                                          url: assetUrl,
                                        });
                                        toast.success("Updated block image from asset!");
                                      } else if (block.type === "signature") {
                                        updateBlockContent(section.id, col.id, block.id, {
                                          ...block.content,
                                          photo: assetUrl,
                                        });
                                        toast.success("Updated signature photo from asset!");
                                      }
                                    }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBlock({ sectionId: section.id, colId: col.id, blockId: block.id });
                                    setSelectedSectionId(null);
                                    setRightPanelTab("style");
                                  }}
                                  className={cn(
                                    "relative p-2.5 my-1 border border-transparent rounded-lg cursor-grab active:cursor-grabbing hover:border-zinc-300 hover:bg-zinc-50/50 group/block transition-all duration-200",
                                    isBlockSelected && "border-indigo-500 bg-indigo-50/10 ring-1 ring-indigo-500/10",
                                    dragOverBlockId === block.id && "border-dashed border-indigo-500 bg-indigo-50/30 scale-[1.01] shadow-sm"
                                  )}
                                >
                                  <div className="absolute top-1.5 left-1.5 opacity-0 group-hover/block:opacity-40 pointer-events-none select-none text-[8px] font-bold">
                                    ⋮⋮
                                  </div>

                                  {isBlockSelected && (
                                    <div
                                      className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white border border-zinc-200 rounded-xl p-1 shadow-xl z-50 pointer-events-auto select-none scale-95 transition-all duration-150 animate-in fade-in slide-in-from-bottom-2 whitespace-nowrap"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {/* Drag grip handle */}
                                      <div
                                        draggable
                                        onDragStart={(e) => handleBlockDragStart(e, section.id, col.id, block.id)}
                                        className="p-1 hover:bg-zinc-100 rounded cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-650"
                                        title="Drag to reposition block"
                                      >
                                        <GripVertical className="w-3.5 h-3.5" />
                                      </div>

                                      <div className="w-px h-3.5 bg-zinc-200 mx-0.5" />

                                      {/* Text block controls */}
                                      {(block.type === "heading" || block.type === "text") && (
                                        <>
                                          {/* Decrement size */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const sizeNum = parseInt(block.content.style.fontSize) || (block.type === "heading" ? 22 : 14);
                                              const nextSize = `${Math.max(8, sizeNum - 1)}px`;
                                              updateBlockContent(section.id, col.id, block.id, {
                                                ...block.content,
                                                style: { ...block.content.style, fontSize: nextSize }
                                              });
                                            }}
                                            className="p-1 hover:bg-zinc-100 rounded text-zinc-600 font-bold border-0 bg-transparent cursor-pointer text-xs"
                                            title="Decrease Font Size"
                                          >
                                            A-
                                          </button>
                                          
                                          {/* Size display */}
                                          <span className="text-[10px] font-bold text-zinc-700 min-w-[28px] text-center">
                                            {block.content.style.fontSize || (block.type === "heading" ? "22px" : "14px")}
                                          </span>

                                          {/* Increment size */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const sizeNum = parseInt(block.content.style.fontSize) || (block.type === "heading" ? 22 : 14);
                                              const nextSize = `${Math.min(72, sizeNum + 1)}px`;
                                              updateBlockContent(section.id, col.id, block.id, {
                                                ...block.content,
                                                style: { ...block.content.style, fontSize: nextSize }
                                              });
                                            }}
                                            className="p-1 hover:bg-zinc-100 rounded text-zinc-600 font-bold border-0 bg-transparent cursor-pointer text-xs"
                                            title="Increase Font Size"
                                          >
                                            A+
                                          </button>

                                          <div className="w-px h-3.5 bg-zinc-200 mx-0.5" />

                                          {/* Bold */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const isBold = block.content.style.fontWeight === "bold" || block.content.style.fontWeight === "800";
                                              const nextWeight = isBold ? "normal" : (block.type === "heading" ? "800" : "bold");
                                              updateBlockContent(section.id, col.id, block.id, {
                                                ...block.content,
                                                style: { ...block.content.style, fontWeight: nextWeight }
                                              });
                                            }}
                                            className={cn(
                                              "p-1 rounded border-0 bg-transparent cursor-pointer",
                                              (block.content.style.fontWeight === "bold" || block.content.style.fontWeight === "800") ? "text-indigo-650 bg-indigo-50" : "text-zinc-500 hover:text-zinc-800"
                                            )}
                                            title="Bold"
                                          >
                                            <Bold className="w-3.5 h-3.5" />
                                          </button>

                                          {/* Italic */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const isItalic = block.content.style.fontStyle === "italic";
                                              const nextStyle = isItalic ? "normal" : "italic";
                                              updateBlockContent(section.id, col.id, block.id, {
                                                ...block.content,
                                                style: { ...block.content.style, fontStyle: nextStyle }
                                              });
                                            }}
                                            className={cn(
                                              "p-1 rounded border-0 bg-transparent cursor-pointer",
                                              block.content.style.fontStyle === "italic" ? "text-indigo-650 bg-indigo-50" : "text-zinc-500 hover:text-zinc-800"
                                            )}
                                            title="Italic"
                                          >
                                            <Italic className="w-3.5 h-3.5" />
                                          </button>

                                          {/* Underline */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const isUnderline = block.content.style.textDecoration === "underline";
                                              const nextDec = isUnderline ? "none" : "underline";
                                              updateBlockContent(section.id, col.id, block.id, {
                                                ...block.content,
                                                style: { ...block.content.style, textDecoration: nextDec }
                                              });
                                            }}
                                            className={cn(
                                              "p-1 rounded border-0 bg-transparent cursor-pointer",
                                              block.content.style.textDecoration === "underline" ? "text-indigo-650 bg-indigo-50" : "text-zinc-500 hover:text-zinc-800"
                                            )}
                                            title="Underline"
                                          >
                                            <Underline className="w-3.5 h-3.5" />
                                          </button>

                                          <div className="w-px h-3.5 bg-zinc-200 mx-0.5" />

                                          {/* Alignments */}
                                          {["left", "center", "right"].map((align) => (
                                            <button
                                              key={align}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                updateBlockContent(section.id, col.id, block.id, { ...block.content, align });
                                              }}
                                              className={cn(
                                                "p-1 rounded border-0 bg-transparent cursor-pointer",
                                                block.content.align === align ? "text-indigo-650 bg-indigo-50" : "text-zinc-400 hover:text-zinc-700"
                                              )}
                                            >
                                              {align === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                                              {align === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                                              {align === "right" && <AlignRight className="w-3.5 h-3.5" />}
                                            </button>
                                          ))}

                                          <div className="w-px h-3.5 bg-zinc-250 mx-0.5" />

                                          {/* Quick Colors */}
                                          <div className="relative group/color flex items-center">
                                            <button 
                                              className="p-1 hover:bg-zinc-100 rounded text-zinc-500 hover:text-zinc-800 cursor-pointer flex items-center gap-0.5 border-0 bg-transparent"
                                              title="Change Text Color"
                                            >
                                              <Palette className="w-3.5 h-3.5" style={{ color: block.content.style.color || "#000000" }} />
                                            </button>
                                            
                                            <div className="hidden group-hover/color:grid grid-cols-4 gap-1 p-2 bg-white border border-zinc-200 rounded-lg shadow-xl absolute top-full left-0 mt-1 z-[999]">
                                              {["#111827", "#4b5563", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#6366f1", "#ffffff"].map((c) => (
                                                <button
                                                  key={c}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const style = { ...block.content.style, color: c };
                                                    updateBlockContent(section.id, col.id, block.id, { ...block.content, style });
                                                  }}
                                                  className="w-4 h-4 rounded-full border border-zinc-250 hover:scale-110 transition-transform cursor-pointer"
                                                  style={{ backgroundColor: c }}
                                                  title={c}
                                                />
                                              ))}
                                            </div>
                                          </div>

                                          <div className="w-px h-3.5 bg-zinc-200 mx-0.5" />

                                          {/* Inline AI Text rewrite */}
                                          <div className="relative group/ai flex items-center">
                                            <button 
                                              className="p-1 hover:bg-indigo-50 hover:text-indigo-750 rounded text-indigo-650 cursor-pointer flex items-center border-0 bg-transparent"
                                              title="Gemini AI Rewrite"
                                            >
                                              <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-550" />
                                            </button>
                                            
                                            <div className="hidden group-hover/ai:block absolute top-full left-0 mt-1 w-44 bg-white border border-zinc-200 rounded-xl shadow-xl p-1.5 z-[999] select-none text-[10.5px] font-sans">
                                              <h5 className="font-bold text-zinc-700 px-2 py-1 uppercase text-[8px] tracking-wider">AI Rewrite presets</h5>
                                              {[
                                                { id: "professional", label: "🪄 Professional Tone" },
                                                { id: "shorter", label: "✍️ Make Shorter" },
                                                { id: "longer", label: "📖 Expand Content" },
                                                { id: "event", label: "🔥 Event Invitation" },
                                                { id: "outreach", label: "🤝 Warm Outreach" },
                                                { id: "emojis", label: "🚀 Add Emojis" },
                                                { id: "translate_en", label: "🇬🇧 English" },
                                                { id: "translate_es", label: "🇪🇸 Spanish" }
                                              ].map((opt) => (
                                                <button
                                                  key={opt.id}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleInlineAiRewrite(section.id, col.id, block.id, opt.id);
                                                  }}
                                                  className="w-full text-left p-1.5 rounded hover:bg-indigo-50/50 text-zinc-650 hover:text-indigo-900 font-semibold cursor-pointer border-0 bg-transparent flex items-center gap-1.5"
                                                >
                                                  {opt.label}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        </>
                                      )}

                                      {/* Button block controls */}
                                      {block.type === "button" && (
                                        <>
                                          {/* Alignments */}
                                          {["left", "center", "right"].map((align) => (
                                            <button
                                              key={align}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                updateBlockContent(section.id, col.id, block.id, { ...block.content, align });
                                              }}
                                              className={cn(
                                                "p-1 rounded border-0 bg-transparent cursor-pointer",
                                                block.content.align === align ? "text-indigo-650 bg-indigo-50" : "text-zinc-400 hover:text-zinc-700"
                                              )}
                                            >
                                              {align === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                                              {align === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                                              {align === "right" && <AlignRight className="w-3.5 h-3.5" />}
                                            </button>
                                          ))}

                                          <div className="w-px h-3.5 bg-zinc-200 mx-0.5" />

                                          {/* Inline AI Text rewrite for button CTAs */}
                                          <div className="relative group/ai flex items-center mr-0.5">
                                            <button 
                                              className="p-1 hover:bg-indigo-50 hover:text-indigo-750 rounded text-indigo-650 cursor-pointer flex items-center border-0 bg-transparent"
                                              title="Gemini AI Rewrite CTA"
                                            >
                                              <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-550" />
                                            </button>
                                            
                                            <div className="hidden group-hover/ai:block absolute top-full left-0 mt-1 w-44 bg-white border border-zinc-200 rounded-xl shadow-xl p-1.5 z-[999] select-none text-[10.5px] font-sans">
                                              <h5 className="font-bold text-zinc-700 px-2 py-1 uppercase text-[8px] tracking-wider">AI Rewrite CTA</h5>
                                              {[
                                                { id: "professional", label: "🪄 Professional CTA" },
                                                { id: "shorter", label: "✍️ Make Shorter" },
                                                { id: "longer", label: "📖 Expand CTA" },
                                                { id: "outreach", label: "🤝 Outreach Focus" }
                                              ].map((opt) => (
                                                <button
                                                  key={opt.id}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleInlineAiRewrite(section.id, col.id, block.id, opt.id);
                                                  }}
                                                  className="w-full text-left p-1.5 rounded hover:bg-indigo-50/50 text-zinc-650 hover:text-indigo-900 font-semibold cursor-pointer border-0 bg-transparent flex items-center gap-1.5"
                                                >
                                                  {opt.label}
                                                </button>
                                              ))}
                                            </div>
                                          </div>

                                          <div className="w-px h-3.5 bg-zinc-200 mr-0.5" />

                                          {/* Border Radius Presets */}
                                          <div className="flex items-center gap-0.5 bg-zinc-50 border border-zinc-200 rounded-lg p-0.5">
                                            {[
                                              { value: 0, label: "Square" },
                                              { value: 6, label: "Soft" },
                                              { value: 12, label: "Round" },
                                              { value: 9999, label: "Pill" }
                                            ].map((rad) => {
                                              const isCurrent = block.content.style.borderRadius === rad.value;
                                              return (
                                                <button
                                                  key={rad.value}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const style = { ...block.content.style, borderRadius: rad.value };
                                                    updateBlockContent(section.id, col.id, block.id, { ...block.content, style });
                                                  }}
                                                  className={cn(
                                                    "px-1.5 py-0.5 text-[8px] font-bold rounded cursor-pointer transition-all border-0 bg-transparent",
                                                    isCurrent ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                                                  )}
                                                >
                                                  {rad.label}
                                                </button>
                                              );
                                            })}
                                          </div>

                                          <div className="w-px h-3.5 bg-zinc-200 mx-0.5" />

                                          {/* Quick Background Colors */}
                                          <div className="relative group/btncolor flex items-center">
                                            <button 
                                              className="p-1 hover:bg-zinc-105 rounded text-zinc-500 hover:text-zinc-800 cursor-pointer flex items-center gap-0.5 border-0 bg-transparent"
                                              title="Button Background"
                                            >
                                              <Palette className="w-3.5 h-3.5" style={{ color: block.content.style.backgroundColor || "#4f46e5" }} />
                                            </button>
                                            
                                            <div className="hidden group-hover/btncolor:grid grid-cols-4 gap-1 p-2 bg-white border border-zinc-200 rounded-lg shadow-xl absolute top-full left-0 mt-1 z-[999]">
                                              {["#4f46e5", "#10b981", "#ef4444", "#f59e0b", "#1e293b", "#3b82f6", "#ec4899", "#8b5cf6"].map((c) => (
                                                <button
                                                  key={c}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const style = { ...block.content.style, backgroundColor: c };
                                                    updateBlockContent(section.id, col.id, block.id, { ...block.content, style });
                                                  }}
                                                  className="w-4 h-4 rounded-full border border-zinc-250 hover:scale-110 transition-transform cursor-pointer"
                                                  style={{ backgroundColor: c }}
                                                  title={c}
                                                />
                                              ))}
                                            </div>
                                          </div>
                                        </>
                                      )}

                                      {/* Image block controls */}
                                      {block.type === "image" && (
                                        <>
                                          {/* Sizing presets */}
                                          <div className="flex items-center gap-0.5 bg-zinc-50 border border-zinc-200 rounded-lg p-0.5">
                                            {["25%", "50%", "75%", "100%"].map((w) => {
                                              const isCurrent = block.content.width === w;
                                              return (
                                                <button
                                                  key={w}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateBlockContent(section.id, col.id, block.id, { ...block.content, width: w });
                                                  }}
                                                  className={cn(
                                                    "px-1.5 py-0.5 text-[8px] font-bold rounded cursor-pointer transition-all border-0 bg-transparent",
                                                    isCurrent ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                                                  )}
                                                >
                                                  {w}
                                                </button>
                                              );
                                            })}
                                          </div>

                                          <div className="w-px h-3.5 bg-zinc-200 mx-0.5" />

                                          {/* Alignments */}
                                          {["left", "center", "right"].map((align) => (
                                            <button
                                              key={align}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                updateBlockContent(section.id, col.id, block.id, { ...block.content, align });
                                              }}
                                              className={cn(
                                                "p-1 rounded border-0 bg-transparent cursor-pointer",
                                                block.content.align === align ? "text-indigo-650 bg-indigo-50" : "text-zinc-400 hover:text-zinc-700"
                                              )}
                                            >
                                              {align === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                                              {align === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                                              {align === "right" && <AlignRight className="w-3.5 h-3.5" />}
                                            </button>
                                          ))}

                                          <div className="w-px h-3.5 bg-zinc-200 mx-0.5" />

                                          {/* Redirect link URL */}
                                          <div className="relative group/link flex items-center">
                                            <button
                                              className={cn(
                                                "p-1 hover:bg-zinc-100 rounded text-zinc-500 hover:text-zinc-850 cursor-pointer border-0 bg-transparent",
                                                block.content.link && "text-indigo-600 bg-indigo-50"
                                              )}
                                              title="Redirect URL Link"
                                            >
                                              <LinkIcon className="w-3.5 h-3.5" />
                                            </button>
                                            
                                            <div className="hidden group-hover/link:flex items-center gap-1.5 p-2 bg-white border border-zinc-200 rounded-lg shadow-xl absolute top-full left-0 mt-1 z-[999] w-48">
                                              <input
                                                type="text"
                                                placeholder="Redirect Link URL"
                                                value={block.content.link || ""}
                                                onChange={(e) => {
                                                  updateBlockContent(section.id, col.id, block.id, {
                                                    ...block.content,
                                                    link: e.target.value
                                                  });
                                                }}
                                                className="h-6 px-1.5 bg-zinc-50 border border-zinc-200 text-[9px] rounded w-full focus:outline-none font-medium"
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                            </div>
                                          </div>
                                        </>
                                      )}

                                      {/* Spacer block controls */}
                                      {block.type === "spacer" && (
                                        <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-lg px-1.5 py-0.5">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const h = block.content.height || 20;
                                              updateBlockContent(section.id, col.id, block.id, { ...block.content, height: Math.max(10, h - 10) });
                                            }}
                                            className="px-1 hover:bg-zinc-200 rounded text-[9px] font-bold border-0 bg-transparent cursor-pointer"
                                          >
                                            -10px
                                          </button>
                                          <span className="text-[9px] font-bold text-zinc-700">{block.content.height || 20}px</span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const h = block.content.height || 20;
                                              updateBlockContent(section.id, col.id, block.id, { ...block.content, height: Math.min(120, h + 10) });
                                            }}
                                            className="px-1 hover:bg-zinc-200 rounded text-[9px] font-bold border-0 bg-transparent cursor-pointer"
                                          >
                                            +10px
                                          </button>
                                        </div>
                                      )}

                                      {/* Divider block controls */}
                                      {block.type === "divider" && (
                                        <>
                                          <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-lg px-1.5 py-0.5">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const h = block.content.height || 1;
                                                updateBlockContent(section.id, col.id, block.id, { ...block.content, height: Math.max(1, h - 1) });
                                              }}
                                              className="px-1 hover:bg-zinc-200 rounded text-[9px] font-bold border-0 bg-transparent cursor-pointer"
                                            >
                                              -
                                            </button>
                                            <span className="text-[9px] font-bold text-zinc-700">{block.content.height || 1}px thick</span>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const h = block.content.height || 1;
                                                updateBlockContent(section.id, col.id, block.id, { ...block.content, height: Math.min(10, h + 1) });
                                              }}
                                              className="px-1 hover:bg-zinc-200 rounded text-[9px] font-bold border-0 bg-transparent cursor-pointer"
                                            >
                                              +
                                            </button>
                                          </div>

                                          <div className="w-px h-3.5 bg-zinc-200 mx-0.5" />

                                          <div className="relative group/divcolor flex items-center">
                                            <button 
                                              className="p-1 hover:bg-zinc-100 rounded text-zinc-500 hover:text-zinc-800 cursor-pointer flex items-center gap-0.5 border-0 bg-transparent"
                                              title="Divider Color"
                                            >
                                              <Palette className="w-3.5 h-3.5" style={{ color: block.content.color || "#e5e7eb" }} />
                                            </button>
                                            
                                            <div className="hidden group-hover/divcolor:grid grid-cols-4 gap-1 p-2 bg-white border border-zinc-200 rounded-lg shadow-xl absolute top-full left-0 mt-1 z-[999]">
                                              {["#e5e7eb", "#cbd5e1", "#9ca3af", "#4f46e5", "#10b981", "#ef4444", "#f59e0b", "#1e293b"].map((c) => (
                                                <button
                                                  key={c}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateBlockContent(section.id, col.id, block.id, { ...block.content, color: c });
                                                  }}
                                                  className="w-4 h-4 rounded-full border border-zinc-250 hover:scale-110 transition-transform cursor-pointer"
                                                  style={{ backgroundColor: c }}
                                                  title={c}
                                                />
                                              ))}
                                            </div>
                                          </div>
                                        </>
                                      )}

                                      {/* Logo / Signature align controls */}
                                      {(block.type === "logo" || block.type === "signature") && (
                                        <>
                                          <div className="flex items-center gap-0.5 bg-zinc-50 border border-zinc-200 rounded-lg p-0.5">
                                            {["left", "center", "right"].map((align) => (
                                              <button
                                                key={align}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  updateBlockContent(section.id, col.id, block.id, { ...block.content, align });
                                                }}
                                                className={cn(
                                                  "px-1.5 py-0.5 text-[8px] font-bold rounded cursor-pointer transition-all border-0 bg-transparent",
                                                  block.content.align === align ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-505"
                                                )}
                                              >
                                                {align.toUpperCase()}
                                              </button>
                                            ))}
                                          </div>
                                        </>
                                      )}

                                      <div className="w-px h-3.5 bg-zinc-200 mx-0.5" />

                                      {/* Utility controls (Duplicate, Delete) */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          duplicateBlock(section.id, col.id, block.id);
                                        }}
                                        title="Duplicate Block"
                                        className="p-1 hover:bg-zinc-100 rounded text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer border-0 bg-transparent"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteBlock(section.id, col.id, block.id);
                                        }}
                                        title="Delete Block"
                                        className="p-1 hover:bg-red rounded text-zinc-400 hover:text-red-600 transition-colors cursor-pointer border-0 bg-transparent"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}

                                  <div className="pointer-events-auto select-text relative">
                                    {isRewritingBlockId === block.id && (
                                      <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex items-center justify-center rounded-lg z-50 animate-pulse select-none pointer-events-none">
                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-650" />
                                        <span className="text-[9px] font-bold text-indigo-950 ml-1.5">Gemini Writing...</span>
                                      </div>
                                    )}
                                    {block.type === "heading" && (
                                      <div
                                        contentEditable={isBlockSelected}
                                        suppressContentEditableWarning
                                        onFocus={() => setIsEditingText(true)}
                                        onBlur={(e) => {
                                          setIsEditingText(false);
                                          const nextText = e.currentTarget.textContent || "";
                                          if (nextText !== block.content.text) {
                                            updateBlockContent(section.id, col.id, block.id, {
                                              ...block.content,
                                              text: nextText,
                                            });
                                          }
                                        }}
                                        className={cn(
                                          "outline-none focus:ring-1 focus:ring-indigo-400 focus:bg-white/80 rounded transition-colors px-1 w-full",
                                          isBlockSelected ? "cursor-text" : "pointer-events-none select-none"
                                        )}
                                        style={{
                                          textAlign: block.content.align,
                                          fontSize: block.content.style.fontSize,
                                          fontWeight: block.content.style.fontWeight || "800",
                                          fontStyle: block.content.style.fontStyle || "normal",
                                          textDecoration: block.content.style.textDecoration || "none",
                                          color: block.content.style.color,
                                        }}
                                      >
                                        {block.content.text}
                                      </div>
                                    )}

                                    {block.type === "text" && (
                                      <div
                                        contentEditable={isBlockSelected}
                                        suppressContentEditableWarning
                                        onFocus={() => setIsEditingText(true)}
                                        onBlur={(e) => {
                                          setIsEditingText(false);
                                          const nextText = e.currentTarget.textContent || "";
                                          if (nextText !== block.content.text) {
                                            updateBlockContent(section.id, col.id, block.id, {
                                              ...block.content,
                                              text: nextText,
                                            });
                                          }
                                        }}
                                        className={cn(
                                          "outline-none focus:ring-1 focus:ring-indigo-400 focus:bg-white/80 rounded transition-colors px-1 w-full",
                                          isBlockSelected ? "cursor-text" : "pointer-events-none select-none"
                                        )}
                                        style={{
                                          textAlign: block.content.align,
                                          fontSize: block.content.style.fontSize,
                                          color: block.content.style.color,
                                          fontWeight: block.content.style.fontWeight || "normal",
                                          fontStyle: block.content.style.fontStyle || "normal",
                                          textDecoration: block.content.style.textDecoration || "none",
                                          lineHeight: 1.5,
                                          whiteSpace: "pre-line",
                                        }}
                                      >
                                        {block.content.text}
                                      </div>
                                    )}

                                    {block.type === "image" && (
                                      <div className="flex justify-center" style={{ textAlign: block.content.align }}>
                                        <img
                                          src={block.content.url}
                                          alt={block.content.alt}
                                          style={{
                                            width: block.content.width,
                                            borderRadius: `${block.content.rounded}px`,
                                          }}
                                          className="max-h-56 object-contain pointer-events-none select-none"
                                        />
                                      </div>
                                    )}

                                    {block.type === "button" && (
                                      <div style={{ textAlign: block.content.align }}>
                                        <span
                                          contentEditable={isBlockSelected}
                                          suppressContentEditableWarning
                                          onFocus={() => setIsEditingText(true)}
                                          onBlur={(e) => {
                                            setIsEditingText(false);
                                            const nextText = e.currentTarget.textContent || "";
                                            if (nextText !== block.content.text) {
                                              updateBlockContent(section.id, col.id, block.id, {
                                                ...block.content,
                                                text: nextText,
                                              });
                                            }
                                          }}
                                          className={cn(
                                            "inline-block text-xs font-bold font-sans tracking-wide border-0 shadow-sm outline-none focus:ring-1 focus:ring-indigo-400 focus:bg-white/10 px-1 rounded",
                                            isBlockSelected ? "cursor-text" : "pointer-events-none select-none"
                                          )}
                                          style={{
                                            backgroundColor: block.content.style.backgroundColor,
                                            color: block.content.style.textColor,
                                            borderRadius: `${block.content.style.borderRadius}px`,
                                            padding: block.content.style.padding,
                                          }}
                                        >
                                          {block.content.text}
                                        </span>
                                      </div>
                                    )}

                                    {block.type === "divider" && (
                                      <div style={{ padding: block.content.padding }}>
                                        <hr style={{ border: 0, borderTop: `${block.content.height}px solid ${block.content.color}` }} />
                                      </div>
                                    )}

                                    {block.type === "spacer" && (
                                      <div style={{ height: `${block.content.height}px` }} className="border-t border-dashed border-zinc-150/40" />
                                    )}

                                    {block.type === "logo" && (
                                      <div style={{ textAlign: block.content.align || "center" }}>
                                        <img
                                          src={block.content.url}
                                          alt={block.content.alt}
                                          style={{ height: `${block.content.height}px`, display: "inline-block" }}
                                        />
                                      </div>
                                    )}

                                    {block.type === "social" && (
                                      <div className="flex items-center gap-3" style={{ justifyContent: block.content.align === "center" ? "center" : block.content.align === "right" ? "flex-end" : "flex-start" }}>
                                        {block.content.platforms.map((p: any, idx: number) => (
                                          <img key={idx} src={p.icon} alt={p.name} style={{ width: `${block.content.size}px`, height: `${block.content.size}px` }} />
                                        ))}
                                      </div>
                                    )}

                                    {block.type === "footer" && (
                                      <div style={{ textAlign: block.content.align }} className="text-[10px] text-zinc-400 font-semibold leading-normal pt-2 border-t border-zinc-150">
                                        <p>{block.content.text}</p>
                                        <p className="mt-1">{block.content.unsubText}</p>
                                        <span className="text-indigo-500 underline mt-1 block">Unsubscribe</span>
                                      </div>
                                    )}

                                    {block.type === "signature" && (
                                      <div style={{ textAlign: block.content.align }} className="py-1 text-zinc-700">
                                        <div className="inline-flex text-left items-center gap-3">
                                          {block.content.photo && (
                                            <img src={block.content.photo} alt={block.content.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                                          )}
                                          <div>
                                            <div className="font-bold text-xs">{block.content.name}</div>
                                            <div className="text-[10px] text-zinc-500 mt-0.5">{block.content.role} | {block.content.company}</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {block.type === "html" && (
                                      <div className="text-[10px] font-mono text-zinc-400 bg-zinc-50 p-2 rounded-lg truncate">
                                        Custom HTML Component
                                      </div>
                                    )}
                                  </div>

                                  <div className="absolute top-1.5 right-1.5 bg-zinc-900 text-white rounded text-[8px] font-bold px-1.5 py-0.5 shadow opacity-0 group-hover/block:opacity-100 flex items-center gap-1 z-30 transition-all select-none">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); duplicateBlock(section.id, col.id, block.id); }}
                                      className="hover:text-indigo-400 cursor-pointer"
                                    >
                                      <Copy className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); deleteBlock(section.id, col.id, block.id); }}
                                      className="hover:text-red-400 cursor-pointer"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Drop slot below this block */}
                                <DropSlot
                                  sectionId={section.id}
                                  colId={col.id}
                                  index={bIdx + 1}
                                  onBlockDropped={handleDropNewBlock}
                                  onBlockMoved={handleBlockDropMove}
                                />
                              </React.Fragment>
                            );
                          })}

                          {col.blocks.length === 0 && (
                            <div className="h-14 flex items-center justify-center border border-dashed border-zinc-200 text-[10px] text-zinc-400 font-semibold select-none rounded-lg hover:bg-zinc-50 transition-colors pointer-events-none">
                              Drop Blocks here
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Add row options */}
              <div className="mt-8 border-t border-dashed border-zinc-200 pt-6 flex flex-col items-center gap-3">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider select-none">Add Layout Section</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => addSection(1)}
                    className="h-8 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-200"
                  >
                    <Plus className="w-3.5 h-3.5" /> Full Width Row
                  </button>
                  <button
                    onClick={() => addSection(2)}
                    className="h-8 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-200"
                  >
                    <Plus className="w-3.5 h-3.5" /> 2-Columns Row
                  </button>
                  <button
                    onClick={() => addSection(3)}
                    className="h-8 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-200"
                  >
                    <Plus className="w-3.5 h-3.5" /> 3-Columns Row
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Zoom Controls Widget */}
          {!previewMode && (
            <div className="absolute bottom-6 right-6 z-50 flex items-center gap-2 bg-white/85 backdrop-blur-md border border-zinc-200 rounded-xl px-2.5 py-1.5 shadow-xl select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={() => setZoomLevel((prev) => Math.max(50, prev - 25))}
                disabled={zoomLevel <= 50}
                className="p-1 rounded-lg hover:bg-zinc-150 text-zinc-500 hover:text-zinc-800 disabled:opacity-30 cursor-pointer border-0 bg-transparent"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              
              <select
                value={zoomLevel}
                onChange={(e) => setZoomLevel(Number(e.target.value))}
                className="h-6 rounded border border-zinc-200 bg-white text-[10px] text-zinc-700 font-bold px-1 focus:outline-none cursor-pointer"
              >
                <option value="50">50%</option>
                <option value="75">75%</option>
                <option value="100">100%</option>
                <option value="125">125%</option>
                <option value="150">150%</option>
              </select>

              <button
                onClick={() => setZoomLevel((prev) => Math.min(150, prev + 25))}
                disabled={zoomLevel >= 150}
                className="p-1 rounded-lg hover:bg-zinc-150 text-zinc-500 hover:text-zinc-800 disabled:opacity-30 cursor-pointer border-0 bg-transparent"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-3 bg-zinc-200" />

              <button
                onClick={() => setZoomLevel(100)}
                className="text-[9px] font-bold text-indigo-650 hover:text-indigo-800 cursor-pointer px-1 py-0.5 rounded hover:bg-indigo-50 border-0 bg-transparent"
                title="Fit to Screen"
              >
                Fit
              </button>
            </div>
          )}
        </main>

        {/* ─── RIGHT SIDEBAR: PROPERTIES INSPECTOR ─── */}
        {!previewMode && (
          <aside className="w-72 bg-white border-l border-zinc-200 flex flex-col shrink-0">
            {/* Tabs */}
            <div className="grid grid-cols-2 border-b border-zinc-200 p-2 gap-1.5 shrink-0">
              <button
                onClick={() => setRightPanelTab("style")}
                className={cn(
                  "py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all",
                  rightPanelTab === "style" ? "bg-zinc-100 text-zinc-800" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                Style Inspector
              </button>
              <button
                onClick={() => setRightPanelTab("global")}
                className={cn(
                  "py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all",
                  rightPanelTab === "global" ? "bg-zinc-100 text-zinc-800" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                Global Defaults
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {rightPanelTab === "global" ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Default Font</label>
                    <select
                      value={dragDropData.globalSettings.fontFamily}
                      onChange={(e) => {
                        const copy = { ...dragDropData };
                        copy.globalSettings.fontFamily = e.target.value;
                        updateStateAndHistory(copy);
                      }}
                      className="w-full h-8 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 font-semibold focus:outline-none"
                    >
                      <option value="'Outfit', 'Inter', sans-serif">Outfit (Default)</option>
                      <option value="'Inter', sans-serif">Inter</option>
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="'Courier New', monospace">Courier</option>
                      <option value="Georgia, serif">Georgia</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Email Width (px)</label>
                    <input
                      type="number"
                      value={dragDropData.globalSettings.emailWidth}
                      onChange={(e) => {
                        const copy = { ...dragDropData };
                        copy.globalSettings.emailWidth = Number(e.target.value);
                        updateStateAndHistory(copy);
                      }}
                      className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Canvas Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={dragDropData.globalSettings.backgroundColor}
                        onChange={(e) => {
                          const copy = { ...dragDropData };
                          copy.globalSettings.backgroundColor = e.target.value;
                          updateStateAndHistory(copy);
                        }}
                        className="w-8 h-8 rounded border border-zinc-200 cursor-pointer overflow-hidden p-0 bg-transparent shrink-0"
                      />
                      <input
                        type="text"
                        value={dragDropData.globalSettings.backgroundColor}
                        onChange={(e) => {
                          const copy = { ...dragDropData };
                          copy.globalSettings.backgroundColor = e.target.value;
                          updateStateAndHistory(copy);
                        }}
                        className="w-full h-8 px-2 rounded bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-700"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {["#ffffff", "#f8fafc", "#f4f4f5", "#e2e8f0", "#e0e7ff", "#fef3c7", "#ecfdf5", "#fef2f2", "#1e293b", "#0f172a"].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            const copy = { ...dragDropData };
                            copy.globalSettings.backgroundColor = color;
                            updateStateAndHistory(copy);
                          }}
                          className="w-4 h-4 rounded-full border border-zinc-250 hover:scale-110 transition-transform cursor-pointer shadow-sm shrink-0"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Body Content Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={dragDropData.globalSettings.contentBackgroundColor}
                        onChange={(e) => {
                          const copy = { ...dragDropData };
                          copy.globalSettings.contentBackgroundColor = e.target.value;
                          updateStateAndHistory(copy);
                        }}
                        className="w-8 h-8 rounded border border-zinc-200 cursor-pointer overflow-hidden p-0 bg-transparent shrink-0"
                      />
                      <input
                        type="text"
                        value={dragDropData.globalSettings.contentBackgroundColor}
                        onChange={(e) => {
                          const copy = { ...dragDropData };
                          copy.globalSettings.contentBackgroundColor = e.target.value;
                          updateStateAndHistory(copy);
                        }}
                        className="w-full h-8 px-2 rounded bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-700"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {["#ffffff", "#f8fafc", "#f4f4f5", "#e2e8f0", "#1e293b", "#0f172a", "#4f46e5", "#10b981"].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            const copy = { ...dragDropData };
                            copy.globalSettings.contentBackgroundColor = color;
                            updateStateAndHistory(copy);
                          }}
                          className="w-4 h-4 rounded-full border border-zinc-250 hover:scale-110 transition-transform cursor-pointer shadow-sm shrink-0"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : selectedBlock ? (
                (() => {
                  const { sectionId, colId, blockId } = selectedBlock;
                  const block = findBlock(sectionId, colId, blockId);
                  if (!block) return <p className="text-xs text-zinc-400 font-semibold text-center py-6">Select a block to inspect</p>;

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-150 pb-2">
                        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                          {block.type.toUpperCase()} BLOCK
                        </span>
                        <button
                          onClick={() => deleteBlock(sectionId, colId, blockId)}
                          className="text-[10px] font-bold text-red-500 flex items-center gap-1 hover:text-red-750 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>

                      {/* HEADING AND TEXT EDITING */}
                      {(block.type === "heading" || block.type === "text") && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Content Text</label>
                            <textarea
                              value={block.content.text}
                              onChange={(e) => {
                                updateBlockContent(sectionId, colId, blockId, {
                                  ...block.content,
                                  text: e.target.value,
                                });
                              }}
                              className="w-full p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 font-semibold focus:outline-none focus:bg-white focus:border-indigo-300 transition-colors"
                              rows={4}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Insert Variables</label>
                            <div className="flex flex-wrap gap-1">
                              {["firstName", "lastName", "companyName", "email", "website"].map((tag) => (
                                <button
                                  key={tag}
                                  onClick={() => {
                                    const nextText = block.content.text + ` {{${tag}}}`;
                                    updateBlockContent(sectionId, colId, blockId, {
                                      ...block.content,
                                      text: nextText,
                                    });
                                  }}
                                  className="px-2 py-0.5 bg-zinc-105 hover:bg-indigo-50 border border-zinc-200 rounded text-[9px] font-mono font-semibold text-zinc-650 cursor-pointer"
                                >
                                  {`{{${tag}}}`}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1.5">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Typography</label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[9px] font-semibold text-zinc-400 block mb-1">Font Size</span>
                                <input
                                  type="text"
                                  value={block.content.style.fontSize}
                                  onChange={(e) => {
                                    const style = { ...block.content.style, fontSize: e.target.value };
                                    updateBlockContent(sectionId, colId, blockId, { ...block.content, style });
                                  }}
                                  className="w-full h-8 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold focus:outline-none text-center"
                                />
                              </div>

                              {block.type === "heading" && (
                                <div>
                                  <span className="text-[9px] font-semibold text-zinc-400 block mb-1">Level</span>
                                  <select
                                    value={block.content.level}
                                    onChange={(e) => {
                                      updateBlockContent(sectionId, colId, blockId, { ...block.content, level: e.target.value });
                                    }}
                                    className="w-full h-8 px-1 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold focus:outline-none"
                                  >
                                    <option value="h1">H1</option>
                                    <option value="h2">H2</option>
                                    <option value="h3">H3</option>
                                    <option value="h4">H4</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Text Color</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={block.content.style.color || "#000000"}
                                onChange={(e) => {
                                  const style = { ...block.content.style, color: e.target.value };
                                  updateBlockContent(sectionId, colId, blockId, { ...block.content, style });
                                }}
                                className="w-8 h-8 rounded border border-zinc-200 cursor-pointer overflow-hidden p-0 bg-transparent shrink-0"
                              />
                              <input
                                type="text"
                                value={block.content.style.color || ""}
                                onChange={(e) => {
                                  const style = { ...block.content.style, color: e.target.value };
                                  updateBlockContent(sectionId, colId, blockId, { ...block.content, style });
                                }}
                                className="w-full h-8 px-2 rounded bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-700 focus:outline-none"
                              />
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {["#111827", "#374151", "#4b5563", "#9ca3af", "#ffffff", "#4f46e5", "#10b981", "#ef4444", "#f59e0b"].map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => {
                                    const style = { ...block.content.style, color };
                                    updateBlockContent(sectionId, colId, blockId, { ...block.content, style });
                                  }}
                                  className="w-4 h-4 rounded-full border border-zinc-250 hover:scale-110 transition-transform cursor-pointer shadow-sm shrink-0"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Alignment</label>
                            <div className="grid grid-cols-3 gap-1 bg-zinc-50 border border-zinc-200 rounded-lg p-0.5 text-center">
                              {["left", "center", "right"].map((align) => (
                                <button
                                  key={align}
                                  onClick={() => {
                                    updateBlockContent(sectionId, colId, blockId, {
                                      ...block.content,
                                      align,
                                    });
                                  }}
                                  className={cn(
                                    "py-1 text-xs font-semibold rounded cursor-pointer transition-all",
                                    block.content.align === align ? "bg-white text-zinc-800 shadow-sm border border-zinc-150" : "text-zinc-500"
                                  )}
                                >
                                  {align.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* IMAGE CONTROLS */}
                      {block.type === "image" && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Image URL Source</label>
                            <input
                              type="text"
                              value={block.content.url}
                              onChange={(e) => {
                                updateBlockContent(sectionId, colId, blockId, {
                                  ...block.content,
                                  url: e.target.value,
                                });
                              }}
                              className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:outline-none"
                            />
                          </div>

                          {/* Direct Assets Selection Dropdown */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">Choose Image from Assets</label>
                            {assets.length > 0 ? (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    updateBlockContent(sectionId, colId, blockId, {
                                      ...block.content,
                                      url: e.target.value,
                                    });
                                    toast.success("Applied uploaded asset!");
                                  }
                                }}
                                value={block.content.url}
                                className="w-full h-8 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 font-semibold focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Choose image --</option>
                                {assets.map((a) => (
                                  <option key={a.id} value={a.url}>
                                    {a.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-[10px] text-zinc-400 font-semibold italic">No uploaded media found. Upload in the "Media" tab.</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Redirect Hyperlink</label>
                            <input
                              type="text"
                              value={block.content.link}
                              onChange={(e) => {
                                updateBlockContent(sectionId, colId, blockId, {
                                  ...block.content,
                                  link: e.target.value,
                                });
                              }}
                              placeholder="e.g. https://mywebsite.com"
                              className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Alternative Alt Text</label>
                            <input
                              type="text"
                              value={block.content.alt}
                              onChange={(e) => {
                                updateBlockContent(sectionId, colId, blockId, {
                                  ...block.content,
                                  alt: e.target.value,
                                });
                              }}
                              className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <span className="text-[9px] font-semibold text-zinc-400 block mb-1">Width (%)</span>
                              <input
                                type="text"
                                value={block.content.width}
                                onChange={(e) => {
                                  updateBlockContent(sectionId, colId, blockId, {
                                    ...block.content,
                                    width: e.target.value,
                                  });
                                }}
                                className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:outline-none text-center"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-semibold text-zinc-400 block mb-1">Corners (px)</span>
                              <input
                                type="number"
                                value={block.content.rounded}
                                onChange={(e) => {
                                  updateBlockContent(sectionId, colId, blockId, {
                                    ...block.content,
                                    rounded: Number(e.target.value),
                                  });
                                }}
                                className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:outline-none text-center"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* BUTTON CONTROLS */}
                      {block.type === "button" && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Button Text</label>
                            <input
                              type="text"
                              value={block.content.text}
                              onChange={(e) => {
                                updateBlockContent(sectionId, colId, blockId, {
                                  ...block.content,
                                  text: e.target.value,
                                });
                              }}
                              className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Button Redirect URL</label>
                            <input
                              type="text"
                              value={block.content.url}
                              onChange={(e) => {
                                updateBlockContent(sectionId, colId, blockId, {
                                  ...block.content,
                                  url: e.target.value,
                                });
                              }}
                              className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Button Background</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={block.content.style.backgroundColor || "#4f46e5"}
                                onChange={(e) => {
                                  const style = { ...block.content.style, backgroundColor: e.target.value };
                                  updateBlockContent(sectionId, colId, blockId, { ...block.content, style });
                                }}
                                className="w-8 h-8 rounded border border-zinc-200 cursor-pointer overflow-hidden p-0 bg-transparent shrink-0"
                              />
                              <input
                                type="text"
                                value={block.content.style.backgroundColor || ""}
                                onChange={(e) => {
                                  const style = { ...block.content.style, backgroundColor: e.target.value };
                                  updateBlockContent(sectionId, colId, blockId, { ...block.content, style });
                                }}
                                className="w-full h-8 px-2 rounded bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-700 focus:outline-none"
                              />
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {["#4f46e5", "#06b6d4", "#10b981", "#ef4444", "#f59e0b", "#1e293b", "#3b82f6", "#ec4899", "#8b5cf6"].map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => {
                                    const style = { ...block.content.style, backgroundColor: color };
                                    updateBlockContent(sectionId, colId, blockId, { ...block.content, style });
                                  }}
                                  className="w-4 h-4 rounded-full border border-zinc-250 hover:scale-110 transition-transform cursor-pointer shadow-sm shrink-0"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Text Color</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={block.content.style.textColor || "#ffffff"}
                                onChange={(e) => {
                                  const style = { ...block.content.style, textColor: e.target.value };
                                  updateBlockContent(sectionId, colId, blockId, { ...block.content, style });
                                }}
                                className="w-8 h-8 rounded border border-zinc-200 cursor-pointer overflow-hidden p-0 bg-transparent shrink-0"
                              />
                              <input
                                type="text"
                                value={block.content.style.textColor || ""}
                                onChange={(e) => {
                                  const style = { ...block.content.style, textColor: e.target.value };
                                  updateBlockContent(sectionId, colId, blockId, { ...block.content, style });
                                }}
                                className="w-full h-8 px-2 rounded bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-700 focus:outline-none"
                              />
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {["#ffffff", "#f8fafc", "#f4f4f5", "#111827", "#374151", "#4b5563", "#4f46e5", "#fef3c7"].map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => {
                                    const style = { ...block.content.style, textColor: color };
                                    updateBlockContent(sectionId, colId, blockId, { ...block.content, style });
                                  }}
                                  className="w-4 h-4 rounded-full border border-zinc-250 hover:scale-110 transition-transform cursor-pointer shadow-sm shrink-0"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <span className="text-[9px] font-semibold text-zinc-400 block mb-1">Padding Style</span>
                              <input
                                type="text"
                                value={block.content.style.padding}
                                onChange={(e) => {
                                  const style = { ...block.content.style, padding: e.target.value };
                                  updateBlockContent(sectionId, colId, blockId, { ...block.content, style });
                                }}
                                className="w-full h-8 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-center focus:outline-none"
                                placeholder="e.g. 10px 20px"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-semibold text-zinc-400 block mb-1">Radius (px)</span>
                              <input
                                type="number"
                                value={block.content.style.borderRadius}
                                onChange={(e) => {
                                  const style = { ...block.content.style, borderRadius: Number(e.target.value) };
                                  updateBlockContent(sectionId, colId, blockId, { ...block.content, style });
                                }}
                                className="w-full h-8 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-center focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Alignment</label>
                            <div className="grid grid-cols-3 gap-1 bg-zinc-50 border border-zinc-200 rounded-lg p-0.5 text-center">
                              {["left", "center", "right"].map((align) => (
                                <button
                                  key={align}
                                  onClick={() => {
                                    updateBlockContent(sectionId, colId, blockId, {
                                      ...block.content,
                                      align,
                                    });
                                  }}
                                  className={cn(
                                    "py-1 text-xs font-semibold rounded cursor-pointer transition-all",
                                    block.content.align === align ? "bg-white text-zinc-800 shadow-sm border border-zinc-150" : "text-zinc-500"
                                  )}
                                >
                                  {align.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* BRAND LOGO CONTROLS */}
                      {block.type === "logo" && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Logo URL</label>
                            <input
                              type="text"
                              value={block.content.url}
                              onChange={(e) => {
                                updateBlockContent(sectionId, colId, blockId, {
                                  ...block.content,
                                  url: e.target.value,
                                });
                              }}
                              className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:outline-none"
                            />
                          </div>

                          {/* Direct Assets Selection Dropdown for Logo */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">Choose Logo from Assets</label>
                            {assets.length > 0 ? (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    updateBlockContent(sectionId, colId, blockId, {
                                      ...block.content,
                                      url: e.target.value,
                                    });
                                    toast.success("Applied uploaded logo!");
                                  }
                                }}
                                value={block.content.url}
                                className="w-full h-8 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 font-semibold focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Choose logo --</option>
                                {assets.map((a) => (
                                  <option key={a.id} value={a.url}>
                                    {a.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-[10px] text-zinc-400 font-semibold italic">No uploaded media found.</p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <span className="text-[9px] font-semibold text-zinc-400 block mb-1">Height (px)</span>
                              <input
                                type="text"
                                value={block.content.height}
                                onChange={(e) => {
                                  updateBlockContent(sectionId, colId, blockId, {
                                    ...block.content,
                                    height: e.target.value,
                                  });
                                }}
                                className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:outline-none text-center"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-semibold text-zinc-400 block mb-1">Alignment</span>
                              <select
                                value={block.content.align}
                                onChange={(e) => {
                                  updateBlockContent(sectionId, colId, blockId, {
                                    ...block.content,
                                    align: e.target.value,
                                  });
                                }}
                                className="w-full h-8 px-1 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:outline-none"
                              >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SOCIAL CONTROLS */}
                      {block.type === "social" && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Align Icons</label>
                            <select
                              value={block.content.align}
                              onChange={(e) => {
                                updateBlockContent(sectionId, colId, blockId, { ...block.content, align: e.target.value });
                              }}
                              className="w-full h-8 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold focus:outline-none"
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Icons Size (px)</label>
                            <input
                              type="number"
                              value={block.content.size}
                              onChange={(e) => {
                                updateBlockContent(sectionId, colId, blockId, { ...block.content, size: e.target.value });
                              }}
                              className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:outline-none text-center"
                            />
                          </div>
                        </div>
                      )}

                      {/* SIGNATURE CONTROLS */}
                      {block.type === "signature" && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Sender Name</label>
                            <input
                              type="text"
                              value={block.content.name}
                              onChange={(e) => {
                                updateBlockContent(sectionId, colId, blockId, { ...block.content, name: e.target.value });
                              }}
                              className="w-full h-8 px-2 rounded bg-zinc-50 border border-zinc-200 text-xs font-semibold focus:outline-none"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Role / Title</label>
                            <input
                              type="text"
                              value={block.content.role}
                              onChange={(e) => {
                                updateBlockContent(sectionId, colId, blockId, { ...block.content, role: e.target.value });
                              }}
                              className="w-full h-8 px-2 rounded bg-zinc-50 border border-zinc-200 text-xs font-semibold focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Signature Photo URL</label>
                            <input
                              type="text"
                              value={block.content.photo || ""}
                              onChange={(e) => {
                                updateBlockContent(sectionId, colId, blockId, { ...block.content, photo: e.target.value });
                              }}
                              className="w-full h-8 px-2 rounded bg-zinc-50 border border-zinc-200 text-xs focus:outline-none"
                            />
                          </div>

                          {/* Signature Photo Selector Dropdown */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">Choose Photo from Assets</label>
                            {assets.length > 0 ? (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    updateBlockContent(sectionId, colId, blockId, {
                                      ...block.content,
                                      photo: e.target.value,
                                    });
                                    toast.success("Applied photo signature!");
                                  }
                                }}
                                value={block.content.photo || ""}
                                className="w-full h-8 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 font-semibold focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Choose image --</option>
                                {assets.map((a) => (
                                  <option key={a.id} value={a.url}>{a.name}</option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-[10px] text-zinc-400 font-semibold italic">No assets uploaded.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* CUSTOM HTML BLOCK */}
                      {block.type === "html" && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">HTML Code</label>
                          <textarea
                            value={block.content.code}
                            onChange={(e) => {
                              updateBlockContent(sectionId, colId, blockId, {
                                ...block.content,
                                code: e.target.value,
                              });
                            }}
                            className="w-full p-2 rounded-lg bg-zinc-50 border border-zinc-200 font-mono text-[10px] focus:outline-none"
                            rows={8}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : selectedSectionId ? (
                (() => {
                  const section = dragDropData.sections.find((s) => s.id === selectedSectionId);
                  if (!section) return <p className="text-xs text-zinc-400 font-semibold text-center py-6">Select a section</p>;

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-150 pb-2">
                        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                          ROW SECTION
                        </span>
                        <button
                          onClick={() => deleteSection(selectedSectionId)}
                          className="text-[10px] font-bold text-red-500 flex items-center gap-1 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Background Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={section.backgroundColor || "#ffffff"}
                            onChange={(e) => {
                              const copy = { ...dragDropData };
                              const target = copy.sections.find((s) => s.id === selectedSectionId);
                              if (target) target.backgroundColor = e.target.value;
                              updateStateAndHistory(copy);
                            }}
                            className="w-8 h-8 rounded border border-zinc-200 cursor-pointer overflow-hidden p-0 bg-transparent shrink-0"
                          />
                          <input
                            type="text"
                            value={section.backgroundColor || ""}
                            onChange={(e) => {
                              const copy = { ...dragDropData };
                              const target = copy.sections.find((s) => s.id === selectedSectionId);
                              if (target) target.backgroundColor = e.target.value;
                              updateStateAndHistory(copy);
                            }}
                            className="w-full h-8 px-2 rounded bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-700 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Paddings (px)</label>
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div>
                            <span className="text-[8px] font-semibold text-zinc-400 block mb-1">Top</span>
                            <input
                              type="number"
                              value={section.padding.top}
                              onChange={(e) => {
                                const copy = { ...dragDropData };
                                const target = copy.sections.find((s) => s.id === selectedSectionId);
                                if (target) target.padding.top = Number(e.target.value);
                                updateStateAndHistory(copy);
                              }}
                              className="w-full h-8 rounded bg-zinc-50 border border-zinc-200 text-xs text-center focus:outline-none"
                            />
                          </div>
                          <div>
                            <span className="text-[8px] font-semibold text-zinc-400 block mb-1">Bottom</span>
                            <input
                              type="number"
                              value={section.padding.bottom}
                              onChange={(e) => {
                                const copy = { ...dragDropData };
                                const target = copy.sections.find((s) => s.id === selectedSectionId);
                                if (target) target.padding.bottom = Number(e.target.value);
                                updateStateAndHistory(copy);
                              }}
                              className="w-full h-8 rounded bg-zinc-50 border border-zinc-200 text-xs text-center focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Margin Bottom (px)</label>
                        <input
                          type="number"
                          value={section.margin.bottom}
                          onChange={(e) => {
                            const copy = { ...dragDropData };
                            const target = copy.sections.find((s) => s.id === selectedSectionId);
                            if (target) target.margin.bottom = Number(e.target.value);
                            updateStateAndHistory(copy);
                          }}
                          className="w-full h-8 px-2 rounded bg-zinc-50 border border-zinc-200 text-xs focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Display Visibility</label>
                        <select
                          value={section.visibility}
                          onChange={(e) => {
                            const copy = { ...dragDropData };
                            const target = copy.sections.find((s) => s.id === selectedSectionId);
                            if (target) target.visibility = e.target.value as any;
                            updateStateAndHistory(copy);
                          }}
                          className="w-full h-8 px-2 rounded bg-zinc-50 border border-zinc-200 text-xs font-semibold focus:outline-none cursor-pointer"
                        >
                          <option value="all">Visible Everywhere</option>
                          <option value="desktop">Desktop Devices Only</option>
                          <option value="mobile">Mobile Devices Only</option>
                        </select>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-10">
                  <Info className="w-5 h-5 text-zinc-300 mx-auto mb-2" />
                  <p className="text-[10.5px] text-zinc-400 font-semibold leading-normal">
                    Click any block or section in the canvas to inspect its layout details and styles.
                  </p>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ─── TEST EMAIL MODAL ─── */}
      {isTestEmailOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsTestEmailOpen(false)}>
          <div
            className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                <Send className="w-4 h-4 text-indigo-500" />
                Send Test Email
              </h3>
              <button onClick={() => setIsTestEmailOpen(false)} className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-700 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Recipient Email</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-850 font-semibold focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Sender SMTP Account</label>
                <select
                  value={testSmtpAccountId}
                  onChange={(e) => setTestSmtpAccountId(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="">Default SMTP Relayer</option>
                  {smtpAccounts.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.fromName} ({acc.fromEmail})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-zinc-100 px-5 py-3.5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTestEmailOpen(false)}
                className="h-9 px-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTestEmail}
                disabled={isSendingTest || !testEmail.trim()}
                className="h-9 px-5 rounded-lg bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {isSendingTest ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-3.5 h-3.5" /> Dispatch Test</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── KEYBOARD SHORTCUTS CHEATSHEET MODAL ─── */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs" onClick={() => setIsShortcutsOpen(false)}>
          <div
            className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-150">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                  <line x1="6" y1="8" x2="6" y2="8" /><line x1="10" y1="8" x2="10" y2="8" /><line x1="14" y1="8" x2="14" y2="8" /><line x1="18" y1="8" x2="18" y2="8" />
                  <line x1="6" y1="12" x2="6" y2="12" /><line x1="10" y1="12" x2="10" y2="12" /><line x1="14" y1="12" x2="14" y2="12" /><line x1="18" y1="12" x2="18" y2="12" />
                  <line x1="7" y1="16" x2="17" y2="16" />
                </svg>
                Keyboard Shortcuts Guide
              </h3>
              <button onClick={() => setIsShortcutsOpen(false)} className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-700 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 space-y-3 font-sans text-xs">
              {[
                { keys: ["Ctrl", "S"], desc: "Save Workspace" },
                { keys: ["Ctrl", "Z"], desc: "Undo last edit action" },
                { keys: ["Ctrl", "Y"], desc: "Redo last edit action" },
                { keys: ["Ctrl", "D"], desc: "Duplicate currently selected block" },
                { keys: ["Arrow Up"], desc: "Move selected block up in column" },
                { keys: ["Arrow Down"], desc: "Move selected block down in column" },
                { keys: ["Backspace", "Del"], desc: "Delete selected block / section" },
                { keys: ["Esc"], desc: "Clear element selection" },
              ].map((shortcut, idx) => (
                <div key={idx} className="flex justify-between items-center py-1">
                  <span className="text-zinc-650 font-semibold">{shortcut.desc}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, kIdx) => (
                      <kbd key={kIdx} className="bg-zinc-100 border border-zinc-200 rounded px-1.5 py-0.5 text-[10px] font-mono font-bold text-zinc-800 shadow-xs">
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-150 px-5 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(false)}
                className="h-8 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-xs font-semibold text-white cursor-pointer transition-colors"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

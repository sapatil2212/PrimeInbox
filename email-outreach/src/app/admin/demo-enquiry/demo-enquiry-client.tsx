"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import { businessTypes } from "@/lib/business-types";
import {
  Loader2,
  Search,
  Mail,
  Phone,
  Building2,
  MessageCircle,
  X,
  Trash2,
  Eye,
  Pencil,
  Calendar,
  Clock,
  Briefcase,
  Save,
  CheckSquare,
  Square,
} from "lucide-react";

type Status = "NEW" | "CONTACTED" | "SCHEDULED" | "COMPLETED" | "CLOSED";

interface Enquiry {
  id: string;
  name: string;
  email: string;
  company: string | null;
  businessType: string | null;
  contactNo: string | null;
  whatsappNo: string | null;
  phone: string | null;
  message: string;
  demoDate: string | null;
  demoTime: string | null;
  source: string;
  status: Status;
  notes: string | null;
  ipAddress: string | null;
  contactedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Summary {
  total: number;
  new: number;
  contacted: number;
  scheduled: number;
  completed: number;
  closed: number;
}

const STATUS_OPTIONS: Status[] = ["NEW", "CONTACTED", "SCHEDULED", "COMPLETED", "CLOSED"];

const STATUS_STYLES: Record<Status, string> = {
  NEW: "bg-blue-50 text-blue-600 border-blue-100",
  CONTACTED: "bg-amber-50 text-amber-600 border-amber-100",
  SCHEDULED: "bg-indigo-50 text-indigo-600 border-indigo-100",
  COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-100",
  CLOSED: "bg-zinc-100 text-zinc-500 border-zinc-200/60",
};

export function DemoEnquiryClient() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Status>("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [viewing, setViewing] = useState<Enquiry | null>(null);
  const [editing, setEditing] = useState<Enquiry | null>(null);
  const [deleting, setDeleting] = useState<{ ids: string[] } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/demo-enquiry");
      if (!res.ok) throw new Error("Failed to load enquiries");
      const data = await res.json();
      setEnquiries(data.enquiries || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      toast.error(err.message || "Failed to load enquiries");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return enquiries.filter((e) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.company || "").toLowerCase().includes(q) ||
        e.message.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [enquiries, query, statusFilter]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((e) => selectedIds.has(e.id));
  const someFilteredSelected =
    filtered.some((e) => selectedIds.has(e.id)) && !allFilteredSelected;

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((e) => next.delete(e.id));
      } else {
        filtered.forEach((e) => next.add(e.id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveEdit = async (patch: Partial<Enquiry>) => {
    if (!editing) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/demo-enquiry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...patch }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Update failed");
      setEnquiries((prev) => prev.map((e) => (e.id === editing.id ? data.enquiry : e)));
      toast.success("Enquiry updated");
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (id: string, status: Status) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/demo-enquiry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Update failed");
      setEnquiries((prev) => prev.map((e) => (e.id === id ? data.enquiry : e)));
      if (viewing?.id === id) setViewing(data.enquiry);
      toast.success(`Status changed to ${status}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setIsSaving(false);
    }
  };

  const performDelete = async () => {
    if (!deleting) return;
    setIsSaving(true);
    try {
      const ids = deleting.ids;
      const res = await fetch("/api/admin/demo-enquiry", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setEnquiries((prev) => prev.filter((e) => !ids.includes(e.id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      toast.success(`Deleted ${data.count} enquir${data.count === 1 ? "y" : "ies"}`);
      setDeleting(null);
      // Reload summary
      load();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-zinc-900">Demo Enquiries</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Inbound demo and contact requests from the website</p>
      </div>

      {/* Summary cards (act as status filters) */}
      {summary && (
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total", value: summary.total, key: "ALL" as const },
            { label: "New", value: summary.new, key: "NEW" as const },
            { label: "Contacted", value: summary.contacted, key: "CONTACTED" as const },
            { label: "Scheduled", value: summary.scheduled, key: "SCHEDULED" as const },
            { label: "Completed", value: summary.completed, key: "COMPLETED" as const },
            { label: "Closed", value: summary.closed, key: "CLOSED" as const },
          ].map((card) => (
            <button
              key={card.label}
              onClick={() => setStatusFilter(card.key)}
              className={cn(
                "bg-white border rounded-xl p-3.5 text-left transition-colors cursor-pointer",
                statusFilter === card.key
                  ? "border-zinc-300"
                  : "border-zinc-200/70 hover:border-zinc-300"
              )}
            >
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                {card.label}
              </span>
              <p className="text-lg font-bold text-zinc-900 mt-0.5">{card.value}</p>
            </button>
          ))}
        </section>
      )}

      {/* Toolbar: bulk-action bar + search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-500">
          {selectedIds.size > 0 ? (
            <>
              <span className="px-2 py-1 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200/70">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => setDeleting({ ids: Array.from(selectedIds) })}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            </>
          ) : (
            <span className="text-zinc-400">{filtered.length} enquir{filtered.length === 1 ? "y" : "ies"}</span>
          )}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, email, message..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-full sm:w-64 pl-8 pr-3 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-300"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[11px] text-zinc-600">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase text-[9px] tracking-wider bg-zinc-50/50">
                <th className="py-3 px-4 w-10">
                  <button
                    onClick={toggleAll}
                    className="flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors"
                    title={allFilteredSelected ? "Deselect all" : "Select all"}
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-zinc-700" />
                    ) : someFilteredSelected ? (
                      <div className="w-3.5 h-3.5 rounded-sm border border-zinc-400 bg-white flex items-center justify-center">
                        <div className="w-1.5 h-0.5 bg-zinc-700 rounded" />
                      </div>
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Company</th>
                <th className="py-3 px-3">Demo Slot</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Submitted</th>
                <th className="py-3 px-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((e) => {
                const isSelected = selectedIds.has(e.id);
                return (
                  <tr
                    key={e.id}
                    className={cn(
                      "transition-colors",
                      isSelected ? "bg-zinc-50" : "hover:bg-zinc-50/50"
                    )}
                  >
                    <td className="py-2.5 px-4">
                      <button
                        onClick={() => toggleOne(e.id)}
                        className="flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-zinc-700" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-zinc-900">{e.name}</td>
                    <td className="py-2.5 px-3 font-semibold text-zinc-500">{e.email}</td>
                    <td className="py-2.5 px-3 font-semibold text-zinc-650">{e.company || "—"}</td>
                    <td className="py-2.5 px-3 font-semibold text-zinc-650">
                      {e.demoDate ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          {new Date(e.demoDate).toLocaleDateString()}
                          {e.demoTime && <span className="text-zinc-400">· {e.demoTime}</span>}
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-bold border",
                          STATUS_STYLES[e.status]
                        )}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-500 whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewing(e)}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditing(e)}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleting({ ids: [e.id] })}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-400">
                    No enquiries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {viewing && (
        <Modal onClose={() => setViewing(null)} title="Enquiry Details" wide>
          <div className="space-y-4">
            {/* Header info */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-900">{viewing.name}</h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Submitted {new Date(viewing.createdAt).toLocaleString()} · Source: {viewing.source.replace("_", " ")}
                </p>
              </div>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-md text-[9px] font-bold border self-start",
                  STATUS_STYLES[viewing.status]
                )}
              >
                {viewing.status}
              </span>
            </div>

            {/* Status quick-change */}
            <div className="bg-zinc-50 border border-zinc-200/70 rounded-lg p-3">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Quick Status
              </span>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    disabled={isSaving}
                    onClick={() => updateStatus(viewing.id, s)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[9px] font-bold border transition-colors",
                      viewing.status === s
                        ? STATUS_STYLES[s]
                        : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailRow icon={<Mail className="w-3.5 h-3.5 text-zinc-400" />} label="Email">
                <a href={`mailto:${viewing.email}`} className="hover:underline">{viewing.email}</a>
              </DetailRow>
              {(viewing.contactNo || viewing.phone) && (
                <DetailRow icon={<Phone className="w-3.5 h-3.5 text-zinc-400" />} label="Contact">
                  <a href={`tel:${viewing.contactNo || viewing.phone}`} className="hover:underline">
                    {viewing.contactNo || viewing.phone}
                  </a>
                </DetailRow>
              )}
              {viewing.whatsappNo && (
                <DetailRow icon={<MessageCircle className="w-3.5 h-3.5 text-emerald-500" />} label="WhatsApp">
                  <a
                    href={`https://wa.me/${viewing.whatsappNo.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {viewing.whatsappNo}
                  </a>
                </DetailRow>
              )}
              {viewing.company && (
                <DetailRow icon={<Building2 className="w-3.5 h-3.5 text-zinc-400" />} label="Company">
                  {viewing.company}
                </DetailRow>
              )}
              {viewing.businessType && (
                <DetailRow icon={<Briefcase className="w-3.5 h-3.5 text-zinc-400" />} label="Business Type">
                  {viewing.businessType}
                </DetailRow>
              )}
              {viewing.demoDate && (
                <DetailRow icon={<Calendar className="w-3.5 h-3.5 text-zinc-400" />} label="Demo Date">
                  {new Date(viewing.demoDate).toLocaleDateString(undefined, {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </DetailRow>
              )}
              {viewing.demoTime && (
                <DetailRow icon={<Clock className="w-3.5 h-3.5 text-zinc-400" />} label="Demo Time">
                  {viewing.demoTime}
                </DetailRow>
              )}
            </div>

            {/* Message */}
            <div>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Message
              </span>
              <div className="bg-zinc-50 border border-zinc-200/70 rounded-lg p-3 text-[11px] text-zinc-700 whitespace-pre-wrap leading-relaxed">
                {viewing.message || <span className="text-zinc-400">No message provided</span>}
              </div>
            </div>

            {/* Notes */}
            {viewing.notes && (
              <div>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Internal Notes
                </span>
                <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3 text-[11px] text-zinc-700 whitespace-pre-wrap leading-relaxed">
                  {viewing.notes}
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => {
                  setEditing(viewing);
                  setViewing(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-[11px] font-bold text-zinc-700"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button
                onClick={() => setViewing(null)}
                className="px-3 h-8 rounded-lg bg-zinc-900 hover:bg-black text-white text-[11px] font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editing && (
        <Modal onClose={() => setEditing(null)} title="Edit Enquiry" wide>
          <EditForm
            enquiry={editing}
            isSaving={isSaving}
            onCancel={() => setEditing(null)}
            onSave={saveEdit}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleting && (
        <Modal onClose={() => setDeleting(null)} title="Delete enquiry?">
          <div className="space-y-4">
            <p className="text-[12px] text-zinc-600 leading-relaxed">
              {deleting.ids.length === 1
                ? "This will permanently delete the selected enquiry. This action cannot be undone."
                : `This will permanently delete ${deleting.ids.length} enquiries. This action cannot be undone.`}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleting(null)}
                disabled={isSaving}
                className="px-3 h-8 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-[11px] font-bold text-zinc-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={performDelete}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-zinc-900 hover:bg-black text-white text-[11px] font-bold disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================================================== */
/*                           HELPERS                                */
/* ============================================================== */

function Modal({
  onClose,
  title,
  children,
  wide = false,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  // Lock body scroll while open + mark mounted for portal
  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full bg-white border border-zinc-200 rounded-2xl my-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150",
          wide ? "max-w-2xl" : "max-w-md"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100">
          <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-50 border border-zinc-200/60 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-[12px] font-semibold text-zinc-800">{children}</div>
    </div>
  );
}

function EditForm({
  enquiry,
  isSaving,
  onCancel,
  onSave,
}: {
  enquiry: Enquiry;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (patch: Partial<Enquiry>) => void;
}) {
  const [form, setForm] = useState({
    name: enquiry.name,
    email: enquiry.email,
    company: enquiry.company || "",
    businessType: enquiry.businessType || "",
    contactNo: enquiry.contactNo || "",
    whatsappNo: enquiry.whatsappNo || "",
    status: enquiry.status,
    demoDate: enquiry.demoDate ? new Date(enquiry.demoDate).toISOString().split("T")[0] : "",
    demoTime: enquiry.demoTime || "",
    message: enquiry.message,
    notes: enquiry.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: form.name,
      email: form.email,
      company: form.company || null,
      businessType: form.businessType || null,
      contactNo: form.contactNo || null,
      whatsappNo: form.whatsappNo || null,
      status: form.status,
      demoDate: form.demoDate || null,
      demoTime: form.demoTime || null,
      message: form.message,
      notes: form.notes,
    } as Partial<Enquiry>);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Full Name" required>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Work Email" required>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Company">
          <input
            type="text"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Business Type">
          <select
            value={form.businessType}
            onChange={(e) => setForm({ ...form, businessType: e.target.value })}
            className={inputCls}
          >
            <option value="">Select business type</option>
            {businessTypes.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </Field>
        <Field label="Contact Number">
          <input
            type="text"
            value={form.contactNo}
            onChange={(e) => setForm({ ...form, contactNo: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="WhatsApp Number">
          <input
            type="text"
            value={form.whatsappNo}
            onChange={(e) => setForm({ ...form, whatsappNo: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Demo Date">
          <input
            type="date"
            value={form.demoDate}
            onChange={(e) => setForm({ ...form, demoDate: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Demo Time">
          <input
            type="time"
            step={900}
            value={form.demoTime}
            onChange={(e) => setForm({ ...form, demoTime: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
            className={inputCls}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Message">
        <textarea
          rows={3}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={cn(inputCls, "resize-none py-2")}
        />
      </Field>

      <Field label="Internal Notes">
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Visible only to admins..."
          className={cn(inputCls, "resize-none py-2")}
        />
      </Field>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-3 h-8 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-[11px] font-bold text-zinc-700 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-zinc-900 hover:bg-black text-white text-[11px] font-bold disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save Changes
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "h-9 w-full px-3 rounded-lg bg-white border border-zinc-200 text-[11px] font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-300 transition-all";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-zinc-500">
        {label} {required && <span className="text-zinc-400">*</span>}
      </label>
      {children}
    </div>
  );
}

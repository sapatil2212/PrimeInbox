"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Pencil,
  Trash2,
  X,
  Save,
  CheckSquare,
  Square,
  Mail,
  Building2,
  Shield,
  Clock,
  Calendar,
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  profileImage: string | null;
  lastLogin: string | null;
  createdAt: string;
  company: string;
  companySlug: string | null;
}

interface Summary {
  total: number;
  verified: number;
  active: number;
  roleCounts: Record<string, number>;
}

const ROLES = ["SUPER_ADMIN", "OWNER", "ADMIN", "MANAGER", "USER"];
const STATUSES = ["ACTIVE", "INACTIVE", "PENDING_VERIFICATION"];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-600 border-emerald-100",
  INACTIVE: "bg-zinc-100 text-zinc-500 border-zinc-200/60",
  PENDING_VERIFICATION: "bg-amber-50 text-amber-600 border-amber-100",
};

export function UsersClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [viewing, setViewing] = useState<AdminUser | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<{ ids: string[] } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users || []);
      setSummary(data.summary || null);
      setCurrentUserId(data.currentUserId || null);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = query.toLowerCase();
      const matchesQuery =
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.company.toLowerCase().includes(q);
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  // Selectable rows exclude the current admin (can't delete self)
  const selectableFiltered = filtered.filter((u) => u.id !== currentUserId);
  const allFilteredSelected =
    selectableFiltered.length > 0 && selectableFiltered.every((u) => selectedIds.has(u.id));
  const someFilteredSelected =
    selectableFiltered.some((u) => selectedIds.has(u.id)) && !allFilteredSelected;

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) selectableFiltered.forEach((u) => next.delete(u.id));
      else selectableFiltered.forEach((u) => next.add(u.id));
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

  const saveEdit = async (patch: Partial<AdminUser>) => {
    if (!editing) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...patch }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Update failed");
      setUsers((prev) => prev.map((u) => (u.id === editing.id ? data.user : u)));
      toast.success("User updated");
      setEditing(null);
      load();
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const performDelete = async () => {
    if (!deleting) return;
    setIsSaving(true);
    try {
      const ids = deleting.ids;
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setUsers((prev) => prev.filter((u) => !ids.includes(u.id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      toast.success(`Deleted ${data.count} user${data.count === 1 ? "" : "s"}`);
      setDeleting(null);
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

  const roleTabs = ["ALL", ...ROLES];

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-zinc-900">Users</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Platform-wide user accounts</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-zinc-200/70 rounded-xl p-4">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Total</span>
            <p className="text-xl font-bold text-zinc-900 mt-0.5">{summary.total}</p>
          </div>
          <div className="bg-white border border-zinc-200/70 rounded-xl p-4">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Verified</span>
            <p className="text-xl font-bold text-zinc-900 mt-0.5">{summary.verified}</p>
          </div>
          <div className="bg-white border border-zinc-200/70 rounded-xl p-4">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Active</span>
            <p className="text-xl font-bold text-zinc-900 mt-0.5">{summary.active}</p>
          </div>
          <div className="bg-white border border-zinc-200/70 rounded-xl p-4">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Admins</span>
            <p className="text-xl font-bold text-zinc-900 mt-0.5">
              {(summary.roleCounts["SUPER_ADMIN"] || 0) + (summary.roleCounts["OWNER"] || 0) + (summary.roleCounts["ADMIN"] || 0)}
            </p>
          </div>
        </section>
      )}

      {/* Role filters */}
      <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-lg border border-zinc-200/70 overflow-x-auto w-fit max-w-full">
        {roleTabs.map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={cn(
              "px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider uppercase transition-colors cursor-pointer whitespace-nowrap",
              roleFilter === r
                ? "bg-white text-zinc-700 border border-zinc-200"
                : "text-zinc-400 hover:text-zinc-700"
            )}
          >
            {r.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Toolbar: bulk actions + search */}
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
            <span className="text-zinc-400">{filtered.length} user{filtered.length === 1 ? "" : "s"}</span>
          )}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, email, company..."
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
                <th className="py-3 px-3 text-center">Role</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Verified</th>
                <th className="py-3 px-3 text-right">Last Login</th>
                <th className="py-3 px-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((u) => {
                const isSelf = u.id === currentUserId;
                const isSelected = selectedIds.has(u.id);
                return (
                  <tr
                    key={u.id}
                    className={cn(
                      "transition-colors",
                      isSelected ? "bg-zinc-50" : "hover:bg-zinc-50/50"
                    )}
                  >
                    <td className="py-2.5 px-4">
                      {isSelf ? (
                        <span className="block w-3.5 h-3.5" title="You cannot select your own account" />
                      ) : (
                        <button
                          onClick={() => toggleOne(u.id)}
                          className="flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-zinc-700" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-zinc-100 border border-zinc-200/70 flex items-center justify-center text-zinc-600 font-bold text-[9px] overflow-hidden shrink-0">
                          {u.profileImage ? (
                            <img src={u.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                          )}
                        </div>
                        <span className="font-bold text-zinc-900">
                          {u.name}
                          {isSelf && <span className="ml-1.5 text-[8px] font-bold text-zinc-400 uppercase">(you)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-zinc-500">{u.email}</td>
                    <td className="py-2.5 px-3 font-semibold text-zinc-600">{u.company}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200/60">
                        {u.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-bold border",
                          STATUS_STYLES[u.status] || "bg-zinc-100 text-zinc-500 border-zinc-200/60"
                        )}
                      >
                        {u.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex justify-center">
                        {u.emailVerified ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-zinc-300" />
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-500 whitespace-nowrap">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "Never"}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewing(u)}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditing(u)}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleting({ ids: [u.id] })}
                          disabled={isSelf}
                          className={cn(
                            "p-1.5 rounded-md transition-colors",
                            isSelf
                              ? "text-zinc-200 cursor-not-allowed"
                              : "text-zinc-400 hover:text-red-600 hover:bg-red-50"
                          )}
                          title={isSelf ? "You cannot delete your own account" : "Delete"}
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
                  <td colSpan={9} className="py-8 text-center text-zinc-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {viewing && (
        <Modal onClose={() => setViewing(null)} title="User Details" wide>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200/70 flex items-center justify-center text-zinc-600 font-bold text-sm overflow-hidden shrink-0">
                {viewing.profileImage ? (
                  <img src={viewing.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  viewing.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">{viewing.name}</h2>
                <p className="text-[11px] text-zinc-400">{viewing.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailRow icon={<Mail className="w-3.5 h-3.5 text-zinc-400" />} label="Email">
                <a href={`mailto:${viewing.email}`} className="hover:underline">{viewing.email}</a>
              </DetailRow>
              <DetailRow icon={<Shield className="w-3.5 h-3.5 text-zinc-400" />} label="Role">
                {viewing.role.replace("_", " ")}
              </DetailRow>
              <DetailRow icon={<Building2 className="w-3.5 h-3.5 text-zinc-400" />} label="Company">
                {viewing.company}
              </DetailRow>
              <DetailRow icon={<CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />} label="Status">
                {viewing.status.replace("_", " ")}
              </DetailRow>
              <DetailRow icon={<CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />} label="Email Verified">
                {viewing.emailVerified ? "Yes" : "No"}
              </DetailRow>
              <DetailRow icon={<Clock className="w-3.5 h-3.5 text-zinc-400" />} label="Last Login">
                {viewing.lastLogin ? new Date(viewing.lastLogin).toLocaleString() : "Never"}
              </DetailRow>
              <DetailRow icon={<Calendar className="w-3.5 h-3.5 text-zinc-400" />} label="Member Since">
                {new Date(viewing.createdAt).toLocaleDateString()}
              </DetailRow>
            </div>

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
        <Modal onClose={() => setEditing(null)} title="Edit User" wide>
          <EditForm
            user={editing}
            isSelf={editing.id === currentUserId}
            isSaving={isSaving}
            onCancel={() => setEditing(null)}
            onSave={saveEdit}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <Modal onClose={() => setDeleting(null)} title="Delete user?">
          <div className="space-y-4">
            <p className="text-[12px] text-zinc-600 leading-relaxed">
              {deleting.ids.length === 1
                ? "This will permanently delete the selected user and all their associated data. This action cannot be undone."
                : `This will permanently delete ${deleting.ids.length} users and all their associated data. This action cannot be undone.`}
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
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================ HELPERS ============================ */

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

function EditForm({
  user,
  isSelf,
  isSaving,
  onCancel,
  onSave,
}: {
  user: AdminUser;
  isSelf: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (patch: Partial<AdminUser>) => void;
}) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: form.name,
      email: form.email,
      role: form.role,
      status: form.status,
      emailVerified: form.emailVerified,
    } as Partial<AdminUser>);
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
        <Field label="Email" required>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Role">
          <select
            value={form.role}
            disabled={isSelf}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className={cn(inputCls, isSelf && "opacity-60 cursor-not-allowed")}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r.replace("_", " ")}</option>
            ))}
          </select>
          {isSelf && (
            <span className="text-[9px] text-zinc-400 font-medium">You cannot change your own role</span>
          )}
        </Field>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className={inputCls}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-[11px] font-semibold text-zinc-600 cursor-pointer">
        <input
          type="checkbox"
          checked={form.emailVerified}
          onChange={(e) => setForm({ ...form, emailVerified: e.target.checked })}
          className="h-3.5 w-3.5 rounded border-zinc-300 accent-zinc-900"
        />
        Email verified
      </label>

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

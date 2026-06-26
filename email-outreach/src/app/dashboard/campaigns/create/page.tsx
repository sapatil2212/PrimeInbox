"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/feedback";
import {
  ArrowLeft,
  Save,
  Loader2,
  Users,
  Mail,
  Server,
  Clock,
  Send,
  Search,
  Check,
  ChevronDown,
  Shuffle,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownItem {
  id: string;
  name: string;
}

interface SmtpItem extends DropdownItem {
  fromEmail: string;
  fromName: string;
}

interface ListItem extends DropdownItem {
  count?: number;
}

type SenderMode = "pool" | "single";

export default function CreateCampaignPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState<null | "draft" | "start">(null);

  // Option sources
  const [smtpAccounts, setSmtpAccounts] = useState<SmtpItem[]>([]);
  const [leadLists, setLeadLists] = useState<ListItem[]>([]);
  const [templates, setTemplates] = useState<DropdownItem[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [senderMode, setSenderMode] = useState<SenderMode>("pool");
  const [poolAccountIds, setPoolAccountIds] = useState<string[]>([]);
  const [singleAccountId, setSingleAccountId] = useState("");
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [delayMin, setDelayMin] = useState(30);
  const [delayMax, setDelayMax] = useState(180);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accRes, listRes, tplRes] = await Promise.all([
          fetch("/api/smtp/accounts"),
          fetch("/api/leads/lists"),
          fetch("/api/templates"),
        ]);

        if (accRes.ok) {
          const data = await accRes.json();
          setSmtpAccounts(
            (data.accounts || []).map((a: any) => ({
              id: a.id,
              name: `${a.fromName} <${a.fromEmail}>`,
              fromEmail: a.fromEmail,
              fromName: a.fromName,
            }))
          );
        }
        if (listRes.ok) {
          const data = await listRes.json();
          setLeadLists(data.lists || []);
        }
        if (tplRes.ok) {
          const data = await tplRes.json();
          setTemplates((data.templates || []).map((t: any) => ({ id: t.id, name: t.name })));
        }
      } catch (err) {
        console.error("Error loading form data:", err);
        toast.error("Failed to load campaign options.");
      }
    };
    fetchData();
  }, []);

  const allPoolSelected =
    smtpAccounts.length > 0 && poolAccountIds.length === smtpAccounts.length;

  const toggleAllPool = () => {
    setPoolAccountIds(allPoolSelected ? [] : smtpAccounts.map((a) => a.id));
  };

  const togglePoolAccount = (id: string) => {
    setPoolAccountIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const validate = (): string | null => {
    if (!name.trim()) return "Please enter a campaign name.";
    if (senderMode === "single" && !singleAccountId) return "Please select a sender email.";
    if (senderMode === "pool" && poolAccountIds.length === 0)
      return "Select at least one SMTP account for the rotational pool.";
    if (selectedListIds.length === 0) return "Please select at least one client list.";
    if (!templateId) return "Please select an email template.";
    if (delayMin < 0 || delayMax < 0) return "Delay values must be positive.";
    if (delayMax < delayMin) return "Max delay must be greater than or equal to min delay.";
    return null;
  };

  const submit = async (mode: "draft" | "start") => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setIsSaving(mode);
    try {
      // For a rotational pool, send the explicit account subset. If every account
      // is selected we leave it null so the sender uses all active accounts.
      const sendingAllAccounts =
        senderMode === "pool" && poolAccountIds.length === smtpAccounts.length;

      const payload = {
        name: name.trim(),
        leadListIds: selectedListIds,
        templateId,
        smtpAccountId: senderMode === "single" ? singleAccountId : null,
        smtpAccountIds:
          senderMode === "pool" && !sendingAllAccounts ? poolAccountIds : null,
        rotationType: "ROUND_ROBIN",
        delayMin,
        delayMax,
        startNow: mode === "start",
      };

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create campaign");
      }

      const data = await res.json();
      toast.success(
        mode === "start"
          ? "Campaign created and sending started!"
          : "Campaign saved as draft."
      );
      router.push(`/dashboard/campaigns/${data.campaign.id}`);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-3xl mx-auto w-full">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard/campaigns"
          className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-500 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-800">New Campaign</h1>
          <p className="text-sm text-zinc-500 font-medium">
            Set up your sender pool, audience, and message, then launch.
          </p>
        </div>
      </header>

      {/* Campaign name */}
      <Section icon={<Mail className="w-4 h-4" />} title="Campaign name">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Q3 SaaS Outreach"
          className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </Section>

      {/* SMTP sender pool */}
      <Section icon={<Server className="w-4 h-4" />} title="SMTP sender pool">
        <div className="flex gap-2 mb-4">
          <ModeTab
            active={senderMode === "pool"}
            onClick={() => setSenderMode("pool")}
            icon={<Shuffle className="w-3.5 h-3.5" />}
            label="Rotational Pool"
          />
          <ModeTab
            active={senderMode === "single"}
            onClick={() => setSenderMode("single")}
            icon={<User className="w-3.5 h-3.5" />}
            label="Single Sender"
          />
        </div>

        {smtpAccounts.length === 0 ? (
          <p className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            No SMTP accounts found.{" "}
            <Link href="/dashboard/smtp" className="underline">
              Add one first
            </Link>
            .
          </p>
        ) : senderMode === "pool" ? (
          <div className="border border-zinc-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={toggleAllPool}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-all"
            >
              <span className="flex items-center gap-2">
                <CheckBox checked={allPoolSelected} />
                Select all ({smtpAccounts.length})
              </span>
              <span className="text-zinc-400 font-semibold">
                {poolAccountIds.length} selected
              </span>
            </button>
            <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100">
              {smtpAccounts.map((acc) => {
                const checked = poolAccountIds.includes(acc.id);
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => togglePoolAccount(acc.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-indigo-50/50 transition-all"
                  >
                    <CheckBox checked={checked} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-zinc-800 truncate">
                        {acc.fromName}
                      </span>
                      <span className="block text-[11px] text-zinc-500 truncate">
                        {acc.fromEmail}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <SearchSelect
            placeholder="Select a sender email..."
            items={smtpAccounts}
            value={singleAccountId}
            onChange={setSingleAccountId}
          />
        )}
      </Section>

      {/* Client list */}
      <Section icon={<Users className="w-4 h-4" />} title="Client list">
        <MultiSearchSelect
          placeholder="Search and select client lists..."
          items={leadLists.map((l) => ({
            id: l.id,
            name: l.count != null ? `${l.name} (${l.count})` : l.name,
          }))}
          values={selectedListIds}
          onChange={setSelectedListIds}
          emptyHint="No client lists found. Import leads first."
        />
      </Section>

      {/* Email template */}
      <Section icon={<Mail className="w-4 h-4" />} title="Email template">
        <SearchSelect
          placeholder="Select an email template..."
          items={templates}
          value={templateId}
          onChange={setTemplateId}
          emptyHint="No templates found. Create one first."
        />
      </Section>

      {/* Anti-spam delay */}
      <Section icon={<Clock className="w-4 h-4" />} title="Anti-spam delay (seconds)">
        <div className="flex items-center gap-4">
          <label className="flex-1">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Min delay
            </span>
            <input
              type="number"
              min={0}
              value={delayMin}
              onChange={(e) => setDelayMin(Number(e.target.value))}
              className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <span className="text-zinc-400 font-bold pt-5">to</span>
          <label className="flex-1">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Max delay
            </span>
            <input
              type="number"
              min={0}
              value={delayMax}
              onChange={(e) => setDelayMax(Number(e.target.value))}
              className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </div>
        <p className="text-[11px] text-zinc-400 font-medium mt-2">
          A random wait between {delayMin}s and {delayMax}s is applied between each email to protect deliverability.
        </p>
      </Section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sticky bottom-0 bg-zinc-50/80 backdrop-blur py-4 -mx-1 px-1 border-t border-zinc-200">
        <button
          type="button"
          disabled={isSaving !== null}
          onClick={() => submit("draft")}
          className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-sm font-bold border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-all disabled:opacity-60"
        >
          {isSaving === "draft" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save as Draft
        </button>
        <button
          type="button"
          disabled={isSaving !== null}
          onClick={() => submit("start")}
          className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-60"
        >
          {isSaving === "start" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Create &amp; Start Campaign
        </button>
      </div>
    </div>
  );
}

/* ---------------------------- Sub-components ---------------------------- */

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-zinc-200 rounded-2xl p-5">
      <h2 className="flex items-center gap-2 text-sm font-extrabold text-zinc-800 mb-4">
        <span className="text-indigo-500">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ModeTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold border transition-all",
        active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all",
        checked ? "bg-indigo-600 border-indigo-600" : "bg-white border-zinc-300"
      )}
    >
      {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </span>
  );
}

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}

function SearchSelect({
  placeholder,
  items,
  value,
  onChange,
  emptyHint,
}: {
  placeholder: string;
  items: DropdownItem[];
  value: string;
  onChange: (v: string) => void;
  emptyHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useClickOutside(() => setOpen(false));

  const selected = items.find((i) => i.id === value);
  const filtered = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-left outline-none focus:border-indigo-400"
      >
        <span className={selected ? "text-zinc-800 truncate" : "text-zinc-400"}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100">
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full text-sm outline-none text-zinc-800 placeholder-zinc-400"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-zinc-400 font-medium">
                {emptyHint || "No results."}
              </p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-semibold text-zinc-700 hover:bg-indigo-50/60 transition-all"
                >
                  <span className="truncate">{item.name}</span>
                  {item.id === value && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MultiSearchSelect({
  placeholder,
  items,
  values,
  onChange,
  emptyHint,
}: {
  placeholder: string;
  items: DropdownItem[];
  values: string[];
  onChange: (v: string[]) => void;
  emptyHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useClickOutside(() => setOpen(false));

  const filtered = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  );

  const toggle = (id: string) =>
    onChange(values.includes(id) ? values.filter((x) => x !== id) : [...values, id]);

  const label =
    values.length === 0
      ? placeholder
      : `${values.length} list${values.length > 1 ? "s" : ""} selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-left outline-none focus:border-indigo-400"
      >
        <span className={values.length ? "text-zinc-800 truncate" : "text-zinc-400"}>
          {label}
        </span>
        <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100">
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lists..."
              className="w-full text-sm outline-none text-zinc-800 placeholder-zinc-400"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-zinc-400 font-medium">
                {emptyHint || "No results."}
              </p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-zinc-700 hover:bg-indigo-50/60 transition-all"
                >
                  <CheckBox checked={values.includes(item.id)} />
                  <span className="truncate">{item.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/feedback";
import {
  Loader2,
  Search,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  FileDown,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  companyId: string;
  companyName: string;
  slug: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
  payments: {
    id: string;
    transactionId: string;
    status: string;
    provider: string;
    amount: number;
    currency: string;
    createdAt: string;
  }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

const PAY_STATUS_STYLES: Record<string, string> = {
  SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
};

export function TransactionsClient() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: p.toString(), limit: "25" });
        if (statusFilter) params.set("status", statusFilter);
        if (fromDate) params.set("from", fromDate);
        if (toDate) params.set("to", toDate);

        const res = await fetch(`/api/admin/invoices?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setInvoices(data.invoices || []);
        setPagination(data.pagination);
      } catch (err: any) {
        toast.error(err.message || "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    },
    [page, statusFilter, fromDate, toDate]
  );

  useEffect(() => {
    fetchData(page);
  }, [page, statusFilter, fromDate, toDate]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const downloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/pdf`);
      if (!res.ok) { toast.error("Failed to generate PDF"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Invoice PDF downloaded");
    } catch {
      toast.error("Failed to download PDF");
    }
  };

  // Client-side query filter (name / invoice number)
  const filtered = invoices.filter((inv) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      inv.companyName.toLowerCase().includes(q) ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.payments.some((p) => p.transactionId?.toLowerCase().includes(q))
    );
  });

  // CSV Export
  const exportCsv = () => {
    const headers = [
      "Invoice Number",
      "Workspace",
      "Slug",
      "Plan",
      "Amount (INR)",
      "Status",
      "Transaction ID",
      "Payment Status",
      "Provider",
      "Date",
    ];

    const rows = invoices.map((inv) => {
      const pay = inv.payments[0];
      return [
        inv.invoiceNumber,
        inv.companyName,
        inv.slug,
        inv.plan,
        inv.amount,
        inv.status,
        pay?.transactionId ?? "",
        pay?.status ?? "",
        pay?.provider ?? "",
        new Date(inv.createdAt).toISOString().slice(0, 10),
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `primeinbox-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-zinc-900">Transaction History</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Complete invoice & payment records across all tenants
            {pagination.total > 0 && (
              <span className="ml-2 text-indigo-600 font-semibold">{pagination.total} total</span>
            )}
          </p>
        </div>
        <div className="flex gap-2 self-start">
          <button
            onClick={exportCsv}
            className="h-8 px-3.5 rounded-xl bg-indigo-600 text-white text-[11px] font-bold flex items-center gap-1.5 hover:bg-indigo-700 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={() => fetchData(page)}
            className="h-8 px-3.5 rounded-xl bg-white border border-zinc-200 text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-zinc-200/70 rounded-xl p-4 flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, invoice #, or Tx ID…"
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-300"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-8 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] font-bold text-zinc-700 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="PAID">PAID</option>
          <option value="PENDING">PENDING</option>
          <option value="FAILED">FAILED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="h-8 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none"
          />
          <span className="text-[11px] text-zinc-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="h-8 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none"
          />
        </div>
        {(statusFilter || fromDate || toDate) && (
          <button
            onClick={() => { setStatusFilter(""); setFromDate(""); setToDate(""); setPage(1); }}
            className="h-8 px-3 rounded-lg bg-zinc-100 text-[11px] font-bold text-zinc-600 hover:bg-zinc-200 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/60">
                {[
                  "Invoice #",
                  "Workspace",
                  "Plan",
                  "Amount",
                  "Invoice Status",
                  "Transaction ID (Zoho)",
                  "Payment",
                  "Provider",
                  "Date",
                  "PDF",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-zinc-400 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-zinc-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-zinc-400 text-[11px]">
                    No transactions found.
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((inv) => {
                  const pay = inv.payments[0];
                  return (
                    <tr key={inv.id} className="hover:bg-zinc-50/50 transition-colors">
                      {/* Invoice # */}
                      <td className="px-4 py-3">
                        <p className="font-mono text-[10px] font-bold text-indigo-700">{inv.invoiceNumber}</p>
                        <p className="text-[9px] text-zinc-400 font-mono">{inv.id.slice(-8)}</p>
                      </td>

                      {/* Workspace */}
                      <td className="px-4 py-3">
                        <p className="font-bold text-zinc-900">{inv.companyName}</p>
                        <p className="text-[9px] text-zinc-400">/{inv.slug}</p>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {inv.plan}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 font-black text-zinc-900 text-[11px]">
                        ₹{inv.amount.toLocaleString("en-IN")}
                      </td>

                      {/* Invoice Status */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[9px] font-bold border flex items-center gap-1 w-fit",
                            STATUS_STYLES[inv.status] || "bg-zinc-100 text-zinc-500 border-zinc-200"
                          )}
                        >
                          {inv.status === "PAID" ? <CheckCircle2 className="w-2.5 h-2.5" /> : inv.status === "FAILED" ? <XCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                          {inv.status}
                        </span>
                      </td>

                      {/* Zoho Transaction ID */}
                      <td className="px-4 py-3">
                        {pay?.transactionId ? (
                          <p className="font-mono text-[10px] text-zinc-800 font-bold">{pay.transactionId}</p>
                        ) : (
                          <span className="text-[9px] text-zinc-400">—</span>
                        )}
                      </td>

                      {/* Payment status */}
                      <td className="px-4 py-3">
                        {pay ? (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[9px] font-bold border",
                              PAY_STATUS_STYLES[pay.status] || "bg-zinc-100 text-zinc-500 border-zinc-200"
                            )}
                          >
                            {pay.status}
                          </span>
                        ) : (
                          <span className="text-[9px] text-zinc-400">—</span>
                        )}
                      </td>

                      {/* Provider */}
                      <td className="px-4 py-3 text-[10px] font-semibold text-zinc-600 uppercase">
                        {pay?.provider ?? "—"}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-[10px] text-zinc-500 font-medium whitespace-nowrap">
                        {new Date(inv.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                        <br />
                        <span className="text-[9px] text-zinc-400">
                          {new Date(inv.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      {/* PDF Download */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => downloadPdf(inv.id, inv.invoiceNumber)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold transition-colors border border-indigo-100"
                        >
                          <Download className="w-3 h-3" />
                          PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 bg-zinc-50/40">
            <p className="text-[10px] text-zinc-400 font-medium">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              <span className="font-bold text-zinc-600">{pagination.total}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-bold text-zinc-700">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

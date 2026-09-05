"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Download, FileSpreadsheet, Table as TableIcon, Calendar, X } from "lucide-react";
import { exportToCSV, exportToExcel } from "../lib/csv";
import { BreakdownColumn } from "../lib/types";
import { fetchTransactions } from "../lib/api";
import { formatCurrency } from "../lib/format";

interface TransactionRow {
  txn_date: string;
  description: string;
  vendor_name: string;
  account_name: string;
  amount: number;
  type: string;
  is_reconciled: string;
  status: string;
}

const COLUMNS: BreakdownColumn[] = [
  { key: "txn_date", label: "Date", format: "text" },
  { key: "description", label: "Description", format: "text" },
  { key: "vendor_name", label: "Vendor", format: "text" },
  { key: "account_name", label: "Account", format: "text" },
  { key: "type", label: "Type", format: "badge" },
  { key: "amount", label: "Amount (₹)", format: "currency" },
  { key: "is_reconciled", label: "Reconciled", format: "badge" },
  { key: "status", label: "Status", format: "badge" },
];

function statusClass(value: string): string {
  const ok = ["completed", "reconciled"];
  const warn = ["unreconciled", "pending"];
  const danger = ["disputed", "failed"];
  if (ok.includes(value)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (warn.includes(value)) return "bg-amber-50 text-amber-700 border-amber-200";
  if (danger.includes(value)) return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export interface DataExportFilters {
  startDate?: string;
  endDate?: string;
  typeFilter?: string;
  searchQuery?: string;
}

export interface DataExportProps {
  initialFilters?: DataExportFilters;
  onClearInitialFilters?: () => void;
}

export const DataExport: React.FC<DataExportProps> = ({ initialFilters, onClearInitialFilters }) => {
  const [data, setData] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialFilters?.searchQuery || "");
  const [typeFilter, setTypeFilter] = useState(initialFilters?.typeFilter || "all");
  const [startDate, setStartDate] = useState(initialFilters?.startDate || "");
  const [endDate, setEndDate] = useState(initialFilters?.endDate || "");

  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.searchQuery !== undefined) setSearchQuery(initialFilters.searchQuery);
      if (initialFilters.typeFilter !== undefined) setTypeFilter(initialFilters.typeFilter);
      if (initialFilters.startDate !== undefined) setStartDate(initialFilters.startDate);
      if (initialFilters.endDate !== undefined) setEndDate(initialFilters.endDate);
    }
  }, [initialFilters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTransactions()
      .then((rows) => {
        if (!cancelled) setData(rows);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setData([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.filter((row) => {
      if (typeFilter !== "all" && row.type !== typeFilter) return false;
      if (startDate) {
        const rowDate = row.txn_date ? row.txn_date.slice(0, 10) : "";
        if (rowDate && rowDate < startDate) return false;
      }
      if (endDate) {
        const rowDate = row.txn_date ? row.txn_date.slice(0, 10) : "";
        if (rowDate && rowDate > endDate) return false;
      }
      if (!q) return true;
      return Object.values(row).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q));
    });
  }, [data, searchQuery, typeFilter, startDate, endDate]);

  const hasActiveFilters = Boolean(searchQuery || (typeFilter && typeFilter !== "all") || startDate || endDate);

  const handleClearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setStartDate("");
    setEndDate("");
    onClearInitialFilters?.();
  };

  const handleExportCSV = () => {
    exportToCSV(COLUMNS, filteredData, "VersatileFinOps_transactions.csv");
  };

  const handleExportExcel = () => {
    exportToExcel(COLUMNS, filteredData, "VersatileFinOps_transactions.xls");
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all fields..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="all">All Types</option>
          <option value="debit">Debit</option>
          <option value="credit">Credit</option>
        </select>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-medium text-slate-500">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
            title="Start date filter"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-medium text-slate-500">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
            title="End date filter"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors shadow-2xs cursor-pointer shrink-0"
            title="Clear all filters"
            aria-label="Clear all filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={handleExportCSV}
          disabled={filteredData.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs hover:text-blue-600 transition-colors disabled:opacity-50"
          title="Download filtered rows as CSV"
        >
          <Download className="w-4 h-4 text-blue-600" />
          <span>Export CSV</span>
        </button>

        <button
          onClick={handleExportExcel}
          disabled={filteredData.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs hover:text-emerald-600 transition-colors disabled:opacity-50"
          title="Download filtered rows as Excel"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Excel</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Transactions</span>
          </div>
          <span className="text-xs text-slate-500">
            Showing <strong>{filteredData.length}</strong> of {data.length} transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500">Retrieving transactions...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-16 flex items-center justify-center text-slate-500 text-xs">No matching transactions. Adjust search or filters.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  {COLUMNS.map((col) => (
                    <th key={col.key} className="py-3 px-4 whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    {COLUMNS.map((col) => {
                      const val = row[col.key as keyof TransactionRow];
                      if (col.format === "currency") {
                        return (
                          <td key={col.key} className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                            {formatCurrency(Number(val || 0))}
                          </td>
                        );
                      }
                      if (col.format === "badge") {
                        return (
                          <td key={col.key} className="py-2.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusClass(
                                String(val || ""),
                              )}`}
                            >
                              {val || "—"}
                            </span>
                          </td>
                        );
                      }
                      return (
                        <td key={col.key} className="py-2.5 px-4 max-w-xs truncate" title={String(val)}>
                          {val !== null && val !== undefined && val !== "" ? String(val) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

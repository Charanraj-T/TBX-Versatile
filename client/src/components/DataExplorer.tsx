import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  FileSpreadsheet, 
  AlertCircle,
  Building2,
  Receipt,
  BookOpen
} from 'lucide-react';
import { exportToCSV } from '../utils/csv';
import type { BreakdownColumn } from '../types';

type TableKey = 'payouts' | 'transactions' | 'reconciliation' | 'vendors' | 'coa';

export const DataExplorer: React.FC = () => {
  const [activeTable, setActiveTable] = useState<TableKey>('payouts');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTableData = async (table: TableKey) => {
    try {
      setLoading(true);
      const endpoint = table === 'coa' ? '/api/data/chart-of-accounts' : `/api/data/${table}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Failed to load ${table}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData(activeTable);
  }, [activeTable]);

  // Filtered rows
  const filteredData = data.filter((row) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return Object.values(row).some((val) =>
      val !== null && val !== undefined && String(val).toLowerCase().includes(query)
    );
  });

  // Table column configs
  const getColumns = (table: TableKey): BreakdownColumn[] => {
    switch (table) {
      case 'payouts':
        return [
          { key: 'payout_date', label: 'Date', format: 'date' },
          { key: 'vendor_name', label: 'Vendor', format: 'text' },
          { key: 'category', label: 'Category', format: 'text' },
          { key: 'amount', label: 'Amount ($)', format: 'currency' },
          { key: 'status', label: 'Status', format: 'badge' },
          { key: 'invoice_no', label: 'Invoice No', format: 'text' },
          { key: 'payment_method', label: 'Method', format: 'text' },
          { key: 'description', label: 'Description', format: 'text' },
        ];
      case 'transactions':
        return [
          { key: 'txn_date', label: 'Txn Date', format: 'date' },
          { key: 'description', label: 'Description', format: 'text' },
          { key: 'vendor_name', label: 'Vendor', format: 'text' },
          { key: 'account_name', label: 'Account', format: 'text' },
          { key: 'amount', label: 'Amount ($)', format: 'currency' },
          { key: 'type', label: 'Type', format: 'badge' },
          { key: 'is_reconciled', label: 'Reconciled', format: 'badge' },
          { key: 'status', label: 'Status', format: 'badge' },
        ];
      case 'reconciliation':
        return [
          { key: 'txn_date', label: 'Date', format: 'date' },
          { key: 'transaction_id', label: 'Txn ID', format: 'text' },
          { key: 'vendor_name', label: 'Vendor', format: 'text' },
          { key: 'status', label: 'Recon Status', format: 'badge' },
          { key: 'discrepancy_amount', label: 'Discrepancy ($)', format: 'currency' },
          { key: 'notes', label: 'FinOps Audit Notes', format: 'text' },
          { key: 'reviewed_by', label: 'Reviewer', format: 'text' },
        ];
      case 'vendors':
        return [
          { key: 'id', label: 'Vendor ID', format: 'text' },
          { key: 'name', label: 'Company Name', format: 'text' },
          { key: 'category', label: 'Category', format: 'text' },
          { key: 'avg_monthly_spend', label: 'Baseline Monthly Avg', format: 'currency' },
          { key: 'payment_terms', label: 'Terms', format: 'text' },
          { key: 'contact_email', label: 'Billing Email', format: 'text' },
          { key: 'status', label: 'Status', format: 'badge' },
        ];
      case 'coa':
        return [
          { key: 'code', label: 'Account Code', format: 'text' },
          { key: 'name', label: 'Account Name', format: 'text' },
          { key: 'category', label: 'Category', format: 'text' },
          { key: 'normal_balance', label: 'Normal Balance', format: 'badge' },
        ];
    }
  };

  const currentColumns = getColumns(activeTable);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Ledger Explorer</h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 font-medium">
              Ground-Truth Source of Truth
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse and verify the raw records used by the assistant to compute every metric and aggregate.
          </p>
        </div>

        <button
          onClick={() => exportToCSV(currentColumns, filteredData, `ledger_${activeTable}.csv`)}
          disabled={filteredData.length === 0}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
        >
          <Download className="w-4 h-4 text-blue-600" />
          <span>Export {activeTable.toUpperCase()} to CSV</span>
        </button>
      </div>

      {/* Table Selection Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTable('payouts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTable === 'payouts'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Vendor Payouts
        </button>
        <button
          onClick={() => setActiveTable('transactions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTable === 'transactions'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Ledger Transactions
        </button>
        <button
          onClick={() => setActiveTable('reconciliation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTable === 'reconciliation'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Reconciliation Logs
        </button>
        <button
          onClick={() => setActiveTable('vendors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTable === 'vendors'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Vendors Directory
        </button>
        <button
          onClick={() => setActiveTable('coa')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTable === 'coa'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Chart of Accounts
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Filter ${activeTable} records...`}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredData.length}</strong> of {data.length} records
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Retrieving ledger rows...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No matching records found.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 sticky top-0 font-bold">
                <tr>
                  {currentColumns.map((col) => (
                    <th key={col.key} className="py-3 px-4 whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    {currentColumns.map((col) => {
                      const val = row[col.key];

                      if (col.format === 'currency') {
                        return (
                          <td key={col.key} className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                            ${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        );
                      }

                      if (col.key === 'is_reconciled') {
                        return (
                          <td key={col.key} className="py-2.5 px-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              val === 1 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {val === 1 ? 'Reconciled' : 'Unreconciled'}
                            </span>
                          </td>
                        );
                      }

                      if (col.format === 'badge') {
                        return (
                          <td key={col.key} className="py-2.5 px-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              val === 'Paid' || val === 'Active' || val === 'Cleared' || val === 'Reconciled'
                                ? 'bg-emerald-100 text-emerald-800'
                                : val === 'Discrepancy' || val === 'Failed'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {val}
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td key={col.key} className="py-2.5 px-4 whitespace-nowrap max-w-sm truncate" title={String(val)}>
                          {val !== null && val !== undefined ? String(val) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

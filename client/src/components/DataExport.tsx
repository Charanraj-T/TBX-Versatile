import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  FileSpreadsheet, 
  AlertCircle,
  Building2,
  Receipt,
  BookOpen,
  CheckCircle2,
  FileDown,
  Layers
} from 'lucide-react';
import { exportToCSV, exportToExcel } from '../utils/csv';
import type { BreakdownColumn } from '../types';

type TableKey = 'payouts' | 'transactions' | 'reconciliation' | 'vendors' | 'coa';

export const DataExport: React.FC = () => {
  const [activeTable, setActiveTable] = useState<TableKey>('payouts');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingAll, setExportingAll] = useState(false);

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

  const handleExportAll = async () => {
    try {
      setExportingAll(true);
      const tables: TableKey[] = ['payouts', 'transactions', 'reconciliation', 'vendors', 'coa'];
      for (const t of tables) {
        const endpoint = t === 'coa' ? '/api/data/chart-of-accounts' : `/api/data/${t}`;
        const res = await fetch(endpoint);
        if (res.ok) {
          const rows = await res.json();
          exportToCSV(getColumns(t), rows, `TBX_export_${t}.csv`);
        }
      }
    } catch (e) {
      console.error('Export all failed', e);
    } finally {
      setExportingAll(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Data Export Center</h1>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Ground-Truth
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Export raw financial ledgers, vendor payout logs, reconciliation discrepancies, and chart of accounts to CSV or Microsoft Excel.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportToCSV(currentColumns, filteredData, `TBX_${activeTable}.csv`)}
            disabled={filteredData.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs hover:text-blue-600 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export Active (CSV)</span>
          </button>

          <button
            onClick={() => exportToExcel(currentColumns, filteredData, `TBX_${activeTable}.xls`)}
            disabled={filteredData.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs hover:text-emerald-600 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Active (Excel)</span>
          </button>

          <button
            onClick={handleExportAll}
            disabled={exportingAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{exportingAll ? 'Exporting All...' : 'Export All 5 Datasets'}</span>
          </button>
        </div>
      </div>

      {/* Dataset Selection Tabs */}
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

      {/* Filter & Count Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Filter ${activeTable} records before export...`}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span>Active dataset: <strong className="text-slate-900 capitalize">{activeTable}</strong></span>
          <span>•</span>
          <span>Showing <strong>{filteredData.length}</strong> of {data.length} records</span>
        </div>
      </div>

      {/* Table Data Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Retrieving ledger dataset...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No matching records found.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[580px]">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold sticky top-0 z-10">
                <tr>
                  {currentColumns.map((col) => (
                    <th key={col.key} className="py-3 px-4 whitespace-nowrap bg-slate-50">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    {currentColumns.map((col) => {
                      const val = row[col.key];
                      if (col.format === 'currency') {
                        return (
                          <td key={col.key} className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                            ${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        );
                      }
                      if (col.format === 'badge') {
                        const isSuccess = val === 'completed' || val === 'reconciled' || val === 'active' || val === 'Debit';
                        const isWarning = val === 'pending' || val === 'in_progress';
                        const isDanger = val === 'unreconciled' || val === 'disputed' || val === 'failed';
                        
                        return (
                          <td key={col.key} className="py-2.5 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              isSuccess 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : isWarning 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : isDanger
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {String(val)}
                            </span>
                          </td>
                        );
                      }
                      return (
                        <td key={col.key} className="py-2.5 px-4 whitespace-nowrap max-w-xs truncate" title={String(val)}>
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

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Live records directly grounded from SQLite local storage</span>
          </div>
          <div>
            Format: UTF-8 CSV & Microsoft Excel (XLS)
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import type { DashboardStats } from '../types';

interface DashboardProps {
  onAskQuestion: (query: string) => void;
}

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export const Dashboard: React.FC<DashboardProps> = ({ onAskQuestion }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard data');
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading grounded financial metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-rose-900">Failed to Connect to Financial Engine</h3>
        <p className="text-sm text-rose-700 mt-1 mb-4">{error || 'Unknown error occurred'}</p>
        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Quick Context */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              BVP Tech Catalyst Hackathon - Enterprise Finance
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Executive Financial Operations</h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Real-time ledger overview with deterministic calculation of vendor payouts, reconciliation audit logs, and proactive anomaly flagging.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onAskQuestion('How much did we spend on vendor payouts last month?')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur border border-white/10 transition-all flex items-center gap-1.5"
            >
              <span>Ask: Last Month Payouts</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onAskQuestion('Which transactions are still unreconciled?')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Ask: Unreconciled Txns</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5 Core Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Spend YTD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total Spend (YTD)</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            ${stats.total_spend_ytd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Cleared Ledger Records</span>
            <button 
              onClick={() => onAskQuestion('Show me overall spend breakdown')}
              className="text-blue-600 font-semibold hover:underline"
            >
              Breakdown →
            </button>
          </div>
        </div>

        {/* Last Month Payouts (August 2026) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Last Month Payouts</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            ${stats.last_month_payouts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs pt-2 border-t border-slate-100">
            <span className={`inline-flex items-center font-semibold ${
              stats.month_over_month_change_pct > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}>
              {stats.month_over_month_change_pct > 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {stats.month_over_month_change_pct > 0 ? '+' : ''}{stats.month_over_month_change_pct}% MoM
            </span>
            <button 
              onClick={() => onAskQuestion('How does that compare to the month before?')}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Compare →
            </button>
          </div>
        </div>

        {/* Reconciliation Health Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Reconciliation Rate</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats.reconciliation_rate}%
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full" 
                style={{ width: `${Math.min(stats.reconciliation_rate, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
              <span>Audited transactions</span>
              <span className="font-semibold text-emerald-600">Verified</span>
            </div>
          </div>
        </div>

        {/* Unreconciled Exposure */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Unreconciled Backlog</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 tracking-tight">
            ${stats.unreconciled_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              {stats.unreconciled_count} transactions
            </span>
            <button 
              onClick={() => onAskQuestion('Which transactions are still unreconciled?')}
              className="text-amber-700 font-semibold hover:underline"
            >
              Investigate →
            </button>
          </div>
        </div>
      </div>

      {/* Visual Analytics Row: Spend Trend & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Payout Trend (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Monthly Payout Trends (Last 6 Months)</h2>
              <p className="text-xs text-slate-500">Historical trend showing reconciled vs unreconciled payout volume</p>
            </div>
            <button
              onClick={() => onAskQuestion('Compare August vs July spend')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Analyze Variance</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthly_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorRecon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month_name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                />
                <Tooltip 
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total_payouts" 
                  name="Total Payouts" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="reconciled_amount" 
                  name="Reconciled Amount" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorRecon)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend by Category Donut Chart (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Spend by Category</h2>
              <p className="text-xs text-slate-500">Distribution across major cost centers</p>
            </div>
            <button
              onClick={() => onAskQuestion('Breakdown payouts by category')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Ask AI →
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.category_breakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {stats.category_breakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-36 overflow-y-auto">
            {stats.category_breakdown.map((cat, i) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-700 font-medium truncate max-w-[150px]">{cat.category}</span>
                </div>
                <div className="font-semibold text-slate-900">
                  ${cat.amount.toLocaleString()} <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Proactive Anomalies Banner & Top Vendors Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proactive Financial Anomaly Callouts (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Detected Financial Anomalies & Outliers</h3>
                <p className="text-xs text-slate-500">Automated IQR & statistical baseline deviations flagged across payouts</p>
              </div>
            </div>
            <button
              onClick={() => onAskQuestion('Flag any abnormal or unusually high payouts')}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <span>Detailed Report</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.recent_anomalies.slice(0, 3).map((anm) => (
              <div key={anm.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{anm.vendor_name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      anm.severity === 'high' 
                        ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      {anm.severity.toUpperCase()} PRIORITY
                    </span>
                    <span className="text-xs text-slate-400">• {anm.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{anm.message}</p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <div className="text-sm font-bold text-slate-900">
                    ${anm.amount.toLocaleString()}
                  </div>
                  <button
                    onClick={() => onAskQuestion(`Explain anomaly for ${anm.vendor_name} on ${anm.date}`)}
                    className="text-[11px] font-semibold text-blue-600 hover:underline mt-1 block"
                  >
                    Investigate →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Vendors Table (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Top Vendors by Spend</h3>
                  <p className="text-xs text-slate-500">Cumulative YTD payout volume</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {stats.top_vendors.map((v, idx) => (
                <div key={v.vendor_id} className="p-3.5 px-5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-600">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">{v.name}</div>
                      <div className="text-slate-400 text-[11px]">{v.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">${v.total_spend.toLocaleString()}</div>
                    <button
                      onClick={() => onAskQuestion(`Show me all payouts for ${v.name}`)}
                      className="text-[11px] text-blue-600 hover:underline"
                    >
                      Audit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => onAskQuestion('Show me top 5 vendors by spend')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Ask AI for Complete Breakdown →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

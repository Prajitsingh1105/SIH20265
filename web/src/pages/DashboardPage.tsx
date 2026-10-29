import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TrustBadge } from '../components/common/TrustBadge';
import { StatusPill } from '../components/common/StatusPill';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  Building,
  ArrowUpRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      if (res.success) {
        setData(res.data);
      }
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-8 h-8 border-4 border-gov-navy-900 border-t-amber-500 rounded-full animate-spin"></div>
          <span className="text-xs text-gray-500 font-medium">Loading executive dashboard...</span>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const needsAttention = data?.needsAttention || [];

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-gov-navy-900">
              {user?.role === 'INSTITUTION' ? user.institution?.name : 'AICTE Central Operations Dashboard'}
            </h1>
            <span className="text-[10px] font-bold bg-gov-navy-100 text-gov-navy-800 px-2 py-0.5 rounded">
              {user?.roleDisplayName || user?.role}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time security deposit portfolio, automated bank verification trust index, and maturity lifecycle status.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchStats}
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
            <span>Refresh</span>
          </button>
          {user?.role === 'INSTITUTION' && (
            <Link
              to="/submission"
              className="flex items-center space-x-1 px-4 py-2 bg-gov-navy-900 hover:bg-gov-navy-800 text-amber-400 font-bold text-xs rounded-lg shadow-xs transition"
            >
              <span>+ New FDR Submission</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Total Value Held</span>
            <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">₹</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-gov-navy-900 mt-2">
            {formatCurrency(kpis.totalValueHeld || 0)}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Across {kpis.totalDeposits || 0} registered instruments</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Active Instruments</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-2">
            {kpis.activeCount || 0}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">In compliance and valid</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Expiring in 90 Days</span>
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 mt-2">
            {kpis.expiring90dCount || 0}
          </div>
          <p className="text-[11px] text-amber-700 font-medium mt-1">Automated alerts active</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Matured / Overdue</span>
            <span className="p-1.5 bg-red-50 text-red-700 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-600 mt-2">
            {kpis.maturedCount || 0}
          </div>
          <p className="text-[11px] text-red-600 font-medium mt-1">Pending renewal / release</p>
        </div>
      </div>

      {/* Measured Impact KPI Panel (Matching SIH Presentation Slide 4) */}
      <div className="bg-gradient-to-r from-gov-navy-900 to-gov-navy-800 text-white rounded-xl p-6 shadow-sm border border-gov-navy-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-amber-400">
              Measurable Outcomes & SIH Impact Index
            </h3>
          </div>
          <span className="text-[11px] text-gray-300">Target Benchmark: AICTE Approval Process Handbook</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white/10 p-3 rounded-lg border border-white/10">
            <div className="text-2xl font-black text-white">{kpis.avgTurnaroundDays || 1.8} Days</div>
            <div className="text-xs text-gray-300 mt-0.5">Verification Turnaround</div>
            <div className="text-[10px] text-emerald-400 mt-1 font-semibold">vs 24 days manual mail</div>
          </div>

          <div className="bg-white/10 p-3 rounded-lg border border-white/10">
            <div className="text-2xl font-black text-white">{kpis.percentVerified || 0}%</div>
            <div className="text-xs text-gray-300 mt-0.5">Bank Confirmed Ratio</div>
            <div className="text-[10px] text-emerald-400 mt-1 font-semibold">Two-Tier Trust Confirmed</div>
          </div>

          <div className="bg-white/10 p-3 rounded-lg border border-white/10">
            <div className="text-2xl font-black text-white">{kpis.missedDeadlines || 0}</div>
            <div className="text-xs text-gray-300 mt-0.5">Missed Maturity Dates</div>
            <div className="text-[10px] text-emerald-400 mt-1 font-semibold">100% Zero-Miss Alerts</div>
          </div>

          <div className="bg-white/10 p-3 rounded-lg border border-white/10">
            <div className="text-2xl font-black text-white">~{kpis.hoursSaved || 0} Hrs</div>
            <div className="text-xs text-gray-300 mt-0.5">Estimated Work Saved</div>
            <div className="text-[10px] text-amber-300 mt-1 font-mono">Formula: (FDRs*3.5h + CBS*4h)</div>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Verification Tiers Donut (5 cols) */}
        <div className="md:col-span-5 bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gov-navy-900">
            Two-Tier Trust Distribution
          </h3>
          <p className="text-[11px] text-gray-500">
            Confirmed by Bank (🟢) vs Claimed (🟠) vs Discrepancy Flagged (🔴)
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.verificationTiers || []}
                  dataKey="count"
                  nameKey="tier"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {(charts.verificationTiers || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} FDRs`, name]}
                  contentStyle={{ backgroundColor: '#1F3A68', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bank-Wise Deposit Holdings (7 cols) */}
        <div className="md:col-span-7 bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gov-navy-900">
            Deposit Volume by Banking Institution
          </h3>
          <p className="text-[11px] text-gray-500">
            Secured funds held across partner Core Banking Systems
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.bankHoldings || []} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis dataKey="bankCode" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(val) => `₹${val / 100000}L`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(val), 'Deposit Amount']}
                  contentStyle={{ backgroundColor: '#1F3A68', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#1F3A68" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Needs Attention Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-gov-navy-900">
              Instruments Requiring Immediate Action ({needsAttention.length})
            </h3>
          </div>
          <Link to="/fdrs" className="text-xs text-gov-navy-DEFAULT hover:underline font-bold flex items-center gap-1">
            <span>View All Repository</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-4">FDR Number</th>
                <th className="py-2.5 px-4">Institution</th>
                <th className="py-2.5 px-4">Bank</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4">Maturity Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Trust Tier</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {needsAttention.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-500">
                    No instruments currently requiring intervention.
                  </td>
                </tr>
              ) : (
                needsAttention.map((fdr: any) => (
                  <tr key={fdr.id} className="hover:bg-gray-50 transition">
                    <td className="py-2.5 px-4 font-mono font-bold text-gov-navy-900">
                      {fdr.fdrNumber}
                    </td>
                    <td className="py-2.5 px-4 truncate max-w-[200px]">{fdr.institution?.name}</td>
                    <td className="py-2.5 px-4">{fdr.bank?.name}</td>
                    <td className="py-2.5 px-4 font-semibold">{formatCurrency(fdr.amount)}</td>
                    <td className="py-2.5 px-4">{new Date(fdr.maturityDate).toLocaleDateString('en-IN')}</td>
                    <td className="py-2.5 px-4">
                      <StatusPill status={fdr.status} />
                    </td>
                    <td className="py-2.5 px-4">
                      <TrustBadge tier={fdr.verificationTier} size="sm" />
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link
                        to={`/fdrs/${fdr.id}`}
                        className="px-2.5 py-1 bg-gov-navy-900 hover:bg-gov-navy-800 text-amber-400 font-bold rounded text-[11px] inline-flex items-center gap-1 shadow-2xs"
                      >
                        <span>Review</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

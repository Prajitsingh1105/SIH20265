import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { FDR, Bank } from '../types';
import { TrustBadge } from '../components/common/TrustBadge';
import { StatusPill } from '../components/common/StatusPill';
import {
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpDown,
  Building,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';

export const FdrListPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [fdrs, setFdrs] = useState<FDR[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination state
  const [search, setSearch] = useState('');
  const [bankId, setBankId] = useState('');
  const [status, setStatus] = useState('');
  const [verificationTier, setVerificationTier] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const fetchBanks = async () => {
    try {
      const res = await api.getBanks();
      if (res.success) setBanks(res.data);
    } catch {
      // Ignore
    }
  };

  const fetchFdrs = async () => {
    setLoading(true);
    try {
      const res = await api.getFdrs({
        search,
        bankId,
        status,
        verificationTier,
        page,
        limit: 10,
      });
      if (res.success) {
        setFdrs(res.data);
        setPagination(res.pagination);
      }
    } catch (e) {
      console.error('Failed to fetch FDRs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    fetchFdrs();
  }, [search, bankId, status, verificationTier, page]);

  const handleExportCsv = () => {
    const query = new URLSearchParams();
    if (bankId) query.append('bankId', bankId);
    if (status) query.append('status', status);
    if (verificationTier) query.append('verificationTier', verificationTier);
    window.open(`/api/v1/reports/export/csv?${query.toString()}`, '_blank');
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Toolbar */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gov-navy-900">{t('nav.repository')}</h1>
          <p className="text-xs text-gray-500 mt-1">
            Institutional security deposit vault, bank verification status, and maturity tracker.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg border border-gray-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('btn.exportCsv')}</span>
          </button>

          {user?.role === 'INSTITUTION' && (
            <Link
              to="/submission"
              className="flex items-center space-x-1.5 px-4 py-2 bg-gov-navy-900 hover:bg-gov-navy-800 text-amber-400 text-xs font-bold rounded-lg shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Submit New FDR</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search FDR #, branch, institution..."
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gov-navy-DEFAULT focus:border-gov-navy-DEFAULT"
            />
          </div>

          {/* Bank Filter */}
          <div>
            <select
              value={bankId}
              onChange={(e) => {
                setBankId(e.target.value);
                setPage(1);
              }}
              className="w-full py-1.5 px-3 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gov-navy-DEFAULT"
            >
              <option value="">All Pledged Banks</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full py-1.5 px-3 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gov-navy-DEFAULT"
            >
              <option value="">All Lifecycle Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="VERIFIED_CONFIRMED">Verified (Bank-Confirmed)</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_SCRUTINY">Under Scrutiny</option>
              <option value="DISCREPANCY_FLAGGED">Discrepancy Flagged</option>
              <option value="RESUBMISSION_REQUIRED">Resubmission Required</option>
              <option value="EXPIRING_SOON">Expiring Soon (Alerted)</option>
              <option value="MATURED">Matured</option>
              <option value="RENEWED">Renewed</option>
              <option value="RELEASE_REQUESTED">Release Requested</option>
              <option value="RELEASED">Released</option>
            </select>
          </div>

          {/* Verification Tier Filter */}
          <div>
            <select
              value={verificationTier}
              onChange={(e) => {
                setVerificationTier(e.target.value);
                setPage(1);
              }}
              className="w-full py-1.5 px-3 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gov-navy-DEFAULT"
            >
              <option value="">All Trust Tiers</option>
              <option value="CONFIRMED">🟢 Confirmed by Bank</option>
              <option value="CLAIMED">🟠 Submitted by Institution</option>
              <option value="FLAGGED">🔴 Discrepancy Flagged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main FDR Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gov-navy-900 text-white font-semibold">
              <tr>
                <th className="py-3 px-4">FDR Number</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Bank & Branch</th>
                <th className="py-3 px-4">Deposit Amount</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Maturity Date</th>
                <th className="py-3 px-4">Trust Tier</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    <div className="inline-block w-6 h-6 border-2 border-gov-navy-900 border-t-amber-500 rounded-full animate-spin"></div>
                    <p className="mt-2 text-xs">Querying central repository...</p>
                  </td>
                </tr>
              ) : fdrs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    No FDR records match the specified search or filter criteria.
                  </td>
                </tr>
              ) : (
                fdrs.map((fdr) => (
                  <tr key={fdr.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-gov-navy-900 whitespace-nowrap">
                      {fdr.fdrNumber}
                      {fdr.isRenewal && (
                        <span className="block text-[10px] text-teal-700 font-semibold font-sans">
                          ↻ Renewal Chain
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-[200px]">
                      <div className="font-semibold text-gray-900 truncate">{fdr.institution?.name}</div>
                      <span className="text-[10px] text-gray-500 font-mono">{fdr.institution?.code} • {fdr.institution?.state}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{fdr.bank?.name}</div>
                      <span className="text-[10px] text-gray-500 truncate block max-w-[150px]">
                        {fdr.branchName}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                      {formatCurrency(fdr.amount)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {new Date(fdr.issueDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {new Date(fdr.maturityDate).toLocaleDateString('en-IN')}
                      </div>
                      <span className="text-[10px] text-gray-500">{fdr.validityMonths} Months</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <TrustBadge tier={fdr.verificationTier} size="sm" />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusPill status={fdr.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                      <Link
                        to={`/fdrs/${fdr.id}`}
                        className="px-2.5 py-1 bg-gov-navy-900 hover:bg-gov-navy-800 text-amber-400 font-bold rounded text-[11px] inline-flex items-center gap-1 shadow-2xs"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 gap-2">
          <div>
            Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages || 1}</strong> (Total <strong>{pagination.total}</strong> records)
          </div>

          <div className="flex space-x-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 bg-white border border-gray-300 rounded font-bold hover:bg-gray-100 disabled:opacity-40 transition"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 bg-white border border-gray-300 rounded font-bold hover:bg-gray-100 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FDR, VerificationTier } from '../types';
import { TrustBadge } from '../components/common/TrustBadge';
import { StatusPill } from '../components/common/StatusPill';
import {
  ShieldCheck,
  FileText,
  Clock,
  History,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  Upload,
  ArrowRight,
  Landmark,
  Eye,
  FileCheck2,
  Lock,
} from 'lucide-react';

export const FdrDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [fdr, setFdr] = useState<FDR | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'verification' | 'discrepancies' | 'timeline' | 'release'>('overview');
  const [loading, setLoading] = useState(true);

  // Modals & Action states
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isResubmitModalOpen, setIsResubmitModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(null);
  const [resolutionRemark, setResolutionRemark] = useState('');
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [versionReason, setVersionReason] = useState('');
  const [versionFile, setVersionFile] = useState<File | null>(null);

  // Resubmit fields
  const [resubmitAmount, setResubmitAmount] = useState<number>(0);
  const [resubmitRemarks, setResubmitRemarks] = useState('');

  // Renew fields
  const [renewFdrNum, setRenewFdrNum] = useState('');
  const [renewAmount, setRenewAmount] = useState<number>(0);

  const fetchFdr = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getFdrById(id);
      if (res.success) {
        setFdr(res.data);
        setResubmitAmount(res.data.amount);
        setRenewAmount(res.data.amount);
      }
    } catch (e) {
      console.error('Failed to load FDR:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFdr();
  }, [id]);

  const loadComparison = async () => {
    if (!id) return;
    try {
      const res = await api.getVerificationComparison(id);
      if (res.success) {
        setComparisonData(res.data);
      }
    } catch (e) {
      console.error('Failed to load comparison:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'verification') {
      loadComparison();
    }
  }, [activeTab]);

  const handleRunBankCheck = async () => {
    if (!id) return;
    try {
      const res = await api.verifyFdr(id, 'MOCK_API');
      alert(res.message);
      await fetchFdr();
      await loadComparison();
    } catch (e: any) {
      alert(e.message || 'Verification check failed');
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.resubmitFdr(id, {
        amount: resubmitAmount,
        remarks: resubmitRemarks || 'Corrected amount submitted as per CBS ledger inquiry.',
      });
      alert('FDR successfully resubmitted. Sent to AICTE Scrutiny Officer.');
      setIsResubmitModalOpen(false);
      await fetchFdr();
    } catch (e: any) {
      alert(e.message || 'Resubmission failed');
    }
  };

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      const res = await api.renewFdr(id, {
        newFdrNumber: renewFdrNum,
        amount: renewAmount,
      });
      alert(`Renewal submitted! Linked to previous instrument. New FDR ID: ${res.data.fdrNumber}`);
      setIsRenewModalOpen(false);
      await fetchFdr();
    } catch (e: any) {
      alert(e.message || 'Renewal failed');
    }
  };

  const handleResolveDiscrepancy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlagId || !resolutionRemark) return;
    try {
      await api.resolveDiscrepancy(selectedFlagId, resolutionRemark);
      alert('Discrepancy resolved. Compliance updated.');
      setIsResolveModalOpen(false);
      setResolutionRemark('');
      await fetchFdr();
    } catch (e: any) {
      alert(e.message || 'Failed to resolve flag');
    }
  };

  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !versionFile) return;
    try {
      const formData = new FormData();
      formData.append('file', versionFile);
      formData.append('changeReason', versionReason);

      await api.uploadDocumentVersion(selectedDocId, formData);
      alert('New document version uploaded and vaulted successfully.');
      setIsVersionModalOpen(false);
      setVersionFile(null);
      setVersionReason('');
      await fetchFdr();
    } catch (e: any) {
      alert(e.message || 'Version upload failed');
    }
  };

  if (loading || !fdr) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-gov-navy-900 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  return (
    <div className="space-y-6">
      {/* Top Details Header Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl font-black font-mono text-gov-navy-900">
                {fdr.fdrNumber}
              </span>
              <TrustBadge tier={fdr.verificationTier} size="md" />
              <StatusPill status={fdr.status} />
              {fdr.isRenewal && (
                <span className="text-xs bg-teal-100 text-teal-900 font-bold px-2.5 py-0.5 rounded-full border border-teal-300">
                  ↻ Renewed Instrument
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Registered by <strong className="text-gray-900">{fdr.institution?.name}</strong> ({fdr.institution?.code}) • {fdr.institution?.state}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Scrutiny Officer Verification Trigger */}
            {(user?.role === 'SCRUTINY_OFFICER' || user?.role === 'SYSTEM_ADMIN') && (
              <button
                onClick={handleRunBankCheck}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs transition"
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>Trigger Bank CBS Verification</span>
              </button>
            )}

            {/* Institution Resubmit Trigger */}
            {user?.role === 'INSTITUTION' && (fdr.status === 'RESUBMISSION_REQUIRED' || fdr.status === 'DISCREPANCY_FLAGGED') && (
              <button
                onClick={() => setIsResubmitModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-gov-navy-950 font-bold text-xs rounded-lg shadow-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Correct & Resubmit</span>
              </button>
            )}

            {/* Renewal Button */}
            {user?.role === 'INSTITUTION' && (fdr.status === 'MATURED' || fdr.status === 'EXPIRING_SOON') && (
              <button
                onClick={() => setIsRenewModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gov-navy-900 hover:bg-gov-navy-800 text-amber-400 font-bold text-xs rounded-lg shadow-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Submit Renewal FDR</span>
              </button>
            )}

            {/* Release Request Button */}
            {user?.role === 'INSTITUTION' && fdr.status !== 'RELEASED' && fdr.status !== 'RELEASE_REQUESTED' && (
              <Link
                to="/release"
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-xs transition"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Raise Release Request</span>
              </Link>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 overflow-x-auto text-xs font-semibold gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-4 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-gov-navy-900 text-gov-navy-900 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-2 px-4 border-b-2 transition ${
              activeTab === 'documents'
                ? 'border-gov-navy-900 text-gov-navy-900 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Digital Vault ({fdr.documents?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`py-2 px-4 border-b-2 transition ${
              activeTab === 'verification'
                ? 'border-gov-navy-900 text-gov-navy-900 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Bank CBS Verification ({fdr.verifications?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('discrepancies')}
            className={`py-2 px-4 border-b-2 transition ${
              activeTab === 'discrepancies'
                ? 'border-gov-navy-900 text-gov-navy-900 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Discrepancies ({(fdr.discrepancies?.filter((d: any) => !d.isResolved) || []).length})
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-2 px-4 border-b-2 transition ${
              activeTab === 'timeline'
                ? 'border-gov-navy-900 text-gov-navy-900 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Timeline & Renewals
          </button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gov-navy-900">
              Instrument Details
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500 font-medium block">Principal Amount</span>
                <span className="text-base font-black text-gov-navy-900 block mt-1">
                  {formatCurrency(fdr.amount)}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500 font-medium block">Issue Date</span>
                <span className="font-bold text-gray-900 block mt-1">
                  {new Date(fdr.issueDate).toLocaleDateString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500 font-medium block">Maturity Date</span>
                <span className="font-bold text-gray-900 block mt-1">
                  {new Date(fdr.maturityDate).toLocaleDateString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500 font-medium block">Validity Period</span>
                <span className="font-bold text-gray-900 block mt-1">
                  {fdr.validityMonths} Months ({(fdr.validityMonths / 12).toFixed(1)} Years)
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500 font-medium block">Pledged Bank</span>
                <span className="font-bold text-gray-900 block mt-1">
                  {fdr.bank?.name} ({fdr.bank?.code})
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500 font-medium block">Branch Name</span>
                <span className="font-bold text-gray-900 block mt-1 truncate">
                  {fdr.branchName}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs text-gray-500 font-medium block">Lien / Pledge in Favour of</span>
              <p className="text-xs font-bold text-gov-navy-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-1">
                {fdr.lienPledgeInFavor}
              </p>
            </div>

            {fdr.remarks && (
              <div>
                <span className="text-xs text-gray-500 font-medium block">Sanction Remarks</span>
                <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-200 mt-1">
                  {fdr.remarks}
                </p>
              </div>
            )}
          </div>

          {/* Scrutiny Notes & Officer Observations (4 cols) */}
          <div className="md:col-span-4 bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gov-navy-900">
                Official Scrutiny Notes
              </h3>
              <span className="text-[10px] text-gray-400">AICTE Verification Desk</span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto">
              {fdr.scrutinyNotes?.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No scrutiny observations added yet.</p>
              ) : (
                fdr.scrutinyNotes?.map((note: any) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span className="font-bold text-gov-navy-900">{note.officer?.fullName}</span>
                      <span>{new Date(note.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-gray-700">{note.note}</p>
                    <span className="text-[10px] font-semibold text-blue-700">
                      Recommendation: {note.recommendation}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Digital Document Vault (Encrypted AES-256 + Versioning) */}
      {activeTab === 'documents' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-gov-navy-900">
                  Encrypted Digital Document Vault
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  AES-256-GCM
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Application-layer encrypted object storage with complete version history and retrieval access logging.
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {fdr.documents?.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-500">
                No documents uploaded yet for this FDR.
              </p>
            ) : (
              fdr.documents?.map((doc: any) => (
                <div key={doc.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-gov-navy-900 mt-1" />
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">{doc.title}</h4>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        {doc.originalName} • {(doc.fileSize / 1024).toFixed(1)} KB • SHA-256: {doc.checksumSha256.substring(0, 12)}...
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-bold">
                          Version {doc.currentVersion}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-medium">
                          🔒 Encrypted at Rest
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <a
                      href={`/api/v1/documents/${doc.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg border border-gray-300 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Decrypt & Download</span>
                    </a>

                    {user?.role === 'INSTITUTION' && (
                      <button
                        onClick={() => {
                          setSelectedDocId(doc.id);
                          setIsVersionModalOpen(true);
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-gov-navy-900 hover:bg-gov-navy-800 text-amber-400 text-xs font-bold rounded-lg shadow-xs transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Version (v{doc.currentVersion + 1})</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Two-Tier Bank CBS Verification (Comparison View) */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-gov-navy-900">
                  Two-Tier Verification Trust Comparison
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Side-by-side reconciliation between institution claim and Core Banking System (CBS) record.
                </p>
              </div>

              {(user?.role === 'SCRUTINY_OFFICER' || user?.role === 'SYSTEM_ADMIN') && (
                <button
                  onClick={handleRunBankCheck}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs transition"
                >
                  Query Live / Mock CBS
                </button>
              )}
            </div>

            {comparisonData?.confirmed ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Institution Claimed */}
                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-900 uppercase">
                      🟠 Institution Claimed Record
                    </span>
                    <span className="text-[10px] text-amber-700 font-mono">Claimed by Institute</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-amber-200/60">
                      <span className="text-gray-500">FDR Number</span>
                      <span className="font-bold font-mono text-gray-900">{comparisonData.claimed.fdrNumber}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-amber-200/60">
                      <span className="text-gray-500">Bank Name</span>
                      <span className="font-semibold text-gray-900">{comparisonData.claimed.bankName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-amber-200/60">
                      <span className="text-gray-500">Branch</span>
                      <span className="text-gray-900">{comparisonData.claimed.branch}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-amber-200/60">
                      <span className="text-gray-500">Claimed Amount</span>
                      <span
                        className={`font-black ${
                          comparisonData.confirmed?.mismatchDetails?.amount
                            ? 'text-red-700 bg-red-100 px-2 py-0.5 rounded font-bold'
                            : 'text-gov-navy-900'
                        }`}
                      >
                        {formatCurrency(comparisonData.claimed.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Maturity Date</span>
                      <span className="text-gray-900">
                        {new Date(comparisonData.claimed.maturityDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bank CBS Confirmed */}
                <div
                  className={`p-4 rounded-xl border space-y-3 ${
                    comparisonData.confirmed.isMatched
                      ? 'bg-emerald-50/50 border-emerald-300'
                      : 'bg-red-50/50 border-red-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-bold text-xs uppercase ${
                        comparisonData.confirmed.isMatched ? 'text-emerald-900' : 'text-red-900'
                      }`}
                    >
                      {comparisonData.confirmed.isMatched ? '🟢 Bank Confirmed Record' : '🔴 Bank Discrepancy Flagged'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {comparisonData.confirmed.verificationType}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-200">
                      <span className="text-gray-500">FDR Number</span>
                      <span className="font-bold font-mono text-gray-900">
                        {comparisonData.confirmed.fdrNumber}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200">
                      <span className="text-gray-500">Bank Name</span>
                      <span className="font-semibold text-gray-900">
                        {comparisonData.confirmed.bankName}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200">
                      <span className="text-gray-500">Branch</span>
                      <span className="text-gray-900">{comparisonData.confirmed.branch}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200">
                      <span className="text-gray-500">CBS Ledger Amount</span>
                      <span
                        className={`font-black ${
                          !comparisonData.confirmed.isMatched
                            ? 'text-red-700 bg-red-100 px-2 py-0.5 rounded animate-pulse'
                            : 'text-emerald-800'
                        }`}
                      >
                        {formatCurrency(comparisonData.confirmed.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Maturity Date</span>
                      <span className="text-gray-900">
                        {new Date(comparisonData.confirmed.maturityDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Mismatch Alert Box */}
                  {!comparisonData.confirmed.isMatched && (
                    <div className="p-3 bg-red-100/80 rounded-lg text-xs text-red-900 space-y-1">
                      <div className="flex items-center space-x-1 font-bold">
                        <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
                        <span>Mismatch Detected in CBS Ledger:</span>
                      </div>
                      <p>
                        Claimed ₹{comparisonData.claimed.amount.toLocaleString('en-IN')} vs Bank Confirmed ₹{comparisonData.confirmed.amount.toLocaleString('en-IN')}.
                      </p>
                      <p className="font-semibold text-red-800 pt-1">
                        Status changed to Resubmission Required. Institution has been alerted via SMS and Mailpit.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-gray-500 space-y-2">
                <Clock className="w-8 h-8 text-gray-400 mx-auto" />
                <p>This FDR has not undergone bank verification yet.</p>
                <p className="text-[11px] text-gray-400">
                  Scrutiny officers can trigger an automated CBS query using the button above.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Discrepancies */}
      {activeTab === 'discrepancies' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gov-navy-900">
            Automated Discrepancy Engine Flags
          </h3>

          <div className="divide-y divide-gray-100">
            {fdr.discrepancies?.length === 0 ? (
              <p className="py-6 text-center text-xs text-emerald-700 font-semibold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero discrepancies detected. Instrument satisfies all AICTE criteria.</span>
              </p>
            ) : (
              fdr.discrepancies?.map((flag: any) => (
                <div key={flag.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        flag.isResolved ? 'text-gray-400' : 'text-red-600'
                      }`}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-gray-900">{flag.ruleCode}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            flag.severity === 'HIGH'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {flag.severity} SEVERITY
                        </span>
                        {flag.isResolved && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                            RESOLVED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 mt-1">{flag.message}</p>
                      {flag.resolutionRemark && (
                        <p className="text-[11px] text-emerald-800 mt-1 bg-emerald-50 p-2 rounded">
                          Resolution: {flag.resolutionRemark}
                        </p>
                      )}
                    </div>
                  </div>

                  {!flag.isResolved && (user?.role === 'SCRUTINY_OFFICER' || user?.role === 'SYSTEM_ADMIN') && (
                    <button
                      onClick={() => {
                        setSelectedFlagId(flag.id);
                        setIsResolveModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-gov-navy-900 hover:bg-gov-navy-800 text-amber-400 font-bold text-xs rounded-lg shrink-0 shadow-xs transition"
                    >
                      Resolve / Override Flag
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Timeline & Renewals */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-gov-navy-900">
              Renewal History Chain
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Parent-child lineage linking original deposits with renewed instruments.
            </p>
          </div>

          {/* Renewal Chain Diagram */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            {fdr.renewalsAsNew?.length ? (
              <div className="flex items-center space-x-3 text-xs">
                <div className="p-3 bg-white border border-gray-300 rounded-lg">
                  <span className="text-gray-400 block text-[10px]">PREVIOUS INSTRUMENT</span>
                  <Link
                    to={`/fdrs/${fdr.renewalsAsNew[0].previousFdrId}`}
                    className="font-mono font-bold text-gov-navy-900 hover:underline"
                  >
                    {fdr.renewalsAsNew[0].previousFdr.fdrNumber}
                  </Link>
                  <span className="text-[10px] text-gray-500 block">Status: RENEWED</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="p-3 bg-teal-50 border border-teal-300 rounded-lg">
                  <span className="text-teal-700 block text-[10px] font-bold">CURRENT ACTIVE RENEWAL</span>
                  <span className="font-mono font-black text-gov-navy-900">{fdr.fdrNumber}</span>
                  <span className="text-[10px] text-teal-800 block">Status: ACTIVE</span>
                </div>
              </div>
            ) : fdr.renewalsAsOld?.length ? (
              <div className="flex items-center space-x-3 text-xs">
                <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg">
                  <span className="text-gray-400 block text-[10px]">ORIGINAL INSTRUMENT</span>
                  <span className="font-mono font-bold text-gray-600">{fdr.fdrNumber}</span>
                  <span className="text-[10px] text-gray-500 block">Status: RENEWED</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="p-3 bg-white border border-gray-300 rounded-lg">
                  <span className="text-teal-700 block text-[10px] font-bold">SUPERSEDING RENEWAL</span>
                  <Link
                    to={`/fdrs/${fdr.renewalsAsOld[0].newFdrId}`}
                    className="font-mono font-black text-gov-navy-900 hover:underline"
                  >
                    {fdr.renewalsAsOld[0].newFdr.fdrNumber}
                  </Link>
                  <span className="text-[10px] text-teal-800 block">Status: ACTIVE</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">
                Stand-alone deposit instrument. No renewal chains linked to this record.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal: Resubmit Mismatch Correction */}
      {isResubmitModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-gov-navy-900">
              Resubmit Corrected FDR Details
            </h3>
            <p className="text-xs text-gray-500">
              Update the principal amount or details to match the bank confirmation record.
            </p>

            <form onSubmit={handleResubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Corrected Deposit Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  value={resubmitAmount}
                  onChange={(e) => setResubmitAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Correction Remarks / Justification
                </label>
                <textarea
                  rows={3}
                  value={resubmitRemarks}
                  onChange={(e) => setResubmitRemarks(e.target.value)}
                  placeholder="Explain reconciliation with bank..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResubmitModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gov-navy-900 text-amber-400 font-bold text-xs rounded-lg shadow-xs"
                >
                  Resubmit for Scrutiny
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Renew FDR */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-gov-navy-900">
              Submit Linked Renewal FDR
            </h3>
            <p className="text-xs text-gray-500">
              Renewing <strong className="font-mono">{fdr.fdrNumber}</strong> for the next 3-year term.
            </p>

            <form onSubmit={handleRenew} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  New Renewal FDR Number
                </label>
                <input
                  type="text"
                  required
                  value={renewFdrNum}
                  onChange={(e) => setRenewFdrNum(e.target.value)}
                  placeholder={`${fdr.fdrNumber}-REN`}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Renewal Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  value={renewAmount}
                  onChange={(e) => setRenewAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRenewModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gov-navy-900 text-amber-400 font-bold text-xs rounded-lg shadow-xs"
                >
                  Submit Linked Renewal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resolve Discrepancy */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-gov-navy-900">
              Resolve / Override Discrepancy Flag
            </h3>
            <p className="text-xs text-gray-500">
              A mandatory scrutiny remark is required by AICTE regulations to override a compliance violation.
            </p>

            <form onSubmit={handleResolveDiscrepancy} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Official Scrutiny Resolution Remark
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionRemark}
                  onChange={(e) => setResolutionRemark(e.target.value)}
                  placeholder="Document the justification or verified evidence..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gov-navy-900 text-amber-400 font-bold text-xs rounded-lg shadow-xs"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Document Version */}
      {isVersionModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-gov-navy-900">
              Upload New Document Version
            </h3>
            <p className="text-xs text-gray-500">
              Upload updated scan file. Prior versions remain cryptographically archived in the vault.
            </p>

            <form onSubmit={handleUploadVersion} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select File</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setVersionFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Change Reason / Notes</label>
                <input
                  type="text"
                  required
                  value={versionReason}
                  onChange={(e) => setVersionReason(e.target.value)}
                  placeholder="e.g., Bank stamped corrected endorsement scan"
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVersionModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gov-navy-900 text-amber-400 font-bold text-xs rounded-lg shadow-xs"
                >
                  Upload & Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

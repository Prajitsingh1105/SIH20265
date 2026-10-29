import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ReleaseRequest, FDR } from '../types';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Building,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Send,
  RotateCcw,
} from 'lucide-react';

export const ReleaseWorkflowPage: React.FC = () => {
  const { user } = useAuth();

  const [requests, setRequests] = useState<ReleaseRequest[]>([]);
  const [fdrs, setFdrs] = useState<FDR[]>([]);
  const [loading, setLoading] = useState(true);

  // New Request Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFdrId, setSelectedFdrId] = useState('');
  const [releaseReason, setReleaseReason] = useState('');
  const [bankAccNum, setBankAccNum] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankAccName, setBankAccName] = useState('');
  const [eligibilityCheck, setEligibilityCheck] = useState<any>(null);

  // Scrutiny Modal state
  const [isScrutinyModalOpen, setIsScrutinyModalOpen] = useState(false);
  const [activeReqId, setActiveReqId] = useState<string | null>(null);
  const [scrutinyAction, setScrutinyAction] = useState('SCRUTINIZED_FORWARD');
  const [scrutinyObs, setScrutinyObs] = useState('');

  // Authority Decision Modal state
  const [isAuthorityModalOpen, setIsAuthorityModalOpen] = useState(false);
  const [authorityAction, setAuthorityAction] = useState('AUTHORITY_APPROVE');
  const [authorityObs, setAuthorityObs] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [reqRes, fdrRes] = await Promise.all([
        api.getReleaseRequests(),
        user?.role === 'INSTITUTION' ? api.getFdrs({ limit: 50 }) : Promise.resolve({ data: [] }),
      ]);

      if (reqRes.success) setRequests(reqRes.data);
      if (fdrRes?.data) setFdrs(fdrRes.data);
    } catch (e) {
      console.error('Failed to load release requests:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleSelectFdrForRelease = async (fdrId: string) => {
    setSelectedFdrId(fdrId);
    if (!fdrId) {
      setEligibilityCheck(null);
      return;
    }
    try {
      const res = await api.checkEligibility(fdrId);
      if (res.success) {
        setEligibilityCheck(res.data);
      }
    } catch (e) {
      console.error('Eligibility check failed:', e);
    }
  };

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFdrId || !releaseReason || !bankAccNum || !bankIfsc || !bankAccName) return;

    try {
      await api.createReleaseRequest({
        fdrId: selectedFdrId,
        reason: releaseReason,
        bankAccountNumber: bankAccNum,
        bankIfsc,
        bankAccountName: bankAccName,
      });
      alert('Release / Refund request submitted successfully. Forwarded to Scrutiny Officer.');
      setIsCreateModalOpen(false);
      await fetchRequests();
    } catch (e: any) {
      alert(e.message || 'Failed to submit release request');
    }
  };

  const handleScrutinySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReqId || !scrutinyObs) return;

    try {
      await api.scrutinizeRelease(activeReqId, scrutinyAction, scrutinyObs);
      alert('Scrutiny review recorded and stage transitioned.');
      setIsScrutinyModalOpen(false);
      setScrutinyObs('');
      await fetchRequests();
    } catch (e: any) {
      alert(e.message || 'Scrutiny action failed');
    }
  };

  const handleAuthoritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReqId) return;

    try {
      const res = await api.decideRelease(activeReqId, authorityAction, authorityObs);
      alert(res.message);
      setIsAuthorityModalOpen(false);
      setAuthorityObs('');
      await fetchRequests();
    } catch (e: any) {
      alert(e.message || 'Authority action failed');
    }
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
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gov-navy-900">
            FDR Security Deposit Release & Refund Workflow
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            End-to-end multi-stage release: Eligibility Audit → Officer Scrutiny → Competent Authority Final Approval → Official QR Release Order.
          </p>
        </div>

        {user?.role === 'INSTITUTION' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gov-navy-900 hover:bg-gov-navy-800 text-amber-400 font-bold text-xs rounded-lg shadow-xs transition"
          >
            <Send className="w-4 h-4" />
            <span>Raise Release / Refund Request</span>
          </button>
        )}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-xs text-gray-500">
            Loading release requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-gray-200 text-center space-y-2">
            <FileCheck2 className="w-10 h-10 text-gray-400 mx-auto" />
            <h3 className="font-bold text-sm text-gov-navy-900">No Active Release Requests</h3>
            <p className="text-xs text-gray-500">
              When institutions complete lock-in terms or course closures, release requests raised will appear here.
            </p>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              {/* Request Header Bar */}
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-black text-xs text-gov-navy-900">
                    {req.requestNumber}
                  </span>
                  <span className="text-[10px] font-bold bg-gov-navy-100 text-gov-navy-800 px-2 py-0.5 rounded">
                    FDR: {req.fdr?.fdrNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      req.currentStage === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.currentStage === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-900'
                    }`}
                  >
                    Stage: {req.currentStage.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-gov-navy-900">
                    {formatCurrency(req.fdr?.amount || 0)}
                  </span>
                  <span className="text-gray-400 text-xs">•</span>
                  <span className="text-xs text-gray-500">
                    {new Date(req.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Request Body */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 block">Institution:</span>
                    <strong className="text-gray-900">{req.institution?.name}</strong>
                    <span className="text-[11px] text-gray-400 block font-mono">{req.institution?.code}</span>
                  </div>

                  <div>
                    <span className="text-gray-500 block">Pledged Bank & Branch:</span>
                    <strong className="text-gray-900">{req.fdr?.bank?.name}</strong>
                    <span className="text-[11px] text-gray-500 block truncate">{req.fdr?.branchName}</span>
                  </div>

                  <div>
                    <span className="text-gray-500 block">Refund Credit Account:</span>
                    <strong className="text-gray-900 font-mono">{req.bankAccountNumber}</strong>
                    <span className="text-[11px] text-gray-500 block font-mono">
                      IFSC: {req.bankIfsc} ({req.bankAccountName})
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1 border border-gray-200">
                  <span className="font-bold text-gray-700">Application Reason / Compliance Grounds:</span>
                  <p className="text-gray-700">{req.reason}</p>
                </div>

                {/* Visual Stage Stepper */}
                <div className="pt-2">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-gray-500 mb-2">
                    Live Workflow Progress
                  </h4>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {/* Stage 1: Submitted */}
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                        ✓
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block">1. Submission</span>
                        <span className="text-[10px] text-gray-400">Institution</span>
                      </div>
                    </div>

                    <div className="hidden sm:block w-8 h-0.5 bg-gray-300"></div>

                    {/* Stage 2: Scrutiny */}
                    <div className="flex items-center space-x-2 text-xs">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          req.currentStage === 'SCRUTINY_REVIEW'
                            ? 'bg-amber-500 text-white animate-pulse'
                            : req.stages?.some((s: any) => s.stageName === 'SCRUTINY')
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {req.stages?.some((s: any) => s.stageName === 'SCRUTINY') ? '✓' : '2'}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block">2. Officer Scrutiny</span>
                        <span className="text-[10px] text-gray-400">AICTE Verification Desk</span>
                      </div>
                    </div>

                    <div className="hidden sm:block w-8 h-0.5 bg-gray-300"></div>

                    {/* Stage 3: Authority Approval */}
                    <div className="flex items-center space-x-2 text-xs">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          req.currentStage === 'AUTHORITY_APPROVAL'
                            ? 'bg-amber-500 text-white animate-pulse'
                            : req.currentStage === 'APPROVED'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {req.currentStage === 'APPROVED' ? '✓' : '3'}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block">3. Final Sanction</span>
                        <span className="text-[10px] text-gray-400">Competent Authority</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Bar based on Role & Stage */}
                <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-gray-500">
                    {req.releaseOrderNumber && (
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        Sanction Order No: {req.releaseOrderNumber}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Scrutiny Officer Action */}
                    {(user?.role === 'SCRUTINY_OFFICER' || user?.role === 'SYSTEM_ADMIN') &&
                      (req.currentStage === 'SUBMITTED' || req.currentStage === 'SCRUTINY_REVIEW') && (
                        <button
                          onClick={() => {
                            setActiveReqId(req.id);
                            setIsScrutinyModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-gov-navy-900 text-amber-400 font-bold text-xs rounded-lg hover:bg-gov-navy-800 shadow-xs"
                        >
                          Scrutinize & Forward Request
                        </button>
                      )}

                    {/* Competent Authority Action */}
                    {(user?.role === 'COMPETENT_AUTHORITY' || user?.role === 'SYSTEM_ADMIN') &&
                      req.currentStage === 'AUTHORITY_APPROVAL' && (
                        <button
                          onClick={() => {
                            setActiveReqId(req.id);
                            setIsAuthorityModalOpen(true);
                          }}
                          className="px-4 py-1.5 bg-emerald-700 text-white font-bold text-xs rounded-lg hover:bg-emerald-800 shadow-xs flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Sign Release Order</span>
                        </button>
                      )}

                    {/* Download Release Order PDF with QR */}
                    {req.currentStage === 'APPROVED' && req.releaseOrderNumber && (
                      <a
                        href={`/api/v1/release/order/${encodeURIComponent(req.releaseOrderNumber)}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Download Release Order PDF (QR Verified)</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Raise Release Request (with Automated Eligibility Check) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-gov-navy-900">
              Raise FDR Security Deposit Release / Refund
            </h3>

            <form onSubmit={handleCreateRelease} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Select FDR Instrument *</label>
                <select
                  required
                  value={selectedFdrId}
                  onChange={(e) => handleSelectFdrForRelease(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-mono text-xs"
                >
                  <option value="">-- Choose Eligible FDR --</option>
                  {fdrs
                    .filter((f) => f.status !== 'RELEASED' && f.status !== 'RELEASE_REQUESTED')
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.fdrNumber} ({formatCurrency(f.amount)}) • {f.status} • {f.verificationTier}
                      </option>
                    ))}
                </select>
              </div>

              {/* Automated Eligibility Checklist */}
              {eligibilityCheck && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-gray-900">Automated Prescribed Eligibility Checklist:</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded ${
                        eligibilityCheck.status === 'PASSED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {eligibilityCheck.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {eligibilityCheck.checklist?.map((item: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-[11px]">
                        <span className={item.passed ? 'text-emerald-600' : 'text-red-600'}>
                          {item.passed ? '✓' : '✗'}
                        </span>
                        <div>
                          <strong className="text-gray-800">{item.label}</strong>
                          <span className="text-gray-500 block">{item.details}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Reason for Release Request (APH Compliance Grounds) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={releaseReason}
                  onChange={(e) => setReleaseReason(e.target.value)}
                  placeholder="e.g. Prescribed 5-year lock-in term expired. Course closure formalities completed as per AICTE guidelines."
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Refund Bank Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankAccNum}
                    onChange={(e) => setBankAccNum(e.target.value)}
                    placeholder="98765432100012"
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Bank IFSC Code *</label>
                  <input
                    type="text"
                    required
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    placeholder="SBIN0001234"
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono uppercase text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Beneficiary Account Name *</label>
                <input
                  type="text"
                  required
                  value={bankAccName}
                  onChange={(e) => setBankAccName(e.target.value)}
                  placeholder="Sunrise Institute General Account"
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gov-navy-900 text-amber-400 font-bold text-xs rounded-lg shadow-xs"
                >
                  Submit Release Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Officer Scrutiny */}
      {isScrutinyModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-gov-navy-900">
              Scrutiny Officer Review & Recommendation
            </h3>

            <form onSubmit={handleScrutinySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Scrutiny Action</label>
                <select
                  value={scrutinyAction}
                  onChange={(e) => setScrutinyAction(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg font-semibold text-xs"
                >
                  <option value="SCRUTINIZED_FORWARD">Recommended: Forward to Competent Authority</option>
                  <option value="SCRUTINIZED_RETURN">Return to Institution for Clarification</option>
                  <option value="REJECT">Reject Application</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Official Observations / Scrutiny Remarks *
                </label>
                <textarea
                  rows={4}
                  required
                  value={scrutinyObs}
                  onChange={(e) => setScrutinyObs(e.target.value)}
                  placeholder="Record verification of no-dues certificate, CBS bank ledger check, and graduation compliance."
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsScrutinyModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gov-navy-900 text-amber-400 font-bold text-xs rounded-lg shadow-xs"
                >
                  Submit Scrutiny Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Competent Authority Approval */}
      {isAuthorityModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-emerald-800">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-base text-gov-navy-900">
                Competent Authority Final Sanction
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              Approving will generate the official tamper-proof PDF Release Order with QR code, update instrument status to RELEASED, and credit refund.
            </p>

            <form onSubmit={handleAuthoritySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Executive Decision</label>
                <select
                  value={authorityAction}
                  onChange={(e) => setAuthorityAction(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg font-semibold text-xs"
                >
                  <option value="AUTHORITY_APPROVE">Approve & Issue Sanction Order</option>
                  <option value="AUTHORITY_RETURN">Return for Further Inspection</option>
                  <option value="AUTHORITY_REJECT">Reject Release Application</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Authority Remarks</label>
                <textarea
                  rows={3}
                  value={authorityObs}
                  onChange={(e) => setAuthorityObs(e.target.value)}
                  placeholder="Sanction accorded as per AICTE Approval Process Handbook Clause 4.8."
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAuthorityModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs hover:bg-emerald-800"
                >
                  Execute Sanction Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

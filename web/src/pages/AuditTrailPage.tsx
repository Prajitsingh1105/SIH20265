import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Lock,
  FileCode,
  Bug,
  RefreshCw,
} from 'lucide-react';

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  // Verification State
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  // Inspector modal
  const [inspectedLog, setInspectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        search,
        action: actionFilter,
        entityType: entityFilter,
        limit: 50,
      });
      if (res.success) {
        setLogs(res.data);
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, actionFilter, entityFilter]);

  const handleVerifyChain = async () => {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await api.verifyAuditChain();
      setVerificationResult(res);
    } catch (e: any) {
      setVerificationResult({ isValid: false, message: e.message || 'Verification failed' });
    } finally {
      setVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    if (!confirm('Simulate unauthorized DB tampering by modifying an audit row directly in PostgreSQL?')) return;
    try {
      const res = await api.simulateTampering();
      alert(`Tampering Simulated! ${res.message}\nNow click "Verify Audit Integrity" to demonstrate detection.`);
      await fetchLogs();
      await handleVerifyChain();
    } catch (e: any) {
      alert(e.message || 'Tamper simulation failed');
    }
  };

  const handleRepairChain = async () => {
    try {
      const res = await api.repairAuditChain();
      alert(`Audit Chain Repaired! ${res.message}`);
      await fetchLogs();
      await handleVerifyChain();
    } catch (e: any) {
      alert(e.message || 'Chain repair failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Integrity Action Bar */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-gov-navy-900" />
            <h1 className="text-xl font-black text-gov-navy-900">
              Immutable SHA-256 Hash-Chained Audit Trail
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Tamper-evident distributed ledger logging all logins, submissions, CBS queries, discrepancy overrides and release approvals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Verify Integrity Button */}
          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs transition"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{verifying ? 'Calculating Hashes...' : 'Verify Audit Integrity'}</span>
          </button>

          {/* Demo Tampering Simulator */}
          <button
            onClick={handleSimulateTamper}
            className="flex items-center space-x-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold rounded-lg transition"
            title="Demonstrate tamper detection for hackathon judges"
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Simulate DB Tampering</span>
          </button>

          {/* Demo Repair */}
          <button
            onClick={handleRepairChain}
            className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 text-xs font-bold rounded-lg transition"
            title="Repair hash chain"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Repair Chain</span>
          </button>
        </div>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start space-x-3 transition animate-in fade-in duration-300 ${
            verificationResult.isValid
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-red-50 border-red-300 text-red-950'
          }`}
        >
          {verificationResult.isValid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1">
            <h4 className="font-bold text-sm">
              {verificationResult.isValid ? '✅ Cryptographic Audit Integrity Intact' : '🚨 Tampering Detected in Audit Log!'}
            </h4>
            <p className="leading-relaxed">{verificationResult.message}</p>
            {verificationResult.isValid ? (
              <p className="text-[11px] font-mono text-emerald-800">
                All {verificationResult.totalVerified} sequential records verified against SHA-256 block hash chain. Tip: {verificationResult.tipHash?.substring(0, 24)}...
              </p>
            ) : (
              <div className="text-[11px] font-mono text-red-800 space-y-0.5 pt-1">
                <p>Tampered Record Index: #{verificationResult.tamperedIndex} (ID: {verificationResult.tamperedRecordId})</p>
                <p>Calculated Hash: {verificationResult.expectedHash || verificationResult.expectedPrevHash}</p>
                <p>Stored Record Hash: {verificationResult.actualHash || verificationResult.actualPrevHash}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actor, entity ID, action, or state change..."
            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs"
          />
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="py-1.5 px-3 border border-gray-300 rounded-lg text-xs"
        >
          <option value="">All Entity Types</option>
          <option value="FDR">FDR Instruments</option>
          <option value="USER">User Sessions</option>
          <option value="DOCUMENT">Digital Vault</option>
          <option value="RELEASE_REQUEST">Release Requests</option>
          <option value="DISCREPANCY">Discrepancy Flags</option>
          <option value="SYSTEM">System & Settings</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="py-1.5 px-3 border border-gray-300 rounded-lg text-xs"
        >
          <option value="">All Actions</option>
          <option value="LOGIN">Login & 2FA</option>
          <option value="CREATE">Create</option>
          <option value="VERIFY">Bank CBS Verification</option>
          <option value="RESUBMIT">Resubmit</option>
          <option value="RENEW">Renew</option>
          <option value="APPROVE">Authority Sanction</option>
          <option value="RESOLVE_FLAG">Resolve Discrepancy</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gov-navy-900 text-white font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 font-mono">Previous Hash</th>
                <th className="py-3 px-4 font-mono">Current SHA-256 Hash</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 font-sans">
                    Loading cryptographic ledger records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 font-sans">
                    No audit records match the current filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-2.5 px-4 font-sans text-gray-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      <strong className="text-gray-900 block truncate max-w-[140px]">
                        {log.actorName || 'System Automated'}
                      </strong>
                      <span className="text-[10px] text-gray-400 block">{log.actorRole || 'SYSTEM'}</span>
                    </td>
                    <td className="py-2.5 px-4 font-sans whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-gov-navy-100 text-gov-navy-900">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className="text-gray-900 font-semibold">{log.entityType}</span>
                      {log.entityId && (
                        <span className="block text-[10px] text-gray-400 font-mono truncate max-w-[120px]">
                          {log.entityId}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-gray-500 font-mono whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-2.5 px-4 text-gray-400 truncate max-w-[120px]" title={log.prevHash}>
                      {log.prevHash.substring(0, 10)}...
                    </td>
                    <td className="py-2.5 px-4 text-emerald-800 font-bold truncate max-w-[140px]" title={log.currHash}>
                      {log.currHash.substring(0, 12)}...
                    </td>
                    <td className="py-2.5 px-4 text-right font-sans">
                      <button
                        onClick={() => setInspectedLog(log)}
                        className="p-1 hover:bg-gray-100 rounded text-gov-navy-DEFAULT"
                        title="View JSON State Diff"
                      >
                        <FileCode className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* State Inspector Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-gov-navy-900">
                  Audit Record Deep Inspection: #{inspectedLog.id}
                </h3>
                <span className="text-xs text-gray-500">
                  Action: <strong>{inspectedLog.action}</strong> on {inspectedLog.entityType}
                </span>
              </div>
              <button
                onClick={() => setInspectedLog(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-gray-700 block mb-1">Cryptographic Linkage:</span>
                <div className="p-3 bg-gray-50 rounded-lg font-mono text-[11px] space-y-1 border">
                  <p className="truncate"><span className="text-gray-400">Previous Hash:</span> {inspectedLog.prevHash}</p>
                  <p className="truncate font-bold text-emerald-800"><span className="text-gray-400">Current Hash: </span> {inspectedLog.currHash}</p>
                </div>
              </div>

              {inspectedLog.afterState && (
                <div>
                  <span className="font-bold text-gray-700 block mb-1">State Mutation Data (JSON):</span>
                  <pre className="p-3 bg-gov-navy-950 text-amber-300 rounded-lg font-mono text-[11px] overflow-x-auto max-h-60">
                    {JSON.stringify(JSON.parse(inspectedLog.afterState), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

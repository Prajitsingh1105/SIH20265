import React, { useState, useEffect } from 'react';
import { useDemo } from '../context/DemoContext';
import { api } from '../services/api';
import {
  Clock,
  RotateCcw,
  Sliders,
  Calendar,
  AlertTriangle,
  BellRing,
  RefreshCw,
  Database,
  CheckCircle2,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { offsetDays, simulatedDate, isShifted, shiftClock, resetClock, resetDemoData } = useDemo();

  const [customDays, setCustomDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<any>(null);

  const [rules, setRules] = useState<any>({ reminderRules: [], escalationRules: [] });

  const fetchRules = async () => {
    try {
      const res = await api.getLifecycleRules();
      if (res.success) {
        setRules(res.data);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleShift = async (days: number) => {
    setLoading(true);
    try {
      const res = await shiftClock(days);
      if (res.success && res.data?.scanResult) {
        setLastScanResult(res.data.scanResult);
      }
      alert(`System date successfully advanced by +${days} days! Automated maturity scan executed.`);
    } catch (e: any) {
      alert(e.message || 'Failed to shift clock');
    } finally {
      setLoading(false);
    }
  };

  const handleManualScan = async () => {
    setLoading(true);
    try {
      const res = await api.runScanNow();
      if (res.success) {
        setLastScanResult(res.data);
        alert(res.message);
      }
    } catch (e: any) {
      alert(e.message || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-gov-navy-900" />
            <h1 className="text-xl font-black text-gov-navy-900">
              System Administration & Demo Control Room
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Configure automated maturity scan intervals, reminder thresholds, overdue escalation policies, and time travel.
          </p>
        </div>

        <button
          onClick={async () => {
            if (confirm('Restore initial demo dataset with ~40 FDRs across all statuses?')) {
              await resetDemoData();
              alert('Demo database reset to seed state.');
            }
          }}
          className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs transition shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data to Seed State</span>
        </button>
      </div>

      {/* Demo Time Travel Clock Card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-700" />
            <h3 className="font-extrabold text-sm text-gov-navy-900 uppercase tracking-wider">
              DEMO TIME TRAVEL (LIFECYCLE SIMULATOR)
            </h3>
          </div>
          <div className="text-xs font-bold text-amber-900">
            Current Simulated Date: <span className="bg-white px-2 py-0.5 rounded border border-amber-300 font-mono text-sm">{new Date(simulatedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span> {isShifted ? `(+${offsetDays} days)` : '(Real Time)'}
          </div>
        </div>

        <p className="text-xs text-amber-900 leading-relaxed">
          Advancing the demo clock instantly shifts the portal's active reference date. The lifecycle engine immediately executes a complete scan across all ~40 FDRs, triggering 90/60/30/7-day advance reminders, overdue transitions, and escalations live in seconds.
        </p>

        {/* Quick Shift Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={() => handleShift(30)}
            disabled={loading}
            className="px-4 py-2 bg-gov-navy-900 hover:bg-gov-navy-800 text-amber-400 font-bold text-xs rounded-lg shadow-xs transition"
          >
            Jump +30 Days
          </button>

          <button
            onClick={() => handleShift(60)}
            disabled={loading}
            className="px-4 py-2 bg-gov-navy-900 hover:bg-gov-navy-800 text-amber-400 font-bold text-xs rounded-lg shadow-xs transition"
          >
            Jump +60 Days (Demo Step 7)
          </button>

          <button
            onClick={() => handleShift(90)}
            disabled={loading}
            className="px-4 py-2 bg-gov-navy-900 hover:bg-gov-navy-800 text-amber-400 font-bold text-xs rounded-lg shadow-xs transition"
          >
            Jump +90 Days
          </button>

          {/* Custom Days Input */}
          <div className="flex items-center space-x-1 pl-2 border-l border-amber-300">
            <input
              type="number"
              value={customDays}
              onChange={(e) => setCustomDays(parseInt(e.target.value) || 0)}
              className="w-20 p-1.5 border border-amber-300 rounded text-xs text-center font-bold"
            />
            <button
              onClick={() => handleShift(customDays)}
              disabled={loading}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded transition"
            >
              Advance
            </button>
          </div>

          {/* Reset Clock */}
          {isShifted && (
            <button
              onClick={resetClock}
              disabled={loading}
              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded transition ml-auto"
            >
              Reset to Today
            </button>
          )}
        </div>

        {/* Scan Result Output */}
        {lastScanResult && (
          <div className="p-3 bg-white rounded-lg border border-amber-300 text-xs text-gov-navy-950 font-mono space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Lifecycle Scan Output ({lastScanResult.durationMs}ms):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-sans text-xs">
              <div>Total Scanned: <strong>{lastScanResult.totalScanned}</strong></div>
              <div>Reminders Dispatched: <strong className="text-amber-700">{lastScanResult.remindersTriggered}</strong></div>
              <div>Matured Overdue: <strong className="text-red-700">{lastScanResult.maturedTransitioned}</strong></div>
              <div>Senior Escalations: <strong className="text-red-700">{lastScanResult.escalationsTriggered}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Reminder & Escalation Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reminder Rules */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <BellRing className="w-4 h-4 text-gov-navy-900" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-gov-navy-900">
                Pre-Maturity Reminder Rules
              </h3>
            </div>
            <span className="text-[10px] text-gray-400">Scheduled Daily</span>
          </div>

          <p className="text-xs text-gray-500">
            Multi-channel notices automatically dispatched to institution email and SMS outbox prior to maturity.
          </p>

          <div className="space-y-2">
            {rules.reminderRules.map((rule: any) => (
              <div
                key={rule.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between text-xs"
              >
                <div>
                  <strong className="text-gov-navy-900 font-black">{rule.daysBeforeMaturity} Days</strong>
                  <span className="text-gray-500 ml-1">prior to maturity</span>
                  <span className="block text-[10px] text-gray-400 mt-0.5">
                    Channels: Email (Mailpit) + SMS Gateway
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  ACTIVE
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Escalation Rules */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-gov-navy-900">
                Post-Maturity Escalation Matrix
              </h3>
            </div>
            <span className="text-[10px] text-gray-400">Senior Oversight</span>
          </div>

          <p className="text-xs text-gray-500">
            Escalates unrenewed or lapsed deposits to regional officers and Competent Authorities to prevent compliance gaps.
          </p>

          <div className="space-y-2">
            {rules.escalationRules.map((esc: any) => (
              <div
                key={esc.id}
                className="p-3 bg-red-50/50 rounded-lg border border-red-200 flex items-center justify-between text-xs"
              >
                <div>
                  <strong className="text-red-900 font-black">{esc.daysOverdue} Day(s) Overdue</strong>
                  <span className="block text-[10px] text-gray-600 mt-0.5">
                    Target: <strong className="text-gov-navy-900">{esc.targetRole}</strong>
                  </span>
                </div>
                <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">
                  ACTIVE
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

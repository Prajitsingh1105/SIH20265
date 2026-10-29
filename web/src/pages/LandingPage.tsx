import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useDemo } from '../context/DemoContext';
import {
  ShieldCheck,
  Clock,
  Layers,
  FileCheck2,
  TrendingUp,
  FileLock2,
  ArrowRight,
  Landmark,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const { setIsGuideOpen } = useDemo();

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gov-navy-900 via-gov-navy-800 to-gov-navy-950 text-white rounded-2xl p-8 sm:p-12 shadow-xl border border-gov-navy-700 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-400/30">
            <span>🏛️ Smart India Hackathon 2026 | PS ID: SIH26265</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
            DEPOSIT-TRACK
            <span className="block text-xl sm:text-2xl font-normal text-amber-400 mt-2">
              Security Deposit & FDR Management Portal
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            "One portal for every deposit, from submission to release."
            <br />
            Streamlining institutional Fixed Deposit Receipts with two-tier CBS bank verification, automated 90/60/30/7-day maturity reminders, smart discrepancy detection, and immutable hash-chained audit trails.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-gov-navy-950 px-6 py-3 rounded-lg font-extrabold text-sm shadow-md transition transform hover:-translate-y-0.5"
            >
              <span>Access Portal (Login)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => setIsGuideOpen(true)}
              className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-lg font-bold text-sm transition"
            >
              <span>▶ Launch Guided Demo (12 Steps)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Live Impact Counters */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs text-center">
          <div className="text-2xl sm:text-3xl font-extrabold text-gov-navy-900">₹84.5 Cr</div>
          <div className="text-xs font-semibold text-gray-500 uppercase mt-1">Total Deposits Held</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Across 5 Partner Banks</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs text-center">
          <div className="text-2xl sm:text-3xl font-extrabold text-gov-navy-900">1.8 Days</div>
          <div className="text-xs font-semibold text-gray-500 uppercase mt-1">Verification Turnaround</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Down from 24 days manual</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs text-center">
          <div className="text-2xl sm:text-3xl font-extrabold text-gov-navy-900">100%</div>
          <div className="text-xs font-semibold text-gray-500 uppercase mt-1">Zero-Miss Alerts</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">90/60/30/7 Days & Escalations</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs text-center">
          <div className="text-2xl sm:text-3xl font-extrabold text-gov-navy-900">SHA-256</div>
          <div className="text-xs font-semibold text-gray-500 uppercase mt-1">Cryptographic Audit</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Tamper-Evident Hash Chain</p>
        </div>
      </section>

      {/* 4-Step Lifecycle Flow */}
      <section className="bg-white p-8 rounded-xl border border-gray-200 shadow-xs space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
            End-to-End Deposit Lifecycle Flow
          </span>
          <h2 className="text-2xl font-black text-gov-navy-900">How DEPOSIT-TRACK Works</h2>
          <p className="text-xs text-gray-600">
            One connected workflow with automated verification, maturity alerts and audit logging at every step.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
          <div className="p-4 bg-gov-navy-50/50 rounded-lg border border-gov-navy-100 text-center space-y-3">
            <div className="w-10 h-10 bg-gov-navy-900 text-amber-400 rounded-full flex items-center justify-center mx-auto font-bold text-sm">
              1
            </div>
            <h3 className="font-bold text-sm text-gov-navy-900">Submit & Verify</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Institution uploads scan; PaddleOCR auto-extracts FDR details. Scrutiny officer triggers real-time bank CBS check.
            </p>
          </div>

          <div className="p-4 bg-gov-navy-50/50 rounded-lg border border-gov-navy-100 text-center space-y-3">
            <div className="w-10 h-10 bg-gov-navy-900 text-amber-400 rounded-full flex items-center justify-center mx-auto font-bold text-sm">
              2
            </div>
            <h3 className="font-bold text-sm text-gov-navy-900">Monitor & Alert</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Automated lifecycle engine runs daily scan for 90, 60, 30 and 7 days advance reminders via Email, SMS & Bell.
            </p>
          </div>

          <div className="p-4 bg-gov-navy-50/50 rounded-lg border border-gov-navy-100 text-center space-y-3">
            <div className="w-10 h-10 bg-gov-navy-900 text-amber-400 rounded-full flex items-center justify-center mx-auto font-bold text-sm">
              3
            </div>
            <h3 className="font-bold text-sm text-gov-navy-900">Release & Refund</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Automated compliance checklist validates release eligibility. Competent Authority issues official QR-coded release order.
            </p>
          </div>

          <div className="p-4 bg-gov-navy-50/50 rounded-lg border border-gov-navy-100 text-center space-y-3">
            <div className="w-10 h-10 bg-gov-navy-900 text-amber-400 rounded-full flex items-center justify-center mx-auto font-bold text-sm">
              4
            </div>
            <h3 className="font-bold text-sm text-gov-navy-900">Immutable Audit</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Every action is cryptographically hash-chained with SHA-256. Tamper verification engine guarantees legal evidentiary integrity.
            </p>
          </div>
        </div>
      </section>

      {/* Unique Value Propositions Grid (Matching SIH PPT) */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gov-navy-DEFAULT">
            Key Architecture Innovations
          </span>
          <h2 className="text-2xl font-black text-gov-navy-900">Unique Value Proposition (UVP)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900">Verified vs Claimed Trust Layer</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Clearly distinguishes between institution-submitted claim (🟠) and bank CBS confirmed record (🟢), with automatic mismatch flagging.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900">Zero-Miss Maturity Monitoring</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Rule-based alerts with automatic escalation to senior officers on overdue instruments. Includes demo time travel clock to simulate future dates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-800 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900">Smart Discrepancy Detection</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Synchronous rule engine checking duplicate FDR numbers across India, date misalignments, amount norms, missing documents, and OCR divergence.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-3">
            <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-lg flex items-center justify-center">
              <FileLock2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900">Digital Document Vault</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              AES-256 application-layer encrypted storage with multi-version history (v1, v2...), who/when/why metadata, and per-document access logs.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-3">
            <div className="w-10 h-10 bg-rose-100 text-rose-800 rounded-lg flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900">Complete SHA-256 Audit Trail</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Tamper-evident hash chain connecting every log record. Built-in verification engine with demo tampering simulation and auto-repair.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-3">
            <div className="w-10 h-10 bg-teal-100 text-teal-800 rounded-lg flex items-center justify-center">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900">Integration-Ready Adapters</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Adapter pattern designed for plug-and-play connection to Bank CBS APIs (SBI, PNB, HDFC, Canara, BoB), AICTE ERP, and SMS/Email gateways.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

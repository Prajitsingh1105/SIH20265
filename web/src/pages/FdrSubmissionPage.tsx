import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Bank } from '../types';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileCheck2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  HelpCircle,
} from 'lucide-react';

export const FdrSubmissionPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Form State
  const [fdrFile, setFdrFile] = useState<File | null>(null);
  const [fdrNumber, setFdrNumber] = useState('');
  const [bankId, setBankId] = useState('');
  const [branchName, setBranchName] = useState('');
  const [amount, setAmount] = useState<number>(1500000);
  const [issueDate, setIssueDate] = useState('2024-07-15');
  const [maturityDate, setMaturityDate] = useState('2027-07-15');
  const [validityMonths, setValidityMonths] = useState(36);
  const [lienPledgeInFavor, setLienPledgeInFavor] = useState('Member Secretary, AICTE, New Delhi');
  const [remarks, setRemarks] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [declarationChecked, setDeclarationChecked] = useState(false);

  // Supporting docs
  const [supportingDocs, setSupportingDocs] = useState<{ title: string; docType: string; file: File }[]>([]);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState('LIEN_LETTER');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);

  // Submission result
  const [submittedFdr, setSubmittedFdr] = useState<any>(null);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await api.getBanks();
        if (res.success) {
          setBanks(res.data);
          if (res.data.length > 0) setBankId(res.data[0].id);
        }
      } catch {
        // Ignore
      }
    };
    fetchBanks();
  }, []);

  const handleOcrUpload = async (file: File) => {
    setFdrFile(file);
    setOcrLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.extractOcr(formData);
      if (res.success && res.data) {
        const d = res.data;
        if (d.fdrNumber) setFdrNumber(d.fdrNumber);
        if (d.amount) setAmount(d.amount);
        if (d.branch) setBranchName(d.branch);
        if (d.issueDate) setIssueDate(d.issueDate);
        if (d.maturityDate) setMaturityDate(d.maturityDate);
        if (d.validityMonths) setValidityMonths(d.validityMonths);
        if (d.confidence) setOcrConfidence(d.confidence);

        // Map bank if matched
        if (d.bankCode && banks.length > 0) {
          const matched = banks.find((b) => b.code === d.bankCode);
          if (matched) setBankId(matched.id);
        }
      }
      setStep(2); // Advance to auto-filled review
    } catch (e) {
      console.error('OCR Error:', e);
      setStep(2); // Still advance so user can input manually
    } finally {
      setOcrLoading(false);
    }
  };

  const handleAddSupportingDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocFile || !newDocTitle) return;

    setSupportingDocs([
      ...supportingDocs,
      { title: newDocTitle, docType: newDocType, file: newDocFile },
    ]);
    setNewDocTitle('');
    setNewDocFile(null);
  };

  const handleSubmitFdr = async (status: 'SUBMITTED' | 'DRAFT') => {
    setLoading(true);
    try {
      // 1. Create FDR
      const fdrRes = await api.createFdr({
        fdrNumber,
        bankId,
        branchName: branchName || 'Main Branch',
        amount: Number(amount),
        issueDate: new Date(issueDate).toISOString(),
        maturityDate: new Date(maturityDate).toISOString(),
        validityMonths: Number(validityMonths),
        lienPledgeInFavor,
        remarks,
        status,
        ocrData: JSON.stringify({ amount, fdrNumber, ocrConfidence }),
      });

      const newFdr = fdrRes.data;

      // 2. Upload FDR original scan file to vault
      if (fdrFile) {
        const formData = new FormData();
        formData.append('file', fdrFile);
        formData.append('fdrId', newFdr.id);
        formData.append('docType', 'FDR_RECEIPT');
        formData.append('title', `Original FDR Receipt Scan (${fdrNumber})`);
        await api.uploadDocument(formData);
      }

      // 3. Upload supporting documents
      for (const sDoc of supportingDocs) {
        const formData = new FormData();
        formData.append('file', sDoc.file);
        formData.append('fdrId', newFdr.id);
        formData.append('docType', sDoc.docType);
        formData.append('title', sDoc.title);
        await api.uploadDocument(formData);
      }

      setSubmittedFdr(newFdr);
      setStep(5); // Success step
    } catch (e: any) {
      alert(e.message || 'Submission failed. Please check form values.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
        <h1 className="text-xl font-black text-gov-navy-900">
          Institutional Security Deposit / FDR Submission
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Submission wizard with PaddleOCR auto-extraction, document vault archiving, and synchronous discrepancy validation.
        </p>

        {/* Stepper Progress */}
        <div className="flex items-center justify-between pt-6 max-w-2xl mx-auto">
          {[
            { num: 1, label: 'Upload FDR' },
            { num: 2, label: 'OCR & Details' },
            { num: 3, label: 'Supporting Docs' },
            { num: 4, label: 'Declaration' },
            { num: 5, label: 'Complete' },
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                  step === s.num
                    ? 'bg-gov-navy-900 text-amber-400 ring-4 ring-amber-100'
                    : step > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span className="text-[11px] font-semibold text-gray-600 mt-1">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Upload FDR Scan */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-xs space-y-6 text-center">
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-gov-navy-900">Step 1: Upload Original FDR Scan</h2>
            <p className="text-xs text-gray-500">
              Upload PDF or high-resolution image of the Term Deposit Receipt. The AICTE OCR engine will auto-extract all fields.
            </p>
          </div>

          <div className="border-2 border-dashed border-gray-300 hover:border-gov-navy-DEFAULT rounded-2xl p-8 max-w-lg mx-auto bg-gray-50/50 transition">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <label className="cursor-pointer text-xs font-bold text-gov-navy-900 hover:underline">
                  Click to select scan file
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleOcrUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
                <p className="text-[11px] text-gray-400 mt-1">Supports PDF, PNG, JPG (up to 25 MB)</p>
              </div>
            </div>
          </div>

          {ocrLoading && (
            <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-gov-navy-DEFAULT">
              <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
              <span>Running PaddleOCR neural text extraction...</span>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
            <button
              onClick={() => setStep(2)}
              className="text-gray-500 hover:text-gray-700 underline"
            >
              Skip OCR & Enter Manually →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: OCR Extracted Fields Review & Edit */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-gov-navy-900">Step 2: Review & Edit FDR Details</h2>
              <p className="text-xs text-gray-500">
                Verify auto-extracted values against the original bank physical receipt.
              </p>
            </div>
            {ocrConfidence && (
              <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>OCR Confidence: {(ocrConfidence * 100).toFixed(0)}%</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">FDR Instrument Number *</label>
              <input
                type="text"
                required
                value={fdrNumber}
                onChange={(e) => setFdrNumber(e.target.value.toUpperCase())}
                placeholder="e.g. FDR-SBI-2024-8842"
                className="w-full p-2.5 border border-gray-300 rounded-lg font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Pledged Bank *</label>
              <select
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg"
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Branch Name *</label>
              <input
                type="text"
                required
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g. Parliament Street Branch"
                className="w-full p-2.5 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Principal Deposit Amount (₹) *</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 border border-gray-300 rounded-lg font-bold text-sm"
              />
              <span className="text-[10px] text-gray-400">AICTE Minimum Norm: ₹5,00,000</span>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Issue Date *</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Maturity Date *</label>
              <input
                type="date"
                required
                value={maturityDate}
                onChange={(e) => setMaturityDate(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Validity (Months) *</label>
              <input
                type="number"
                value={validityMonths}
                onChange={(e) => setValidityMonths(parseInt(e.target.value) || 36)}
                className="w-full p-2.5 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Lien / Pledge in Favour of *</label>
              <input
                type="text"
                value={lienPledgeInFavor}
                onChange={(e) => setLienPledgeInFavor(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Program / Course Purpose Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Security deposit for approval of new B.Tech program in AI & Data Science"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-100">
            <button
              onClick={() => setStep(1)}
              className="flex items-center space-x-1 px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center space-x-1 px-4 py-2 bg-gov-navy-900 text-amber-400 rounded-lg text-xs font-bold hover:bg-gov-navy-800 shadow-xs"
            >
              <span>Proceed to Supporting Documents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Supporting Documents */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-gov-navy-900">Step 3: Upload Supporting Documents</h2>
            <p className="text-xs text-gray-500">
              Upload AICTE Lien declaration letter, sanction letter, or board resolution. Files will be stored AES-256 encrypted.
            </p>
          </div>

          {/* Add Document Box */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <h3 className="font-bold text-xs text-gov-navy-900">Add Mandatory / Optional Document</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-gray-500 mb-1">Document Title</label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g. Official AICTE Lien Declaration"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Document Type</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="LIEN_LETTER">AICTE Lien / Pledge Letter</option>
                  <option value="SANCTION_LETTER">Bank Sanction Letter</option>
                  <option value="BANK_CONFIRMATION">Bank Endorsement Confirmation</option>
                  <option value="OTHER">Other Compliance Document</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Select File</label>
                <input
                  type="file"
                  onChange={(e) => setNewDocFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs"
                />
              </div>
            </div>

            <button
              onClick={handleAddSupportingDoc}
              disabled={!newDocFile || !newDocTitle}
              className="px-3 py-1.5 bg-gov-navy-900 text-amber-400 font-bold text-xs rounded-lg disabled:opacity-40"
            >
              + Attach Document to Vault
            </button>
          </div>

          {/* Attached Files List */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-gray-700">Attached Documents ({supportingDocs.length})</h4>
            {supportingDocs.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No additional supporting documents attached yet.</p>
            ) : (
              supportingDocs.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gov-navy-900" />
                    <span className="font-bold text-gray-900">{doc.title}</span>
                    <span className="text-gray-500">({doc.docType})</span>
                  </div>
                  <span className="text-gray-400 font-mono text-[11px]">{doc.file.name}</span>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-100">
            <button
              onClick={() => setStep(2)}
              className="flex items-center space-x-1 px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex items-center space-x-1 px-4 py-2 bg-gov-navy-900 text-amber-400 rounded-lg text-xs font-bold hover:bg-gov-navy-800 shadow-xs"
            >
              <span>Review & Declaration</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review, Legal Declaration & Submit */}
      {step === 4 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-gov-navy-900">Step 4: Review & Formal Declaration</h2>
            <p className="text-xs text-gray-500">
              Review all instrument attributes prior to official submission into the AICTE central repository.
            </p>
          </div>

          {/* Summary Box */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-gray-500 block">FDR Number:</span>
              <strong className="font-mono text-gov-navy-900">{fdrNumber}</strong>
            </div>
            <div>
              <span className="text-gray-500 block">Bank & Branch:</span>
              <strong className="text-gray-900">{branchName}</strong>
            </div>
            <div>
              <span className="text-gray-500 block">Principal Amount:</span>
              <strong className="text-gov-navy-900 font-black">₹{amount.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span className="text-gray-500 block">Validity Tenure:</span>
              <strong className="text-gray-900">{issueDate} to {maturityDate}</strong>
            </div>
            <div>
              <span className="text-gray-500 block">Lien Pledge:</span>
              <strong className="text-gray-900">{lienPledgeInFavor}</strong>
            </div>
            <div>
              <span className="text-gray-500 block">Vault Documents:</span>
              <strong className="text-gray-900">{supportingDocs.length + 1} Files</strong>
            </div>
          </div>

          {/* Legal Declaration */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={declarationChecked}
                onChange={(e) => setDeclarationChecked(e.target.checked)}
                className="mt-0.5 rounded text-gov-navy-900 focus:ring-gov-navy-DEFAULT"
              />
              <span className="text-xs text-amber-950 leading-relaxed font-medium">
                I hereby declare on behalf of the institution that the Fixed Deposit Receipt details provided above are authentic, valid, and created with an irrevocable lien marked in favour of the Member Secretary, AICTE, New Delhi. I understand that duplicate FDR numbers or CBS amount mismatches will be flagged as discrepancies and subject to compliance scrutiny.
              </span>
            </label>
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-100">
            <button
              onClick={() => setStep(3)}
              className="flex items-center space-x-1 px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <div className="space-x-2">
              <button
                type="button"
                onClick={() => handleSubmitFdr('DRAFT')}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                Save as Draft
              </button>

              <button
                type="button"
                onClick={() => handleSubmitFdr('SUBMITTED')}
                disabled={loading || !declarationChecked}
                className="px-5 py-2 bg-gov-navy-900 hover:bg-gov-navy-800 text-amber-400 rounded-lg text-xs font-bold shadow-xs disabled:opacity-40"
              >
                {loading ? 'Submitting & Validating...' : 'Submit FDR to AICTE Portal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Submission Success & Discrepancy Engine Output */}
      {step === 5 && submittedFdr && (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-xs space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-gov-navy-900">
              FDR Submitted Successfully!
            </h2>
            <p className="text-xs text-gray-500">
              Record registered under Instrument ID <strong className="font-mono text-gray-900">{submittedFdr.fdrNumber}</strong>
            </p>
          </div>

          {/* Immediate Discrepancy Engine Feedback */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 max-w-lg mx-auto text-left text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-gray-900">
              <span>Synchronous Discrepancy Scan:</span>
              <span className="text-emerald-700">COMPLETED</span>
            </div>
            {submittedFdr.discrepancies?.length > 0 ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  <span>{submittedFdr.discrepancies.length} Discrepancy Flag(s) Detected:</span>
                </span>
                <ul className="list-disc pl-4 text-[11px] text-red-800">
                  {submittedFdr.discrepancies.map((d: any, i: number) => (
                    <li key={i}>{d.message}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-emerald-800 font-medium">
                ✅ No date, duplicate, or norm violations found. Trust tier: 🟠 Submitted by Institution. Ready for AICTE Officer scrutiny.
              </p>
            )}
          </div>

          <div className="pt-4 flex justify-center space-x-3">
            <button
              onClick={() => navigate(`/fdrs/${submittedFdr.id}`)}
              className="px-5 py-2.5 bg-gov-navy-900 text-amber-400 rounded-lg text-xs font-bold shadow-xs hover:bg-gov-navy-800"
            >
              View FDR Details & Vault
            </button>
            <button
              onClick={() => navigate('/fdrs')}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100"
            >
              Return to Repository
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

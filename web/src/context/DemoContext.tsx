import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export interface DemoStep {
  id: number;
  title: string;
  hindiTitle: string;
  role: 'INSTITUTION' | 'SCRUTINY_OFFICER' | 'COMPETENT_AUTHORITY' | 'SYSTEM_ADMIN';
  roleLabel: string;
  path: string;
  talkingPoint: string;
  isCompleted: boolean;
}

interface DemoContextType {
  offsetDays: number;
  simulatedDate: string;
  isShifted: boolean;
  shiftClock: (days: number) => Promise<any>;
  resetClock: () => Promise<any>;
  isGuideOpen: boolean;
  setIsGuideOpen: (open: boolean) => void;
  demoSteps: DemoStep[];
  completeStep: (stepId: number) => void;
  resetDemoData: () => Promise<void>;
}

const INITIAL_STEPS: DemoStep[] = [
  {
    id: 1,
    title: 'Landing & 2FA Login',
    hindiTitle: 'पोर्टल और 2FA लॉगिन',
    role: 'INSTITUTION',
    roleLabel: 'Institution User',
    path: '/login',
    talkingPoint: 'Demonstrate bilingual GIGW 3.0 header, font scaling, contrast, and 2FA login with demo OTP 123456.',
    isCompleted: false,
  },
  {
    id: 2,
    title: 'FDR Submission & OCR Auto-Extraction',
    hindiTitle: 'एफडीआर सबमिशन और ओसीआर निष्कर्षण',
    role: 'INSTITUTION',
    roleLabel: 'Institution User',
    path: '/submission',
    talkingPoint: 'Upload sample FDR scan; watch PaddleOCR auto-fill receipt number, bank, amount, and dates with confidence scoring.',
    isCompleted: false,
  },
  {
    id: 3,
    title: 'Smart Discrepancy Detection',
    hindiTitle: 'स्मार्ट विसंगति का पता लगाना',
    role: 'INSTITUTION',
    roleLabel: 'Institution User',
    path: '/fdrs',
    talkingPoint: 'Show immediate automated flags: duplicate FDR number, minimum AICTE amount violation, or missing lien documents.',
    isCompleted: false,
  },
  {
    id: 4,
    title: 'AICTE Officer Scrutiny',
    hindiTitle: 'एआईसीटीई अधिकारी समीक्षा',
    role: 'SCRUTINY_OFFICER',
    roleLabel: 'Scrutiny Officer',
    path: '/fdrs',
    talkingPoint: 'Log in as Scrutiny Officer; inspect flagged FDR, review rule violations, and record official scrutiny observations.',
    isCompleted: false,
  },
  {
    id: 5,
    title: 'Two-Tier Bank CBS Verification Loop',
    hindiTitle: 'दो-स्तरीय बैंक सत्यापन लूप',
    role: 'SCRUTINY_OFFICER',
    roleLabel: 'Scrutiny Officer',
    path: '/fdrs',
    talkingPoint: 'Query mock Core Banking System. Highlight side-by-side mismatch, transition to Resubmission Required, then verify matching record to turn badge 🟢 Confirmed.',
    isCompleted: false,
  },
  {
    id: 6,
    title: 'Digital Vault & Version History',
    hindiTitle: 'डिजिटल वॉल्ट और संस्करण इतिहास',
    role: 'INSTITUTION',
    roleLabel: 'Institution User',
    path: '/fdrs',
    talkingPoint: 'Demonstrate AES-256 application encryption, download audit access logs, and upload v2 version with change reason.',
    isCompleted: false,
  },
  {
    id: 7,
    title: 'Automated Lifecycle & Time Travel (+60 Days)',
    hindiTitle: 'स्वचालित जीवनचक्र और टाइम ट्रैवल (+60 दिन)',
    role: 'SYSTEM_ADMIN',
    roleLabel: 'System Admin',
    path: '/admin',
    talkingPoint: 'Shift Demo Clock forward +60 days; run scan to trigger 90/60 day reminders in Mailpit, in-app bell and SMS outbox. Jump past maturity to show senior escalation.',
    isCompleted: false,
  },
  {
    id: 8,
    title: 'Renewal Linking & Audit Chain',
    hindiTitle: 'नवीनीकरण लिंकिंग और ऑडिट चेन',
    role: 'INSTITUTION',
    roleLabel: 'Institution User',
    path: '/fdrs',
    talkingPoint: 'Renew a matured instrument. Inspect the permanent parent-child history chain (Old FDR -> Renewed FDR).',
    isCompleted: false,
  },
  {
    id: 9,
    title: 'Release & Refund Workflow with QR Order',
    hindiTitle: 'रिलीज़ / रिफंड वर्कफ़्लो और क्यूआर ऑर्डर',
    role: 'INSTITUTION',
    roleLabel: 'Institution User',
    path: '/release',
    talkingPoint: 'Execute 4-stage release: Eligibility Check -> Officer Scrutiny -> Authority Final Approval -> Download tamper-proof PDF with verification QR.',
    isCompleted: false,
  },
  {
    id: 10,
    title: 'Executive Dashboards & Measured KPIs',
    hindiTitle: 'डैशबोर्ड और मापे गए केपीआई',
    role: 'SCRUTINY_OFFICER',
    roleLabel: 'Scrutiny Officer',
    path: '/dashboard',
    talkingPoint: 'Review turnaround time (1.8d vs 24d), % records verified, zero missed deadlines, and estimated manual hours saved formula.',
    isCompleted: false,
  },
  {
    id: 11,
    title: 'Immutable SHA-256 Audit Integrity',
    hindiTitle: 'अपरिवर्तनीय ऑडिट ट्रेल सत्यापन',
    role: 'SYSTEM_ADMIN',
    roleLabel: 'System Admin',
    path: '/audit',
    talkingPoint: 'Verify SHA-256 hash chain (green). Click "Simulate Tampering" to detect broken link at record #N (red). Click "Repair" to restore green integrity.',
    isCompleted: false,
  },
  {
    id: 12,
    title: 'Integration-Ready Adapter Hub',
    hindiTitle: 'एकीकरण एडेप्टर हब',
    role: 'SYSTEM_ADMIN',
    roleLabel: 'System Admin',
    path: '/integrations',
    talkingPoint: 'Demonstrate plug-in architecture for live Bank CBS, AICTE e-Gov ERP, and Telephony/Mail SMS gateways with real latency tests.',
    isCompleted: false,
  },
];

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [offsetDays, setOffsetDays] = useState(0);
  const [simulatedDate, setSimulatedDate] = useState(new Date().toISOString());
  const [isShifted, setIsShifted] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [demoSteps, setDemoSteps] = useState<DemoStep[]>(INITIAL_STEPS);

  const fetchClock = async () => {
    try {
      const res = await api.getClockState();
      if (res.success && res.data) {
        setOffsetDays(res.data.offsetDays);
        setSimulatedDate(res.data.simulatedDate);
        setIsShifted(res.data.isShifted);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchClock();
  }, []);

  const shiftClock = async (days: number) => {
    const res = await api.shiftClock(days);
    if (res.success) {
      setOffsetDays(res.data.offsetDays);
      setSimulatedDate(res.data.simulatedDate);
      setIsShifted(res.data.offsetDays !== 0);
    }
    return res;
  };

  const resetClock = async () => {
    const res = await api.resetClock();
    if (res.success) {
      setOffsetDays(0);
      setSimulatedDate(new Date().toISOString());
      setIsShifted(false);
    }
    return res;
  };

  const completeStep = (stepId: number) => {
    setDemoSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, isCompleted: true } : s))
    );
  };

  const resetDemoData = async () => {
    await api.resetDemoData();
    await resetClock();
    setDemoSteps(INITIAL_STEPS);
  };

  return (
    <DemoContext.Provider
      value={{
        offsetDays,
        simulatedDate,
        isShifted,
        shiftClock,
        resetClock,
        isGuideOpen,
        setIsGuideOpen,
        demoSteps,
        completeStep,
        resetDemoData,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within DemoProvider');
  return context;
};

import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'hi';

const DICTIONARY: Record<Language, Record<string, string>> = {
  en: {
    // Top Bar & Header
    'portal.title': 'DEPOSIT-TRACK',
    'portal.subtitle': 'Security Deposit & FDR Management Portal',
    'portal.org': 'All India Council for Technical Education (AICTE), New Delhi',
    'portal.tagline': 'One portal for every deposit, from submission to release.',
    'skip.to.content': 'Skip to main content',
    'screen.reader': 'Screen Reader Access',
    'text.size': 'Text Size',
    'high.contrast': 'High Contrast',
    'login': 'Login',
    'logout': 'Sign Out',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.repository': 'FDR Repository',
    'nav.submission': 'New FDR Submission',
    'nav.release': 'Release / Refund',
    'nav.audit': 'Audit Trail',
    'nav.integrations': 'Integrations Hub',
    'nav.smsOutbox': 'SMS Outbox',
    'nav.admin': 'System Settings',

    // Statuses
    'status.ACTIVE': 'Active',
    'status.SUBMITTED': 'Submitted',
    'status.UNDER_SCRUTINY': 'Under Scrutiny',
    'status.DISCREPANCY_FLAGGED': 'Discrepancy Flagged',
    'status.RESUBMISSION_REQUIRED': 'Resubmission Required',
    'status.BANK_VERIFICATION_PENDING': 'Bank Verification Pending',
    'status.VERIFIED_CONFIRMED': 'Verified (Bank-Confirmed)',
    'status.EXPIRING_SOON': 'Expiring Soon',
    'status.MATURED': 'Matured',
    'status.RENEWED': 'Renewed',
    'status.RELEASE_REQUESTED': 'Release Requested',
    'status.RELEASED': 'Released',
    'status.REJECTED': 'Rejected',
    'status.DRAFT': 'Draft',

    // Trust Tiers
    'tier.CLAIMED': 'Submitted by Institution',
    'tier.CONFIRMED': 'Confirmed by Bank',
    'tier.FLAGGED': 'Discrepancy Flagged',

    // Common Buttons
    'btn.submit': 'Submit',
    'btn.cancel': 'Cancel',
    'btn.view': 'View Details',
    'btn.verify': 'Bank Check',
    'btn.renew': 'Renew FDR',
    'btn.release': 'Request Release',
    'btn.resubmit': 'Resubmit',
    'btn.exportCsv': 'Export CSV',
    'btn.guide': 'Demo Guide',
  },
  hi: {
    // Top Bar & Header
    'portal.title': 'डिपॉजिट-ट्रैक',
    'portal.subtitle': 'सुरक्षा जमा एवं एफडीआर प्रबंधन पोर्टल',
    'portal.org': 'अखिल भारतीय तकनीकी शिक्षा परिषद (एआईसीटीई), नई दिल्ली',
    'portal.tagline': 'हर जमा के लिए एक पोर्टल, सबमिशन से लेकर रिलीज तक।',
    'skip.to.content': 'मुख्य सामग्री पर जाएं',
    'screen.reader': 'स्क्रीन रीडर एक्सेस',
    'text.size': 'अक्षर आकार',
    'high.contrast': 'उच्च कंट्रास्ट',
    'login': 'लॉगिन',
    'logout': 'साइन आउट',

    // Navigation
    'nav.dashboard': 'डैशबोर्ड',
    'nav.repository': 'एफडीआर भंडार',
    'nav.submission': 'नया एफडीआर सबमिशन',
    'nav.release': 'रिलीज़ / रिफंड',
    'nav.audit': 'ऑडिट ट्रेल',
    'nav.integrations': 'एकीकरण हब',
    'nav.smsOutbox': 'एसएमएस आउटबॉक्स',
    'nav.admin': 'सिस्टम सेटिंग्स',

    // Statuses
    'status.ACTIVE': 'सक्रिय',
    'status.SUBMITTED': 'प्रस्तुत किया गया',
    'status.UNDER_SCRUTINY': 'जांच के अधीन',
    'status.DISCREPANCY_FLAGGED': 'विसंगति चिह्नित',
    'status.RESUBMISSION_REQUIRED': 'पुनः प्रस्तुतीकरण आवश्यक',
    'status.BANK_VERIFICATION_PENDING': 'बैंक सत्यापन लंबित',
    'status.VERIFIED_CONFIRMED': 'सत्यापित (बैंक-पुष्ट)',
    'status.EXPIRING_SOON': 'जल्द समाप्त होने वाला',
    'status.MATURED': 'परिपक्व (समाप्त)',
    'status.RENEWED': 'नवीनीकृत',
    'status.RELEASE_REQUESTED': 'रिलीज़ का अनुरोध किया गया',
    'status.RELEASED': 'जारी / विमुक्त',
    'status.REJECTED': 'अस्वीकृत',
    'status.DRAFT': 'ड्राफ्ट',

    // Trust Tiers
    'tier.CLAIMED': 'संस्थान द्वारा प्रस्तुत',
    'tier.CONFIRMED': 'बैंक द्वारा पुष्ट',
    'tier.FLAGGED': 'विसंगति चिह्नित',

    // Common Buttons
    'btn.submit': 'सबमिट करें',
    'btn.cancel': 'रद्द करें',
    'btn.view': 'विवरण देखें',
    'btn.verify': 'बैंक जांच',
    'btn.renew': 'एफडीआर नवीनीकरण',
    'btn.release': 'रिलीज़ अनुरोध',
    'btn.resubmit': 'पुनः प्रस्तुत करें',
    'btn.exportCsv': 'सीएसवी निर्यात',
    'btn.guide': 'डेमो गाइड',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return DICTIONARY[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

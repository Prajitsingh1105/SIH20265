import React from 'react';
import { FdrStatus } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface StatusPillProps {
  status: FdrStatus;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, className = '' }) => {
  const { t } = useLanguage();

  const getStyle = () => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'VERIFIED_CONFIRMED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-medium';
      case 'SUBMITTED':
      case 'UNDER_SCRUTINY':
      case 'BANK_VERIFICATION_PENDING':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'EXPIRING_SOON':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-medium animate-pulse';
      case 'MATURED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'RENEWED':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'RELEASE_REQUESTED':
        return 'bg-sky-50 text-sky-800 border-sky-300';
      case 'RELEASED':
        return 'bg-green-100 text-green-900 border-green-400 font-semibold';
      case 'DISCREPANCY_FLAGGED':
      case 'RESUBMISSION_REQUIRED':
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-300 font-medium';
      case 'DRAFT':
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border font-medium ${getStyle()} ${className}`}
    >
      {t(`status.${status}`) || status}
    </span>
  );
};

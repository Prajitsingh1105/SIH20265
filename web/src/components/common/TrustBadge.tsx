import React from 'react';
import { VerificationTier } from '../../types';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface TrustBadgeProps {
  tier: VerificationTier;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ tier, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  if (tier === 'CONFIRMED') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs ${sizeClasses[size]} ${className}`}
        title="Verified & Confirmed by Bank Core Banking System (CBS)"
      >
        <CheckCircle2 className={size === 'sm' ? 'w-3 h-3 text-emerald-600' : 'w-4 h-4 text-emerald-600'} />
        <span>Confirmed by Bank</span>
      </span>
    );
  }

  if (tier === 'FLAGGED') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-rose-50 text-rose-800 border border-rose-300 shadow-xs ${sizeClasses[size]} ${className}`}
        title="Discrepancy detected during validation or bank verification"
      >
        <AlertCircle className={size === 'sm' ? 'w-3 h-3 text-rose-600' : 'w-4 h-4 text-rose-600'} />
        <span>Discrepancy Flagged</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-xs ${sizeClasses[size]} ${className}`}
      title="Submitted by institution; pending bank core ledger confirmation"
    >
      <Clock className={size === 'sm' ? 'w-3 h-3 text-amber-600' : 'w-4 h-4 text-amber-600'} />
      <span>Submitted by Institution</span>
    </span>
  );
};

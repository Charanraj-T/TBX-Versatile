import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { ValidationStatus } from '@/lib/types';

interface ValidationBadgeProps {
  status: ValidationStatus;
  showIcon?: boolean;
}

export const ValidationBadge: React.FC<ValidationBadgeProps> = ({ status, showIcon = true }) => {
  switch (status) {
    case 'VERIFIED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {showIcon && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
          VERIFIED
        </span>
      );
    case 'WARNING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
          WARNING
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
          FAILED
        </span>
      );
    default:
      return null;
  }
};


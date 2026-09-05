'use client';

import React from 'react';
import { ValidationStatus } from '../lib/types';

const STYLES: Record<ValidationStatus, string> = {
  VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  WARNING: 'bg-amber-50 text-amber-700 border-amber-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const ValidationBadge: React.FC<{ status: ValidationStatus }> = ({ status }) => {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STYLES[status]}`}>
      {status}
    </span>
  );
};
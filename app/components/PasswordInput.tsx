'use client';

import React, { useState } from 'react';
import { useLanguage } from '../i18n';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export default function PasswordInput({ className = '', disabled, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();
  const toggleLabel = visible ? t('password.hide') : t('password.show');

  return (
    <div className="relative">
      <input
        {...props}
        disabled={disabled}
        type={visible ? 'text' : 'password'}
        className={`${className} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        disabled={disabled}
        aria-label={toggleLabel}
        aria-pressed={visible}
        title={toggleLabel}
        className="absolute right-0 top-0 h-full w-11 flex items-center justify-center rounded-r-[9px] text-[#8a8270] hover:text-[#13243c] hover:bg-[#f8f7f2] focus:outline-none focus:ring-1 focus:ring-[#d9704f] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition"
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.8 21.8 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-3.22 4.53M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <path d="M1 1l22 22" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

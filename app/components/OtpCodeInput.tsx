'use client';

import React from 'react';

interface OtpCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  size?: 'md' | 'lg';
}

const SIZE_STYLES: Record<NonNullable<OtpCodeInputProps['size']>, string> = {
  md: 'h-[52px] rounded-[9px] text-[22px]',
  lg: 'h-[56px] rounded-[10px] text-[26px]',
};

export default function OtpCodeInput({ value, onChange, size = 'lg' }: OtpCodeInputProps) {
  return (
    <input
      required
      maxLength={6}
      type="text"
      placeholder="000000"
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full text-center border-2 border-[#13243c] font-mono font-bold tracking-[0.25em] text-[#13243c] focus:outline-none ${SIZE_STYLES[size]}`}
    />
  );
}

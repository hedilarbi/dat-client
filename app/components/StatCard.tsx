import React from 'react';
import Link from 'next/link';

interface StatCardProps {
  label: string;
  value: number | string;
  bg: string;
  labelColor: string;
  valueColor?: string;
  href?: string;
}

export default function StatCard({ label, value, bg, labelColor, valueColor = '#13243c', href }: StatCardProps) {
  const content = (
    <div className={`rounded-[12px] p-[18px_20px] ${href ? 'transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13243c]' : ''}`} style={{ background: bg }}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: labelColor }}>
        {label}
      </div>
      <div className="text-[32px] font-bold font-heading mt-2" style={{ color: valueColor }}>
        {value}
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block rounded-[12px]" aria-label={label}>
      {content}
    </Link>
  );
}

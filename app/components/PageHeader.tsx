import React from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}

export default function PageHeader({ eyebrow, title, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#a3987f] mb-2">
          {eyebrow}
        </div>
        <h1 className="text-[36px] font-bold font-heading uppercase text-[#13243c]">
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}

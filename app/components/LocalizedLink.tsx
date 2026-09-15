'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { localizedPath, useLanguage } from '../i18n';

export default function LocalizedLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const { language } = useLanguage();
  return <Link href={localizedPath(href, language)} className={className}>{children}</Link>;
}

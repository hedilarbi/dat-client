'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface DropdownMenuProps {
  trigger: (props: { onClick: () => void; open: boolean }) => React.ReactNode;
  children: React.ReactNode | ((props: { close: () => void }) => React.ReactNode);
  align?: 'left' | 'right';
  panelClassName?: string;
}

/**
 * Renders its panel through a portal to document.body, anchored (fixed position) to the
 * trigger's bounding rect. Header bars use overflow-x-auto for horizontal scrolling on small
 * screens, which would otherwise clip any absolutely-positioned dropdown taller than the header.
 */
export default function DropdownMenu({ trigger, children, align = 'right', panelClassName = '' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => setOpen(prev => !prev);
  const close = () => setOpen(false);

  useLayoutEffect(() => {
    if (!open) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition(
      align === 'right'
        ? { top: rect.bottom + 8, right: window.innerWidth - rect.right }
        : { top: rect.bottom + 8, left: rect.left }
    );
  }, [open, align]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  return (
    <div ref={triggerRef} className="inline-flex">
      {trigger({ onClick: toggleOpen, open })}
      {open && position && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: position.top, left: position.left, right: position.right }}
          className={`z-300 ${panelClassName}`}
        >
          {typeof children === 'function' ? children({ close }) : children}
        </div>,
        document.body
      )}
    </div>
  );
}

'use client';

import React from 'react';
import Spinner from './Spinner';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger = false,
  loading = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6" onClick={() => !loading && onCancel()}>
      <div
        className="w-full max-w-[420px] bg-white rounded-[14px] shadow-[0_20px_60px_rgba(0,0,0,0.24)] p-6"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-[#13243c] mb-2">{title}</h3>
        <div className="text-sm text-[#5a5e66] mb-6">{message}</div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn btn-secondary disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
            className={`px-4 py-2 flex items-center gap-2 text-white font-bold rounded-[8px] text-xs uppercase cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#13243c] hover:bg-slate-800'}`}
          >
            {loading ? <Spinner /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

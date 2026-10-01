'use client';

import React, { useState } from 'react';
import { useLanguage } from '../i18n';
import { DOCUMENTS_SUBSTEPS, STEP } from '../lib/saleSteps';

interface DocumentsSubstepsProps {
  currentStep: number;
  closed: boolean;
  // Contenu d'une sous-étape ; `historical` vaut true pour une sous-étape terminée
  children: (step: number, historical: boolean) => React.ReactNode;
}

/**
 * Étape « Documents administratifs » : ses sous-étapes (préparation, validation, signature) sont
 * présentées par leur nom, sans numéro. Une sous-étape terminée peut être rouverte pour voir ce
 * qui s'y est passé.
 */
export default function DocumentsSubsteps({ currentStep, closed, children }: DocumentsSubstepsProps) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<number | null>(null);
  // Sans choix de l'utilisateur : la sous-étape en cours, ou la signature une fois la vente clôturée
  const shown = selected ?? (closed ? STEP.SIGNATURE : currentStep);

  return (
    <div>
      <ol className="mb-5 flex flex-col gap-2 sm:flex-row">
        {DOCUMENTS_SUBSTEPS.map(({ step, key }) => {
          const done = closed || step < currentStep;
          const current = !closed && step === currentStep;
          const isShown = step === shown;
          const tone = done
            ? 'border-[#cbe3d5] bg-[#e9f4ee] text-[#2f6f4f]'
            : current
              ? 'border-[#d9704f] bg-[#fdf3ec] text-[#d9704f]'
              : 'border-[#eceadf] bg-white text-[#9a917d]';
          return (
            <li key={key} className="flex-1">
              <button
                type="button"
                disabled={!done && !current}
                aria-current={current ? 'step' : undefined}
                aria-pressed={done ? isShown : undefined}
                onClick={() => setSelected(current || selected === step ? null : step)}
                className={`flex w-full items-center gap-2 rounded-[9px] border px-3 py-2 text-left text-[13px] font-bold transition ${tone} ${isShown && (done || current) ? 'ring-2 ring-[#13243c]/15' : ''} ${done ? 'cursor-pointer hover:brightness-95' : current ? 'cursor-default' : 'cursor-not-allowed'}`}
              >
                <span aria-hidden="true">{done ? '✓' : current ? '●' : '○'}</span>
                {t(`saleSubstep.${key}`)}
              </button>
            </li>
          );
        })}
      </ol>
      {children(shown, closed || shown < currentStep)}
    </div>
  );
}

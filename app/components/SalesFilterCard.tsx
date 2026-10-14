'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useLanguage } from '../i18n';
import vehicleCatalog from '../lib/vehicleCatalog.json';
import { ENERGY_OPTIONS, GEARBOX_OPTIONS, PROCEDURE_OPTIONS } from '../lib/vehicleLabels';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_MIN = 1990;
const MILEAGE_MIN = 0;
const MILEAGE_MAX = 300000;
const MILEAGE_STEP = 5000;

export interface SaleFilters {
  brand: string;
  model: string;
  energy: string;
  procedure: string;
  gearbox: string;
  registrationCardAvailable: string;
  yearFrom: string;
  yearTo: string;
  mileageFrom: string;
  mileageTo: string;
}

export const EMPTY_SALE_FILTERS: SaleFilters = {
  brand: '', model: '', energy: '', procedure: '', gearbox: '', registrationCardAvailable: '',
  yearFrom: '', yearTo: '', mileageFrom: '', mileageTo: '',
};

const FILTER_KEYS = Object.keys(EMPTY_SALE_FILTERS) as Array<keyof SaleFilters>;

/** Filtres → paramètres d'URL (seuls les filtres renseignés), pour ouvrir la page Véhicules déjà filtrée. */
export const filtersToQueryString = (filters: SaleFilters) => {
  const params = new URLSearchParams();
  FILTER_KEYS.forEach((key) => { if (filters[key]) params.set(key, filters[key]); });
  return params.toString();
};

/** Paramètres d'URL → filtres (les paramètres inconnus sont ignorés). */
export const filtersFromSearchParams = (params: { get: (name: string) => string | null }): SaleFilters => {
  const filters = { ...EMPTY_SALE_FILTERS };
  FILTER_KEYS.forEach((key) => { filters[key] = params.get(key) || ''; });
  return filters;
};

interface SalesFilterCardProps {
  /** Filtres actuellement appliqués à la liste */
  filters: SaleFilters;
  onApply: (filters: SaleFilters) => void;
  /** Remise à zéro : par défaut elle applique des filtres vides ; l'accueil, où appliquer ouvre une autre page, la limite au formulaire. */
  onReset?: () => void;
  /** Classes de la section englobante (position dans la page) */
  className?: string;
}

/**
 * Filtre des véhicules en vente, partagé entre la page Véhicules et l'accueil. Les modifications se
 * préparent dans le panneau et ne s'appliquent qu'au clic sur « Rechercher ». L'année et le
 * kilométrage se règlent avec un curseur à deux poignées (minimum et maximum).
 */
export default function SalesFilterCard({ filters, onApply, onReset, className = '' }: SalesFilterCardProps) {
  const { language, t } = useLanguage();
  const fr = language === 'fr';
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SaleFilters>(filters);

  const brands = vehicleCatalog.map((entry) => entry.brand);
  const models = vehicleCatalog.find((entry) => entry.brand === draft.brand)?.models || [];
  const activeCount = Object.values(filters).filter(Boolean).length;
  const update = (key: keyof SaleFilters, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const reset = () => { setDraft(EMPTY_SALE_FILTERS); if (onReset) onReset(); else onApply(EMPTY_SALE_FILTERS); };

  const yearLow = draft.yearFrom ? Number(draft.yearFrom) : YEAR_MIN;
  const yearHigh = draft.yearTo ? Number(draft.yearTo) : CURRENT_YEAR;
  const mileageLow = draft.mileageFrom ? Number(draft.mileageFrom) : MILEAGE_MIN;
  const mileageHigh = draft.mileageTo ? Number(draft.mileageTo) : MILEAGE_MAX;
  const km = (value: number) => `${value.toLocaleString(fr ? 'fr-FR' : 'en-GB')} km`;

  return (
    <section className={className}>
      <div className="rounded-[14px] border border-[#eceadf] bg-white shadow-[0_16px_34px_rgba(19,36,60,.16)]">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#13243c]">{fr ? 'Affiner les véhicules' : 'Refine vehicles'}</p>
            {activeCount > 0 && <p className="mt-1 text-xs text-[#d9704f]">{activeCount} {fr ? 'filtre(s) appliqué(s)' : 'active filter(s)'}</p>}
          </div>
          <div className="flex gap-2">
            {activeCount > 0 && <button type="button" onClick={reset} className="btn btn-secondary">{fr ? 'Réinitialiser' : 'Reset'}</button>}
            <button
              type="button"
              onClick={() => { if (!open) setDraft(filters); setOpen((value) => !value); }}
              aria-expanded={open}
              className="flex h-10 items-center gap-2 rounded-[8px] bg-[#13243c] px-5 text-[11px] font-bold uppercase text-white hover:bg-[#1a3050]"
            >
              <span aria-hidden="true">☷</span>{open ? (fr ? 'Fermer' : 'Close') : (fr ? 'Afficher les filtres' : 'Show filters')}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-[#efece3] p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <Select label={fr ? 'Marque' : 'Brand'} value={draft.brand} onChange={(value) => setDraft((current) => ({ ...current, brand: value, model: '' }))}>
                <option value="">{fr ? 'Toutes les marques' : 'All brands'}</option>
                {brands.map((item) => <option key={item}>{item}</option>)}
              </Select>
              <Select label={fr ? 'Modèle' : 'Model'} value={draft.model} onChange={(value) => update('model', value)} disabled={!draft.brand}>
                <option value="">{draft.brand ? (fr ? 'Tous les modèles' : 'All models') : (fr ? 'Choisir une marque' : 'Choose a brand')}</option>
                {models.map((item) => <option key={item}>{item}</option>)}
              </Select>
              <Select label={fr ? 'Énergie' : 'Energy'} value={draft.energy} onChange={(value) => update('energy', value)}>
                <option value="">{fr ? 'Toutes les énergies' : 'All energies'}</option>
                {ENERGY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{fr ? item.fr : item.en}</option>)}
              </Select>
              <Select label={fr ? 'Procédure' : 'Procedure'} value={draft.procedure} onChange={(value) => update('procedure', value)}>
                <option value="">{fr ? 'Toutes les procédures' : 'All procedures'}</option>
                {PROCEDURE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
              <Select label={fr ? 'Boîte de vitesse' : 'Gearbox'} value={draft.gearbox} onChange={(value) => update('gearbox', value)}>
                <option value="">{fr ? 'Toutes' : 'All'}</option>
                {GEARBOX_OPTIONS.map((item) => <option key={item.value} value={item.value}>{fr ? item.fr : item.en}</option>)}
              </Select>
              <Select label={fr ? 'Carte grise disponible' : 'Registration document available'} value={draft.registrationCardAvailable} onChange={(value) => update('registrationCardAvailable', value)}>
                <option value="">{fr ? 'Toutes' : 'All'}</option>
                <option value="true">{fr ? 'Oui' : 'Yes'}</option>
                <option value="false">{fr ? 'Non' : 'No'}</option>
              </Select>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
              <DualRange
                label={fr ? 'Année' : 'Year'}
                min={YEAR_MIN}
                max={CURRENT_YEAR}
                step={1}
                low={yearLow}
                high={yearHigh}
                display={`${yearLow} – ${yearHigh}`}
                onChange={(low, high) => setDraft((current) => ({ ...current, yearFrom: low <= YEAR_MIN ? '' : String(low), yearTo: high >= CURRENT_YEAR ? '' : String(high) }))}
              />
              <DualRange
                label={fr ? 'Kilométrage' : 'Mileage'}
                min={MILEAGE_MIN}
                max={MILEAGE_MAX}
                step={MILEAGE_STEP}
                low={mileageLow}
                high={mileageHigh}
                display={`${km(mileageLow)} – ${km(mileageHigh)}${mileageHigh >= MILEAGE_MAX ? ' +' : ''}`}
                onChange={(low, high) => setDraft((current) => ({ ...current, mileageFrom: low <= MILEAGE_MIN ? '' : String(low), mileageTo: high >= MILEAGE_MAX ? '' : String(high) }))}
              />
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={reset} className="btn btn-secondary">{fr ? 'Effacer' : 'Clear'}</button>
              <button type="button" onClick={() => { onApply(draft); setOpen(false); }} className="h-11 rounded-[9px] bg-[#d9704f] px-7 text-xs font-bold uppercase text-white hover:bg-[#c66042]">{t('home.searchButton')}</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Select({ label, value, onChange, children, disabled = false }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode; disabled?: boolean }) {
  return (
    <label className="min-w-[170px] flex-1">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[.06em] text-[#5a5e66]">{label}</span>
      <select
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-[9px] border border-[#dcd7cb] bg-white px-3.5 text-sm font-medium text-[#5a5e66] outline-none focus:border-[#13243c] disabled:bg-[#f1efe8] disabled:opacity-60"
      >
        {children}
      </select>
    </label>
  );
}

/**
 * Curseur à deux poignées : minimum et maximum d'une même plage. Deux champs « range » superposés,
 * dont seules les poignées captent la souris ; les poignées ne se croisent jamais.
 */
function DualRange({ label, min, max, step, low, high, display, onChange }: {
  label: string; min: number; max: number; step: number; low: number; high: number; display: string;
  onChange: (low: number, high: number) => void;
}) {
  const percent = (value: number) => ((value - min) / (max - min)) * 100;
  // Quand les deux poignées sont tout à droite, celle du minimum doit rester saisissable
  const lowOnTop = low > max - (max - min) * 0.1;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[.06em] text-[#5a5e66]">{label}</span>
        <span className="font-mono text-[13px] font-bold text-[#13243c]">{display}</span>
      </div>
      <div className="relative h-6">
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#e5e1d7]" />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#d9704f]" style={{ left: `${percent(low)}%`, right: `${100 - percent(high)}%` }} />
        <input
          type="range"
          aria-label={`${label} (min)`}
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={(event) => onChange(Math.min(Number(event.target.value), high), high)}
          className="dual-range-input absolute inset-0 w-full"
          style={{ zIndex: lowOnTop ? 5 : 3 }}
        />
        <input
          type="range"
          aria-label={`${label} (max)`}
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={(event) => onChange(low, Math.max(Number(event.target.value), low))}
          className="dual-range-input absolute inset-0 w-full"
          style={{ zIndex: 4 }}
        />
      </div>
      <style>{`
        .dual-range-input { -webkit-appearance: none; appearance: none; background: transparent; pointer-events: none; height: 24px; margin: 0; }
        .dual-range-input::-webkit-slider-runnable-track { background: transparent; height: 24px; }
        .dual-range-input::-moz-range-track { background: transparent; height: 24px; }
        .dual-range-input::-webkit-slider-thumb { -webkit-appearance: none; pointer-events: auto; width: 22px; height: 22px; margin-top: 1px; border-radius: 9999px; background: #d9704f; border: 3px solid #fff; box-shadow: 0 1px 5px rgba(19,36,60,.4); cursor: grab; }
        .dual-range-input::-moz-range-thumb { pointer-events: auto; width: 16px; height: 16px; border-radius: 9999px; background: #d9704f; border: 3px solid #fff; box-shadow: 0 1px 5px rgba(19,36,60,.4); cursor: grab; }
        .dual-range-input:focus-visible::-webkit-slider-thumb { outline: 2px solid #13243c; outline-offset: 2px; }
      `}</style>
    </div>
  );
}

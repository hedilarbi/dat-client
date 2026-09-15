'use client';

export interface SellerListFilterValues {
  model: string;
  registrationNumber: string;
  dateFrom: string;
  dateTo: string;
  priceMin: string;
  priceMax: string;
}

export const EMPTY_SELLER_LIST_FILTERS: SellerListFilterValues = {
  model: '',
  registrationNumber: '',
  dateFrom: '',
  dateTo: '',
  priceMin: '',
  priceMax: '',
};

interface Props {
  value: SellerListFilterValues;
  onChange: (value: SellerListFilterValues) => void;
  onReset: () => void;
  resultCount: number;
  totalCount: number;
  t: (key: string, params?: Record<string, string>) => string;
}

export default function SellerListFilters({ value, onChange, onReset, resultCount, totalCount, t }: Props) {
  const update = (field: keyof SellerListFilterValues, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };
  const active = Object.values(value).some(Boolean);
  const inputClass = 'h-10 w-full rounded-[8px] border border-[#dcd7cb] bg-white px-3 text-[13px] text-[#13243c] outline-none transition focus:border-[#d9704f] focus:ring-2 focus:ring-[#d9704f]/15';

  return (
    <section className="mb-5 rounded-[14px] border border-[#e2ddd1] bg-[#fbfaf7] p-4" aria-label={t('sellerFilters.title')}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-[0.04em] text-[#13243c]">{t('sellerFilters.title')}</h2>
          <p className="mt-0.5 text-[11px] text-[#7a756a]">
            {t('sellerFilters.results', { shown: String(resultCount), total: String(totalCount) })}
          </p>
        </div>
        {active && (
          <button type="button" onClick={onReset} className="text-[12px] font-bold text-[#d9704f] hover:underline">
            {t('sellerFilters.reset')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <label className="space-y-1">
          <span className="text-[11px] font-semibold text-[#5a5e66]">{t('sellerFilters.model')}</span>
          <input value={value.model} onChange={(e) => update('model', e.target.value)} placeholder={t('sellerFilters.modelPlaceholder')} className={inputClass} />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-semibold text-[#5a5e66]">{t('sellerFilters.registration')}</span>
          <input value={value.registrationNumber} onChange={(e) => update('registrationNumber', e.target.value)} placeholder={t('sellerFilters.registrationPlaceholder')} className={inputClass} />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-semibold text-[#5a5e66]">{t('sellerFilters.dateFrom')}</span>
          <input type="date" value={value.dateFrom} onChange={(e) => update('dateFrom', e.target.value)} className={inputClass} />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-semibold text-[#5a5e66]">{t('sellerFilters.dateTo')}</span>
          <input type="date" value={value.dateTo} onChange={(e) => update('dateTo', e.target.value)} className={inputClass} />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-semibold text-[#5a5e66]">{t('sellerFilters.priceMin')}</span>
          <input type="number" min="0" inputMode="decimal" value={value.priceMin} onChange={(e) => update('priceMin', e.target.value)} placeholder="0 €" className={inputClass} />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-semibold text-[#5a5e66]">{t('sellerFilters.priceMax')}</span>
          <input type="number" min="0" inputMode="decimal" value={value.priceMax} onChange={(e) => update('priceMax', e.target.value)} placeholder="— €" className={inputClass} />
        </label>
      </div>
    </section>
  );
}

export function matchesSellerListFilters(
  filters: SellerListFilterValues,
  row: { model?: string | null; registrationNumber?: string | null; date?: string | null; price?: number | null },
) {
  const normalize = (text: string) => text.trim().toLocaleLowerCase().replace(/[\s-]/g, '');
  if (filters.model && !normalize(row.model || '').includes(normalize(filters.model))) return false;
  if (filters.registrationNumber && !normalize(row.registrationNumber || '').includes(normalize(filters.registrationNumber))) return false;

  const rowTime = row.date ? new Date(row.date).getTime() : null;
  if (filters.dateFrom) {
    const from = new Date(`${filters.dateFrom}T00:00:00`).getTime();
    if (rowTime === null || rowTime < from) return false;
  }
  if (filters.dateTo) {
    const to = new Date(`${filters.dateTo}T23:59:59.999`).getTime();
    if (rowTime === null || rowTime > to) return false;
  }

  const min = filters.priceMin === '' ? null : Number(filters.priceMin);
  const max = filters.priceMax === '' ? null : Number(filters.priceMax);
  if (min !== null && (row.price == null || row.price < min)) return false;
  if (max !== null && (row.price == null || row.price > max)) return false;
  return true;
}

import React from 'react';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  activeClassName?: string;
}

interface FilterPillsProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  baseClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}

export default function FilterPills<T extends string>({
  options,
  value,
  onChange,
  baseClassName = 'px-4 py-1.5 rounded-full text-xs font-bold transition',
  activeClassName = 'bg-[#13243c] text-white',
  inactiveClassName = 'bg-white border text-gray-600 hover:bg-gray-50',
}: FilterPillsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`${baseClassName} ${value === opt.value ? (opt.activeClassName || activeClassName) : inactiveClassName}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

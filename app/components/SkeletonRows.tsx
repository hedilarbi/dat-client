import React from 'react';

interface SkeletonRowsProps {
  count?: number;
}

/** Lignes de contenu qui clignotent (animate-pulse), à la place d'une liste en cours de chargement. */
export default function SkeletonRows({ count = 6 }: SkeletonRowsProps) {
  return (
    <div className="divide-y divide-[#efece3]">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-[16px_20px] animate-pulse flex flex-col gap-2">
          <div className="h-2.5 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
          <div className="h-2.5 bg-gray-200 rounded w-1/4" />
        </div>
      ))}
    </div>
  );
}

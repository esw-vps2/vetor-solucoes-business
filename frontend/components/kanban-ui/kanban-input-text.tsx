'use client';

import { focusRing } from './samples';
import { MagnifyingGlassIcon } from './icons/magnifying-glass';

export function KanbanInputText({
  label = 'Buscar',
  onChange,
  placeholder = 'Buscar...',
  value,
}: {
  label?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="sr-only">{label}</span>
      <span className="flex min-h-10 items-center gap-2 rounded-full border border-[#cbd5e1] bg-white px-3 py-2">
        <MagnifyingGlassIcon className="size-5 text-[#475569]" />
        <input
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange?.(event.target.value)}
          className={`w-full bg-transparent text-base font-medium tracking-[-0.112px] text-[#475569] outline-none ${focusRing}`}
        />
      </span>
    </label>
  );
}

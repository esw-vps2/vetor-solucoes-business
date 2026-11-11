const fillClass = {
  amber: 'bg-[#f59e0b]',
  green: 'bg-[#00c345]',
  indigo: 'bg-[#4f46e5]',
} as const;

export function KanbanProgressBar({
  tone = 'indigo',
  value,
  valueLabel,
}: {
  tone?: keyof typeof fillClass;
  value: number;
  valueLabel?: string;
}) {
  const percent = Math.min(100, Math.max(0, value));

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between text-sm tracking-[-0.084px]">
        <span className="font-medium text-[#475569]">Progresso</span>
        <span className="font-bold text-[#1e293b]">{valueLabel ?? `${percent}%`}</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Progresso"
        className="h-2 w-full rounded-full bg-[#e2e8f0]"
      >
        <div className={`h-2 rounded-full ${fillClass[tone]}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

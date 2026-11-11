export function KanbanDot({ color }: { color?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-2.5 rounded-full ${color ? '' : 'bg-[#4f46e5]'}`}
      style={color ? { backgroundColor: color } : undefined}
    />
  );
}

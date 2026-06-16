export default function StatCard({
  label,
  value,
  hint,
  accent = "zinc",
}: {
  label: string;
  value: number | string | undefined;
  hint?: string;
  accent?: "zinc" | "emerald" | "amber" | "violet";
}) {
  const valueColors = {
    zinc: "text-zinc-900",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    violet: "text-violet-700",
  };

  return (
    <div className="panel p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${valueColors[accent]}`}>
        {value ?? "—"}
      </p>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

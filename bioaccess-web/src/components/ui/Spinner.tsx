export default function Spinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-border border-t-brand-500" />
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

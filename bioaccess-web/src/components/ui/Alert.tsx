export default function Alert({
  message,
  type = "info",
  onClose,
}: {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  onClose?: () => void;
}) {
  if (!message) return null;

  const styles = {
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    error: "border-red-500/30 bg-red-500/10 text-red-200",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    info: "border-brand-500/30 bg-brand-500/10 text-brand-100",
  };

  return (
    <div className={`mb-6 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm animate-fade-in ${styles[type]}`}>
      <p>{message}</p>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
          ✕
        </button>
      )}
    </div>
  );
}

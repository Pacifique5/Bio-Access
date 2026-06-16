export default function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "success" | "warning" | "default";
}) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warning: "bg-amber-50 text-amber-700 ring-amber-200",
    default: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[variant]}`}>
      {children}
    </span>
  );
}

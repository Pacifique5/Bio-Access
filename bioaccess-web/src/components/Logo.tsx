import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white">
        BA
      </span>
      <span className="text-lg font-semibold tracking-tight text-zinc-900">BioAccess</span>
    </Link>
  );
}

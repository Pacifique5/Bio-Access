"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useToast } from "@/components/ui/Toast";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (!d.isLoggedIn) router.replace("/login");
        else {
          setUsername(d.username);
          if (sessionStorage.getItem("bioaccess-login-success") === "1") {
            toast(`Welcome back, ${d.username}. Login successful.`, "success");
            sessionStorage.removeItem("bioaccess-login-success");
          }
        }
      });
  }, [router, toast]);

  if (!username) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-400">
        Loading…
      </div>
    );
  }

  return <Sidebar username={username}>{children}</Sidebar>;
}

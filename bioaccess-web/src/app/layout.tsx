import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BioAccess – Fingerprint Attendance",
  description: "Web-based fingerprint attendance with per-user Windows Hello registration",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

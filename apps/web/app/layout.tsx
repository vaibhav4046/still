import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STILL: Continuity for Critical Journeys",
  description:
    "Proactive service continuity, WCAG 2.1 AA failover, and transactional PostgreSQL booking verification.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body>{children}</body>
    </html>
  );
}


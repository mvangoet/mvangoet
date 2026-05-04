import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Avocado Sphere",
  description: "Internal avocado oil operations workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-50 font-sans text-slate-900 antialiased">{children}</body>
    </html>
  );
}

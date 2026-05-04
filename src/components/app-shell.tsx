"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { type Dictionary, type Locale } from "@/lib/i18n";
import { getAccessibleSections, type AppSection } from "@/lib/permissions";
import { LanguageSwitcher } from "./language-switcher";

const sectionLabels: Record<AppSection, keyof Dictionary["nav"]> = {
  dashboard: "dashboard",
  partners: "partners",
  inventory: "inventory",
  orders: "orders",
  invoices: "invoices",
  shipments: "shipments",
  users: "users",
};

export function AppShell({
  children,
  locale,
  dictionary,
  session,
  logoutAction,
}: {
  children: React.ReactNode;
  locale: Locale;
  dictionary: Dictionary;
  session: Session;
  logoutAction: (formData: FormData) => Promise<void>;
}) {
  const pathname = usePathname();
  const currentSection = (pathname.split("/")[2] || "dashboard") as AppSection;
  const allowedSections = getAccessibleSections(session.user.role);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
        <aside className="w-full rounded-3xl bg-emerald-950 p-6 text-white shadow-lg lg:sticky lg:top-6 lg:w-72 lg:self-start">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">{dictionary.common.appName}</p>
            <h1 className="text-2xl font-semibold">{dictionary.common.welcome}</h1>
            <p className="text-sm text-emerald-100">{session.user.name} · {dictionary.roles[session.user.role]}</p>
          </div>

          <nav className="mt-8 space-y-2">
            {allowedSections.map((section) => {
              const active = section === currentSection;
              return (
                <Link
                  key={section}
                  href={section === "dashboard" ? `/${locale}` : `/${locale}/${section}`}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${active ? "bg-white text-emerald-950" : "text-emerald-100 hover:bg-emerald-900"}`}
                >
                  {dictionary.nav[sectionLabels[section]]}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 flex flex-col gap-3 border-t border-emerald-900 pt-6">
            <LanguageSwitcher currentLocale={locale} />
            <form action={logoutAction}>
              <button className="w-full rounded-2xl border border-emerald-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-900">
                {dictionary.common.signOut}
              </button>
            </form>
          </div>
        </aside>
        <main className="flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-white p-1 text-xs font-semibold text-slate-600">
      {locales.map((locale) => {
        const segments = pathname.split("/");
        if (segments[1]) {
          segments[1] = locale;
        }
        const href = segments.join("/") || `/${locale}`;

        return (
          <Link
            key={locale}
            href={href}
            className={`rounded-full px-3 py-1 transition ${locale === currentLocale ? "bg-emerald-600 text-white" : "hover:bg-emerald-50"}`}
          >
            {locale.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}

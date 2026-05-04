import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { logoutAction } from "@/lib/actions";
import { getDictionary, isLocale } from "@/lib/i18n";
import { requireSession } from "@/lib/session";

export default async function DashboardLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const session = await requireSession(locale);
  const dictionary = getDictionary(locale);
  const logout = logoutAction.bind(null, locale);

  return (
    <AppShell locale={locale} dictionary={dictionary} session={session} logoutAction={logout}>
      {children}
    </AppShell>
  );
}

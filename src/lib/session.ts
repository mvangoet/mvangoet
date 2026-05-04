import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Locale } from "./i18n";
import { canAccessSection, type AppSection } from "./permissions";

export async function requireSession(locale: Locale, section?: AppSection) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login?error=login_required`);
  }

  if (section && !canAccessSection(session.user.role, section)) {
    redirect(`/${locale}?error=forbidden`);
  }

  return session;
}

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/forms";
import { MessageBanner } from "@/components/message-banner";
import { loginAction } from "@/lib/actions";
import { resolveFlashMessage } from "@/lib/flash";
import { getDictionary, isLocale } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ message?: string; type?: string }>;
};

const demoAccounts = [
  "admin@avocadosphere.local",
  "sales@avocadosphere.local",
  "logistics@avocadosphere.local",
  "finance@avocadosphere.local",
];

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    redirect("/fr/login");
  }

  const session = await auth();
  if (session?.user) {
    redirect(`/${locale}`);
  }

  const dictionary = getDictionary(locale);
  const flash = await searchParams;
  const action = loginAction.bind(null, locale);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="bg-emerald-950 p-8 text-white lg:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">The Avocado Sphere</p>
          <h1 className="mt-4 text-4xl font-semibold">{dictionary.auth.title}</h1>
          <p className="mt-4 max-w-md text-base text-emerald-100">{dictionary.auth.subtitle}</p>
          <div className="mt-10 rounded-3xl border border-emerald-800 bg-emerald-900/70 p-5">
            <p className="text-sm font-semibold text-emerald-50">{dictionary.auth.demoAccounts}</p>
            <ul className="mt-3 space-y-2 text-sm text-emerald-100">
              {demoAccounts.map((account) => (
                <li key={account}>{account}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-emerald-200">
              {dictionary.common.seededPassword}:{" "}
              <span className="font-semibold text-white">{dictionary.common.seedPasswordValue}</span>
            </p>
          </div>
        </div>
        <div className="space-y-6 p-8 lg:p-10">
          <MessageBanner message={resolveFlashMessage(dictionary, flash.message)} type={flash.type} />
          <LoginForm dictionary={dictionary} action={action} />
        </div>
      </div>
    </div>
  );
}

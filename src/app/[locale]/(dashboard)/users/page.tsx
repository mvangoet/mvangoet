import { notFound } from "next/navigation";
import { UserForm } from "@/components/forms";
import { MessageBanner } from "@/components/message-banner";
import { createUserAction } from "@/lib/actions";
import { getUsersPageData } from "@/lib/data";
import { resolveFlashMessage } from "@/lib/flash";
import { formatDate } from "@/lib/format";
import { getDictionary, isLocale } from "@/lib/i18n";
import { requireSession } from "@/lib/session";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ message?: string; type?: string }>;
};

export default async function UsersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  await requireSession(locale, "users");
  const dictionary = getDictionary(locale);
  const flash = await searchParams;
  const action = createUserAction.bind(null, locale);
  const users = await getUsersPageData();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-semibold text-slate-900">{dictionary.users.title}</h2>
        <p className="mt-3 text-sm text-slate-600">{dictionary.users.subtitle}</p>
      </section>
      <MessageBanner message={resolveFlashMessage(dictionary, flash.message)} type={flash.type} />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <UserForm dictionary={dictionary} action={action} />
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3 pr-4 font-medium">{dictionary.users.name}</th>
                  <th className="pb-3 pr-4 font-medium">{dictionary.common.email}</th>
                  <th className="pb-3 pr-4 font-medium">{dictionary.users.role}</th>
                  <th className="pb-3 font-medium">{dictionary.common.createdAt}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100 align-top text-slate-700">
                    <td className="py-3 pr-4 font-medium">{user.name}</td>
                    <td className="py-3 pr-4">{user.email}</td>
                    <td className="py-3 pr-4">{dictionary.roles[user.role]}</td>
                    <td className="py-3">{formatDate(user.createdAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { createPartnerAction } from "@/lib/actions";
import { getPartnersPageData } from "@/lib/data";
import { resolveFlashMessage } from "@/lib/flash";
import { formatDate } from "@/lib/format";
import { getDictionary, isLocale } from "@/lib/i18n";
import { requireSession } from "@/lib/session";
import { PartnerForm } from "@/components/forms";
import { MessageBanner } from "@/components/message-banner";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ message?: string; type?: string }>;
};

function PartnerTable({
  title,
  rows,
  locale,
}: {
  title: string;
  rows: Array<{
    id: string;
    name: string;
    country: string;
    email: string | null;
    phone: string | null;
    address: string;
    createdAt: Date;
    suppliedLots?: { id: string }[];
    customerOrders?: { id: string }[];
    customerInvoices?: { id: string }[];
  }>;
  locale: "fr" | "en";
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="pb-3 pr-4 font-medium">{locale === "fr" ? "Nom" : "Name"}</th>
              <th className="pb-3 pr-4 font-medium">{locale === "fr" ? "Pays" : "Country"}</th>
              <th className="pb-3 pr-4 font-medium">{locale === "fr" ? "Email" : "Email"}</th>
              <th className="pb-3 pr-4 font-medium">{locale === "fr" ? "Téléphone" : "Phone"}</th>
              <th className="pb-3 pr-4 font-medium">{locale === "fr" ? "Historique" : "History"}</th>
              <th className="pb-3 font-medium">{locale === "fr" ? "Créé le" : "Created"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((partner) => (
              <tr key={partner.id} className="border-t border-slate-100 align-top text-slate-700">
                <td className="py-3 pr-4 font-medium">
                  {partner.name}
                  <p className="mt-1 text-xs text-slate-500">{partner.address}</p>
                </td>
                <td className="py-3 pr-4">{partner.country}</td>
                <td className="py-3 pr-4">{partner.email ?? "—"}</td>
                <td className="py-3 pr-4">{partner.phone ?? "—"}</td>
                <td className="py-3 pr-4 text-xs text-slate-500">
                  {(partner.suppliedLots?.length ?? 0)} lots · {(partner.customerOrders?.length ?? 0)} orders · {(partner.customerInvoices?.length ?? 0)} invoices
                </td>
                <td className="py-3">{formatDate(partner.createdAt, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export default async function PartnersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  await requireSession(locale, "partners");
  const dictionary = getDictionary(locale);
  const flash = await searchParams;
  const action = createPartnerAction.bind(null, locale);
  const data = await getPartnersPageData();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-semibold text-slate-900">{dictionary.partners.title}</h2>
        <p className="mt-3 text-sm text-slate-600">{dictionary.partners.subtitle}</p>
      </section>
      <MessageBanner message={resolveFlashMessage(dictionary, flash.message)} type={flash.type} />
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <PartnerForm dictionary={dictionary} action={action} />
        <div className="space-y-6">
          <PartnerTable title={dictionary.partnerTypes.CUSTOMER} rows={data.customers} locale={locale} />
          <PartnerTable title={dictionary.partnerTypes.SUPPLIER} rows={data.suppliers} locale={locale} />
        </div>
      </div>
    </div>
  );
}

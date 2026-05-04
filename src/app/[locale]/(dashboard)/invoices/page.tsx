import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceForm } from "@/components/forms";
import { MessageBanner } from "@/components/message-banner";
import { StatusBadge } from "@/components/status-badge";
import { createInvoiceAction } from "@/lib/actions";
import { getInvoicesPageData } from "@/lib/data";
import { resolveFlashMessage } from "@/lib/flash";
import { formatCurrency, formatDate } from "@/lib/format";
import { getDictionary, isLocale } from "@/lib/i18n";
import { requireSession } from "@/lib/session";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ message?: string; type?: string }>;
};

export default async function InvoicesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  await requireSession(locale, "invoices");
  const dictionary = getDictionary(locale);
  const flash = await searchParams;
  const action = createInvoiceAction.bind(null, locale);
  const data = await getInvoicesPageData();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-semibold text-slate-900">{dictionary.invoices.title}</h2>
        <p className="mt-3 text-sm text-slate-600">{dictionary.invoices.subtitle}</p>
      </section>
      <MessageBanner message={resolveFlashMessage(dictionary, flash.message)} type={flash.type} />
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <InvoiceForm dictionary={dictionary} customers={data.customers} orders={data.orders} action={action} />
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3 pr-4 font-medium">{dictionary.invoices.invoiceNumber}</th>
                  <th className="pb-3 pr-4 font-medium">{dictionary.orders.customer}</th>
                  <th className="pb-3 pr-4 font-medium">{dictionary.invoices.type}</th>
                  <th className="pb-3 pr-4 font-medium">{dictionary.invoices.issueDate}</th>
                  <th className="pb-3 pr-4 font-medium">{dictionary.common.amount}</th>
                  <th className="pb-3 pr-4 font-medium">{dictionary.common.status}</th>
                  <th className="pb-3 font-medium">{dictionary.invoices.pdf}</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-slate-100 align-top text-slate-700">
                    <td className="py-3 pr-4 font-medium">{invoice.invoiceNumber}</td>
                    <td className="py-3 pr-4">{invoice.customer.name}</td>
                    <td className="py-3 pr-4">{dictionary.invoiceTypes[invoice.type]}</td>
                    <td className="py-3 pr-4">{formatDate(invoice.issueDate, locale)}</td>
                    <td className="py-3 pr-4">{formatCurrency(invoice.total, invoice.currency, locale)}</td>
                    <td className="py-3 pr-4"><StatusBadge label={dictionary.paymentStatuses[invoice.paymentStatus]} status={invoice.paymentStatus} /></td>
                    <td className="py-3">
                      <Link className="text-sm font-semibold text-emerald-700 hover:text-emerald-800" href={`/api/invoices/${invoice.id}/pdf`}>
                        {dictionary.invoices.pdf}
                      </Link>
                    </td>
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

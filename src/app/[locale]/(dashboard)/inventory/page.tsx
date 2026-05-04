import { notFound } from "next/navigation";
import { StockLotForm } from "@/components/forms";
import { MessageBanner } from "@/components/message-banner";
import { StatusBadge } from "@/components/status-badge";
import { createStockLotAction } from "@/lib/actions";
import { getInventoryPageData } from "@/lib/data";
import { resolveFlashMessage } from "@/lib/flash";
import { formatDate, formatQuantity } from "@/lib/format";
import { getDictionary, isLocale } from "@/lib/i18n";
import { requireSession } from "@/lib/session";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ message?: string; type?: string }>;
};

export default async function InventoryPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  await requireSession(locale, "inventory");
  const dictionary = getDictionary(locale);
  const flash = await searchParams;
  const action = createStockLotAction.bind(null, locale);
  const data = await getInventoryPageData();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-semibold text-slate-900">{dictionary.inventory.title}</h2>
        <p className="mt-3 text-sm text-slate-600">{dictionary.inventory.subtitle}</p>
      </section>
      <MessageBanner message={resolveFlashMessage(dictionary, flash.message)} type={flash.type} />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <StockLotForm dictionary={dictionary} suppliers={data.suppliers} action={action} />
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">{dictionary.inventory.alerts}</h3>
            <div className="mt-4 space-y-3">
              {data.alerts.map((lot) => (
                <div key={lot.id} className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{lot.lotNumber}</p>
                    <StatusBadge label={dictionary.lotStatuses[lot.status]} status={lot.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{formatQuantity(lot.quantityAvailable, locale)} L</p>
                </div>
              ))}
              {data.alerts.length === 0 ? <p className="text-sm text-slate-500">{dictionary.common.noData}</p> : null}
            </div>
          </article>
        </div>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3 pr-4 font-medium">{dictionary.inventory.lotNumber}</th>
                  <th className="pb-3 pr-4 font-medium">{dictionary.inventory.supplier}</th>
                  <th className="pb-3 pr-4 font-medium">{dictionary.inventory.productionDate}</th>
                  <th className="pb-3 pr-4 font-medium">{dictionary.inventory.expirationDate}</th>
                  <th className="pb-3 pr-4 font-medium">{dictionary.inventory.quantityAvailable}</th>
                  <th className="pb-3 font-medium">{dictionary.common.status}</th>
                </tr>
              </thead>
              <tbody>
                {data.lots.map((lot) => (
                  <tr key={lot.id} className="border-t border-slate-100 align-top text-slate-700">
                    <td className="py-3 pr-4 font-medium">{lot.lotNumber}</td>
                    <td className="py-3 pr-4">{lot.supplier.name}</td>
                    <td className="py-3 pr-4">{formatDate(lot.productionDate, locale)}</td>
                    <td className="py-3 pr-4">{formatDate(lot.expirationDate, locale)}</td>
                    <td className="py-3 pr-4">
                      {formatQuantity(lot.quantityAvailable, locale)} / {formatQuantity(lot.quantityReceived, locale)} L
                    </td>
                    <td className="py-3"><StatusBadge label={dictionary.lotStatuses[lot.status]} status={lot.status} /></td>
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

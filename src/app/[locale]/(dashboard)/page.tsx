import { notFound } from "next/navigation";
import { MessageBanner } from "@/components/message-banner";
import { StatusBadge } from "@/components/status-badge";
import { getDashboardData } from "@/lib/data";
import { resolveFlashMessage } from "@/lib/flash";
import { formatDate, formatQuantity } from "@/lib/format";
import { getDictionary, isLocale } from "@/lib/i18n";
import { requireSession } from "@/lib/session";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ message?: string; type?: string }>;
};

export default async function DashboardPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  await requireSession(locale, "dashboard");
  const dictionary = getDictionary(locale);
  const flash = await searchParams;
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-600">{dictionary.common.dashboard}</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">{dictionary.dashboard.title}</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">{dictionary.dashboard.subtitle}</p>
      </section>

      <MessageBanner message={resolveFlashMessage(dictionary, flash.message)} type={flash.type} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          [dictionary.dashboard.cards.availableStock, `${formatQuantity(data.availableStock, locale)} L`],
          [dictionary.dashboard.cards.activeOrders, String(data.activeOrders)],
          [dictionary.dashboard.cards.invoicesDue, String(data.openInvoices)],
          [dictionary.dashboard.cards.shipmentsInTransit, String(data.shipmentsInTransit)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">{dictionary.dashboard.recentActivity}</h3>
            <span className="text-sm text-slate-500">{data.recentActivity.length}</span>
          </div>
          <div className="mt-5 space-y-4">
            {data.recentActivity.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium text-slate-800">{entry.description}</p>
                  <span className="text-xs text-slate-500">{formatDate(entry.createdAt, locale)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{entry.user?.name ?? dictionary.common.system} · {entry.entityType}</p>
              </div>
            ))}
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">{dictionary.dashboard.alerts}</h3>
            <p className="mt-2 text-sm text-slate-500">
              {data.lowStockLots.length} {dictionary.dashboard.lowStockMessage}
            </p>
            <div className="mt-5 space-y-3">
              {data.lowStockLots.map((lot) => (
                <div key={lot.id} className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <div>
                    <p className="font-medium text-slate-900">{lot.lotNumber}</p>
                    <p className="text-sm text-slate-500">{lot.supplier.name}</p>
                  </div>
                  <StatusBadge label={dictionary.lotStatuses[lot.status]} status={lot.status} />
                </div>
              ))}
              {data.lowStockLots.length === 0 ? <p className="text-sm text-slate-500">{dictionary.common.noData}</p> : null}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">{dictionary.dashboard.nextArrivals}</h3>
            <div className="mt-5 space-y-3">
              {data.upcomingShipments.map((shipment) => (
                <div key={shipment.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{shipment.shipmentNumber}</p>
                    <StatusBadge label={dictionary.shipmentStatuses[shipment.status]} status={shipment.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{shipment.order?.customer.name ?? "—"}</p>
                  <p className="mt-1 text-sm text-slate-500">{dictionary.shipments.eta} {formatDate(shipment.eta, locale)}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

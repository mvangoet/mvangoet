import { notFound } from "next/navigation";
import { ShipmentForm } from "@/components/forms";
import { MessageBanner } from "@/components/message-banner";
import { StatusBadge } from "@/components/status-badge";
import { createShipmentAction } from "@/lib/actions";
import { getShipmentsPageData } from "@/lib/data";
import { resolveFlashMessage } from "@/lib/flash";
import { formatDate } from "@/lib/format";
import { getDictionary, isLocale } from "@/lib/i18n";
import { requireSession } from "@/lib/session";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ message?: string; type?: string }>;
};

export default async function ShipmentsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  await requireSession(locale, "shipments");
  const dictionary = getDictionary(locale);
  const flash = await searchParams;
  const action = createShipmentAction.bind(null, locale);
  const data = await getShipmentsPageData();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-semibold text-slate-900">{dictionary.shipments.title}</h2>
        <p className="mt-3 text-sm text-slate-600">{dictionary.shipments.subtitle}</p>
      </section>
      <MessageBanner message={resolveFlashMessage(dictionary, flash.message)} type={flash.type} />
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ShipmentForm dictionary={dictionary} orders={data.orders} action={action} />
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3 pr-4 font-medium">{dictionary.shipments.shipmentNumber}</th>
                  <th className="pb-3 pr-4 font-medium">{dictionary.shipments.order}</th>
                  <th className="pb-3 pr-4 font-medium">{dictionary.shipments.carrier}</th>
                  <th className="pb-3 pr-4 font-medium">{dictionary.shipments.shippedAt}</th>
                  <th className="pb-3 pr-4 font-medium">{dictionary.shipments.eta}</th>
                  <th className="pb-3 pr-4 font-medium">{dictionary.common.documents}</th>
                  <th className="pb-3 font-medium">{dictionary.common.status}</th>
                </tr>
              </thead>
              <tbody>
                {data.shipments.map((shipment) => (
                  <tr key={shipment.id} className="border-t border-slate-100 align-top text-slate-700">
                    <td className="py-3 pr-4 font-medium">{shipment.shipmentNumber}</td>
                    <td className="py-3 pr-4">
                      {shipment.order?.orderNumber ?? "—"}
                      <p className="mt-1 text-xs text-slate-500">{shipment.order?.customer.name ?? ""}</p>
                    </td>
                    <td className="py-3 pr-4">
                      {shipment.carrier}
                      <p className="mt-1 text-xs text-slate-500">{shipment.trackingNumber}</p>
                    </td>
                    <td className="py-3 pr-4">{formatDate(shipment.shippedAt, locale)}</td>
                    <td className="py-3 pr-4">{formatDate(shipment.eta, locale)}</td>
                    <td className="py-3 pr-4 text-xs text-slate-500">{Array.isArray(shipment.documents) ? shipment.documents.join(", ") : "—"}</td>
                    <td className="py-3"><StatusBadge label={dictionary.shipmentStatuses[shipment.status]} status={shipment.status} /></td>
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

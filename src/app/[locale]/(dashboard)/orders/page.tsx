import { notFound } from "next/navigation";
import { OrderForm } from "@/components/forms";
import { MessageBanner } from "@/components/message-banner";
import { StatusBadge } from "@/components/status-badge";
import { createOrderAction } from "@/lib/actions";
import { getOrdersPageData } from "@/lib/data";
import { resolveFlashMessage } from "@/lib/flash";
import { formatCurrency, formatDate, formatQuantity } from "@/lib/format";
import { getDictionary, isLocale } from "@/lib/i18n";
import { requireSession } from "@/lib/session";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ message?: string; type?: string }>;
};

export default async function OrdersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  await requireSession(locale, "orders");
  const dictionary = getDictionary(locale);
  const flash = await searchParams;
  const action = createOrderAction.bind(null, locale);
  const data = await getOrdersPageData();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-semibold text-slate-900">{dictionary.orders.title}</h2>
        <p className="mt-3 text-sm text-slate-600">{dictionary.orders.subtitle}</p>
      </section>
      <MessageBanner message={resolveFlashMessage(dictionary, flash.message)} type={flash.type} />
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <OrderForm dictionary={dictionary} customers={data.customers} lots={data.lots} action={action} />
        <div className="space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3 pr-4 font-medium">{dictionary.orders.orderNumber}</th>
                    <th className="pb-3 pr-4 font-medium">{dictionary.orders.customer}</th>
                    <th className="pb-3 pr-4 font-medium">{dictionary.orders.orderDate}</th>
                    <th className="pb-3 pr-4 font-medium">{dictionary.orders.total}</th>
                    <th className="pb-3 pr-4 font-medium">{dictionary.common.status}</th>
                    <th className="pb-3 font-medium">{dictionary.orders.items}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((order) => (
                    <tr key={order.id} className="border-t border-slate-100 align-top text-slate-700">
                      <td className="py-3 pr-4 font-medium">{order.orderNumber}</td>
                      <td className="py-3 pr-4">{order.customer.name}</td>
                      <td className="py-3 pr-4">{formatDate(order.orderDate, locale)}</td>
                      <td className="py-3 pr-4">{formatCurrency(order.totalAmount, order.currency, locale)}</td>
                      <td className="py-3 pr-4"><StatusBadge label={dictionary.orderStatuses[order.status]} status={order.status} /></td>
                      <td className="py-3 text-xs text-slate-500">
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id}>
                              {item.productName} · {formatQuantity(item.quantity, locale)} × {formatCurrency(item.unitPrice, order.currency, locale)}
                              {item.lot?.lotNumber ? <span> · {item.lot.lotNumber}</span> : null}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">{dictionary.orders.history}</h3>
            <div className="mt-4 space-y-3">
              {data.activity.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">{entry.description}</p>
                  <p className="mt-1 text-sm text-slate-500">{entry.user?.name ?? dictionary.common.system} · {formatDate(entry.createdAt, locale)}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

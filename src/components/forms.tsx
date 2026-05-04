import { InvoiceType, LotStatus, OrderStatus, PartnerType, PaymentStatus, ShipmentStatus, UserRole, type Partner, type StockLot, type Order } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";

const formCardClass = "space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm";
const inputClass = "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white";
const labelClass = "space-y-2 text-sm font-medium text-slate-700";
const buttonClass = "rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700";

export function LoginForm({ dictionary, action }: { dictionary: Dictionary; action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className={formCardClass}>
      <label className={labelClass}>
        {dictionary.auth.email}
        <input className={inputClass} name="email" type="email" placeholder="admin@avocadosphere.local" required />
      </label>
      <label className={labelClass}>
        {dictionary.auth.password}
        <input className={inputClass} name="password" type="password" required />
      </label>
      <button className={`${buttonClass} w-full`}>{dictionary.auth.submit}</button>
    </form>
  );
}

export function PartnerForm({ dictionary, action }: { dictionary: Dictionary; action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className={formCardClass}>
      <h2 className="text-lg font-semibold text-slate-900">{dictionary.partners.create}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelClass}>
          {dictionary.partners.type}
          <select className={inputClass} name="type" defaultValue={PartnerType.CUSTOMER}>
            <option value={PartnerType.CUSTOMER}>{dictionary.partnerTypes.CUSTOMER}</option>
            <option value={PartnerType.SUPPLIER}>{dictionary.partnerTypes.SUPPLIER}</option>
          </select>
        </label>
        <label className={labelClass}>
          {dictionary.users.name}
          <input className={inputClass} name="name" required />
        </label>
        <label className={labelClass}>
          {dictionary.common.country}
          <input className={inputClass} name="country" placeholder="France / Rwanda" required />
        </label>
        <label className={labelClass}>
          {dictionary.common.email}
          <input className={inputClass} name="email" type="email" />
        </label>
        <label className={labelClass}>
          {dictionary.common.phone}
          <input className={inputClass} name="phone" />
        </label>
        <label className={`${labelClass} md:col-span-2`}>
          {dictionary.common.address}
          <textarea className={inputClass} name="address" rows={3} required />
        </label>
        <label className={`${labelClass} md:col-span-2`}>
          {dictionary.common.notes}
          <textarea className={inputClass} name="notes" rows={3} />
        </label>
      </div>
      <button className={buttonClass}>{dictionary.common.create}</button>
    </form>
  );
}

export function StockLotForm({
  dictionary,
  suppliers,
  action,
}: {
  dictionary: Dictionary;
  suppliers: Partner[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className={formCardClass}>
      <h2 className="text-lg font-semibold text-slate-900">{dictionary.inventory.create}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelClass}>
          {dictionary.inventory.supplier}
          <select className={inputClass} name="supplierId" required>
            <option value="">—</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          {dictionary.inventory.quantityReceived}
          <input className={inputClass} name="quantityReceived" type="number" min="0" step="0.01" required />
        </label>
        <label className={labelClass}>
          {dictionary.inventory.productionDate}
          <input className={inputClass} name="productionDate" type="date" required />
        </label>
        <label className={labelClass}>
          {dictionary.inventory.expirationDate}
          <input className={inputClass} name="expirationDate" type="date" required />
        </label>
        <label className={`${labelClass} md:col-span-2`}>
          {dictionary.common.notes}
          <textarea className={inputClass} name="notes" rows={3} />
        </label>
      </div>
      <button className={buttonClass}>{dictionary.common.create}</button>
    </form>
  );
}

export function OrderForm({
  dictionary,
  customers,
  lots,
  action,
}: {
  dictionary: Dictionary;
  customers: Partner[];
  lots: StockLot[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className={formCardClass}>
      <h2 className="text-lg font-semibold text-slate-900">{dictionary.orders.create}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className={labelClass}>
          {dictionary.orders.customer}
          <select className={inputClass} name="customerId" required>
            <option value="">—</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          {dictionary.orders.orderDate}
          <input className={inputClass} name="orderDate" type="date" required />
        </label>
        <label className={labelClass}>
          {dictionary.common.status}
          <select className={inputClass} name="status" defaultValue={OrderStatus.CONFIRMED}>
            {Object.values(OrderStatus).map((status) => (
              <option key={status} value={status}>{dictionary.orderStatuses[status]}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          {dictionary.orders.currency}
          <input className={inputClass} name="currency" defaultValue="EUR" maxLength={3} required />
        </label>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-700">{dictionary.orders.items}</p>
        {[0, 1, 2].map((row) => (
          <div key={row} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[2fr_1fr_1fr_1.5fr]">
            <input className={inputClass} name="itemProductName" placeholder={`${dictionary.orders.product} ${row + 1}`} />
            <input className={inputClass} name="itemQuantity" type="number" min="0" step="0.01" placeholder={dictionary.common.quantity} />
            <input className={inputClass} name="itemUnitPrice" type="number" min="0" step="0.01" placeholder={dictionary.orders.unitPrice} />
            <select className={inputClass} name="itemLotId" defaultValue="">
              <option value="">{dictionary.orders.lot}</option>
              {lots.map((lot) => (
                <option key={lot.id} value={lot.id}>{lot.lotNumber}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <label className={labelClass}>
        {dictionary.common.notes}
        <textarea className={inputClass} name="notes" rows={3} />
      </label>
      <button className={buttonClass}>{dictionary.common.create}</button>
    </form>
  );
}

export function InvoiceForm({
  dictionary,
  customers,
  orders,
  action,
}: {
  dictionary: Dictionary;
  customers: Partner[];
  orders: Order[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className={formCardClass}>
      <h2 className="text-lg font-semibold text-slate-900">{dictionary.invoices.create}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className={labelClass}>
          {dictionary.invoices.type}
          <select className={inputClass} name="type" defaultValue={InvoiceType.INVOICE}>
            {Object.values(InvoiceType).map((type) => (
              <option key={type} value={type}>{dictionary.invoiceTypes[type]}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          {dictionary.orders.customer}
          <select className={inputClass} name="customerId" required>
            <option value="">—</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          {dictionary.shipments.order}
          <select className={inputClass} name="orderId" defaultValue="">
            <option value="">—</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>{order.orderNumber}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          {dictionary.orders.currency}
          <input className={inputClass} name="currency" defaultValue="EUR" maxLength={3} required />
        </label>
        <label className={labelClass}>
          {dictionary.invoices.issueDate}
          <input className={inputClass} name="issueDate" type="date" required />
        </label>
        <label className={labelClass}>
          {dictionary.invoices.dueDate}
          <input className={inputClass} name="dueDate" type="date" required />
        </label>
        <label className={labelClass}>
          {dictionary.common.amount}
          <input className={inputClass} name="total" type="number" min="0" step="0.01" required />
        </label>
        <label className={labelClass}>
          {dictionary.invoices.paidAmount}
          <input className={inputClass} name="paidAmount" type="number" min="0" step="0.01" defaultValue="0" required />
        </label>
        <label className={labelClass}>
          {dictionary.common.status}
          <select className={inputClass} name="paymentStatus" defaultValue={PaymentStatus.PENDING}>
            {Object.values(PaymentStatus).map((status) => (
              <option key={status} value={status}>{dictionary.paymentStatuses[status]}</option>
            ))}
          </select>
        </label>
        <label className={`${labelClass} md:col-span-2 xl:col-span-3`}>
          {dictionary.common.notes}
          <textarea className={inputClass} name="notes" rows={3} />
        </label>
      </div>
      <button className={buttonClass}>{dictionary.common.create}</button>
    </form>
  );
}

export function ShipmentForm({
  dictionary,
  orders,
  action,
}: {
  dictionary: Dictionary;
  orders: (Order & { customer: Partner })[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className={formCardClass}>
      <h2 className="text-lg font-semibold text-slate-900">{dictionary.shipments.create}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className={labelClass}>
          {dictionary.shipments.order}
          <select className={inputClass} name="orderId" defaultValue="">
            <option value="">—</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>{order.orderNumber} · {order.customer.name}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          {dictionary.shipments.carrier}
          <input className={inputClass} name="carrier" required />
        </label>
        <label className={labelClass}>
          {dictionary.shipments.trackingNumber}
          <input className={inputClass} name="trackingNumber" required />
        </label>
        <label className={labelClass}>
          {dictionary.common.status}
          <select className={inputClass} name="status" defaultValue={ShipmentStatus.PLANNED}>
            {Object.values(ShipmentStatus).map((status) => (
              <option key={status} value={status}>{dictionary.shipmentStatuses[status]}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          {dictionary.shipments.shippedAt}
          <input className={inputClass} name="shippedAt" type="date" required />
        </label>
        <label className={labelClass}>
          {dictionary.shipments.eta}
          <input className={inputClass} name="eta" type="date" />
        </label>
        <label className={`${labelClass} md:col-span-2 xl:col-span-2`}>
          {dictionary.common.documents}
          <textarea className={inputClass} name="documents" rows={4} placeholder="Invoice\nPacking list\nExport certificate" />
        </label>
      </div>
      <button className={buttonClass}>{dictionary.common.create}</button>
    </form>
  );
}

export function UserForm({ dictionary, action }: { dictionary: Dictionary; action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className={formCardClass}>
      <h2 className="text-lg font-semibold text-slate-900">{dictionary.users.create}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className={labelClass}>
          {dictionary.users.name}
          <input className={inputClass} name="name" required />
        </label>
        <label className={labelClass}>
          {dictionary.common.email}
          <input className={inputClass} name="email" type="email" required />
        </label>
        <label className={labelClass}>
          {dictionary.users.role}
          <select className={inputClass} name="role" defaultValue={UserRole.COMMERCIAL}>
            {Object.values(UserRole).map((role) => (
              <option key={role} value={role}>{dictionary.roles[role]}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          {dictionary.users.password}
          <input className={inputClass} name="password" type="password" minLength={8} required />
        </label>
      </div>
      <button className={buttonClass}>{dictionary.common.create}</button>
    </form>
  );
}

export const statusValues = {
  lot: Object.values(LotStatus),
  order: Object.values(OrderStatus),
  payment: Object.values(PaymentStatus),
  shipment: Object.values(ShipmentStatus),
};

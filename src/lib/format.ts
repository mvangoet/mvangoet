import { LotStatus, OrderStatus, PaymentStatus, ShipmentStatus } from "@prisma/client";
import type { Locale } from "./i18n";

export const LOW_STOCK_THRESHOLD = 250;

export function formatDate(value: Date | string | null | undefined, locale: Locale) {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatCurrency(amount: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatQuantity(quantity: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(quantity);
}

export function nextDocumentNumber(prefix: string, latestValue: string | null, date = new Date()) {
  const year = date.getFullYear();
  const latestSequence = latestValue ? Number.parseInt(latestValue.split("-").at(-1) ?? "0", 10) : 0;
  return `${prefix}-${year}-${String(latestSequence + 1).padStart(4, "0")}`;
}

export function isLowStock(quantityAvailable: number) {
  return quantityAvailable <= LOW_STOCK_THRESHOLD;
}

export function getLotStatus(quantityAvailable: number, expirationDate: Date) {
  if (expirationDate.getTime() < Date.now()) {
    return LotStatus.EXPIRED;
  }

  if (quantityAvailable <= 0) {
    return LotStatus.SOLD;
  }

  if (isLowStock(quantityAvailable)) {
    return LotStatus.LOW_STOCK;
  }

  return LotStatus.AVAILABLE;
}

export function getStatusTone(status: LotStatus | OrderStatus | PaymentStatus | ShipmentStatus) {
  if ([LotStatus.EXPIRED, OrderStatus.CANCELLED, PaymentStatus.OVERDUE, ShipmentStatus.DELAYED].includes(status as never)) {
    return "bg-red-100 text-red-700";
  }

  if ([LotStatus.LOW_STOCK, PaymentStatus.PARTIAL, ShipmentStatus.CUSTOMS].includes(status as never)) {
    return "bg-amber-100 text-amber-700";
  }

  if ([OrderStatus.DRAFT, OrderStatus.PREPARING, PaymentStatus.PENDING, ShipmentStatus.PLANNED, ShipmentStatus.IN_TRANSIT, LotStatus.RESERVED].includes(status as never)) {
    return "bg-slate-100 text-slate-700";
  }

  return "bg-emerald-100 text-emerald-700";
}

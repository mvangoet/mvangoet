import { OrderStatus, PartnerType, PaymentStatus, ShipmentStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { LOW_STOCK_THRESHOLD } from "./format";

export async function getDashboardData() {
  const [lots, activeOrders, openInvoices, shipmentsInTransit, recentActivity, upcomingShipments] = await Promise.all([
    prisma.stockLot.aggregate({ _sum: { quantityAvailable: true }, where: { status: { not: "SOLD" } } }),
    prisma.order.count({ where: { status: { in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.SHIPPED] } } }),
    prisma.invoice.count({ where: { paymentStatus: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] } } }),
    prisma.shipment.count({ where: { status: { in: [ShipmentStatus.PLANNED, ShipmentStatus.IN_TRANSIT, ShipmentStatus.CUSTOMS] } } }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { user: true } }),
    prisma.shipment.findMany({ where: { eta: { not: null } }, orderBy: { eta: "asc" }, include: { order: { include: { customer: true } } }, take: 5 }),
  ]);

  const lowStockLots = await prisma.stockLot.findMany({
    where: {
      quantityAvailable: { lte: LOW_STOCK_THRESHOLD },
      status: { not: "SOLD" },
    },
    include: { supplier: true },
    orderBy: { quantityAvailable: "asc" },
  });

  return {
    availableStock: lots._sum.quantityAvailable ?? 0,
    activeOrders,
    openInvoices,
    shipmentsInTransit,
    recentActivity,
    lowStockLots,
    upcomingShipments,
  };
}

export async function getPartnersPageData() {
  const partners = await prisma.partner.findMany({
    include: {
      suppliedLots: true,
      customerOrders: true,
      customerInvoices: true,
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return {
    suppliers: partners.filter((partner) => partner.type === PartnerType.SUPPLIER),
    customers: partners.filter((partner) => partner.type === PartnerType.CUSTOMER),
  };
}

export async function getInventoryPageData() {
  const [suppliers, lots] = await Promise.all([
    prisma.partner.findMany({ where: { type: PartnerType.SUPPLIER }, orderBy: { name: "asc" } }),
    prisma.stockLot.findMany({ include: { supplier: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return { suppliers, lots, alerts: lots.filter((lot) => lot.quantityAvailable <= LOW_STOCK_THRESHOLD) };
}

export async function getOrdersPageData() {
  const [customers, lots, orders, activity] = await Promise.all([
    prisma.partner.findMany({ where: { type: PartnerType.CUSTOMER }, orderBy: { name: "asc" } }),
    prisma.stockLot.findMany({ orderBy: { lotNumber: "asc" }, where: { quantityAvailable: { gt: 0 } } }),
    prisma.order.findMany({
      include: {
        customer: true,
        items: { include: { lot: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.activityLog.findMany({ where: { entityType: "ORDER" }, orderBy: { createdAt: "desc" }, include: { user: true }, take: 8 }),
  ]);

  return { customers, lots, orders, activity };
}

export async function getInvoicesPageData() {
  const [customers, orders, invoices] = await Promise.all([
    prisma.partner.findMany({ where: { type: PartnerType.CUSTOMER }, orderBy: { name: "asc" } }),
    prisma.order.findMany({ include: { customer: true }, orderBy: { createdAt: "desc" } }),
    prisma.invoice.findMany({ include: { customer: true, order: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return { customers, orders, invoices };
}

export async function getShipmentsPageData() {
  const [orders, shipments] = await Promise.all([
    prisma.order.findMany({ include: { customer: true }, orderBy: { createdAt: "desc" } }),
    prisma.shipment.findMany({ include: { order: { include: { customer: true } } }, orderBy: { createdAt: "desc" } }),
  ]);

  return { orders, shipments };
}

export async function getUsersPageData() {
  return prisma.user.findMany({ orderBy: { createdAt: "asc" } });
}

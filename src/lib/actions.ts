"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  InvoiceType,
  OrderStatus,
  PartnerType,
  PaymentStatus,
  ShipmentStatus,
  UserRole,
} from "@prisma/client";
import { auth, signIn, signOut } from "@/auth";
import type { Locale } from "@/lib/i18n";
import { getLotStatus, nextDocumentNumber } from "@/lib/format";
import { canAccessSection } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function withMessage(path: string, message: string, type: "success" | "error" = "success") {
  const query = new URLSearchParams({ message, type });
  return `${path}?${query.toString()}`;
}

async function getActor(section: Parameters<typeof canAccessSection>[1]) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  if (!canAccessSection(session.user.role, section)) {
    throw new Error("FORBIDDEN");
  }

  return session.user;
}

function normalizeOptional(value: FormDataEntryValue | null) {
  const content = value?.toString().trim() ?? "";
  return content.length > 0 ? content : undefined;
}

const partnerSchema = z.object({
  type: z.enum([PartnerType.SUPPLIER, PartnerType.CUSTOMER]),
  name: z.string().min(2),
  country: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  address: z.string().min(6),
  notes: z.string().optional(),
});

const stockLotSchema = z.object({
  supplierId: z.string().min(1),
  productionDate: z.coerce.date(),
  expirationDate: z.coerce.date(),
  quantityReceived: z.coerce.number().positive(),
  notes: z.string().optional(),
});

const invoiceSchema = z.object({
  type: z.enum([InvoiceType.QUOTE, InvoiceType.INVOICE]),
  customerId: z.string().min(1),
  orderId: z.string().optional(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  paymentStatus: z.enum([PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.PAID, PaymentStatus.OVERDUE]),
  currency: z.string().length(3),
  total: z.coerce.number().nonnegative(),
  paidAmount: z.coerce.number().nonnegative(),
  notes: z.string().optional(),
});

const shipmentSchema = z.object({
  orderId: z.string().optional(),
  carrier: z.string().min(2),
  trackingNumber: z.string().min(3),
  shippedAt: z.coerce.date(),
  eta: z.coerce.date().optional(),
  status: z.enum([ShipmentStatus.PLANNED, ShipmentStatus.IN_TRANSIT, ShipmentStatus.CUSTOMS, ShipmentStatus.DELIVERED, ShipmentStatus.DELAYED]),
  documents: z.array(z.string()).default([]),
});

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum([UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.LOGISTICS, UserRole.FINANCE]),
  password: z.string().min(8),
});

function parseOrderForm(formData: FormData) {
  const productNames = formData.getAll("itemProductName").map((value) => value.toString().trim());
  const quantities = formData.getAll("itemQuantity").map((value) => value.toString().trim());
  const unitPrices = formData.getAll("itemUnitPrice").map((value) => value.toString().trim());
  const lotIds = formData.getAll("itemLotId").map((value) => value.toString().trim());

  const items = productNames
    .map((productName, index) => ({
      productName,
      quantity: Number.parseFloat(quantities[index] ?? "0"),
      unitPrice: Number.parseFloat(unitPrices[index] ?? "0"),
      lotId: lotIds[index] || undefined,
    }))
    .filter((item) => item.productName && item.quantity > 0 && item.unitPrice >= 0);

  const schema = z.object({
    customerId: z.string().min(1),
    orderDate: z.coerce.date(),
    status: z.enum([OrderStatus.DRAFT, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED]),
    currency: z.string().length(3),
    notes: z.string().optional(),
    items: z
      .array(
        z.object({
          productName: z.string().min(2),
          quantity: z.number().positive(),
          unitPrice: z.number().nonnegative(),
          lotId: z.string().optional(),
        }),
      )
      .min(1),
  });

  return schema.safeParse({
    customerId: formData.get("customerId")?.toString(),
    orderDate: formData.get("orderDate")?.toString(),
    status: formData.get("status")?.toString(),
    currency: formData.get("currency")?.toString(),
    notes: normalizeOptional(formData.get("notes")),
    items,
  });
}

export async function loginAction(locale: Locale, formData: FormData) {
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: `/${locale}`,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(withMessage(`/${locale}/login`, "invalid_credentials", "error"));
    }

    throw error;
  }
}

export async function logoutAction(locale: Locale) {
  await signOut({ redirectTo: `/${locale}/login` });
}

export async function createPartnerAction(locale: Locale, formData: FormData) {
  const actor = await getActor("partners");
  const parsed = partnerSchema.safeParse({
    type: formData.get("type")?.toString(),
    name: formData.get("name")?.toString(),
    country: formData.get("country")?.toString(),
    email: normalizeOptional(formData.get("email")),
    phone: normalizeOptional(formData.get("phone")),
    address: formData.get("address")?.toString(),
    notes: normalizeOptional(formData.get("notes")),
  });

  if (!parsed.success) {
    redirect(withMessage(`/${locale}/partners`, "invalid_form", "error"));
  }

  const partner = await prisma.partner.create({ data: parsed.data });
  await prisma.activityLog.create({
    data: {
      userId: actor.id,
      entityType: "PARTNER",
      entityId: partner.id,
      action: "CREATED",
      description: `${parsed.data.type === PartnerType.SUPPLIER ? "Supplier" : "Customer"} ${partner.name} created.`,
    },
  });
  revalidatePath(`/${locale}/partners`);
  redirect(withMessage(`/${locale}/partners`, "created"));
}

export async function createStockLotAction(locale: Locale, formData: FormData) {
  const actor = await getActor("inventory");
  const parsed = stockLotSchema.safeParse({
    supplierId: formData.get("supplierId")?.toString(),
    productionDate: formData.get("productionDate")?.toString(),
    expirationDate: formData.get("expirationDate")?.toString(),
    quantityReceived: formData.get("quantityReceived")?.toString(),
    notes: normalizeOptional(formData.get("notes")),
  });

  if (!parsed.success) {
    redirect(withMessage(`/${locale}/inventory`, "invalid_form", "error"));
  }

  const latest = await prisma.stockLot.findFirst({ orderBy: { createdAt: "desc" } });
  const status = getLotStatus(parsed.data.quantityReceived, parsed.data.expirationDate);
  const lot = await prisma.stockLot.create({
    data: {
      lotNumber: nextDocumentNumber("LOT", latest?.lotNumber ?? null),
      quantityAvailable: parsed.data.quantityReceived,
      status,
      ...parsed.data,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: actor.id,
      entityType: "LOT",
      entityId: lot.id,
      action: "CREATED",
      description: `Lot ${lot.lotNumber} created with ${parsed.data.quantityReceived}L.`,
    },
  });

  revalidatePath(`/${locale}/inventory`);
  redirect(withMessage(`/${locale}/inventory`, "created"));
}

export async function createOrderAction(locale: Locale, formData: FormData) {
  const actor = await getActor("orders");
  const parsed = parseOrderForm(formData);

  if (!parsed.success) {
    redirect(withMessage(`/${locale}/orders`, "invalid_form", "error"));
  }

  for (const item of parsed.data.items) {
    if (item.lotId && parsed.data.status !== OrderStatus.DRAFT && parsed.data.status !== OrderStatus.CANCELLED) {
      const lot = await prisma.stockLot.findUnique({ where: { id: item.lotId } });
      if (!lot || lot.quantityAvailable < item.quantity) {
        redirect(withMessage(`/${locale}/orders`, "invalid_form", "error"));
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    const latest = await tx.order.findFirst({ orderBy: { createdAt: "desc" } });
    const orderNumber = nextDocumentNumber("ORD", latest?.orderNumber ?? null);
    let totalAmount = 0;

    for (const item of parsed.data.items) {
      totalAmount += item.quantity * item.unitPrice;
    }

    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: parsed.data.customerId,
        orderDate: parsed.data.orderDate,
        status: parsed.data.status,
        currency: parsed.data.currency.toUpperCase(),
        totalAmount,
        notes: parsed.data.notes,
        items: {
          create: parsed.data.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.quantity * item.unitPrice,
            lotId: item.lotId,
          })),
        },
      },
    });

    for (const item of parsed.data.items) {
      if (item.lotId && parsed.data.status !== OrderStatus.DRAFT && parsed.data.status !== OrderStatus.CANCELLED) {
        const lot = await tx.stockLot.findUniqueOrThrow({ where: { id: item.lotId } });
        const quantityAvailable = lot.quantityAvailable - item.quantity;
        await tx.stockLot.update({
          where: { id: item.lotId },
          data: {
            quantityAvailable,
            status: getLotStatus(quantityAvailable, lot.expirationDate),
          },
        });
      }
    }

    await tx.activityLog.create({
      data: {
        userId: actor.id,
        entityType: "ORDER",
        entityId: order.id,
        action: "CREATED",
        description: `Order ${order.orderNumber} created for ${totalAmount.toFixed(2)} ${parsed.data.currency.toUpperCase()}.`,
      },
    });
  });

  revalidatePath(`/${locale}/orders`);
  revalidatePath(`/${locale}/inventory`);
  redirect(withMessage(`/${locale}/orders`, "created"));
}

export async function createInvoiceAction(locale: Locale, formData: FormData) {
  const actor = await getActor("invoices");
  const parsed = invoiceSchema.safeParse({
    type: formData.get("type")?.toString(),
    customerId: formData.get("customerId")?.toString(),
    orderId: normalizeOptional(formData.get("orderId")),
    issueDate: formData.get("issueDate")?.toString(),
    dueDate: formData.get("dueDate")?.toString(),
    paymentStatus: formData.get("paymentStatus")?.toString(),
    currency: formData.get("currency")?.toString()?.toUpperCase(),
    total: formData.get("total")?.toString(),
    paidAmount: formData.get("paidAmount")?.toString() ?? "0",
    notes: normalizeOptional(formData.get("notes")),
  });

  if (!parsed.success) {
    redirect(withMessage(`/${locale}/invoices`, "invalid_form", "error"));
  }

  const linkedOrder = parsed.data.orderId ? await prisma.order.findUnique({ where: { id: parsed.data.orderId } }) : null;
  const latest = await prisma.invoice.findFirst({ orderBy: { createdAt: "desc" } });
  const prefix = parsed.data.type === InvoiceType.QUOTE ? "QUO" : "INV";
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: nextDocumentNumber(prefix, latest?.invoiceNumber ?? null),
      type: parsed.data.type,
      customerId: linkedOrder?.customerId ?? parsed.data.customerId,
      orderId: linkedOrder?.id,
      issueDate: parsed.data.issueDate,
      dueDate: parsed.data.dueDate,
      paymentStatus: parsed.data.paymentStatus,
      currency: parsed.data.currency,
      subtotal: linkedOrder?.totalAmount ?? parsed.data.total,
      total: linkedOrder?.totalAmount ?? parsed.data.total,
      paidAmount: parsed.data.paidAmount,
      notes: parsed.data.notes,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: actor.id,
      entityType: "INVOICE",
      entityId: invoice.id,
      action: "CREATED",
      description: `${invoice.type} ${invoice.invoiceNumber} created.`,
    },
  });

  revalidatePath(`/${locale}/invoices`);
  redirect(withMessage(`/${locale}/invoices`, "created"));
}

export async function createShipmentAction(locale: Locale, formData: FormData) {
  const actor = await getActor("shipments");
  const parsed = shipmentSchema.safeParse({
    orderId: normalizeOptional(formData.get("orderId")),
    carrier: formData.get("carrier")?.toString(),
    trackingNumber: formData.get("trackingNumber")?.toString(),
    shippedAt: formData.get("shippedAt")?.toString(),
    eta: normalizeOptional(formData.get("eta")),
    status: formData.get("status")?.toString(),
    documents: (formData.get("documents")?.toString() ?? "")
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean),
  });

  if (!parsed.success) {
    redirect(withMessage(`/${locale}/shipments`, "invalid_form", "error"));
  }

  const latest = await prisma.shipment.findFirst({ orderBy: { createdAt: "desc" } });
  const shipment = await prisma.shipment.create({
    data: {
      shipmentNumber: nextDocumentNumber("SHP", latest?.shipmentNumber ?? null),
      orderId: parsed.data.orderId,
      carrier: parsed.data.carrier,
      trackingNumber: parsed.data.trackingNumber,
      shippedAt: parsed.data.shippedAt,
      eta: parsed.data.eta,
      status: parsed.data.status,
      documents: parsed.data.documents,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: actor.id,
      entityType: "SHIPMENT",
      entityId: shipment.id,
      action: "CREATED",
      description: `Shipment ${shipment.shipmentNumber} created with carrier ${shipment.carrier}.`,
    },
  });

  revalidatePath(`/${locale}/shipments`);
  redirect(withMessage(`/${locale}/shipments`, "created"));
}

export async function createUserAction(locale: Locale, formData: FormData) {
  const actor = await getActor("users");
  const parsed = userSchema.safeParse({
    name: formData.get("name")?.toString(),
    email: formData.get("email")?.toString(),
    role: formData.get("role")?.toString(),
    password: formData.get("password")?.toString(),
  });

  if (!parsed.success) {
    redirect(withMessage(`/${locale}/users`, "invalid_form", "error"));
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: await hash(parsed.data.password, 10),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: actor.id,
      entityType: "USER",
      entityId: user.id,
      action: "CREATED",
      description: `User ${user.email} created with role ${user.role}.`,
    },
  });

  revalidatePath(`/${locale}/users`);
  redirect(withMessage(`/${locale}/users`, "created"));
}

import { hash } from "bcryptjs";
import { PrismaClient, UserRole, PartnerType, LotStatus, OrderStatus, InvoiceType, PaymentStatus, ShipmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stockLot.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash("Avocado123!", 10);

  const [admin, commercial, logistics, finance] = await Promise.all([
    prisma.user.create({ data: { name: "Admin Sphere", email: "admin@avocadosphere.local", role: UserRole.ADMIN, passwordHash } }),
    prisma.user.create({ data: { name: "Commercial Sphere", email: "sales@avocadosphere.local", role: UserRole.COMMERCIAL, passwordHash } }),
    prisma.user.create({ data: { name: "Logistics Sphere", email: "logistics@avocadosphere.local", role: UserRole.LOGISTICS, passwordHash } }),
    prisma.user.create({ data: { name: "Finance Sphere", email: "finance@avocadosphere.local", role: UserRole.FINANCE, passwordHash } }),
  ]);

  const supplier = await prisma.partner.create({
    data: {
      type: PartnerType.SUPPLIER,
      name: "Kigali Avocado Cooperative",
      country: "Rwanda",
      email: "contact@kigali-avocado.rw",
      phone: "+250788000111",
      address: "KG 7 Ave, Kigali",
      notes: "Primary origin supplier for cold pressed avocado oil.",
    },
  });

  const customer = await prisma.partner.create({
    data: {
      type: PartnerType.CUSTOMER,
      name: "Maison Verte Paris",
      country: "France",
      email: "achats@maisonverte.fr",
      phone: "+33145000000",
      address: "18 rue des Maraîchers, 75020 Paris",
      notes: "Key French distributor.",
    },
  });

  const lot = await prisma.stockLot.create({
    data: {
      lotNumber: "LOT-2026-0001",
      supplierId: supplier.id,
      productionDate: new Date("2026-03-10"),
      expirationDate: new Date("2027-03-10"),
      quantityReceived: 1200,
      quantityAvailable: 900,
      status: LotStatus.AVAILABLE,
      notes: "Cold pressed premium batch.",
    },
  });

  const order = await prisma.order.create({
    data: {
      orderNumber: "ORD-2026-0001",
      customerId: customer.id,
      orderDate: new Date("2026-04-08"),
      status: OrderStatus.CONFIRMED,
      currency: "EUR",
      totalAmount: 7200,
      notes: "First April replenishment order.",
      items: {
        create: [
          {
            productName: "Huile d'avocat premium 5L",
            quantity: 300,
            unitPrice: 24,
            lineTotal: 7200,
            lotId: lot.id,
          },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-0001",
      type: InvoiceType.INVOICE,
      orderId: order.id,
      customerId: customer.id,
      issueDate: new Date("2026-04-10"),
      dueDate: new Date("2026-05-10"),
      paymentStatus: PaymentStatus.PARTIAL,
      currency: "EUR",
      subtotal: 7200,
      total: 7200,
      paidAmount: 3600,
      notes: "50% paid on dispatch.",
    },
  });

  await prisma.shipment.create({
    data: {
      shipmentNumber: "SHP-2026-0001",
      orderId: order.id,
      carrier: "Maersk",
      trackingNumber: "MSKUAVO260401",
      shippedAt: new Date("2026-04-12"),
      eta: new Date("2026-04-30"),
      status: ShipmentStatus.IN_TRANSIT,
      documents: ["Commercial invoice", "Packing list", "Export certificate"],
    },
  });

  await prisma.activityLog.createMany({
    data: [
      { userId: admin.id, entityType: "USER", entityId: admin.id, action: "SEEDED", description: "Initial admin user created." },
      { userId: commercial.id, entityType: "ORDER", entityId: order.id, action: "CREATED", description: "Seeded April customer order." },
      { userId: logistics.id, entityType: "SHIPMENT", entityId: order.id, action: "UPDATED", description: "Shipment created and marked in transit." },
      { userId: finance.id, entityType: "INVOICE", entityId: order.id, action: "UPDATED", description: "Invoice registered with partial payment." },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

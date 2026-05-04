import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { customer: true, order: true },
  });

  if (!invoice) {
    return new NextResponse("Not found", { status: 404 });
  }

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawText("The Avocado Sphere", { x: 50, y: 790, font: bold, size: 22, color: rgb(0.06, 0.35, 0.16) });
  page.drawText(invoice.invoiceNumber, { x: 50, y: 752, font: bold, size: 16 });
  page.drawText(`Customer: ${invoice.customer.name}`, { x: 50, y: 720, font, size: 12 });
  page.drawText(`Issue date: ${formatDate(invoice.issueDate, "en")}`, { x: 50, y: 700, font, size: 12 });
  page.drawText(`Due date: ${formatDate(invoice.dueDate, "en")}`, { x: 50, y: 680, font, size: 12 });
  page.drawText(`Currency: ${invoice.currency}`, { x: 50, y: 660, font, size: 12 });
  page.drawText(`Total amount: ${invoice.total.toFixed(2)} ${invoice.currency}`, { x: 50, y: 640, font: bold, size: 13 });
  page.drawText(`Paid amount: ${invoice.paidAmount.toFixed(2)} ${invoice.currency}`, { x: 50, y: 620, font, size: 12 });
  page.drawText(`Payment status: ${invoice.paymentStatus}`, { x: 50, y: 600, font, size: 12 });
  page.drawText(`Linked order: ${invoice.order?.orderNumber ?? "N/A"}`, { x: 50, y: 580, font, size: 12 });

  if (invoice.notes) {
    const notes = invoice.notes.replace(/\r\n/g, "\n").replace(/[^\S\n]+/g, " ").slice(0, 600);
    page.drawText(`Notes:\n${notes}`, { x: 50, y: 540, font, size: 12, maxWidth: 480, lineHeight: 16 });
  }

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    },
  });
}

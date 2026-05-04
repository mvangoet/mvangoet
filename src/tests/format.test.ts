import { describe, expect, it } from "vitest";
import { LOW_STOCK_THRESHOLD, getLotStatus, isLowStock, nextDocumentNumber } from "@/lib/format";

describe("format helpers", () => {
  it("increments document numbers", () => {
    expect(nextDocumentNumber("INV", "INV-2026-0009", new Date("2026-05-04"))).toBe("INV-2026-0010");
  });

  it("flags low stock quantities", () => {
    expect(isLowStock(LOW_STOCK_THRESHOLD)).toBe(true);
    expect(isLowStock(LOW_STOCK_THRESHOLD + 1)).toBe(false);
  });

  it("derives lot status from quantity and expiration", () => {
    expect(getLotStatus(0, new Date("2027-01-01"))).toBe("SOLD");
    expect(getLotStatus(50, new Date("2027-01-01"))).toBe("LOW_STOCK");
    expect(getLotStatus(1000, new Date("2020-01-01"))).toBe("EXPIRED");
  });
});

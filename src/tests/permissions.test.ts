import { describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";
import { canAccessSection, getAccessibleSections } from "@/lib/permissions";

describe("permissions", () => {
  it("limits user management to admins", () => {
    expect(canAccessSection(UserRole.ADMIN, "users")).toBe(true);
    expect(canAccessSection(UserRole.COMMERCIAL, "users")).toBe(false);
  });

  it("returns the sections available to a logistics user", () => {
    expect(getAccessibleSections(UserRole.LOGISTICS)).toEqual(["dashboard", "inventory", "orders", "shipments"]);
  });
});

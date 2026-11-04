import { describe, expect, it } from "vitest";
import { generalizeAge, generalizeZip, patientToFhir } from "@/lib/privacy";
import { isStrongPassword } from "@/routes/index";
import { groupByCategory } from "@/routes/revenue";

describe("privacy rules", () => {
  it("buckets ages", () => {
    expect([19, 20, 45, 60].map(generalizeAge)).toEqual(["<20", "20-39", "40-59", "60+"]);
  });
  it("masks zip codes to first 3 digits", () => {
    expect(generalizeZip("560001")).toBe("560XX");
  });
  it("converts patient to FHIR", () => {
    expect(patientToFhir({ patient_id: 7, first_name: "A", last_name: "B" }).name).toEqual([{ family: "B", given: ["A"] }]);
  });
  it("requires a strong password", () => {
    expect(isStrongPassword("Abcdef1!")).toBe(true);
    expect(isStrongPassword("abcdefg1")).toBe(false);
  });
  it("groups revenue by category", () => {
    expect(groupByCategory([{ category: null, price: 5 }, { category: null, price: 3 }])).toEqual([{ category: "Uncategorized", count: 2, revenue: 8 }]);
  });
});

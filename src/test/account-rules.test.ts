import { describe, expect, it } from "vitest";
import { canUsePersonalAction, canRunExtendedSearch, dailySearches, type PersonalAction } from "@/lib/account-rules";
describe("Personal access", () => {
  for (const action of ["save", "watchbox", "alert", "project", "pro", "whatsapp"] as PersonalAction[]) {
    it(`requires an account for ${action}`, () => {
      expect(canUsePersonalAction(null, action)).toBe(false);
      expect(canUsePersonalAction({ id: "owner" }, action)).toBe(true);
    });
  }
  it("allows five free extensive searches, not a sixth", () => {
    expect(canRunExtendedSearch(4, false)).toBe(true);
    expect(canRunExtendedSearch(5, false)).toBe(false);
  });
  it("resets extensive searches on a new day", () => {
    expect(dailySearches(5, "2026-10-27", "2026-10-28")).toBe(0);
    expect(dailySearches(5, "2026-10-27", "2026-10-27")).toBe(5);
  });
});
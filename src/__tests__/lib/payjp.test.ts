import {
  SUBSCRIPTION_PLANS,
  getAvailablePlans,
  getPlansForUser,
  formatCardNumber,
  formatExpiryDate,
  formatPrice,
} from "@/lib/payjp";

describe("payjp ユーティリティ", () => {
  describe("SUBSCRIPTION_PLANS", () => {
    it("5つのプランが定義されている", () => {
      expect(SUBSCRIPTION_PLANS).toHaveLength(5);
    });

    it("レガシープランが2つ存在する", () => {
      const legacy = SUBSCRIPTION_PLANS.filter((p) => p.legacy);
      expect(legacy).toHaveLength(2);
    });

    it("現行プランが3つ存在する", () => {
      const current = SUBSCRIPTION_PLANS.filter((p) => !p.legacy);
      expect(current).toHaveLength(3);
    });
  });

  describe("getAvailablePlans", () => {
    it("レガシープランを除外した3つのプランを返す", () => {
      const plans = getAvailablePlans();
      expect(plans).toHaveLength(3);
      expect(plans.every((p) => !p.legacy)).toBe(true);
    });

    it("1year, 5year, 10year が含まれる", () => {
      const plans = getAvailablePlans();
      const ids = plans.map((p) => p.id);
      expect(ids).toContain("1year");
      expect(ids).toContain("5year");
      expect(ids).toContain("10year");
    });
  });

  describe("getPlansForUser", () => {
    it("プランIDなしの場合は現行プランのみ返す", () => {
      const plans = getPlansForUser();
      expect(plans).toHaveLength(3);
      expect(plans.every((p) => !p.legacy)).toBe(true);
    });

    it("現行プランユーザーには現行プランのみ返す", () => {
      const plans = getPlansForUser("1year");
      expect(plans).toHaveLength(3);
      expect(plans.every((p) => !p.legacy)).toBe(true);
    });

    it("レガシープランユーザーにはレガシー+現行プランを返す", () => {
      const plans = getPlansForUser("1year_legacy");
      expect(plans.length).toBe(5); // 2 legacy + 3 current
      expect(plans.some((p) => p.legacy)).toBe(true);
      expect(plans.some((p) => !p.legacy)).toBe(true);
    });

    it("5year_legacyユーザーにもレガシー+現行プランを返す", () => {
      const plans = getPlansForUser("5year_legacy");
      expect(plans.length).toBe(5);
    });
  });

  describe("formatCardNumber", () => {
    it("ブランドと下4桁でフォーマットする", () => {
      expect(formatCardNumber("1234", "visa")).toBe("VISA **** **** **** 1234");
    });

    it("ブランド名を大文字に変換する", () => {
      expect(formatCardNumber("5678", "mastercard")).toBe(
        "MASTERCARD **** **** **** 5678"
      );
    });
  });

  describe("formatExpiryDate", () => {
    it("月/年のフォーマットで返す", () => {
      expect(formatExpiryDate(3, 2027)).toBe("03/2027");
    });

    it("1桁の月をゼロ埋めする", () => {
      expect(formatExpiryDate(1, 2028)).toBe("01/2028");
    });

    it("2桁の月はそのまま", () => {
      expect(formatExpiryDate(12, 2026)).toBe("12/2026");
    });
  });

  describe("formatPrice", () => {
    it("円記号とカンマ区切りでフォーマットする", () => {
      expect(formatPrice(3960)).toBe("¥3,960");
    });

    it("大きな金額もフォーマットする", () => {
      expect(formatPrice(22000)).toBe("¥22,000");
    });

    it("小さな金額もフォーマットする", () => {
      expect(formatPrice(980)).toBe("¥980");
    });
  });
});

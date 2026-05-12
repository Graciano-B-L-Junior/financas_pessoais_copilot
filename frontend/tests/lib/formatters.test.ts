import {
  formatCurrency,
  formatDate,
  formatPercent,
  getInitials,
  currentMonthInput,
} from "@/lib/formatters";

describe("formatters", () => {
  describe("formatCurrency", () => {
    it("formats positive amounts in BRL", () => {
      expect(formatCurrency(1000)).toBe("R$\u00A01.000,00");
      expect(formatCurrency(100.5)).toBe("R$\u00A0100,50");
    });

    it("formats negative amounts", () => {
      expect(formatCurrency(-1000)).toBe("-R$\u00A01.000,00");
    });

    it("formats zero", () => {
      expect(formatCurrency(0)).toBe("R$\u00A00,00");
    });

    it("handles string input", () => {
      expect(formatCurrency("1000")).toBe("R$\u00A01.000,00");
    });

    it("handles very large numbers", () => {
      expect(formatCurrency(1000000)).toBe("R$\u00A01.000.000,00");
    });
  });

  describe("formatDate", () => {
    it("formats ISO date to pt-BR format", () => {
      expect(formatDate("2026-05-12")).toBe("12 de mai. de 2026");
    });

    it("handles date at start of month", () => {
      expect(formatDate("2026-05-01")).toBe("1 de mai. de 2026");
    });

    it("handles date at end of month", () => {
      expect(formatDate("2026-05-31")).toBe("31 de mai. de 2026");
    });

    it("returns em dash for null/undefined", () => {
      expect(formatDate(null)).toBe("—");
      expect(formatDate(undefined)).toBe("—");
    });
  });

  describe("formatPercent", () => {
    it("formats percentage with 1 decimal place using pt-BR locale", () => {
      expect(formatPercent(50)).toBe("50,0%");
      expect(formatPercent(33.33)).toBe("33,3%");
    });

    it("formats zero", () => {
      expect(formatPercent(0)).toBe("0,0%");
    });

    it("formats 100 percent", () => {
      expect(formatPercent(100)).toBe("100,0%");
    });

    it("handles decimal input", () => {
      expect(formatPercent(0.5)).toBe("50,0%");
      expect(formatPercent(99.9)).toBe("99,9%");
    });

    it("handles string input", () => {
      expect(formatPercent("50")).toBe("50,0%");
    });
  });

  describe("getInitials", () => {
    it("returns initials from first and last name", () => {
      expect(
        getInitials({ first_name: "Joao", last_name: "Silva" })
      ).toBe("JS");
    });

    it("returns first letter of first name if no last name", () => {
      expect(
        getInitials({ first_name: "Joao", last_name: "" })
      ).toBe("J");
    });

    it("returns first letter of email if no names", () => {
      expect(
        getInitials({
          first_name: "",
          last_name: "",
          email: "joao@example.com",
        })
      ).toBe("J");
    });

    it("returns fallback for empty user", () => {
      expect(getInitials({ email: "" })).toBe("?");
    });

    it("handles mixed case names", () => {
      expect(
        getInitials({ first_name: "João", last_name: "Silva" })
      ).toBe("JS");
    });
  });

  describe("currentMonthInput", () => {
    it("returns current month in YYYY-MM format", () => {
      const result = currentMonthInput();
      expect(result).toMatch(/^\d{4}-\d{2}$/);
    });

    it("returns valid month format", () => {
      const result = currentMonthInput();
      const [year, month] = result.split("-");
      expect(parseInt(month, 10)).toBeGreaterThanOrEqual(1);
      expect(parseInt(month, 10)).toBeLessThanOrEqual(12);
    });
  });
});

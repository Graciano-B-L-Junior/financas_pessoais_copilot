import {
  normalizeItem,
  normalizeList,
  extractPagination,
  normalizeErrors,
  parseBoolean,
  parseInteger,
  parseMoney,
  parseDate,
} from "@/lib/normalizers";

describe("normalizers", () => {
  describe("normalizeItem", () => {
    it("returns object as-is", () => {
      const obj = { id: 1, name: "Test" };
      expect(normalizeItem(obj)).toEqual(obj);
    });

    it("unwraps data property", () => {
      const wrapped = { data: { id: 1, name: "Test" } };
      expect(normalizeItem(wrapped)).toEqual({ id: 1, name: "Test" });
    });

    it("unwraps result property", () => {
      const wrapped = { result: { id: 1, name: "Test" } };
      expect(normalizeItem(wrapped)).toEqual({ id: 1, name: "Test" });
    });

    it("returns empty object for null/undefined", () => {
      expect(normalizeItem(null)).toEqual({});
      expect(normalizeItem(undefined)).toEqual({});
    });

    it("returns object for non-object input", () => {
      expect(normalizeItem("string")).toEqual("string");
      expect(normalizeItem(42)).toEqual(42);
    });
  });

  describe("normalizeList", () => {
    it("returns array as-is", () => {
      const arr = [{ id: 1 }, { id: 2 }];
      expect(normalizeList(arr)).toEqual(arr);
    });

    it("extracts results property", () => {
      const payload = { results: [{ id: 1 }, { id: 2 }] };
      expect(normalizeList(payload)).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it("extracts data property", () => {
      const payload = { data: [{ id: 1 }, { id: 2 }] };
      expect(normalizeList(payload)).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it("extracts items property", () => {
      const payload = { items: [{ id: 1 }, { id: 2 }] };
      expect(normalizeList(payload)).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it("returns empty array for null/undefined", () => {
      expect(normalizeList(null)).toEqual([]);
      expect(normalizeList(undefined)).toEqual([]);
    });

    it("returns empty array for non-array properties", () => {
      expect(normalizeList({ invalid: "property" })).toEqual([]);
    });
  });

  describe("extractPagination", () => {
    it("extracts pagination metadata", () => {
      const payload = {
        count: 100,
        next: "http://example.com?page=2",
        previous: null,
      };
      const result = extractPagination(payload);
      expect(result).toEqual({
        count: 100,
        next: "http://example.com?page=2",
        previous: null,
      });
    });

    it("returns null for invalid payload", () => {
      expect(extractPagination(null)).toBeNull();
      expect(extractPagination(undefined)).toBeNull();
      expect(extractPagination({})).toBeNull();
    });

    it("returns null if count is missing", () => {
      expect(
        extractPagination({ next: "url", previous: null })
      ).toBeNull();
    });

    it("handles all null values correctly", () => {
      const payload = {
        count: 0,
        next: null,
        previous: null,
      };
      expect(extractPagination(payload)).toEqual(payload);
    });
  });

  describe("normalizeErrors", () => {
    it("flattens nested error object", () => {
      const payload = {
        email: ["Invalid email format"],
        password: ["Too short"],
      };
      const result = normalizeErrors(payload);
      expect(result.email).toEqual(["Invalid email format"]);
      expect(result.password).toEqual(["Too short"]);
    });

    it("moves non_field_errors to general", () => {
      const payload = {
        non_field_errors: ["Invalid credentials"],
      };
      const result = normalizeErrors(payload);
      expect(result.general).toContain("Invalid credentials");
    });

    it("returns default error for null payload", () => {
      const result = normalizeErrors(null);
      expect(result.general.length).toBeGreaterThan(0);
    });

    it("handles arrays of errors", () => {
      const payload = {
        categories: [["Invalid category"], ["Not found"]],
      };
      const result = normalizeErrors(payload);
      expect(result.categories).toContain("Invalid category");
    });
  });

  describe("parseBoolean", () => {
    it("parses true strings", () => {
      expect(parseBoolean("true")).toBe(true);
      expect(parseBoolean("1")).toBe(true);
      expect(parseBoolean("yes")).toBe(true);
      expect(parseBoolean("on")).toBe(true);
    });

    it("parses false strings", () => {
      expect(parseBoolean("false")).toBe(false);
      expect(parseBoolean("0")).toBe(false);
      expect(parseBoolean("no")).toBe(false);
    });

    it("uses fallback for empty/undefined", () => {
      expect(parseBoolean(undefined, false)).toBe(false);
      expect(parseBoolean("", true)).toBe(true);
      expect(parseBoolean(null, false)).toBe(false);
    });

    it("parses boolean directly", () => {
      expect(parseBoolean(true)).toBe(true);
      expect(parseBoolean(false)).toBe(false);
    });
  });

  describe("parseInteger", () => {
    it("parses valid integers", () => {
      expect(parseInteger("42")).toBe(42);
      expect(parseInteger(42)).toBe(42);
      expect(parseInteger("  100  ")).toBe(100);
    });

    it("returns undefined for empty/null", () => {
      expect(parseInteger("")).toBeUndefined();
      expect(parseInteger(null)).toBeUndefined();
      expect(parseInteger(undefined)).toBeUndefined();
    });

    it("returns raw string for non-numeric", () => {
      expect(parseInteger("abc")).toBe("abc");
      expect(parseInteger("12abc")).toBe("12abc");
    });
  });

  describe("parseMoney", () => {
    it("parses decimal numbers", () => {
      expect(parseMoney("100.50")).toBe(100.5);
      expect(parseMoney("1000")).toBe(1000);
    });

    it("converts comma decimal separator", () => {
      expect(parseMoney("100,50")).toBe(100.5);
      expect(parseMoney("1.000,50")).toBe(1000.5);
    });

    it("handles currency symbols", () => {
      expect(parseMoney("R$ 100,50")).toBe(100.5);
      expect(parseMoney("$100.50")).toBe(100.5);
    });

    it("returns undefined for empty/null", () => {
      expect(parseMoney("")).toBeUndefined();
      expect(parseMoney(null)).toBeUndefined();
      expect(parseMoney(undefined)).toBeUndefined();
    });
  });

  describe("parseDate", () => {
    it("returns valid ISO date strings", () => {
      expect(parseDate("2026-05-12")).toBe("2026-05-12");
    });

    it("returns null for empty string", () => {
      expect(parseDate("")).toBeNull();
    });

    it("returns undefined for null/undefined", () => {
      expect(parseDate(null)).toBeUndefined();
      expect(parseDate(undefined)).toBeUndefined();
    });

    it("trims whitespace", () => {
      expect(parseDate("  2026-05-12  ")).toBe("2026-05-12");
    });
  });
});

import {
  setAuthCookies,
  clearAuthCookies,
  setFlash,
  consumeFlash,
  hasAuthCookies,
} from "@/lib/session";

// Mock de cookies
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

import { cookies } from "next/headers";

describe("session", () => {
  let mockCookieStore: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCookieStore = {
      set: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    };
    (cookies as jest.Mock).mockResolvedValue(mockCookieStore);
  });

  describe("setAuthCookies", () => {
    it("sets access and refresh tokens", async () => {
      await setAuthCookies({
        accessToken: "access-value",
        refreshToken: "refresh-value",
      });

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "access_token",
        "access-value",
        expect.objectContaining({
          httpOnly: true,
          path: "/",
          sameSite: "lax",
        })
      );

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "refresh_token",
        "refresh-value",
        expect.objectContaining({
          httpOnly: true,
          path: "/",
          sameSite: "lax",
        })
      );
    });

    it("only sets provided tokens", async () => {
      await setAuthCookies({ accessToken: "access-value" });

      expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "access_token",
        "access-value",
        expect.any(Object)
      );
    });

    it("sets httpOnly flag", async () => {
      await setAuthCookies({ accessToken: "token" });

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ httpOnly: true })
      );
    });
  });

  describe("clearAuthCookies", () => {
    it("deletes both auth cookies", async () => {
      await clearAuthCookies();

      expect(mockCookieStore.delete).toHaveBeenCalledWith("access_token");
      expect(mockCookieStore.delete).toHaveBeenCalledWith("refresh_token");
    });
  });

  describe("setFlash", () => {
    it("sets flash message with short expiry", async () => {
      await setFlash("success", "Operation completed");

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "flash_type",
        "success",
        expect.objectContaining({ maxAge: 10 })
      );

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "flash_message",
        "Operation completed",
        expect.objectContaining({ maxAge: 10 })
      );
    });
  });

  describe("consumeFlash", () => {
    it("returns flash message and deletes cookies", async () => {
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === "flash_type") return { value: "success" };
        if (name === "flash_message") return { value: "Done!" };
        return undefined;
      });

      const result = await consumeFlash();

      expect(result).toEqual({
        type: "success",
        message: "Done!",
      });

      expect(mockCookieStore.delete).toHaveBeenCalledWith("flash_type");
      expect(mockCookieStore.delete).toHaveBeenCalledWith("flash_message");
    });

    it("returns null if no flash set", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await consumeFlash();

      expect(result).toBeNull();
    });

    it("uses default type if missing", async () => {
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === "flash_message") return { value: "Message only" };
        return undefined;
      });

      const result = await consumeFlash();

      expect(result?.type).toBe("info");
      expect(result?.message).toBe("Message only");
    });

    it("uses default message if missing", async () => {
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === "flash_type") return { value: "warning" };
        return undefined;
      });

      const result = await consumeFlash();

      expect(result?.type).toBe("warning");
      expect(result?.message).toBe("");
    });
  });

  describe("hasAuthCookies", () => {
    it("returns true if access token exists", async () => {
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === "access_token") return { value: "token" };
        return undefined;
      });

      const result = await hasAuthCookies();

      expect(result).toBe(true);
    });

    it("returns true if refresh token exists", async () => {
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === "refresh_token") return { value: "token" };
        return undefined;
      });

      const result = await hasAuthCookies();

      expect(result).toBe(true);
    });

    it("returns false if neither token exists", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await hasAuthCookies();

      expect(result).toBe(false);
    });
  });
});

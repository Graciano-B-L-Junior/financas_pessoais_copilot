import "@testing-library/jest-dom";

// Mock de next/headers
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
  headers: jest.fn(),
}));

// Mock de next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// Mock global de fetch
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Mock de env vars
process.env.BACKEND_API_URL = "http://localhost:8000/api/v1";
process.env.COOKIE_SECURE = "false";
process.env.LOCALE = "pt-BR";
process.env.CURRENCY = "BRL";


const request = require("supertest");

jest.mock("../src/lib/api", () => ({
  analyticsGet: jest.fn(),
  categoriesCreate: jest.fn(),
  categoriesDelete: jest.fn(),
  categoriesList: jest.fn(),
  categoriesRetrieve: jest.fn(),
  categoriesUpdate: jest.fn(),
  dashboardGet: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  profileGet: jest.fn(),
  profileUpdate: jest.fn(),
  register: jest.fn(),
  transactionsCreate: jest.fn(),
  transactionsDelete: jest.fn(),
  transactionsList: jest.fn(),
  transactionsRetrieve: jest.fn(),
  transactionsUpdate: jest.fn(),
}));

const api = require("../src/lib/api");
const { createApp } = require("../src/app");

describe("frontend app", () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it("exposes a health endpoint", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("renders the public landing page", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("Financas Pessoais");
  });

  it("redirects protected routes when session is missing", async () => {
    const response = await request(app).get("/dashboard");

    expect([302, 303]).toContain(response.statusCode);
    expect(response.headers.location).toContain("/login");
  });

  it("sets auth cookies on login", async () => {
    api.login.mockResolvedValueOnce({
      data: { access: "access-token", refresh: "refresh-token" },
      status: 200,
    });

    const response = await request(app)
      .post("/login")
      .type("form")
      .send({ email: "joao@exemplo.com", password: "Senha@123", next: "/dashboard" });

    expect([302, 303]).toContain(response.statusCode);
    expect(response.headers.location).toBe("/dashboard");
    expect(response.headers["set-cookie"]).toEqual(expect.arrayContaining([
      expect.stringContaining("access_token=access-token"),
      expect.stringContaining("refresh_token=refresh-token"),
    ]));
  });

  it("renders the dashboard with mocked backend data", async () => {
    api.profileGet.mockResolvedValueOnce({
      data: { email: "joao@exemplo.com", first_name: "Joao", last_name: "Silva" },
      status: 200,
    });
    api.dashboardGet.mockResolvedValueOnce({
      data: {
        summary: {
          balance: 1840,
          recurring_count: 2,
          total_expenses: 3160,
          total_income: 5000,
          transaction_count: 8,
        },
        top_categories: [{ category: "Alimentacao", total: 900 }],
      },
      status: 200,
    });
    api.categoriesList.mockResolvedValueOnce({ data: [], status: 200 });
    api.transactionsList.mockResolvedValueOnce({ data: [], status: 200 });

    const response = await request(app)
      .get("/dashboard")
      .set("Cookie", ["access_token=access-token", "refresh_token=refresh-token"]);

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("Dashboard");
    expect(response.text.replace(/\u00a0/g, " ")).toMatch(/5\.000,00/);
  });
});
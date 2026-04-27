const mockRequest = jest.fn();
const mockPost = jest.fn();

jest.mock("axios", () => ({
  create: jest.fn(() => ({
    post: mockPost,
    request: mockRequest,
  })),
}), { virtual: true });

const api = require("../src/lib/api");

describe("frontend api client", () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockPost.mockReset();
  });

  it("sends the access token as bearer auth", async () => {
    mockRequest.mockResolvedValueOnce({ data: { email: "joao@exemplo.com" }, status: 200 });

    await api.profileGet(
      {
        cookies: {
          access_token: "access-token",
          refresh_token: "refresh-token",
        },
      },
      null,
    );

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
          Cookie: "access_token=access-token; refresh_token=refresh-token",
        }),
        method: "get",
        url: "/profile/",
      }),
    );
  });

  it("retries protected requests with a refreshed access token", async () => {
    mockRequest
      .mockResolvedValueOnce({ data: { detail: "Unauthorized" }, status: 401 })
      .mockResolvedValueOnce({ data: { email: "joao@exemplo.com" }, status: 200 });
    mockPost.mockResolvedValueOnce({
      data: { access: "new-access-token", refresh: "new-refresh-token" },
      status: 200,
    });

    const res = {
      cookie: jest.fn(),
    };
    const req = {
      cookies: {
        access_token: "expired-access-token",
        refresh_token: "refresh-token",
      },
    };

    await api.profileGet(req, res);

    expect(mockRequest).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer expired-access-token",
        }),
      }),
    );
    expect(mockPost).toHaveBeenCalledWith(
      "/auth/refresh/",
      { refresh: "refresh-token" },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer expired-access-token",
        }),
      }),
    );
    expect(mockRequest).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer new-access-token",
        }),
      }),
    );
    expect(res.cookie).toHaveBeenCalledWith("access_token", "new-access-token", expect.any(Object));
    expect(res.cookie).toHaveBeenCalledWith("refresh_token", "new-refresh-token", expect.any(Object));
  });
});
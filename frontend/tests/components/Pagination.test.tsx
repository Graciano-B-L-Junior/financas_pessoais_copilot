import { render, screen } from "@testing-library/react";
import { Pagination } from "@/components/ui/Pagination";

describe("Pagination", () => {
  const defaultProps = {
    page: 2,
    totalPages: 5,
    totalCount: 100,
    pageSize: 20,
    hasNext: true,
    hasPrevious: true,
    pathname: "/lancamentos",
    searchParams: {
      start: "2026-01-01",
      end: "2026-12-31",
      category: "5",
    },
  };

  it("renders pagination controls", () => {
    render(<Pagination {...defaultProps} />);

    expect(screen.getByText("← Anterior")).toBeInTheDocument();
    expect(screen.getByText("Próxima →")).toBeInTheDocument();
  });

  it("displays current page info", () => {
    render(<Pagination {...defaultProps} />);

    const pageInfo = screen.getByText((content, element) => {
      return element?.className === "pagination-page" && content.includes("Página");
    });
    expect(pageInfo).toBeInTheDocument();
    expect(pageInfo?.textContent).toContain("2");
    expect(pageInfo?.textContent).toContain("5");
  });

  it("displays total count", () => {
    render(<Pagination {...defaultProps} />);

    expect(screen.getByText("100 registros")).toBeInTheDocument();
  });

  it("disables Anterior button on first page", () => {
    render(
      <Pagination {...defaultProps} page={1} hasPrevious={false} />
    );

    const anteriorButton = screen.getByText("← Anterior");
    expect(anteriorButton).toBeDisabled();
  });

  it("disables Próxima button on last page", () => {
    render(
      <Pagination
        {...defaultProps}
        page={5}
        totalPages={5}
        hasNext={false}
      />
    );

    const proximaButton = screen.getByText("Próxima →");
    expect(proximaButton).toBeDisabled();
  });

  it("links Anterior button to previous page preserving filters", () => {
    render(<Pagination {...defaultProps} />);

    const anteriorLink = screen.getByRole("link", { name: /anterior/ });
    const href = anteriorLink.getAttribute("href");

    expect(href).toContain("/lancamentos");
    expect(href).toContain("page=1");
    expect(href).toContain("start=2026-01-01");
    expect(href).toContain("category=5");
  });

  it("links Próxima button to next page preserving filters", () => {
    render(<Pagination {...defaultProps} />);

    const proximaLink = screen.getByRole("link", { name: /próxima/ });
    const href = proximaLink.getAttribute("href");

    expect(href).toContain("/lancamentos");
    expect(href).toContain("page=3");
    expect(href).toContain("start=2026-01-01");
    expect(href).toContain("category=5");
  });

  it("does not include empty search params in URL", () => {
    render(
      <Pagination
        {...defaultProps}
        searchParams={{
          start: "2026-01-01",
          end: undefined,
          category: "",
        }}
      />
    );

    const proximaLink = screen.getByRole("link", { name: /próxima/ });
    const href = proximaLink.getAttribute("href");

    expect(href).toContain("start=2026-01-01");
    expect(href).not.toContain("end=");
    expect(href).not.toContain("category=");
  });

  it("has proper ARIA labels", () => {
    render(<Pagination {...defaultProps} />);

    expect(screen.getByLabelText(/página anterior/)).toBeInTheDocument();
    expect(screen.getByLabelText(/próxima página/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Total de 100 registros/)).toBeInTheDocument();
  });

  it("has navigation role", () => {
    const { container } = render(<Pagination {...defaultProps} />);

    const nav = container.querySelector("nav[role='navigation']");
    expect(nav).toBeInTheDocument();
  });

  it("handles single page correctly", () => {
    render(
      <Pagination
        {...defaultProps}
        page={1}
        totalPages={1}
        hasNext={false}
        hasPrevious={false}
      />
    );

    const anteriorButton = screen.getByText("← Anterior");
    const proximaButton = screen.getByText("Próxima →");

    expect(anteriorButton).toBeDisabled();
    expect(proximaButton).toBeDisabled();
  });

  it("renders different pathnames", () => {
    const { rerender } = render(
      <Pagination {...defaultProps} pathname="/lancamentos" />
    );

    let proximaLink = screen.getByRole("link", { name: /próxima/ });
    expect(proximaLink.getAttribute("href")).toContain("/lancamentos");

    rerender(
      <Pagination {...defaultProps} pathname="/categorias" />
    );

    proximaLink = screen.getByRole("link", { name: /próxima/ });
    expect(proximaLink.getAttribute("href")).toContain("/categorias");
  });
});

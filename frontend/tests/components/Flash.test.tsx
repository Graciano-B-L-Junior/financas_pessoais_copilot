import { render, screen } from "@testing-library/react";
import { Flash } from "@/components/ui/Flash";

describe("Flash", () => {
  it("renders nothing when flash is null", () => {
    const { container } = render(<Flash flash={null} />);

    expect(container.firstChild).toBeNull();
  });

  it("renders success message", () => {
    render(<Flash flash={{ type: "success", message: "Operation successful!" }} />);

    expect(screen.getByText("Operation successful!")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveClass("flash--success");
  });

  it("renders error message", () => {
    render(<Flash flash={{ type: "danger", message: "Something went wrong" }} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveClass("flash--danger");
  });

  it("renders warning message", () => {
    render(<Flash flash={{ type: "warning", message: "Warning message" }} />);

    expect(screen.getByText("Warning message")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveClass("flash--warning");
  });

  it("renders info message", () => {
    render(<Flash flash={{ type: "info", message: "Information" }} />);

    expect(screen.getByText("Information")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveClass("flash--info");
  });

  it("has alert role for accessibility", () => {
    render(<Flash flash={{ type: "success", message: "Message" }} />);

    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
  });

  it("applies correct CSS class based on type", () => {
    const { rerender } = render(
      <Flash flash={{ type: "success", message: "Success" }} />
    );

    expect(screen.getByRole("status")).toHaveClass("flash--success");

    rerender(<Flash flash={{ type: "danger", message: "Error" }} />);
    expect(screen.getByRole("status")).toHaveClass("flash--danger");

    rerender(<Flash flash={{ type: "warning", message: "Warning" }} />);
    expect(screen.getByRole("status")).toHaveClass("flash--warning");

    rerender(<Flash flash={{ type: "info", message: "Info" }} />);
    expect(screen.getByRole("status")).toHaveClass("flash--info");
  });

  it("renders with proper structure", () => {
    const { container } = render(
      <Flash flash={{ type: "success", message: "Test message" }} />
    );

    const div = container.querySelector(".flash");
    expect(div).toBeInTheDocument();
    expect(div?.textContent).toContain("Test message");
  });

  it("handles multiline messages", () => {
    render(
      <Flash flash={{ type: "info", message: "Line 1\nLine 2" }} />
    );

    const status = screen.getByRole("status");
    expect(status.textContent).toContain("Line 1");
    expect(status.textContent).toContain("Line 2");
  });
});

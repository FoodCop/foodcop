import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "../../../components/ui/ErrorBoundary";

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("renders error UI when child throws an error", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Oops! Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText(
        "We're sorry, but something unexpected happened. Our team has been notified."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /go home/i })
    ).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("calls onError callback when error occurs", () => {
    const onError = vi.fn();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Test error" }),
      expect.any(Object)
    );

    consoleSpy.mockRestore();
  });

  it("renders custom fallback when provided", () => {
    const customFallback = <div>Custom error message</div>;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
    expect(
      screen.queryByText("Oops! Something went wrong")
    ).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("has retry button that can be clicked", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error UI initially
    expect(screen.getByText("Oops! Something went wrong")).toBeInTheDocument();

    // Should have retry button
    const retryButton = screen.getByRole("button", { name: /try again/i });
    expect(retryButton).toBeInTheDocument();

    // Should be able to click the retry button (functionality tested in integration)
    fireEvent.click(retryButton);

    consoleSpy.mockRestore();
  });

  it("shows error details in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Error Details:")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });

  it("does not show error details in production mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText("Error Details:")).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });
});

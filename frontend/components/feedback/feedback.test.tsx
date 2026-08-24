import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookOpen } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import TaskEmptyState from "@/components/feedback/TaskEmptyState";

describe("shared feedback", () => {
  it("renders and invokes an optional retry action", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    render(<ErrorMessage message="Unable to load courses." onRetry={retry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to load courses.");
    await user.click(screen.getByRole("button", { name: "Try Again" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("renders an explanatory empty state", () => {
    render(<TaskEmptyState icon={BookOpen} title="No courses selected" description="Choose a course to continue." />);
    expect(screen.getByRole("heading", { name: "No courses selected" })).toBeInTheDocument();
    expect(screen.getByText("Choose a course to continue.")).toBeInTheDocument();
  });
});

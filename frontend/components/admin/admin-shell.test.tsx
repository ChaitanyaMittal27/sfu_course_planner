import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  pathname: "/admin/users",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.pathname,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a>,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { email: "admin@test.com" } }),
}));

import AdminSidebar from "@/components/admin/AdminSidebar";
import { healthServicePresentation } from "@/components/admin/health-services";
import AdminLayout from "@/app/admin/layout";

describe("admin shell", () => {
  beforeEach(() => {
    navigationMocks.pathname = "/admin/users";
  });

  it("renders the centralized navigation with the current route marked active", () => {
    render(<AdminSidebar />);

    expect(screen.getByRole("navigation", { name: "Admin navigation" })).toBeInTheDocument();
    expect(screen.getAllByText("Users")[0].closest("a")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("admin@test.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view course planner/i })).toHaveAttribute("href", "/");
  });

  it("opens and closes mobile navigation accessibly", async () => {
    const user = userEvent.setup();
    render(<AdminSidebar />);

    const toggle = screen.getByRole("button", { name: "Toggle admin navigation" });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("admin-mobile-navigation")).toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("admin-mobile-navigation")).not.toBeInTheDocument();
  });

  it("keeps the sidebar out of the unauthorized route while retaining it for admin routes", () => {
    const { rerender } = render(<AdminLayout><p>Unauthorized content</p></AdminLayout>);
    expect(screen.getAllByText("Course Planner")).not.toHaveLength(0);

    navigationMocks.pathname = "/admin/unauthorized";
    rerender(<AdminLayout><p>Unauthorized content</p></AdminLayout>);
    expect(screen.queryAllByText("Course Planner")).toHaveLength(0);
    expect(screen.getByText("Unauthorized content")).toBeInTheDocument();
  });

  it("uses friendly health labels and a safe fallback", () => {
    expect(healthServicePresentation("coursesys").label).toBe("CourseSys");
    expect(healthServicePresentation("custom-service").label).toBe("custom-service");
  });
});

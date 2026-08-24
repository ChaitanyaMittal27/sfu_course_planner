import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
  Geist: () => ({ variable: "--font-geist" }),
}));

afterEach(() => {
  cleanup();
});

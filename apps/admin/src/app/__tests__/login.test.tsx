import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import AdminLoginPage from "../login/page";

describe("AdminLoginPage", () => {
  it("renders login form", () => {
    render(<AdminLoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders branding elements", () => {
    render(<AdminLoginPage />);

    expect(screen.getByText("Bookstore Admin")).toBeInTheDocument();
    expect(screen.getByText(/sign in to access/i)).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "./page";
import * as authActions from "@/actions/auth";

// Mock the server action
vi.mock("@/actions/auth", () => ({
  registerUser: vi.fn(),
}));

describe("RegisterPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render registration form and authorized email notice banner", () => {
    render(<RegisterPage />);

    // Title and description
    expect(screen.getByRole("heading", { name: /register/i })).toBeInTheDocument();
    expect(screen.getByText(/Create your cleaner management account/i)).toBeInTheDocument();

    // Restricted Access Notice
    expect(
      screen.getByText(/Only authorized emails can register an account on this platform/i)
    ).toBeInTheDocument();

    // Input fields
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
  });

  it("should display validation errors when submitting invalid empty form", async () => {
    render(<RegisterPage />);

    const submitBtn = screen.getByRole("button", { name: /register/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    });

    expect(authActions.registerUser).not.toHaveBeenCalled();
  });

  it("should reject invalid email and weak password on blur or submit", async () => {
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(passwordInput, { target: { value: "weak" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "weak" } });

    fireEvent.blur(emailInput);
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(screen.getByText(/Please provide a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /register/i });
    fireEvent.click(submitBtn);

    expect(authActions.registerUser).not.toHaveBeenCalled();
  });

  it("should show mismatch error when passwords do not match", async () => {
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "SuperSecret#2026" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "Different#2026" } });

    fireEvent.blur(confirmPasswordInput);

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /register/i });
    fireEvent.click(submitBtn);

    expect(authActions.registerUser).not.toHaveBeenCalled();
  });

  it("should submit valid form and display server error when registration fails", async () => {
    vi.mocked(authActions.registerUser).mockResolvedValueOnce({
      success: false,
      error: "Registration restricted: This email is not authorized to register on this platform.",
    });

    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "unauthorized@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "SuperSecret#2026" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "SuperSecret#2026" } });

    const submitBtn = screen.getByRole("button", { name: /register/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authActions.registerUser).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText(/Registration restricted: This email is not authorized to register on this platform/i)
      ).toBeInTheDocument();
    });
  });
});

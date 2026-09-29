import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AppointmentActions from "./AppointmentActions";

vi.mock("@/actions/appointment", () => ({
  updateAppointmentStatus: vi.fn().mockResolvedValue({ success: true, message: "Status updated" }),
  updateAppointment: vi.fn().mockResolvedValue({ success: true, message: "Appointment updated" }),
}));

vi.mock("@/actions/invoice", () => ({
  createInvoiceForAppointment: vi.fn().mockResolvedValue({ success: true, message: "Invoice created" }),
}));

describe("AppointmentActions Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render SCHEDULED actions and open Edit modal into document.body", () => {
    render(
      <AppointmentActions
        appointmentId='apt-123'
        currentStatus='SCHEDULED'
        clientName='Jane Doe'
        initialDate='2026-10-15T10:00:00.000Z'
        initialPrice={150}
      />,
    );

    // Buttons for scheduled appointment
    expect(screen.getByRole("button", { name: /mark as completed/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();

    // Click Edit button
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Modal should be rendered in document.body
    expect(screen.getByRole("heading", { name: /edit scheduled cleaning/i })).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("150.00")).toBeInTheDocument();

    // Click Close modal button
    fireEvent.click(screen.getByRole("button", { name: /close modal/i }));

    // Modal should be closed
    expect(screen.queryByRole("heading", { name: /edit scheduled cleaning/i })).not.toBeInTheDocument();
  });

  it("should render COMPLETED actions in history tab and open Edit modal", () => {
    render(
      <AppointmentActions
        appointmentId='apt-456'
        currentStatus='COMPLETED'
        clientName='Bob Smith'
        initialDate='2026-09-01T14:00:00.000Z'
        initialPrice={200}
        hasInvoice={false}
      />,
    );

    // Completed actions
    expect(screen.getByRole("button", { name: /create invoice/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reopen/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();

    // Click Edit button
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Modal should open and be rendered via portal
    expect(screen.getByRole("heading", { name: /edit scheduled cleaning/i })).toBeInTheDocument();
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
    expect(screen.getByDisplayValue("200.00")).toBeInTheDocument();

    // Press Escape to close modal
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("heading", { name: /edit scheduled cleaning/i })).not.toBeInTheDocument();
  });

  it("should open Complete Cleaning modal when clicking Mark as Completed", () => {
    render(
      <AppointmentActions
        appointmentId='apt-789'
        currentStatus='SCHEDULED'
        clientName='Alice Green'
        initialDate='2026-10-16T09:00:00.000Z'
        initialPrice={100}
        clientPreferredPaymentMethod='CASH'
        clientHourlyRate={50}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /mark as completed/i }));

    expect(screen.getByRole("heading", { name: /complete cleaning/i })).toBeInTheDocument();
    expect(screen.getByText("Alice Green")).toBeInTheDocument();
    expect(screen.getByText(/cash payment/i)).toBeInTheDocument();

    // Close with Escape
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("heading", { name: /complete cleaning/i })).not.toBeInTheDocument();
  });
});

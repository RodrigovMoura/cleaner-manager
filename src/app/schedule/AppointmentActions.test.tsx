import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AppointmentActions from "./AppointmentActions";

import { cancelAppointment } from "@/actions/appointment";

vi.mock("@/actions/appointment", () => ({
  updateAppointmentStatus: vi.fn().mockResolvedValue({ success: true, message: "Status updated" }),
  updateAppointment: vi.fn().mockResolvedValue({ success: true, message: "Appointment updated" }),
  cancelAppointment: vi.fn().mockResolvedValue({ success: true, message: "Appointment cancelled" }),
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

  it("should render Cancel button with red background and open Cancel modal with date, time, and options", async () => {
    render(
      <AppointmentActions
        appointmentId='apt-cancel-1'
        currentStatus='SCHEDULED'
        clientName='Carlos Silva'
        initialDate='2026-10-20T14:30:00.000Z'
        initialPrice={160}
      />,
    );

    const cancelBtn = screen.getByRole("button", { name: /^cancel$/i });
    expect(cancelBtn).toBeInTheDocument();
    // Verify it has red background classes already (not only hover)
    expect(cancelBtn.className).toContain("bg-red-50");
    expect(cancelBtn.className).toContain("text-red-700");

    // Click Cancel to open modal
    fireEvent.click(cancelBtn);

    // Modal should be open
    expect(screen.getByRole("heading", { name: /cancel cleaning/i })).toBeInTheDocument();
    expect(screen.getByText("Carlos Silva")).toBeInTheDocument();

    // Verify date and time are displayed in the modal
    expect(screen.getByText(/scheduled date:/i)).toBeInTheDocument();
    expect(screen.getByText(/scheduled time:/i)).toBeInTheDocument();
    expect(screen.getByText(/\$160\.00 AUD/i)).toBeInTheDocument();

    // Verify cancellation options are displayed
    expect(screen.getByLabelText(/only this appointment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/all appointments for this client/i)).toBeInTheDocument();

    // Default option is "Only this appointment"
    expect(screen.getByLabelText(/only this appointment/i)).toBeChecked();

    // Click "Keep Appointment" to close without cancelling
    fireEvent.click(screen.getByRole("button", { name: /keep appointment/i }));
    expect(screen.queryByRole("heading", { name: /cancel cleaning/i })).not.toBeInTheDocument();
    expect(cancelAppointment).not.toHaveBeenCalled();
  });

  it("should cancel only current appointment when THIS_ONLY is selected", async () => {
    render(
      <AppointmentActions
        appointmentId='apt-cancel-2'
        currentStatus='SCHEDULED'
        clientName='Maria Santos'
        initialDate='2026-10-21T09:00:00.000Z'
        initialPrice={120}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(screen.getByRole("heading", { name: /cancel cleaning/i })).toBeInTheDocument();

    // Submit single appointment cancellation
    const confirmBtn = screen.getByRole("button", { name: /cancel appointment/i });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(cancelAppointment).toHaveBeenCalledWith("apt-cancel-2", "THIS_ONLY");
  });

  it("should cancel all appointments for client when ALL_FOR_CLIENT is selected", async () => {
    render(
      <AppointmentActions
        appointmentId='apt-cancel-3'
        currentStatus='SCHEDULED'
        clientName='Maria Santos'
        initialDate='2026-10-21T09:00:00.000Z'
        initialPrice={120}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    // Select "All appointments for this client"
    const allRadio = screen.getByLabelText(/all appointments for this client/i);
    fireEvent.click(allRadio);
    expect(allRadio).toBeChecked();

    // Button text updates to "Cancel All Appointments"
    const confirmAllBtn = screen.getByRole("button", { name: /cancel all appointments/i });
    await act(async () => {
      fireEvent.click(confirmAllBtn);
    });

    expect(cancelAppointment).toHaveBeenCalledWith("apt-cancel-3", "ALL_FOR_CLIENT");
  });

  it("should display error message if cancelAppointment returns failure", async () => {
    vi.mocked(cancelAppointment).mockResolvedValueOnce({
      success: false,
      message: "Database connection failed",
    });

    render(
      <AppointmentActions
        appointmentId='apt-cancel-err'
        currentStatus='SCHEDULED'
        clientName='David Brown'
        initialDate='2026-10-22T11:00:00.000Z'
        initialPrice={130}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /cancel appointment/i }));
    });

    expect(await screen.findByText("Database connection failed")).toBeInTheDocument();
  });

  it("should prompt user when other scheduled dates exist and allow cancelling only the chosen weekday/recurrence (SAME_RECURRENCE)", async () => {
    vi.mocked(cancelAppointment)
      .mockResolvedValueOnce({
        success: false,
        requiresConfirmation: true,
        weekdayName: "Friday",
        recurrenceLabel: "bi-weekly",
        otherWeekdays: ["Wednesday"],
        matchingCount: 4,
        otherCount: 4,
        totalCount: 8,
        message: "Other appointments exist on Wednesday.",
      })
      .mockResolvedValueOnce({
        success: true,
        message: "Successfully cancelled 4 Friday (bi-weekly) scheduled cleaning(s) for Maria Santos.",
        count: 4,
      });

    render(
      <AppointmentActions
        appointmentId='apt-fri-1'
        currentStatus='SCHEDULED'
        clientName='Maria Santos'
        initialDate='2026-10-23T09:00:00.000Z'
        initialPrice={120}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    // Select "All appointments for this client"
    fireEvent.click(screen.getByLabelText(/all appointments for this client/i));

    // Click "Cancel All Appointments" -> triggers conflict check
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /cancel all appointments/i }));
    });

    expect(cancelAppointment).toHaveBeenCalledWith("apt-fri-1", "ALL_FOR_CLIENT");

    // Modal should remain open and show the conflict confirmation options
    expect(screen.getByText(/other scheduled dates found/i)).toBeInTheDocument();
    const onlyFridayRadio = screen.getByLabelText(/only friday \(bi-weekly\) appointments \(4\)/i);
    const allWithoutExceptionRadio = screen.getByLabelText(/all appointments without exception \(8\)/i);

    expect(onlyFridayRadio).toBeChecked();
    expect(allWithoutExceptionRadio).not.toBeChecked();

    // Confirm cancelling only Friday appointments
    const confirmFridayBtn = screen.getByRole("button", { name: /cancel friday appointments/i });
    await act(async () => {
      fireEvent.click(confirmFridayBtn);
    });

    expect(cancelAppointment).toHaveBeenCalledWith("apt-fri-1", "SAME_RECURRENCE");
    expect(screen.queryByRole("heading", { name: /cancel cleaning/i })).not.toBeInTheDocument();
  });

  it("should allow selecting ALL_WITHOUT_EXCEPTION when prompted about other scheduled dates", async () => {
    vi.mocked(cancelAppointment)
      .mockResolvedValueOnce({
        success: false,
        requiresConfirmation: true,
        weekdayName: "Friday",
        recurrenceLabel: "bi-weekly",
        otherWeekdays: ["Wednesday"],
        matchingCount: 3,
        otherCount: 3,
        totalCount: 6,
        message: "Other appointments exist on Wednesday.",
      })
      .mockResolvedValueOnce({
        success: true,
        message: "Successfully cancelled all 6 scheduled cleanings for Maria Santos.",
        count: 6,
      });

    render(
      <AppointmentActions
        appointmentId='apt-fri-2'
        currentStatus='SCHEDULED'
        clientName='Maria Santos'
        initialDate='2026-10-23T09:00:00.000Z'
        initialPrice={120}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    fireEvent.click(screen.getByLabelText(/all appointments for this client/i));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /cancel all appointments/i }));
    });

    // Switch radio to "All appointments without exception (6)"
    const allWithoutExceptionRadio = screen.getByLabelText(/all appointments without exception \(6\)/i);
    fireEvent.click(allWithoutExceptionRadio);
    expect(allWithoutExceptionRadio).toBeChecked();

    const confirmAllBtn = screen.getByRole("button", { name: /cancel all without exception/i });
    await act(async () => {
      fireEvent.click(confirmAllBtn);
    });

    expect(cancelAppointment).toHaveBeenCalledWith("apt-fri-2", "ALL_WITHOUT_EXCEPTION");
    expect(screen.queryByRole("heading", { name: /cancel cleaning/i })).not.toBeInTheDocument();
  });
});

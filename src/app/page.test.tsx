import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "./page";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    appointment: {
      findMany: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
    },
  },
}));

// Mock AppointmentActions
vi.mock("./schedule/AppointmentActions", () => ({
  default: ({ appointmentId }: { appointmentId: string }) => (
    <div data-testid={`appointment-actions-${appointmentId}`}>MockAppointmentActions</div>
  ),
}));

describe("HomePage (Dashboard)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect to /login if user is not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);

    await HomePage();

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("should render dashboard with today's agenda, contact actions, and client notes", async () => {
    vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-123" });

    // Mock user
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      name: "Rodrigo Moura",
    } as never);

    // Mock today's appointment
    const todayDate = new Date();
    todayDate.setHours(10, 30, 0, 0);

    const mockTodayAppointment = {
      id: "apt-today-1",
      clientId: "client-1",
      date: todayDate,
      price: new Prisma.Decimal(150.0),
      status: "SCHEDULED" as const,
      reminderSentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      client: {
        id: "client-1",
        name: "Alice Johnson",
        phone: "0412 345 678",
        address: "123 Ocean Street, Bondi",
        notes: "Lockbox code is 9988. Please leave laundry basket outside.",
      },
    };

    // Mock Prisma queries in HomePage:
    // 2. todaysAppointments
    vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([mockTodayAppointment] as never);
    // 3. thisWeekAppointments
    vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([
      { price: new Prisma.Decimal(150.0), status: "SCHEDULED" },
    ] as never);
    // 4. upcomingAppointments
    vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([] as never);
    // 5. overdueInvoices
    vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([
      {
        id: "inv-overdue-1",
        invoiceNumber: "INV-2026-0001",
        amount: new Prisma.Decimal(120.0),
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        status: "OVERDUE",
        client: {
          id: "client-2",
          name: "Bob Dylan",
          phone: "0498 765 432",
        },
      },
    ] as never);
    // 6. pendingInvoices
    vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([] as never);
    // 7. monthlyPaidInvoices
    vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([
      { amount: new Prisma.Decimal(500.0) },
    ] as never);

    const jsx = await HomePage();
    render(jsx);

    // Verify Greeting with user first name
    expect(screen.getByText(/Rodrigo/i)).toBeInTheDocument();

    // Verify KPI Cards
    expect(screen.getByText("Today's Jobs")).toBeInTheDocument();
    expect(screen.getByText("This Week")).toBeInTheDocument();
    expect(screen.getByText("Earned this Month")).toBeInTheDocument();
    expect(screen.getAllByText("$500.00").length).toBeGreaterThanOrEqual(1);

    // Verify Today's Agenda section
    expect(screen.getByText("Today's Agenda")).toBeInTheDocument();
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText(/123 Ocean Street, Bondi/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open maps/i })).toHaveAttribute(
      "href",
      expect.stringContaining("123%20Ocean%20Street%2C%20Bondi"),
    );

    // Verify Client Notes are displayed
    expect(screen.getByText(/Lockbox code is 9988/i)).toBeInTheDocument();

    // Verify Contact Actions (Call, SMS, WhatsApp) for today's appointment
    const callLinks = screen.getAllByRole("link", { name: /call/i });
    expect(callLinks[0]).toHaveAttribute("href", "tel:0412345678");

    const smsLinks = screen.getAllByRole("link", { name: /sms/i });
    expect(smsLinks[0]).toHaveAttribute("href", "sms:0412345678");

    const waLinks = screen.getAllByRole("link", { name: /whatsapp/i });
    expect(waLinks[0]).toHaveAttribute("href", "https://wa.me/61412345678");

    // Verify Action button for appointment
    expect(screen.getByTestId("appointment-actions-apt-today-1")).toBeInTheDocument();

    // Verify Overdue Invoice Alert & Chase action
    expect(screen.getByText(/Action Required/i)).toBeInTheDocument();
    expect(screen.getByText("Bob Dylan")).toBeInTheDocument();
    expect(screen.getAllByText(/overdue/i).length).toBeGreaterThanOrEqual(1);
  });

  it("should display encouraging empty state when today has no jobs", async () => {
    vi.mocked(getSession).mockResolvedValueOnce({ userId: "user-123" });

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ name: "Carlos" } as never);
    // 2. todaysAppointments
    vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([] as never);
    // 3. thisWeekAppointments
    vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([] as never);
    // 4. upcomingAppointments (with next appointment tomorrow)
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    tomorrowDate.setHours(9, 0, 0, 0);

    vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([
      {
        id: "apt-next",
        date: tomorrowDate,
        price: new Prisma.Decimal(130),
        status: "SCHEDULED",
        client: { id: "c-1", name: "David Hasselhoff" },
      },
    ] as never);
    // 5. overdueInvoices
    vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([] as never);
    // 6. pendingInvoices
    vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([] as never);
    // 7. monthlyPaidInvoices
    vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([] as never);

    const jsx = await HomePage();
    render(jsx);

    expect(screen.getByText(/No cleanings scheduled for today/i)).toBeInTheDocument();
    expect(screen.getAllByText(/David Hasselhoff/i).length).toBeGreaterThanOrEqual(1);
  });
});

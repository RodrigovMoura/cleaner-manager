import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import SchedulePage from "./page";
import * as appointmentActions from "@/actions/appointment";
import { AppointmentStatus, Prisma } from "@prisma/client";

// Mock router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock appointment actions
vi.mock("@/actions/appointment", () => ({
  getAppointments: vi.fn(),
}));

// Mock AppointmentActions child component
vi.mock("./AppointmentActions", () => ({
  default: () => <div data-testid='appointment-actions'>Actions</div>,
}));

const generateAppointments = (count: number, status: AppointmentStatus = AppointmentStatus.SCHEDULED) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `apt-${i + 1}`,
    clientId: `client-${i + 1}`,
    date: new Date(2026, 9, 15, 9 + (i % 8), 0),
    price: new Prisma.Decimal(100 + i * 10),
    status,
    reminderSentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    client: {
      id: `client-${i + 1}`,
      userId: "user-1",
      name: `Customer ${i + 1}`,
      email: `customer${i + 1}@example.com`,
      phone: "0400000000",
      address: `${i + 1} Queen St`,
      notes: null,
      defaultPrice: null,
      enableAppointmentReminder: true,
      reminderDaysBefore: 1,
      enableInvoice: true,
      autoSendInvoice: false,
      enablePaymentReminder: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    invoice: null,
  }));
};

describe("SchedulePage Server Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should paginate upcoming appointments at most 8 items per page on page 1", async () => {
    const mockData = generateAppointments(18); // 18 items -> 3 pages (8, 8, 2)
    vi.mocked(appointmentActions.getAppointments).mockResolvedValueOnce(
      mockData as unknown as Awaited<ReturnType<typeof appointmentActions.getAppointments>>,
    );

    const jsx = await SchedulePage({
      searchParams: Promise.resolve({ tab: "upcoming", page: "1" }),
    });
    render(jsx);

    expect(appointmentActions.getAppointments).toHaveBeenCalledWith("upcoming");

    // Page 1 should only render Customer 1 to Customer 8
    expect(screen.getByText("Customer 1")).toBeInTheDocument();
    expect(screen.getByText("Customer 8")).toBeInTheDocument();
    expect(screen.queryByText("Customer 9")).not.toBeInTheDocument();

    // Summary should show 1 to 8 of 18
    expect(screen.getByText(/showing/i)).toHaveTextContent("Showing 1 to 8 of 18 cleanings");
  });

  it("should paginate upcoming appointments on page 2 showing items 9 to 16", async () => {
    const mockData = generateAppointments(18);
    vi.mocked(appointmentActions.getAppointments).mockResolvedValueOnce(
      mockData as unknown as Awaited<ReturnType<typeof appointmentActions.getAppointments>>,
    );

    const jsx = await SchedulePage({
      searchParams: Promise.resolve({ tab: "upcoming", page: "2" }),
    });
    render(jsx);

    expect(screen.queryByText("Customer 8")).not.toBeInTheDocument();
    expect(screen.getByText("Customer 9")).toBeInTheDocument();
    expect(screen.getByText("Customer 16")).toBeInTheDocument();
    expect(screen.queryByText("Customer 17")).not.toBeInTheDocument();

    expect(screen.getByText(/showing/i)).toHaveTextContent("Showing 9 to 16 of 18 cleanings");
  });

  it("should paginate history appointments with at most 8 items per page", async () => {
    const mockHistoryData = generateAppointments(10, AppointmentStatus.COMPLETED);
    vi.mocked(appointmentActions.getAppointments).mockResolvedValueOnce(
      mockHistoryData as unknown as Awaited<ReturnType<typeof appointmentActions.getAppointments>>,
    );

    const jsx = await SchedulePage({
      searchParams: Promise.resolve({ tab: "history", page: "1" }),
    });
    render(jsx);

    expect(appointmentActions.getAppointments).toHaveBeenCalledWith("history");
    expect(screen.getByText("Customer 1")).toBeInTheDocument();
    expect(screen.getByText("Customer 8")).toBeInTheDocument();
    expect(screen.queryByText("Customer 9")).not.toBeInTheDocument();

    expect(screen.getByText(/showing/i)).toHaveTextContent("Showing 1 to 8 of 10 cleanings");
  });

  it("should clamp invalid or out-of-range page numbers to the last available page", async () => {
    const mockData = generateAppointments(12); // 2 pages
    vi.mocked(appointmentActions.getAppointments).mockResolvedValueOnce(
      mockData as unknown as Awaited<ReturnType<typeof appointmentActions.getAppointments>>,
    );

    const jsx = await SchedulePage({
      searchParams: Promise.resolve({ tab: "upcoming", page: "999" }),
    });
    render(jsx);

    // Clamped to page 2 (showing 9 to 12 of 12)
    expect(screen.getByText(/showing/i)).toHaveTextContent("Showing 9 to 12 of 12 cleanings");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ScheduleView, { SerializedAppointment } from "./ScheduleView";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("./AppointmentActions", () => ({
  default: ({ appointmentId }: { appointmentId: string }) => (
    <div data-testid={`actions-${appointmentId}`}>MockActions</div>
  ),
}));

const createMockAppointments = (count: number, prefix = "apt"): SerializedAppointment[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i + 1}`,
    clientId: `client-${i + 1}`,
    date: new Date(2026, 9, 10 + i, 10, 0).toISOString(),
    price: 120.0,
    status: "SCHEDULED" as const,
    client: {
      id: `client-${i + 1}`,
      name: `Client ${i + 1}`,
      address: `${i + 1} Main St, Melbourne`,
    },
  }));
};

describe("ScheduleView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render upcoming cleanings with at most 8 items and pagination summary", () => {
    // 12 total items, page 1 receives only 8 items
    const page1Appointments = createMockAppointments(8, "upcoming");

    render(
      <ScheduleView
        appointments={page1Appointments}
        currentTab='upcoming'
        currentPage={1}
        totalItems={12}
        totalPages={2}
        pageSize={8}
      />,
    );

    // Verify Tab headers
    expect(screen.getByRole("tab", { name: /upcoming cleanings/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /history & past jobs/i })).toBeInTheDocument();

    // Verify 8 items are rendered
    expect(screen.getByText("Client 1")).toBeInTheDocument();
    expect(screen.getByText("Client 8")).toBeInTheDocument();
    expect(screen.queryByText("Client 9")).not.toBeInTheDocument();

    // Verify pagination summary
    const summary = screen.getByText(/showing/i);
    expect(summary).toHaveTextContent("Showing 1 to 8 of 12 cleanings");

    // Verify pagination controls
    const prevBtn = screen.getByRole("button", { name: /previous page/i });
    const nextBtn = screen.getByRole("button", { name: /next page/i });
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();

    // Verify page numbers
    expect(screen.getByRole("button", { name: "Page 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 2" })).toBeInTheDocument();
  });

  it("should navigate to page 2 when clicking Next or Page 2 button", () => {
    const page1Appointments = createMockAppointments(8, "upcoming");

    render(
      <ScheduleView
        appointments={page1Appointments}
        currentTab='upcoming'
        currentPage={1}
        totalItems={12}
        totalPages={2}
        pageSize={8}
      />,
    );

    const nextBtn = screen.getByRole("button", { name: /next page/i });
    fireEvent.click(nextBtn);

    expect(mockPush).toHaveBeenCalledWith("/schedule?tab=upcoming&page=2");
  });

  it("should navigate to page 1 when clicking Previous from page 2", () => {
    const page2Appointments = createMockAppointments(4, "upcoming-page2");

    render(
      <ScheduleView
        appointments={page2Appointments}
        currentTab='upcoming'
        currentPage={2}
        totalItems={12}
        totalPages={2}
        pageSize={8}
      />,
    );

    const prevBtn = screen.getByRole("button", { name: /previous page/i });
    expect(prevBtn).toBeEnabled();

    fireEvent.click(prevBtn);
    expect(mockPush).toHaveBeenCalledWith("/schedule?tab=upcoming&page=1");
  });

  it("should trigger navigation when switching to the History tab", () => {
    const page1Appointments = createMockAppointments(8, "upcoming");

    render(
      <ScheduleView
        appointments={page1Appointments}
        currentTab='upcoming'
        currentPage={1}
        totalItems={12}
        totalPages={2}
        pageSize={8}
      />,
    );

    const historyTab = screen.getByRole("tab", { name: /history & past jobs/i });
    fireEvent.click(historyTab);

    expect(mockPush).toHaveBeenCalledWith("/schedule?tab=history&page=1");
  });

  it("should trigger navigation when switching from History back to Upcoming tab", () => {
    const historyAppointments = createMockAppointments(5, "history");

    render(
      <ScheduleView
        appointments={historyAppointments}
        currentTab='history'
        currentPage={1}
        totalItems={5}
        totalPages={1}
        pageSize={8}
      />,
    );

    const upcomingTab = screen.getByRole("tab", { name: /upcoming cleanings/i });
    fireEvent.click(upcomingTab);

    expect(mockPush).toHaveBeenCalledWith("/schedule?tab=upcoming&page=1");
  });

  it("should display empty state for upcoming cleanings when none exist", () => {
    render(
      <ScheduleView
        appointments={[]}
        currentTab='upcoming'
        currentPage={1}
        totalItems={0}
        totalPages={1}
        pageSize={8}
      />,
    );

    expect(screen.getByText(/no upcoming cleanings scheduled/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /schedule cleaning/i })).toBeInTheDocument();
  });

  it("should display empty state for history when no past jobs exist", () => {
    render(
      <ScheduleView
        appointments={[]}
        currentTab='history'
        currentPage={1}
        totalItems={0}
        totalPages={1}
        pageSize={8}
      />,
    );

    expect(screen.getByText(/no past appointments found/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /schedule cleaning/i })).not.toBeInTheDocument();
  });

  it("should render at most 8 items when exactly 8 items are present on single page", () => {
    const eightAppointments = createMockAppointments(8, "eight");

    render(
      <ScheduleView
        appointments={eightAppointments}
        currentTab='upcoming'
        currentPage={1}
        totalItems={8}
        totalPages={1}
        pageSize={8}
      />,
    );

    const summary = screen.getByText(/showing/i);
    expect(summary).toHaveTextContent("Showing 1 to 8 of 8 cleanings");

    // When totalPages is 1, page navigation buttons (Next/Prev/numbers) are hidden
    expect(screen.queryByRole("button", { name: /next page/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /previous page/i })).not.toBeInTheDocument();
  });
});

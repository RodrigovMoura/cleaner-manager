import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CalendarView, { CalendarAppointment } from "./CalendarView";

describe("CalendarView", () => {
  it("displays SCHEDULED and COMPLETED appointments and excludes CANCELLED appointments", () => {
    const now = new Date();
    const todayIso = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      10,
      0,
      0,
    ).toISOString();

    const appointments: CalendarAppointment[] = [
      {
        id: "apt-scheduled",
        date: todayIso,
        price: 120,
        status: "SCHEDULED",
        clientId: "client-1",
        client: {
          id: "client-1",
          name: "Alice Johnson",
          phone: "0400000001",
          address: "10 King St",
          email: "alice@example.com",
        },
      },
      {
        id: "apt-completed",
        date: todayIso,
        price: 150,
        status: "COMPLETED",
        clientId: "client-2",
        client: {
          id: "client-2",
          name: "Bob Smith",
          phone: "0400000002",
          address: "20 Queen St",
          email: "bob@example.com",
        },
      },
      {
        id: "apt-cancelled",
        date: todayIso,
        price: 200,
        status: "CANCELLED",
        clientId: "client-3",
        client: {
          id: "client-3",
          name: "Charlie Cancelled",
          phone: "0400000003",
          address: "30 Prince St",
          email: "charlie@example.com",
        },
      },
    ];

    render(<CalendarView appointments={appointments} />);

    // Both SCHEDULED and COMPLETED clients should appear in the week view
    expect(screen.getByText("Alice J.")).toBeInTheDocument();
    expect(screen.getByText("Scheduled")).toBeInTheDocument();

    expect(screen.getByText("Bob S.")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();

    // CANCELLED client should NOT appear
    expect(screen.queryByText("Charlie C.")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancelled")).not.toBeInTheDocument();

    // Summary strip should count 2 cleanings (1 scheduled, 1 completed) and $270.00 AUD
    expect(screen.getByText("2 cleanings")).toBeInTheDocument();
    expect(screen.getByText("$270.00 AUD")).toBeInTheDocument();
    expect(screen.getByText("(1 scheduled, 1 completed)")).toBeInTheDocument();
  });
});

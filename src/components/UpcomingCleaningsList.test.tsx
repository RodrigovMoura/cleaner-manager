import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UpcomingCleaningsList, { UpcomingCleaningItem } from "./UpcomingCleaningsList";

describe("UpcomingCleaningsList", () => {
  const sampleItems: UpcomingCleaningItem[] = Array.from({ length: 14 }, (_, i) => ({
    id: `apt-${i + 1}`,
    date: new Date(2026, 8, 15 + i, 9, 0).toISOString(),
    price: 100 + i * 10,
    client: {
      id: `client-${i + 1}`,
      name: `Client Number ${i + 1}`,
      phone: "0400000000",
      address: `${i + 1} High St`,
    },
  }));

  it("should render empty state when no cleanings are passed", () => {
    render(<UpcomingCleaningsList appointments={[]} timeZone="Australia/Perth" />);
    expect(screen.getByText(/No further cleanings scheduled this week/i)).toBeInTheDocument();
  });

  it("should render exactly 6 items on page 1 and show pagination controls", () => {
    render(<UpcomingCleaningsList appointments={sampleItems} timeZone="Australia/Perth" pageSize={6} />);

    // Page 1 should contain items 1 to 6
    expect(screen.getByText("Client Number 1")).toBeInTheDocument();
    expect(screen.getByText("Client Number 6")).toBeInTheDocument();
    expect(screen.queryByText("Client Number 7")).not.toBeInTheDocument();

    // Pagination text: Page 1 of 3 (14 jobs)
    expect(screen.getByText(/Page/i)).toHaveTextContent("Page 1 of 3 (14 jobs)");
  });

  it("should advance to page 2 when clicking Next, and go back when clicking Prev", () => {
    render(<UpcomingCleaningsList appointments={sampleItems} timeZone="Australia/Perth" pageSize={6} />);

    const nextBtn = screen.getByRole("button", { name: /next/i });
    const prevBtn = screen.getByRole("button", { name: /prev/i });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Click Next -> Page 2
    fireEvent.click(nextBtn);

    expect(screen.queryByText("Client Number 1")).not.toBeInTheDocument();
    expect(screen.getByText("Client Number 7")).toBeInTheDocument();
    expect(screen.getByText("Client Number 12")).toBeInTheDocument();
    expect(screen.queryByText("Client Number 13")).not.toBeInTheDocument();
    expect(screen.getByText(/Page/i)).toHaveTextContent("Page 2 of 3 (14 jobs)");

    // Click Next -> Page 3 (remaining 2 items)
    fireEvent.click(nextBtn);
    expect(screen.getByText("Client Number 13")).toBeInTheDocument();
    expect(screen.getByText("Client Number 14")).toBeInTheDocument();
    expect(nextBtn).toBeDisabled();

    // Click Prev -> Back to Page 2
    fireEvent.click(prevBtn);
    expect(screen.getByText("Client Number 7")).toBeInTheDocument();
  });
});

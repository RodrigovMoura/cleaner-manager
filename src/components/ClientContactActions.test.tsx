import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClientContactActions, { formatPhoneForWhatsApp } from "./ClientContactActions";

describe("ClientContactActions Component", () => {
  it("should format Australian mobile numbers properly for WhatsApp", () => {
    expect(formatPhoneForWhatsApp("0412 345 678")).toBe("61412345678");
    expect(formatPhoneForWhatsApp("0400-111-222")).toBe("61400111222");
  });

  it("should preserve international numbers with country codes", () => {
    expect(formatPhoneForWhatsApp("+55 11 99999-8888")).toBe("5511999998888");
    expect(formatPhoneForWhatsApp("+61 412 345 678")).toBe("61412345678");
  });

  it("should render Call, SMS and WhatsApp action links with correct URLs", () => {
    render(<ClientContactActions phone='0412 345 678' clientName='Sarah Connor' />);

    const callLink = screen.getByRole("link", { name: /call/i });
    expect(callLink).toHaveAttribute("href", "tel:0412345678");

    const smsLink = screen.getByRole("link", { name: /sms/i });
    expect(smsLink).toHaveAttribute("href", "sms:0412345678");

    const waLink = screen.getByRole("link", { name: /whatsapp/i });
    expect(waLink).toHaveAttribute("href", "https://wa.me/61412345678");
    expect(waLink).toHaveAttribute("target", "_blank");
  });

  it("should render compact icons when compact prop is true", () => {
    render(<ClientContactActions phone='0412 345 678' clientName='Sarah' compact />);

    expect(screen.getByRole("link", { name: /call sarah/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /send sms to sarah/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open whatsapp with sarah/i })).toBeInTheDocument();
  });

  it("should return null if phone is empty or blank", () => {
    const { container } = render(<ClientContactActions phone='   ' />);
    expect(container.firstChild).toBeNull();
  });
});

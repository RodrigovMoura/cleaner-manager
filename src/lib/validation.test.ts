import { describe, it, expect } from "vitest";
import {
  sanitizeInput,
  validateName,
  validateEmail,
  validatePassword,
  isEmailAuthorized,
  validateRegistrationData,
} from "./validation";

describe("Validation & Security Library", () => {
  describe("sanitizeInput", () => {
    it("should trim surrounding whitespace", () => {
      expect(sanitizeInput("  hello world  ")).toBe("hello world");
    });

    it("should strip null bytes and dangerous control characters", () => {
      const malicious = "hello\0world\x1b[31m\x08test";
      expect(sanitizeInput(malicious)).toBe("helloworld[31mtest");
    });

    it("should return empty string for non-string inputs", () => {
      expect(sanitizeInput(null)).toBe("");
      expect(sanitizeInput(undefined)).toBe("");
      expect(sanitizeInput(123)).toBe("");
    });
  });

  describe("validateName", () => {
    it("should accept valid names", () => {
      expect(validateName("John Doe").isValid).toBe(true);
      expect(validateName("Maria Silva").isValid).toBe(true);
      expect(validateName("O'Connor").isValid).toBe(true);
      expect(validateName("Jean-Luc").isValid).toBe(true);
      expect(validateName("René Müller").isValid).toBe(true);
    });

    it("should reject empty or whitespace-only names", () => {
      expect(validateName("").isValid).toBe(false);
      expect(validateName("   ").isValid).toBe(false);
    });

    it("should reject names shorter than 2 characters", () => {
      const res = validateName("A");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("at least 2 characters");
    });

    it("should reject names longer than 70 characters", () => {
      const longName = "A".repeat(71);
      const res = validateName(longName);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("must not exceed 70 characters");
    });

    it("should reject script tags and HTML injection", () => {
      const xss1 = validateName("<script>alert('xss')</script>");
      expect(xss1.isValid).toBe(false);
      expect(xss1.error).toContain("cannot contain HTML or script code");

      const xss2 = validateName("John <img src=x onerror=alert(1)>");
      expect(xss2.isValid).toBe(false);

      const xss3 = validateName("javascript:alert(1)");
      expect(xss3.isValid).toBe(false);
    });

    it("should reject dangerous control characters and null bytes", () => {
      const res = validateName("John\0Doe");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("invalid or malicious characters");
    });
  });

  describe("validateEmail", () => {
    it("should accept valid email formats", () => {
      expect(validateEmail("user@example.com").isValid).toBe(true);
      expect(validateEmail("user.name+tag@sub.example.com.au").isValid).toBe(true);
      expect(validateEmail("cleaner123@business.io").isValid).toBe(true);
    });

    it("should reject empty or missing email", () => {
      expect(validateEmail("").isValid).toBe(false);
      expect(validateEmail("   ").isValid).toBe(false);
    });

    it("should reject malformed email formats", () => {
      expect(validateEmail("plainaddress").isValid).toBe(false);
      expect(validateEmail("@missinguser.com").isValid).toBe(false);
      expect(validateEmail("user@.com").isValid).toBe(false);
      expect(validateEmail("user@domain").isValid).toBe(false);
      expect(validateEmail("user..name@domain.com").isValid).toBe(false);
      expect(validateEmail("user@domain..com").isValid).toBe(false);
      expect(validateEmail("user@domain.c").isValid).toBe(false); // 1-letter TLD
    });

    it("should reject emails with HTML, script, or injection attempts", () => {
      expect(validateEmail("<script>alert(1)</script>@domain.com").isValid).toBe(false);
      expect(validateEmail("user@<script>alert(1)</script>.com").isValid).toBe(false);
      expect(validateEmail("user\0@domain.com").isValid).toBe(false);
    });

    it("should reject emails exceeding maximum length (254 chars)", () => {
      const longLocal = "a".repeat(250);
      const longEmail = `${longLocal}@example.com`;
      const res = validateEmail(longEmail);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("exceeds maximum allowed length");
    });
  });

  describe("validatePassword", () => {
    it("should accept strong passwords", () => {
      expect(validatePassword("SecureP@ssw0rd").isValid).toBe(true);
      expect(validatePassword("Valid#2026_Clean").isValid).toBe(true);
    });

    it("should reject passwords shorter than 8 characters", () => {
      const res = validatePassword("Sh0rt!");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("at least 8 characters");
    });

    it("should reject passwords longer than 128 characters (DoS protection)", () => {
      const longPassword = "Aa1!" + "x".repeat(130);
      const res = validatePassword(longPassword);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("must not exceed 128 characters");
    });

    it("should require uppercase, lowercase, number, and special character", () => {
      expect(validatePassword("lowercase123!").isValid).toBe(false); // Missing upper
      expect(validatePassword("UPPERCASE123!").isValid).toBe(false); // Missing lower
      expect(validatePassword("NoNumberSpecial!").isValid).toBe(false); // Missing number
      expect(validatePassword("NoSpecial12345").isValid).toBe(false); // Missing special
    });

    it("should reject passwords with control characters", () => {
      const res = validatePassword("Password123!\0");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("invalid control characters");
    });
  });

  describe("isEmailAuthorized", () => {
    it("should allow any email when allowlist is not configured or empty", () => {
      expect(isEmailAuthorized("test@example.com", undefined)).toBe(true);
      expect(isEmailAuthorized("test@example.com", "")).toBe(true);
      expect(isEmailAuthorized("test@example.com", "   ")).toBe(true);
    });

    it("should only allow emails in the allowlist", () => {
      const allowlist = "admin@cleaner.com, authorized@business.com, VIP@CLEAN.COM";

      expect(isEmailAuthorized("admin@cleaner.com", allowlist)).toBe(true);
      expect(isEmailAuthorized("AUTHORIZED@business.com", allowlist)).toBe(true);
      expect(isEmailAuthorized("vip@clean.com", allowlist)).toBe(true);
      expect(isEmailAuthorized("unauthorized@example.com", allowlist)).toBe(false);
      expect(isEmailAuthorized("hacker@malicious.com", allowlist)).toBe(false);
    });
  });

  describe("validateRegistrationData", () => {
    it("should succeed with valid registration data", () => {
      const result = validateRegistrationData({
        name: "Alice Smith",
        email: "alice@example.com",
        password: "SuperSecret#2026",
        confirmPassword: "SuperSecret#2026",
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should flag mismatching passwords", () => {
      const result = validateRegistrationData({
        name: "Alice Smith",
        email: "alice@example.com",
        password: "SuperSecret#2026",
        confirmPassword: "DifferentPassword#2026",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.confirmPassword).toBe("Passwords do not match.");
    });

    it("should return individual field errors for invalid inputs", () => {
      const result = validateRegistrationData({
        name: "<script>",
        email: "bad-email",
        password: "123",
        confirmPassword: "456",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeDefined();
      expect(result.errors.confirmPassword).toBeDefined();
    });
  });
});

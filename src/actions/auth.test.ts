import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registerUser } from "./auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { redirect } from "next/navigation";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  createSession: vi.fn(),
  destroySession: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

describe("registerUser server action", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should reject registration if fields are missing or invalid", async () => {
    const formData = new FormData();
    formData.append("name", "A"); // too short
    formData.append("email", "bad-email");
    formData.append("password", "123");

    const result = await registerUser(formData);

    expect(result?.success).toBe(false);
    expect(result?.error).toBeDefined();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("should reject registration if password confirmation does not match", async () => {
    const formData = new FormData();
    formData.append("name", "Valid User");
    formData.append("email", "valid@example.com");
    formData.append("password", "SuperSecret#2026");
    formData.append("confirmPassword", "Mismatch#2026");

    const result = await registerUser(formData);

    expect(result?.success).toBe(false);
    expect(result?.error).toBe("Passwords do not match.");
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("should reject registration if email is not in ALLOWED_REGISTRATION_EMAILS allowlist", async () => {
    process.env.ALLOWED_REGISTRATION_EMAILS = "authorized@cleaner.com, vip@cleaner.com";

    const formData = new FormData();
    formData.append("name", "Unauthorized User");
    formData.append("email", "unauthorized@example.com");
    formData.append("password", "SuperSecret#2026");

    const result = await registerUser(formData);

    expect(result?.success).toBe(false);
    expect(result?.error).toContain("This email is not authorized");
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("should reject registration if email already exists", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "user-1",
      name: "Existing User",
      email: "existing@example.com",
      password: "hashedpassword",
      createdAt: new Date(),
      updatedAt: new Date(),
      bankAccountName: null,
      bankBsb: null,
      bankAccountNo: null,
      payId: null,
    });

    const formData = new FormData();
    formData.append("name", "New User");
    formData.append("email", "existing@example.com");
    formData.append("password", "SuperSecret#2026");

    const result = await registerUser(formData);

    expect(result?.success).toBe(false);
    expect(result?.error).toContain("already exists");
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("should successfully register an authorized user and redirect", async () => {
    process.env.ALLOWED_REGISTRATION_EMAILS = "authorized@cleaner.com";

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(bcrypt.hash).mockResolvedValueOnce("hashed_password" as never);
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      id: "new-user-id",
      name: "Authorized User",
      email: "authorized@cleaner.com",
      password: "hashed_password",
      createdAt: new Date(),
      updatedAt: new Date(),
      bankAccountName: null,
      bankBsb: null,
      bankAccountNo: null,
      payId: null,
    });

    const formData = new FormData();
    formData.append("name", "Authorized User");
    formData.append("email", "authorized@cleaner.com");
    formData.append("password", "SuperSecret#2026");

    await registerUser(formData);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "authorized@cleaner.com" },
    });
    expect(bcrypt.hash).toHaveBeenCalledWith("SuperSecret#2026", 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: "Authorized User",
        email: "authorized@cleaner.com",
        password: "hashed_password",
      },
    });
    expect(createSession).toHaveBeenCalledWith("new-user-id");
    expect(redirect).toHaveBeenCalledWith("/");
  });
});

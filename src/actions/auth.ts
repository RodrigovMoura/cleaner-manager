"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { createSession, destroySession } from "@/lib/auth";
import {
  isEmailAuthorized,
  sanitizeInput,
  validateRegistrationData,
} from "@/lib/validation";

export type AuthActionResult = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function registerUser(formData: FormData): Promise<AuthActionResult | undefined> {
  const rawName = formData.get("name") as string;
  const rawEmail = formData.get("email") as string;
  const rawPassword = formData.get("password") as string;
  const rawConfirmPassword = formData.get("confirmPassword") as string | null;

  const validation = validateRegistrationData({
    name: rawName,
    email: rawEmail,
    password: rawPassword,
    ...(rawConfirmPassword !== null ? { confirmPassword: rawConfirmPassword } : {}),
  });

  if (!validation.isValid) {
    const firstError =
      validation.errors.name ||
      validation.errors.email ||
      validation.errors.password ||
      validation.errors.confirmPassword ||
      "Invalid registration data provided.";
    return {
      success: false,
      error: firstError,
      message: firstError,
    };
  }

  const name = sanitizeInput(rawName);
  const email = (rawEmail || "").trim().toLowerCase();
  const password = rawPassword;

  // 1. Email Allowlist Validation
  if (!isEmailAuthorized(email)) {
    return {
      success: false,
      error: "Registration restricted: This email is not authorized to register on this platform.",
      message: "Registration restricted: This email is not authorized to register on this platform.",
    };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "An account with this email already exists.",
        message: "An account with this email already exists.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    await createSession(user.id);
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "An unexpected error occurred during registration. Please try again.",
      message: "An unexpected error occurred during registration. Please try again.",
    };
  }

  redirect("/");
}

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { error: "Wrong credentials" };
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return { error: "Wrong credentials" };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logoutUser() {
  await destroySession();
  redirect("/login");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; email?: string };
  } catch (error) {
    console.error("Error verifying JWT:", error);
    return null;
  }
}

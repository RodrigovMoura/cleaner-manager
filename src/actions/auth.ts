"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { createSession, destroySession } from "@/lib/auth";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "Fill all fields." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "E-mail already exist." };
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
  redirect("/dashboard");
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
  redirect("/clients");
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

import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const jwtSecret = process.env.JWT_SECRET;
const JWT_SECRET = jwtSecret ? new TextEncoder().encode(jwtSecret) : null;

const PUBLIC_ROUTES = ["/login", "/register"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("auth_token")?.value;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  let isAuthenticated = false;

  if (token && JWT_SECRET) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated && !isPublicRoute && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL("/clients", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

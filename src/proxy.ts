import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "chave-secreta-padrao-mude-no-env");

const PUBLIC_ROUTES = ["/login", "/register"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("auth_token")?.value;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  let isAuthenticated = false;

  if (token) {
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

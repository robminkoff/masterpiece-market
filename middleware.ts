import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

const PUBLIC_ROUTES = new Set(["/", "/signin", "/signup"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let static assets through
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") // e.g. favicon.ico, images
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session (important — keeps tokens alive for both pages and API routes)
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase unreachable — treat as unauthenticated
  }

  // Skip redirect logic for API routes — they handle auth via 401 responses
  if (pathname.startsWith("/api")) {
    return response;
  }

  const isPublic = PUBLIC_ROUTES.has(pathname);

  // Authenticated users on signin/signup → redirect to catalog
  if (user && (pathname === "/signin" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/catalog";
    return NextResponse.redirect(url);
  }

  // Unauthenticated users on protected routes → redirect to signin
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

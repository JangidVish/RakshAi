import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Buyers may only enter /buyer/*
    if (path.startsWith("/buyer") && token?.role !== "BUYER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Vendors may only enter /vendor/*
    if (path.startsWith("/vendor") && token?.role !== "VENDOR") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Only run the middleware body when a valid token exists;
      // otherwise NextAuth redirects to the signIn page automatically.
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/buyer/:path*", "/vendor/:path*"],
};

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// Throttle credential checks to blunt brute-force / password spraying.
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function ipFromHeaders(headers?: Record<string, string>): string {
  if (!headers) return "unknown";
  const xff = headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0]!.trim();
  return headers["x-real-ip"]?.trim() || "unknown";
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate-limit per IP so credential stuffing is throttled regardless of
        // which email is targeted.
        const ip = ipFromHeaders(req?.headers as Record<string, string>);
        const limit = rateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
        if (!limit.allowed) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          vendorId: user.vendorId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.vendorId = (user as any).vendorId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).vendorId = token.vendorId;
      }
      return session;
    },
  },
};

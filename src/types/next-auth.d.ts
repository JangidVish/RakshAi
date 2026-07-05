import "next-auth";

declare module "next-auth" {
  interface User {
    role: "BUYER" | "VENDOR";
    vendorId?: string | null;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: "BUYER" | "VENDOR";
      vendorId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "BUYER" | "VENDOR";
    vendorId?: string | null;
  }
}

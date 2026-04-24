import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    role: "ADMIN" | "USER";
    adminRole?: "CORE_ADMIN" | "ADMIN" | null;
    adminActive?: boolean | null;
  }

  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      adminRole?: "CORE_ADMIN" | "ADMIN" | null;
      adminActive?: boolean | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "USER";
    adminRole?: "CORE_ADMIN" | "ADMIN" | null;
    adminActive?: boolean | null;
    email?: string | null;
    name?: string | null;
  }
}

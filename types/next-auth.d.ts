import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    kind?: string;
  }
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      kind: "user" | "admin";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    kind?: string;
    userId?: string;
  }
}
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/schemas";
import { md5 } from "@/lib/utils";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { identifier, password, role } = parsed.data;
        const hashed = md5(password);

        if (role === "ADMIN") {
          const admin = await prisma.admin.findFirst({
            where: {
              OR: [{ email: identifier }, { username: identifier }]
            }
          });

          if (!admin || admin.password !== hashed) return null;

          return {
            id: String(admin.adminId),
            name: admin.name,
            email: admin.email,
            role: "ADMIN",
            kind: "admin"
          };
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { username: identifier }]
          }
        });

        if (!user || user.password !== hashed) return null;

        return {
          id: String(user.userId),
          name: user.fullName,
          email: user.email,
          role: "USER",
          kind: "user"
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.kind = (user as { kind?: string }).kind;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as "USER" | "ADMIN") || "USER";
        session.user.kind = (token.kind as "user" | "admin") || "user";
        session.user.id = token.userId as string;
      }
      return session;
    }
  }
};

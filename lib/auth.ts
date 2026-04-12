import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/schemas";
import { md5 } from "@/lib/utils";

async function checkPassword(plain: string, stored: string) {
  if (stored.startsWith("$2")) {
    return bcrypt.compare(plain, stored);
  }

  return md5(plain) === stored;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
        intendedRole: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          throw new Error("Missing login fields");
        }

        const { identifier, password, intendedRole } = parsed.data;
        const normalizedIdentifier = identifier.trim();

        if (intendedRole === "admin") {
          const admin = await prisma.admin.findFirst({
            where: {
              OR: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
            },
          });

          if (!admin) {
            throw new Error("Invalid email/username or password");
          }

          const isValid = await checkPassword(password, admin.password);
          if (!isValid) {
            throw new Error("Invalid email/username or password");
          }

          return {
            id: String(admin.adminId),
            email: admin.email,
            name: admin.name,
            role: "ADMIN",
          };
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
          },
        });

        if (!user) {
          throw new Error("Invalid email/username or password");
        }

        const isValid = await checkPassword(password, user.password);
        if (!isValid) {
          throw new Error("Invalid email/username or password");
        }

        return {
          id: String(user.userId),
          email: user.email,
          name: user.name,
          role: "USER",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.role = token.role as "ADMIN" | "USER";
        session.user.email = token.email ?? session.user.email ?? "";
        session.user.name = token.name ?? session.user.name ?? "";
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

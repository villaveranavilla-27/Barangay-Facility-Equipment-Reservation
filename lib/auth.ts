import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
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

        if (intendedRole?.toLowerCase() === "admin") {
          const admin = await prisma.admin.findFirst({
            where: {
              isActive: true,
              OR: [
                { email: normalizedIdentifier },
                { username: normalizedIdentifier },
              ],
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
            adminRole: admin.role,
            adminActive: admin.isActive,
          };
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: normalizedIdentifier },
              { username: normalizedIdentifier },
            ],
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
          adminRole: null,
          adminActive: null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as typeof user & {
          adminRole?: "CORE_ADMIN" | "ADMIN" | null;
          adminActive?: boolean | null;
        };

        token.id = user.id;
        token.role = user.role ?? "USER";
        token.email = user.email ?? null;
        token.name = user.name ?? null;
        token.adminRole = authUser.adminRole ?? null;
        token.adminActive = authUser.adminActive ?? null;
      }

      if (token.role === "ADMIN" && token.id) {
        const admin = await prisma.admin.findUnique({
          where: { adminId: Number(token.id) },
          select: {
            adminId: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        });

        if (!admin || !admin.isActive) {
          token.adminRole = null;
          token.adminActive = false;
          return token;
        }

        token.email = admin.email;
        token.name = admin.name;
        token.adminRole = admin.role;
        token.adminActive = true;
      } else {
        token.adminRole = null;
        token.adminActive = null;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as "ADMIN" | "USER") ?? "USER";
        session.user.adminRole =
          (token.adminRole as "CORE_ADMIN" | "ADMIN" | null) ?? null;
        session.user.adminActive =
          typeof token.adminActive === "boolean" ? token.adminActive : null;
        session.user.email =
          (token.email as string) ?? session.user.email ?? "";
        session.user.name =
          (token.name as string) ?? session.user.name ?? "";
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

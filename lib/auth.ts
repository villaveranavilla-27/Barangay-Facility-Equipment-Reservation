import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getAppOrigin } from "@/lib/app-url";
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
            select: {
              adminId: true,
              email: true,
              name: true,
              role: true,
              isActive: true,
              username: true,
              password: true,
            },
          });

          if (!admin) {
            throw new Error("Invalid email/username or password");
          }

          const linkedUser = await prisma.user.findUnique({
            where: { username: admin.username },
            select: {
              email: true,
              name: true,
              password: true,
              isActive: true,
            },
          });

          if (linkedUser && !linkedUser.isActive) {
            throw new Error("This user account is inactive");
          }

          const isValid = await checkPassword(
            password,
            linkedUser?.password ?? admin.password
          );
          if (!isValid) {
            throw new Error("Invalid email/username or password");
          }

          return {
            id: String(admin.adminId),
            email: linkedUser?.email ?? admin.email,
            name: linkedUser?.name ?? admin.name,
            role: "ADMIN",
            adminRole: admin.role,
            adminActive: admin.isActive,
            userActive: null,
          };
        }

        const user = await prisma.user.findFirst({
          where: {
            isActive: true,
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
          userActive: user.isActive,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Prefer the active request origin first to avoid redirecting to a misconfigured external host.
      const appOrigin =
        (() => {
          try {
            return new URL(baseUrl).origin;
          } catch {
            return null;
          }
        })() ?? getAppOrigin(baseUrl) ?? baseUrl;

      if (url.startsWith("/")) {
        return new URL(url, `${appOrigin}/`).toString();
      }

      try {
        const targetUrl = new URL(url);

        if (targetUrl.origin === appOrigin) {
          return targetUrl.toString();
        }
      } catch {
        return appOrigin;
      }

      return appOrigin;
    },

    async jwt({ token, user }) {
      if (user) {
        const authUser = user as typeof user & {
          adminRole?: "CORE_ADMIN" | "ADMIN" | null;
          adminActive?: boolean | null;
          userActive?: boolean | null;
        };

        token.id = user.id;
        token.role = user.role ?? "USER";
        token.email = user.email ?? null;
        token.name = user.name ?? null;
        token.adminRole = authUser.adminRole ?? null;
        token.adminActive = authUser.adminActive ?? null;
        token.userActive = authUser.userActive ?? null;
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
            username: true,
          },
        });

        if (!admin || !admin.isActive) {
          token.adminRole = null;
          token.adminActive = false;
          token.userActive = null;
          return token;
        }

        const linkedUser = await prisma.user.findUnique({
          where: { username: admin.username },
          select: {
            email: true,
            name: true,
            isActive: true,
          },
        });

        if (linkedUser && !linkedUser.isActive) {
          token.adminRole = null;
          token.adminActive = false;
          token.userActive = null;
          return token;
        }

        token.email = linkedUser?.email ?? admin.email;
        token.name = linkedUser?.name ?? admin.name;
        token.adminRole = admin.role;
        token.adminActive = true;
        token.userActive = null;
      } else if (token.role === "USER" && token.id) {
        const currentUser = await prisma.user.findUnique({
          where: { userId: Number(token.id) },
          select: {
            email: true,
            name: true,
            isActive: true,
          },
        });

        if (!currentUser || !currentUser.isActive) {
          token.userActive = false;
          return token;
        }

        token.email = currentUser.email;
        token.name = currentUser.name;
        token.userActive = true;
        token.adminRole = null;
        token.adminActive = null;
      } else {
        token.adminRole = null;
        token.adminActive = null;
        token.userActive = null;
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
        session.user.userActive =
          typeof token.userActive === "boolean" ? token.userActive : null;
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

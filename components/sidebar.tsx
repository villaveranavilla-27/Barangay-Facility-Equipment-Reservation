"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  ClipboardPlus,
  FileBarChart2,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button, Modal } from "@/components/common";
import { cn } from "@/lib/utils";

type Role = "user" | "admin";

const items = {
  user: [
    { href: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/user/calendar", label: "Live Calendar", icon: CalendarDays },
    { href: "/user/facilities", label: "View Facility & Equipment", icon: Building2 },
    { href: "/user/reservations/new", label: "Make Reservation", icon: ClipboardPlus },
    { href: "/user/reservations", label: "Reservation Request", icon: ClipboardList },
    { href: "/user/profile", label: "Profile", icon: UserRound },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/reservations", label: "Reservations", icon: ClipboardList },
    { href: "/admin/calendar", label: "Live Calendar", icon: CalendarDays },
    {
      href: "/admin/facilities",
      label: "View Facility and Equipment",
      icon: Building2,
    },
    { href: "/admin/users", label: "Users Directory", icon: Users },
    { href: "/admin/reports", label: "Generated Report", icon: FileBarChart2 },
  ],
} as const;

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="app-shell__mobile-header fixed inset-x-0 top-0 z-[var(--z-sticky)] border-b border-white/10 text-white lg:hidden">
        <div className="flex h-full items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-bold tracking-[-0.02em]">Barangay GO</div>
            <div className="mt-1 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#f7d69b]">
              {role === "admin" ? "Admin Portal" : "Resident Portal"}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-white/10 bg-white/10 transition duration-200 hover:bg-white/15"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {navOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[var(--z-overlay)] bg-slate-950/40 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation overlay"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "app-shell__sidebar fixed inset-y-0 left-0 flex h-dvh w-[var(--sidebar-width)] max-w-[88vw] flex-col overflow-hidden border-r border-white/10 transition-transform duration-200 lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="border-b border-white/10 px-6 pb-5 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xl font-bold tracking-[-0.03em] text-white">Barangay GO</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#f7d69b]">
                {role === "admin" ? "Admin Portal" : "Resident Portal"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-white/10 bg-white/10 text-white transition duration-200 hover:bg-white/15 lg:hidden"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="scrollbar-subtle flex-1 space-y-2 overflow-y-auto px-4 py-5">
          {items[role].map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold leading-snug transition duration-200 sm:text-[0.95rem]",
                  active
                    ? "bg-white text-[#11233d] shadow-[0_12px_28px_rgba(15,23,42,0.14)]"
                    : "text-white/88 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition duration-200",
                    active ? "text-brand-600" : "text-white/72 group-hover:text-white"
                  )}
                />
                <span className="min-w-0">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 px-4 py-4">
          <Button
            variant="ghost"
            className="w-full justify-start border-white/10 bg-white/5 text-white hover:border-white/15 hover:bg-white/10 hover:text-white"
            onClick={() => setLogoutOpen(true)}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <Modal
        open={logoutOpen}
        title="Log out"
        onClose={() => setLogoutOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setLogoutOpen(false)}>
              Stay signed in
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                try {
                  const response = await fetch("/api/auth/logout", {
                    method: "POST",
                  });

                  if (!response.ok) {
                    const data = await response.json().catch(() => null);
                    throw new Error(data?.error || "Logout failed");
                  }

                  window.location.replace(role === "admin" ? "/admin-login" : "/login");
                } catch (error) {
                  const message = error instanceof Error ? error.message : "Logout failed";
                  toast.error(message);
                }
              }}
            >
              Confirm logout
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm leading-6 text-text-secondary">
          <p>
            You will be signed out immediately and your current session will be cleared from
            this device.
          </p>
          <p className="surface-note">
            Make sure any unfinished changes are saved before continuing.
          </p>
        </div>
      </Modal>
    </>
  );
}

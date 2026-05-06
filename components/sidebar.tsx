"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  FileBarChart2,
  LogOut,
  ClipboardPlus,
  UserRound,
  Building2,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button, Modal } from "@/components/common";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

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
  const [open, setOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  return (
    <>
      <div className="app-shell__mobile-header fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#165719] px-4 py-4 text-white shadow-soft lg:hidden">
        <div className="flex min-h-[var(--mobile-shell-header-height)] items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-bold">Barangay GO</div>
            <div className="text-xs font-semibold tracking-[0.18em] text-yellow-500/80">
              {role === "admin" ? "ADMIN PORTAL" : "USER PORTAL"}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 transition hover:bg-white/15"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {navOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          aria-label="Close navigation overlay"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "app-shell__sidebar fixed inset-y-0 left-0 z-50 flex h-dvh w-[var(--sidebar-width)] max-w-[85vw] flex-col overflow-hidden bg-[#165719] shadow-soft transition-transform duration-200 lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-6">
          <div className="text-center lg:w-full">
            <div className="text-lg font-bold text-white">Barangay GO</div>
            <div className="mt-1 text-sm font-semibold text-yellow-500/80">
              {role === "admin" ? "ADMIN PORTAL" : "USER PORTAL"}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setNavOpen(false)}
            className="app-shell__sidebar-close inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-6 py-5">
          {items[role].map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setNavOpen(false)}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium leading-snug transition sm:text-base lg:text-lg",
                  active ? "bg-brand-50 text-[#11233d] shadow-sm" : "text-white hover:bg-white/10"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 px-6 py-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-left text-white hover:bg-red-50"
            onClick={() => setOpen(true)}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <Modal
        open={open}
        title="Logout"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
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

                  window.location.replace(
                    role === "admin" ? "/admin-login" : "/login"
                  );
                } catch (error) {
                  const message =
                    error instanceof Error ? error.message : "Logout failed";
                  toast.error(message);
                }
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p>Are you sure you want to log out?</p>
      </Modal>
    </>
  );
}

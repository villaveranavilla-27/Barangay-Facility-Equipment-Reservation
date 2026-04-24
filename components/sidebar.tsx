"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
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
} from "lucide-react";
import { useState } from "react";
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
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <aside className="fixed flex h-screen w-72 flex-col bg-[#165719] shadow-soft">
      {/* HEADER */}
      <div className="border-b border-border px-6 py-6">
        <div className="text-center">
          <div className="text-lg font-bold text-white">Barangay GO</div>
          <div className="mt-1 text-sm font-semibold text-yellow-500/80">
            {role === "admin" ? "ADMIN PORTAL" : "USER PORTAL"}
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-6 py-5">
        {items[role].map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-lg font-medium transition",
                active
                  ? "bg-brand-50 text-gray"
                  : "text-white hover:bg-brand-30"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* LOGOUT (BOTTOM) */}
      <div className="mt-auto border-t border-border px-6 py-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-left text-white hover:bg-red-50"
          onClick={() => setOpen(true)}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* MODAL */}
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
                await signOut({
                  callbackUrl: role === "admin" ? "/admin-login" : "/login",
                });
                router.refresh();
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p>Are you sure you want to log out?</p>
      </Modal>
    </aside>
  );
}
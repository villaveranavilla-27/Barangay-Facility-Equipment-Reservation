"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, CalendarDays, Users, Boxes, ClipboardList, FileBarChart2, LogOut, ClipboardPlus, UserRound, Building2} from "lucide-react";
import { useState } from "react";
import { Button, Modal } from "@/components/common";
import { cn } from "@/lib/utils";

type Role = "user" | "admin";

const items = {
  user: [
    { href: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/user/facilities", label: "View Facility & Equipment", icon: Building2 },
    { href: "/user/reservations/new", label: "Make Reservation", icon: ClipboardPlus },
    { href: "/user/reservations", label: "My Requests", icon: ClipboardList },
    { href: "/user/calendar", label: "Live Calendar", icon: CalendarDays },
    { href: "/user/profile", label: "Profile", icon: UserRound }
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/reservations", label: "Reservations", icon: ClipboardList },
    { href: "/admin/facilities", label: "Facilities", icon: Building2 },
    { href: "/admin/equipment", label: "Equipment", icon: Boxes },
    { href: "/admin/calendar", label: "Live Calendar", icon: CalendarDays },
    { href: "/admin/users", label: "Users Directory", icon: Users },
    { href: "/admin/reports", label: "Reports & Analytics", icon: FileBarChart2 }
  ]
} as const;

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

 return (
  <aside className="flex h-screen w-72 flex-col bg-[#165719] shadow-soft">
    
    <div className="border-b border-border px-6 py-6">
      <div className="text-center">
        
        <div className="font-bold text-white text-lg">
          Barangay GO
        </div>

        <div className="mt-1 font-semibold text-yellow-500/80 text-sm">
          {role === "admin" ? "ADMIN PORTAL" : "USER PORTAL"}
        </div>

      </div>
    </div>



      

      <nav className="flex-1 space-y-1 px-4 py-5">
        {items[role].map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                active ? "bg-brand-50 !text-gray" : "!text-white hover:bg-brand-30"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <Button variant="ghost" className="w-full justify-start text-left text-danger hover:bg-red-50" onClick={() => setOpen(true)}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      <Modal
        open={open}
        title="Logout"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={async () => {
                await signOut({ callbackUrl: role === "admin" ? "/admin-login" : "/login" });
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

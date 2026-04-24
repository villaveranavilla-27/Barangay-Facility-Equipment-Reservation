"use client";

import type { ChangeEventHandler } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SearchIcon,
  Chair01Icon,
  Mic01Icon,
  Speaker01Icon,
  Projector01Icon,
  TentIcon,
  Table02Icon,
  BasketballHoopIcon,
  HousePlusIcon,
  PackageIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export type CatalogType = "facility" | "equipment" | "FACILITY" | "EQUIPMENT";
type CatalogIcon = typeof SearchIcon;

function normalizeCatalogType(type?: CatalogType) {
  return String(type).toUpperCase() === "EQUIPMENT" ? "EQUIPMENT" : "FACILITY";
}

export function getCatalogItemIcon(
  itemName: string,
  type?: CatalogType
): CatalogIcon {
  const name = itemName.toLowerCase();

  if (name.includes("chair")) {
    return Chair01Icon;
  }

  if (name.includes("microphone") || name.includes("mic")) {
    return Mic01Icon;
  }

  if (name.includes("speaker") || name.includes("sound")) {
    return Speaker01Icon;
  }

  if (name.includes("projector")) {
    return Projector01Icon;
  }

  if (name.includes("table")) {
    return Table02Icon;
  }

  if (name.includes("tent")) {
    return TentIcon;
  }

  if (name.includes("barangay hall")) {
    return HousePlusIcon;
  }

  if (name.includes("barangay covered court complex")) {
    return BasketballHoopIcon;
  }

  return normalizeCatalogType(type) === "FACILITY" ? HousePlusIcon : PackageIcon;
}

export function CatalogItemIcon({
  itemName,
  type,
  size = 32,
  className,
  iconClassName,
}: {
  itemName: string;
  type?: CatalogType;
  size?: number;
  className?: string;
  iconClassName?: string;
}) {
  const icon = getCatalogItemIcon(itemName, type);

  return (
    <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center", className)}>
      <HugeiconsIcon
        icon={icon}
        size={size}
        className={cn("text-green-700", iconClassName)}
      />
    </div>
  );
}

export function CatalogSearchField({
  value,
  onChange,
  placeholder = "Search by name or description...",
}: {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
}) {
  return (
    <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center">
          <HugeiconsIcon
            icon={SearchIcon}
            size={20}
            className="text-gray-400"
          />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          className="h-14 w-full rounded-[20px] border border-gray-200 bg-white pl-14 pr-4 text-base text-gray-700 outline-none"
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

export function CatalogTabButton({
  label,
  active,
  onClick,
  icon,
  minWidthClassName = "min-w-[220px]",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: CatalogIcon;
  minWidthClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-[18px] px-6 py-3 text-lg font-semibold transition",
        minWidthClassName,
        active ? "bg-green-700 text-white" : "text-gray-800 hover:bg-gray-50"
      )}
    >
      {icon ? <HugeiconsIcon icon={icon} size={20} /> : null}
      {label}
    </button>
  );
}

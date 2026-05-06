"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Card({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("rounded-2xl bg-white p-4 shadow-soft sm:p-6", className)}>
      {children}
    </div>
  );
}

export function Button({
  className,
  variant = "primary",
  children,
  href,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  href?: string;
}) {
  const base =
    "inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium leading-5 transition disabled:pointer-events-none disabled:opacity-50 sm:text-base";

  const styles: Record<Variant, string> = {
    primary: "bg-[#165719] text-white hover:bg-[#134d15]",
    secondary: "bg-[#e9f3ea] text-[#165719] hover:bg-[#d8eadb]",
    ghost: "bg-transparent text-[#165719] hover:bg-[#e9f3ea]",
    danger: "bg-red-600 text-white hover:opacity-90",
  };

  const classes = cn(base, styles[variant], className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "min-h-11 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[#165719] sm:text-base",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "min-h-11 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[#165719] sm:text-base",
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-border bg-white px-3 py-2 outline-none transition focus:ring-2 focus:ring-[#165719]",
        props.className
      )}
    />
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: React.PropsWithChildren<{
  tone?: "neutral" | "yellow" | "green" | "red" | "blue";
  className?: string;
}>) {
  const tones: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-700",
    yellow: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={cn("rounded-full px-3 py-1 text-xs font-semibold", tones[tone], className)}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <Card>
      <div className="text-sm text-text-secondary">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-text-primary">{value}</div>
      {subtext ? <div className="mt-1 text-sm text-text-secondary">{subtext}</div> : null}
    </Card>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 pt-8 sm:items-center sm:pt-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#e9f3ea]"
            aria-label="Close modal"
          >
            x
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-4 py-5 sm:px-6">{children}</div>

        {footer ? (
          <div className="flex flex-col-reverse items-stretch justify-end gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card className="text-center">
      <div className="text-lg font-semibold">{title}</div>
      {description ? <p className="mt-2 text-sm text-text-secondary">{description}</p> : null}
    </Card>
  );
}

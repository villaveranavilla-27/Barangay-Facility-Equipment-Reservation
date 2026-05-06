"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Card({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[var(--radius-lg)] border border-border bg-white/95 p-4 shadow-soft backdrop-blur sm:p-6",
        className
      )}
    >
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
    "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-sm)] border px-4 py-2.5 text-[0.95rem] font-semibold leading-5 transition duration-200 ease-out disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

  const styles: Record<Variant, string> = {
    primary:
      "border-brand-500 bg-brand-500 text-white shadow-[0_12px_24px_rgba(31,106,58,0.18)] hover:border-brand-600 hover:bg-brand-600 active:translate-y-px",
    secondary:
      "border-border bg-brand-50 text-brand-600 hover:border-brand-500/30 hover:bg-[#dcecdf] active:translate-y-px",
    ghost:
      "border-transparent bg-transparent text-text-primary hover:bg-slate-900/5 active:translate-y-px",
    danger:
      "border-danger bg-danger text-white shadow-[0_12px_24px_rgba(194,65,45,0.18)] hover:bg-[#a73624] hover:border-[#a73624] active:translate-y-px",
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
        "min-h-12 w-full rounded-[var(--radius-sm)] border border-border bg-white px-4 py-3 text-base text-text-primary shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] outline-none transition duration-200 placeholder:text-text-secondary/70 hover:border-[#b8c8bc] focus:border-brand-500 focus:ring-4 focus:ring-[var(--focus-ring)]",
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
        "min-h-12 w-full rounded-[var(--radius-sm)] border border-border bg-white px-4 py-3 text-base text-text-primary shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] outline-none transition duration-200 hover:border-[#b8c8bc] focus:border-brand-500 focus:ring-4 focus:ring-[var(--focus-ring)]",
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
        "min-h-[120px] w-full rounded-[var(--radius-sm)] border border-border bg-white px-4 py-3 text-base text-text-primary shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] outline-none transition duration-200 placeholder:text-text-secondary/70 hover:border-[#b8c8bc] focus:border-brand-500 focus:ring-4 focus:ring-[var(--focus-ring)]",
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
    neutral: "border-slate-200 bg-slate-100 text-slate-700",
    yellow: "border-[rgba(183,121,31,0.16)] bg-[var(--warning-soft)] text-[var(--warning)]",
    green: "border-[rgba(31,139,76,0.16)] bg-[var(--success-soft)] text-[var(--success)]",
    red: "border-[rgba(194,65,45,0.16)] bg-[var(--danger-soft)] text-[var(--danger)]",
    blue: "border-[rgba(31,91,143,0.16)] bg-[var(--info-soft)] text-[var(--info)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.02em]",
        tones[tone],
        className
      )}
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
    <Card className="h-full">
      <div className="flex h-full flex-col gap-3">
        <div className="text-sm font-medium uppercase tracking-[0.08em] text-text-secondary">
          {label}
        </div>
        <div className="text-3xl font-bold tracking-[-0.04em] text-text-primary">{value}</div>
        {subtext ? <div className="text-sm text-text-secondary">{subtext}</div> : null}
      </div>
    </Card>
  );
}

export function Skeleton({
  className,
}: {
  className?: string;
}) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
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
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 z-[var(--z-overlay)] bg-slate-950/55 backdrop-blur-sm"
        aria-label="Close modal backdrop"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-[61] flex max-h-[min(92dvh,880px)] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-white shadow-[0_26px_80px_rgba(15,23,42,0.24)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold tracking-[-0.03em] text-text-primary">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-transparent text-text-secondary transition duration-200 hover:border-border hover:bg-slate-900/5 hover:text-text-primary"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer ? (
          <div className="flex flex-col-reverse gap-3 border-t border-border bg-[var(--surface-muted)] px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
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
      <div className="flex flex-col items-center gap-3 py-3">
        <div className="text-xl font-semibold tracking-[-0.03em] text-text-primary">{title}</div>
        {description ? (
          <p className="max-w-xl text-sm leading-6 text-text-secondary">{description}</p>
        ) : null}
      </div>
    </Card>
  );
}

import crypto from "crypto";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function md5(value: string) {
  return crypto.createHash("md5").update(value).digest("hex");
}

export function money(value: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);
}

export function fmtDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function fmtDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium"
  }).format(new Date(value));
}

export function durationHours(start: Date, end: Date) {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)));
}

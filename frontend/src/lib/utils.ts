import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return currencyFormatter.format(value || 0);
}

export function serializeFilters(filters: Record<string, string[] | number[] | string | number | undefined>) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length) {
        params.set(key, value.join(","));
      }
      return;
    }

    if (value) {
      params.set(key, String(value));
    }
  });

  return params.toString();
}
import { headers } from "next/headers";
import type { PricingCurrency } from "@/app/components/marketing/CandidatePricingPlans";

const EU_EUR = new Set([
  "AT","BE","CY","EE","FI","FR","DE","GR","IE","IT","LV","LT","LU","MT",
  "NL","PT","SK","SI","ES","BG","HR","CZ","DK","HU","PL","RO","SE",
]);

/** The currency to show a visitor, from Vercel's country header. */
export async function detectCurrency(): Promise<PricingCurrency> {
  const h = await headers();
  const country = h.get("x-vercel-ip-country") ?? "GB";
  if (country === "US" || country === "CA") return "USD";
  if (EU_EUR.has(country)) return "EUR";
  return "GBP";
}

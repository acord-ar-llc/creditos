import { createContext, useContext } from "react";

// CountryConfig mirrors the backend GET /config response. It drives currency,
// locale and identity-document labels/validation for the deployment country.
export interface CountryConfig {
  country: string; // "AR" | "CO"
  currency: string; // "ARS" | "COP"
  locale: string; // "es-AR" | "es-CO"
  nationalIdLabel: string; // "DNI" | "Cédula"
  taxIdLabel: string; // "CUIT" | "NIT"
  ivaRate: number;
}

export const DEFAULT_CONFIG: CountryConfig = {
  country: "AR",
  currency: "ARS",
  locale: "es-AR",
  nationalIdLabel: "DNI",
  taxIdLabel: "CUIT",
  ivaRate: 21,
};

// Module-level singleton so non-React helpers (formatMoney) and inline
// formatters can read the resolved config synchronously after bootstrap.
let current: CountryConfig = DEFAULT_CONFIG;

export const setCountryConfig = (c: CountryConfig) => {
  current = c;
};

export const getCountryConfig = (): CountryConfig => current;

// formatMoney formats an amount using the deployment currency and locale.
export const formatMoney = (
  amount: number | string,
  opts?: Intl.NumberFormatOptions
): string => {
  const n = typeof amount === "string" ? parseFloat(amount) || 0 : amount;
  return new Intl.NumberFormat(current.locale, {
    style: "currency",
    currency: current.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(n);
};

// countryNameFor maps a country code to the address country name used in forms.
export const countryNameFor = (code: string): string =>
  code === "CO" ? "Colombia" : "Argentina";

// React context for components that want reactive access to the config.
const CountryConfigContext = createContext<CountryConfig>(DEFAULT_CONFIG);
export const CountryConfigProvider = CountryConfigContext.Provider;
export const useCountryConfig = (): CountryConfig => useContext(CountryConfigContext);

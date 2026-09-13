export const COMPANY_CONFIG = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || "Ana's Cleaning Touch",
  subtitle: "Residential Cleaning Services",
} as const;

export const COMPANY_NAME = COMPANY_CONFIG.name;
export const COMPANY_SUBTITLE = COMPANY_CONFIG.subtitle;

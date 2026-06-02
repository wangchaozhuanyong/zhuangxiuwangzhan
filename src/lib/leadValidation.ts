export const LEAD_PHONE_PATTERN = /^(?=.{7,20}$)[+]?\d[\d\s-]*$/;
export const LEAD_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidLeadPhone = (value: string) =>
  LEAD_PHONE_PATTERN.test(value.trim());

export const isValidLeadEmail = (value: string) =>
  LEAD_EMAIL_PATTERN.test(value.trim());

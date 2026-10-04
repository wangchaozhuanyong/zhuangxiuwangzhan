export const LEAD_PHONE_PATTERN = /^(?=.{7,20}$)[+]?\d[\d\s-]*$/;
export const LEAD_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidLeadPhone = (value: string) =>
  LEAD_PHONE_PATTERN.test(value.trim());

export const isValidLeadEmail = (value: string) =>
  LEAD_EMAIL_PATTERN.test(value.trim());

export const localizeLeadFormErrors = <MessageKey extends string>(
  errors: Partial<Record<string, MessageKey>>,
  messages: Record<MessageKey, string>,
): Partial<Record<string, string>> => {
  const localized: Partial<Record<string, string>> = {};
  for (const [field, key] of Object.entries(errors)) {
    if (key !== undefined) localized[field] = messages[key];
  }
  return localized;
};

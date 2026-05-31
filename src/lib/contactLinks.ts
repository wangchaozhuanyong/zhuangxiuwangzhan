const cleanPhone = (phone?: string | null) => String(phone || "").trim();

export const whatsappHrefFromPhone = (phone?: string | null) => {
  const digits = cleanPhone(phone).replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : "";
};

export const telHrefFromPhone = (phone?: string | null) => {
  const value = cleanPhone(phone).replace(/[^\d+]/g, "");
  return value ? `tel:${value}` : "";
};

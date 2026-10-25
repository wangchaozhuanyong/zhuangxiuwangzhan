export const isSafeContentUrl = (value: string, image = false) => {
  if (!value.trim()) return false;
  try {
    // The DOM has decoded entities. The browser URL parser also removes tabs
    // and newlines before deciding the scheme, unlike a string prefix check.
    const protocol = new URL(value, "https://cms-content.invalid/").protocol;
    return protocol === "https:" || protocol === "http:"
      || (!image && (protocol === "mailto:" || protocol === "tel:"));
  } catch {
    return false;
  }
};

import { cloneElement, type ReactElement } from "react";
import { useAdminLang, type AdminLang } from "@/lib/adminPreferences";

/** Router elements are cached. Re-render the same page instance when language changes. */
export default function AdminLanguagePage({ children }: { children: ReactElement<{ adminLanguage?: AdminLang }> }) {
  const adminLanguage = useAdminLang();
  return cloneElement(children, { adminLanguage });
}

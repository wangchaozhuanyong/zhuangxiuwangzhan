import { Button } from "@/components/ui/button";
import { adminMobileText } from "@/i18n/adminMobileText";
import { getAdminLang } from "@/lib/adminLocale";

export default function AdminFilterSummary({ filters, onClear }: { filters: string[]; onClear: () => void }) {
  const text = adminMobileText[getAdminLang()];
  if (filters.length === 0) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" aria-label={text.activeFilters}>
      <span className="min-w-0 break-words text-muted-foreground" role="status">{filters.join(" · ")}</span>
      <Button type="button" variant="link" className="min-h-11 shrink-0 px-0" onClick={onClear}>{text.clearFilters}</Button>
    </div>
  );
}

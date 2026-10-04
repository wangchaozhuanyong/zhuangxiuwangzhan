import { useQueryClient } from "@tanstack/react-query";
import { useAdminSimpleCmsRows } from "@/lib/adminCmsQueries";
import { saveAdminRecord } from "@/lib/adminMutation";
import { getAdminLang } from "@/lib/adminLocale";
import { isOptionalHomeSectionEnabled, type OptionalHomeSection } from "@/lib/homeOptionalSections";
import { adminContentSyncText } from "@/i18n/adminContentSyncText";
import { formatUserFacingError } from "@/lib/userFacingText";
import { useSubmissionLock } from "@/hooks/useSubmissionLock";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import AdminAlert from "@/components/admin/AdminAlert";

export default function AdminHomeSectionVisibility({ sectionKey }: { sectionKey: OptionalHomeSection }) {
  const language = getAdminLang();
  const t = adminContentSyncText[language];
  const queryClient = useQueryClient();
  const query = useAdminSimpleCmsRows("home_sections");
  const row = query.data?.find((row) => row.section_key === sectionKey);
  const { protectSubmission, isSubmitting } = useSubmissionLock();
  useUnsavedChangesWarning(isSubmitting);
  const enabled = isOptionalHomeSectionEnabled(sectionKey, row);
  const id = `home-${sectionKey}-visibility`;
  const update = protectSubmission("visibility", async (next: boolean) => {
    try {
      await saveAdminRecord({
        table: "home_sections", id: row?.id as string | undefined,
        expectedUpdatedAt: row?.updated_at as string | undefined,
        payload: { section_key: sectionKey, status: next ? "published" : "draft", items_zh: [{ enabled: next }], items_en: [{ enabled: next }] },
        queryClient,
      });
      toast({ title: t.saved });
    } catch (error) {
      toast({ title: t.failed, description: formatUserFacingError(error, language), variant: "destructive" });
    }
  });
  return (
    <section className="mb-6 rounded-xl border border-border bg-card p-4 sm:p-6" aria-busy={query.isFetching || isSubmitting}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><label htmlFor={id} className="font-semibold">{t[sectionKey]} · {t.toggle}</label><p className="mt-1 text-sm text-muted-foreground" aria-live="polite">{isSubmitting ? t.saving : enabled ? t.enabled : t.disabled}</p></div>
        <Switch id={id} language={language} checked={enabled} disabled={!query.data || query.isFetching || isSubmitting} onCheckedChange={(next) => void update(next)} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{t.placement}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t.noContent}</p>
      {query.error && <AdminAlert tone="error">{formatUserFacingError(query.error, language)} <Button variant="outline" onClick={() => void query.refetch()}>{t.retry}</Button></AdminAlert>}
    </section>
  );
}

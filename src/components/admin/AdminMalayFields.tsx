import { useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AdminActionButton } from "@/components/admin/AdminPermission";
import AdminFormSection from "@/components/admin/AdminFormSection";
import { adminMalayText } from "@/i18n/adminMalayText";
import { useAdminLang } from "@/lib/adminPreferences";
import { generateAdminEnglishContent, translationDeliveryNotice, translationEnabledTables } from "@/lib/adminTranslation";
import { invalidateAdminResource } from "@/lib/adminInvalidate";
import { useSubmissionLock } from "@/hooks/useSubmissionLock";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { formatUserFacingError } from "@/lib/userFacingText";

type Value = unknown;
const stableField = /^(?:id|slug|path|href|url|src|icon|image|image_url|button_url|link|type|step)$/;

function ValueEditor({ label, value, reference, onChange }: { label: string; value: Value; reference: Value; onChange: (value: Value) => void }) {
  const id = useId();
  const text = adminMalayText[useAdminLang()];
  if (Array.isArray(reference)) {
    const items = Array.isArray(value) ? value : [];
    const example = reference[0] ?? "";
    const blank = (sample: Value): Value => typeof sample === "string" ? "" : sample && typeof sample === "object"
      ? Object.fromEntries(Object.entries(sample).map(([key, child]) => [key, stableField.test(key) ? child : blank(child)])) : "";
    return <fieldset className="space-y-3 rounded-lg border p-4"><legend className="px-1 text-sm font-medium">{label}</legend>
      {items.map((item, index) => <div key={index} className="space-y-2 rounded-lg bg-muted/40 p-3">
        <ValueEditor label={`${text.item} ${index + 1}`} value={item} reference={reference[index] ?? example} onChange={(next) => onChange(items.map((previous, i) => i === index ? next : previous))} />
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(items.filter((_, i) => i !== index))}>{text.remove}</Button>
      </div>)}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, blank(example)])}>{text.add}</Button>
    </fieldset>;
  }
  if (reference && typeof reference === "object") {
    const current = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
    return <fieldset className="space-y-3 rounded-lg border p-4"><legend className="px-1 text-sm font-medium">{label}</legend>
      {Object.entries(reference).filter(([key]) => !stableField.test(key)).map(([key, sample]) => <ValueEditor key={key}
        label={text.fields[key as keyof typeof text.fields] || text.text} value={current[key]} reference={sample}
        onChange={(next) => onChange({ ...Object.fromEntries(Object.entries(reference).filter(([key]) => stableField.test(key))), ...current, [key]: next })} />)}
    </fieldset>;
  }
  if (typeof reference !== "string" && reference !== null && reference !== undefined) return null;
  return <div className="space-y-1.5">
    <label className="block text-sm font-medium" htmlFor={id}>{label}</label>
    {String(reference || "").length > 100 || /[\n<>]/.test(String(reference || ""))
      ? <Textarea id={id} lang="ms-MY" rows={4} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} />
      : <Input id={id} lang="ms-MY" value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} />}
  </div>;
}

export default function AdminMalayFields({ record, onChange, table, dirty = false, disabled = false }: {
  record: object; onChange: (patch: Record<string, unknown>) => void; table?: string; dirty?: boolean; disabled?: boolean;
}) {
  const language = useAdminLang();
  const text = adminMalayText[language];
  const data = record as Record<string, unknown>;
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { protectSubmission } = useSubmissionLock();
  useUnsavedChangesWarning(busy);
  const [message, setMessage] = useState("");
  const fields = Object.keys(data).filter((key) => key.endsWith("_en"));
  if (!fields.length) return null;
  const generate = protectSubmission("malay-translation", async () => {
    if (!table || typeof data.id !== "string" || dirty || busy) return;
    setBusy(true); setMessage("");
    try {
      const result = await generateAdminEnglishContent({ table, id: data.id, targetLanguage: "ms", force: false });
      await invalidateAdminResource(queryClient, table);
      setMessage([text.completed, translationDeliveryNotice(result, language)].filter(Boolean).join(" "));
    } catch (error) {
      setMessage(`${text.failed}: ${formatUserFacingError(error, language)}`);
    } finally { setBusy(false); }
  });
  return <AdminFormSection title={text.title} description={text.description}>
    {table && (translationEnabledTables as readonly string[]).includes(table) && <div className="mb-5 space-y-2">
      <AdminActionButton action="content.write" type="button" variant="outline" disabled={disabled || busy || dirty || !data.id} onClick={() => void generate()}>{busy ? text.generating : text.generate}</AdminActionButton>
      {(dirty || !data.id) && <p className="text-xs text-muted-foreground">{text.saveFirst}</p>}
      {message && <p role="status" className="text-sm">{message}</p>}
    </div>}
    <fieldset disabled={disabled || busy} className="space-y-5">
      {fields.map((englishKey) => {
        const base = englishKey.slice(0, -3);
        const malayKey = `${base}_ms`;
        return <ValueEditor key={malayKey} label={text.fields[base as keyof typeof text.fields] || text.text}
          value={data[malayKey]} reference={data[englishKey]} onChange={(value) => onChange({ [malayKey]: value })} />;
      })}
    </fieldset>
  </AdminFormSection>;
}

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminFieldLabel } from "@/components/admin/AdminHelpTip";
import {
  adminCmsSectionContentEditorSchemas,
  adminCmsSectionContentEditorText,
  type AdminCmsLocalizedSectionField,
  type AdminCmsLocalizedSectionSchema,
  type AdminCmsLocalizedSimpleSectionField,
  type AdminCmsLocalizedText,
} from "@/i18n/adminCmsSectionContentEditorText";
import { getAdminLang } from "@/lib/adminLocale";
import AdminImageUpload from "@/pages/admin/AdminImageUpload";

type SimpleSectionField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "url" | "image";
  help: string;
  placeholder?: string;
  rows?: number;
};

type ItemsSectionField = {
  key: string;
  label: string;
  type: "items";
  help: string;
  addLabel: string;
  itemLabel: string;
  itemFields: SimpleSectionField[];
};

type SectionField = SimpleSectionField | ItemsSectionField;

type SectionSchema = {
  label: string;
  description: string;
  fields: SectionField[];
};

type AdminCmsSectionContentEditorTextKey = keyof typeof adminCmsSectionContentEditorText;

const sectionSchemas = adminCmsSectionContentEditorSchemas as Record<string, AdminCmsLocalizedSectionSchema>;

const A = (key: AdminCmsSectionContentEditorTextKey) => adminCmsSectionContentEditorText[key][getAdminLang()];

const L = (text: AdminCmsLocalizedText) => text[getAdminLang()];

const localizeSimpleField = (field: AdminCmsLocalizedSimpleSectionField): SimpleSectionField => ({
  key: field.key,
  label: L(field.label),
  type: field.type,
  help: L(field.help),
  placeholder: field.placeholder ? L(field.placeholder) : undefined,
  rows: field.rows,
});

const localizeField = (field: AdminCmsLocalizedSectionField): SectionField => {
  if (field.type !== "items") return localizeSimpleField(field);
  return {
    key: field.key,
    label: L(field.label),
    type: field.type,
    help: L(field.help),
    addLabel: L(field.addLabel),
    itemLabel: L(field.itemLabel),
    itemFields: field.itemFields.map(localizeSimpleField),
  };
};

const localizeSchema = (schema: AdminCmsLocalizedSectionSchema): SectionSchema => ({
  label: L(schema.label),
  description: L(schema.description),
  fields: schema.fields.map(localizeField),
});

const normalizeSectionType = (value: string) => value.trim().toLowerCase().replace(/-/g, "_");

const getSectionSchema = (type: string): SectionSchema => {
  const schema = sectionSchemas[normalizeSectionType(type)];
  if (schema) return localizeSchema(schema);
  return {
    label: type || A("customSectionLabel"),
    description: A("customSectionDescription"),
    fields: [
      { key: "title", label: A("genericTitleLabel"), type: "text", help: A("genericTitleHelp") },
      { key: "description", label: A("genericDescriptionLabel"), type: "textarea", rows: 4, help: A("genericDescriptionHelp") },
      { key: "image_url", label: A("genericImageLabel"), type: "image", help: A("genericImageHelp") },
    ],
  };
};

const parseObjectFromText = (text: string) => {
  try {
    const parsed = text.trim() ? JSON.parse(text) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
};

const updateJsonText = (text: string, patcher: (value: Record<string, unknown>) => Record<string, unknown>) => {
  const next = patcher(parseObjectFromText(text));
  return JSON.stringify(next, null, 2);
};

const readRecordItems = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.map((item) => (item && typeof item === "object" && !Array.isArray(item) ? item as Record<string, unknown> : {})) : [];

export const SectionContentEditor = ({
  sectionType,
  languageLabel,
  text,
  onChange,
  onDirty,
}: {
  sectionType: string;
  languageLabel: string;
  text: string;
  onChange: (value: string) => void;
  onDirty: () => void;
}) => {
  const schema = getSectionSchema(sectionType);
  const content = parseObjectFromText(text);
  const updateField = (key: string, value: unknown) => {
    onDirty();
    onChange(updateJsonText(text, (current) => ({ ...current, [key]: value })));
  };
  const updateItem = (field: ItemsSectionField, index: number, patch: Record<string, unknown>) => {
    const items = readRecordItems(content[field.key]);
    items[index] = { ...(items[index] || {}), ...patch };
    updateField(field.key, items);
  };
  const moveItem = (field: ItemsSectionField, index: number, direction: -1 | 1) => {
    const items = readRecordItems(content[field.key]);
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const [item] = items.splice(index, 1);
    if (!item) return;
    items.splice(nextIndex, 0, item);
    updateField(field.key, items);
  };
  const removeItem = (field: ItemsSectionField, index: number) => {
    const items = readRecordItems(content[field.key]);
    updateField(field.key, items.filter((_, itemIndex) => itemIndex !== index));
  };
  const addItem = (field: ItemsSectionField) => {
    const items = readRecordItems(content[field.key]);
    const emptyItem = Object.fromEntries(field.itemFields.map((itemField) => [itemField.key, ""]));
    updateField(field.key, [...items, emptyItem]);
  };

  const renderSimpleField = (field: SimpleSectionField, value: string, onValueChange: (value: string) => void, keyPrefix: string) => {
    const id = `${keyPrefix}-${field.key}`;
    if (field.type === "textarea") {
      return (
        <div key={id}>
          <AdminFieldLabel label={field.label} help={field.help} />
          <Textarea rows={field.rows || 3} value={value} placeholder={field.placeholder} onChange={(event) => onValueChange(event.target.value)} />
        </div>
      );
    }
    if (field.type === "image") {
      return (
        <div key={id} className="space-y-3">
          <AdminFieldLabel label={field.label} help={field.help} />
          <Input value={value} placeholder={field.placeholder || "/images/example.webp"} onChange={(event) => onValueChange(event.target.value)} />
          <AdminImageUpload value={value} folder={`cms-${normalizeSectionType(sectionType) || "custom"}`} recordAsset assetUsageType="general" onUploaded={onValueChange} />
        </div>
      );
    }
    return (
      <div key={id}>
        <AdminFieldLabel label={field.label} help={field.help} />
        <Input value={value} type={field.type === "url" ? "text" : "text"} placeholder={field.placeholder} onChange={(event) => onValueChange(event.target.value)} />
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">{languageLabel}{A("visualEditorSuffix")}{schema.label}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{schema.description}</p>
      </div>

      <div className="space-y-4">
        {schema.fields.map((field) => {
          if (field.type === "items") {
            const items = readRecordItems(content[field.key]);
            return (
              <div key={field.key} className="space-y-3">
                <AdminFieldLabel label={field.label} help={field.help} />
                {items.map((item: Record<string, unknown>, index: number) => (
                  <div key={`${field.key}-${index}`} className="rounded-lg border border-border bg-background p-4">
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm font-medium">{field.itemLabel} {index + 1}</span>
                      <div className="grid grid-cols-3 gap-2 sm:flex">
                        <Button type="button" variant="outline" size="icon" onClick={() => moveItem(field, index, -1)} disabled={index === 0} aria-label={A("moveUpAria")}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="icon" onClick={() => moveItem(field, index, 1)} disabled={index === items.length - 1} aria-label={A("moveDownAria")}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="icon" onClick={() => removeItem(field, index)} aria-label={A("deleteAria")}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {field.itemFields.map((itemField) =>
                        renderSimpleField(
                          itemField,
                          String(item?.[itemField.key] || ""),
                          (nextValue) => updateItem(field, index, { [itemField.key]: nextValue }),
                          `${field.key}-${index}`,
                        ),
                      )}
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addItem(field)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {field.addLabel}
                </Button>
              </div>
            );
          }

          return renderSimpleField(
            field,
            String(content[field.key] || ""),
            (nextValue) => updateField(field.key, nextValue),
            `${languageLabel}-${field.key}`,
          );
        })}
      </div>

      <details className="mt-4 rounded-lg border border-border bg-background p-3">
        <summary className="cursor-pointer text-sm font-semibold">{A("advancedJsonSummary")}</summary>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{A("advancedJsonDescription")}</p>
        <Textarea rows={8} value={text} onChange={(event) => { onDirty(); onChange(event.target.value); }} className="mt-3 font-mono text-xs" />
      </details>
    </div>
  );
};

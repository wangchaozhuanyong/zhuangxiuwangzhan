import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import AdminImageUpload from "@/pages/admin/AdminImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AdminHelpTip from "@/components/admin/AdminHelpTip";
import { adminSharedText, formatAdminSharedText } from "@/i18n/adminSharedText";
import { getAdminLang } from "@/lib/adminLocale";

type TextItem = string;
type ProcessStep = { title?: string; desc?: string; [key: string]: unknown };
type FaqItem = { q?: string; a?: string; [key: string]: unknown };
type ProjectCard = { title?: string; type?: string; location?: string; image?: string; [key: string]: unknown };
type AboutSectionItem = {
  value?: string;
  label?: string;
  title?: string;
  desc?: string;
  year?: string;
  icon?: string;
  [key: string]: unknown;
};
type HomeSectionItem = {
  value?: string;
  label_zh?: string;
  label_en?: string;
  title_zh?: string;
  title_en?: string;
  desc_zh?: string;
  desc_en?: string;
  icon?: string;
  [key: string]: unknown;
};
type EditorHelp = { helpText?: string | null };

const EditorLabel = ({ label, helpText }: { label: string; helpText?: string | null }) => (
  <label className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
    <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
    <AdminHelpTip text={helpText} />
  </label>
);

const normalizeTextItems = (value?: unknown[]): TextItem[] =>
  (value || []).map((item) => String(item || ""));

const normalizeProcessSteps = (value?: unknown[]): ProcessStep[] =>
  (value || []).map((item) => {
    if (item && typeof item === "object") return item as ProcessStep;
    return { title: String(item || ""), desc: "" };
  });

const normalizeFaqs = (value?: unknown[]): FaqItem[] =>
  (value || []).map((item) => {
    if (item && typeof item === "object") return item as FaqItem;
    return { q: String(item || ""), a: "" };
  });

const normalizeProjectCards = (value?: unknown[]): ProjectCard[] =>
  (value || []).map((item) => {
    if (item && typeof item === "object") return item as ProjectCard;
    return { title: String(item || ""), image: "" };
  });

const normalizeAboutItems = (value?: unknown[]): AboutSectionItem[] =>
  (value || []).map((item) => {
    if (item && typeof item === "object") return item as AboutSectionItem;
    return { title: String(item || ""), desc: "", icon: "" };
  });

const normalizeHomeItems = (value?: unknown[]): HomeSectionItem[] =>
  (value || []).map((item) => {
    if (item && typeof item === "object") return item as HomeSectionItem;
    return { title_zh: String(item || ""), title_en: "", desc_zh: "", desc_en: "", icon: "" };
  });

const moveItem = <T,>(items: T[], index: number, direction: -1 | 1) => {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const copy = [...items];
  const [item] = copy.splice(index, 1);
  copy.splice(nextIndex, 0, item);
  return copy;
};

const RowActions = ({
  index,
  length,
  onMove,
  onRemove,
}: {
  index: number;
  length: number;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) => {
  const text = adminSharedText[getAdminLang()];

  return (
    <div className="grid shrink-0 grid-cols-3 gap-2 sm:flex">
      <Button type="button" variant="outline" size="icon" onClick={() => onMove(-1)} disabled={index === 0} aria-label={text.moveUp}>
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button type="button" variant="outline" size="icon" onClick={() => onMove(1)} disabled={index === length - 1} aria-label={text.moveDown}>
        <ArrowDown className="h-4 w-4" />
      </Button>
      <Button type="button" variant="outline" size="icon" onClick={onRemove} aria-label={text.delete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const TextListEditor = ({
  label,
  value,
  onChange,
  placeholder,
  addLabel,
  helpText,
}: {
  label: string;
  value?: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  addLabel?: string;
} & EditorHelp) => {
  const text = adminSharedText[getAdminLang()];
  const items = normalizeTextItems(value);
  const effectivePlaceholder = placeholder || text.textPlaceholder;
  const effectiveAddLabel = addLabel || text.textAdd;
  const update = (index: number, nextValue: string) => onChange(items.map((item, i) => (i === index ? nextValue : item)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <EditorLabel label={label} helpText={helpText} />
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${label}-${index}`} className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-background p-3 sm:flex-row">
            <Input className="min-w-0" value={item} onChange={(event) => update(index, event.target.value)} placeholder={effectivePlaceholder} />
            <RowActions
              index={index}
              length={items.length}
              onMove={(direction) => onChange(moveItem(items, index, direction))}
              onRemove={() => remove(index)}
            />
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
        <Plus className="mr-2 h-4 w-4" />
        {effectiveAddLabel}
      </Button>
    </div>
  );
};

export const ProcessStepsEditor = ({
  label,
  value,
  onChange,
  helpText,
}: {
  label: string;
  value?: ProcessStep[];
  onChange: (value: ProcessStep[]) => void;
} & EditorHelp) => {
  const text = adminSharedText[getAdminLang()];
  const items = normalizeProcessSteps(value);
  const update = (index: number, patch: Partial<ProcessStep>) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <EditorLabel label={label} helpText={helpText} />
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${label}-${index}`} className="rounded-lg border border-border bg-background p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium">{formatAdminSharedText(text.stepLabel, { index: index + 1 })}</span>
              <RowActions
                index={index}
                length={items.length}
                onMove={(direction) => onChange(moveItem(items, index, direction))}
                onRemove={() => remove(index)}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={item.title || ""} onChange={(event) => update(index, { title: event.target.value })} placeholder={text.stepTitlePlaceholder} />
              <Textarea value={item.desc || ""} onChange={(event) => update(index, { desc: event.target.value })} placeholder={text.stepDescPlaceholder} rows={3} />
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, { title: "", desc: "" }])}>
        <Plus className="mr-2 h-4 w-4" />{text.addStep}</Button>
    </div>
  );
};

export const FaqListEditor = ({
  label,
  value,
  onChange,
  helpText,
}: {
  label: string;
  value?: FaqItem[];
  onChange: (value: FaqItem[]) => void;
} & EditorHelp) => {
  const text = adminSharedText[getAdminLang()];
  const items = normalizeFaqs(value);
  const update = (index: number, patch: Partial<FaqItem>) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <EditorLabel label={label} helpText={helpText} />
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${label}-${index}`} className="rounded-lg border border-border bg-background p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium">{formatAdminSharedText(text.questionLabel, { index: index + 1 })}</span>
              <RowActions
                index={index}
                length={items.length}
                onMove={(direction) => onChange(moveItem(items, index, direction))}
                onRemove={() => remove(index)}
              />
            </div>
            <div className="space-y-3">
              <Textarea value={item.q || ""} onChange={(event) => update(index, { q: event.target.value })} placeholder={text.questionPlaceholder} rows={2} />
              <Textarea value={item.a || ""} onChange={(event) => update(index, { a: event.target.value })} placeholder={text.answerPlaceholder} rows={4} />
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, { q: "", a: "" }])}>
        <Plus className="mr-2 h-4 w-4" />{text.addFaq}</Button>
    </div>
  );
};

export const ProjectCardsEditor = ({
  label,
  value,
  onChange,
  folder,
  metaKey,
  metaLabel,
  helpText,
}: {
  label: string;
  value?: ProjectCard[];
  onChange: (value: ProjectCard[]) => void;
  folder: string;
  metaKey: "type" | "location";
  metaLabel: string;
} & EditorHelp) => {
  const text = adminSharedText[getAdminLang()];
  const items = normalizeProjectCards(value);
  const update = (index: number, patch: Partial<ProjectCard>) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <EditorLabel label={label} helpText={helpText} />
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${label}-${index}`} className="rounded-lg border border-border bg-background p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium">{formatAdminSharedText(text.projectCardLabel, { index: index + 1 })}</span>
              <RowActions
                index={index}
                length={items.length}
                onMove={(direction) => onChange(moveItem(items, index, direction))}
                onRemove={() => remove(index)}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={item.title || ""} onChange={(event) => update(index, { title: event.target.value })} placeholder={text.projectTitlePlaceholder} />
              <Input value={String(item[metaKey] || "")} onChange={(event) => update(index, { [metaKey]: event.target.value })} placeholder={metaLabel} />
              <div className="space-y-3 md:col-span-2">
                <Input value={item.image || ""} onChange={(event) => update(index, { image: event.target.value })} placeholder={text.imageUrlPlaceholder} />
                <AdminImageUpload value={item.image || ""} folder={folder} recordAsset assetUsageType="general" onUploaded={(url) => update(index, { image: url })} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, { title: "", [metaKey]: "", image: "" }])}>
        <Plus className="mr-2 h-4 w-4" />{text.addProjectCard}</Button>
    </div>
  );
};

export const AboutSectionItemsEditor = ({
  label,
  sectionKey,
  value,
  onChange,
  helpText,
}: {
  label: string;
  sectionKey: string;
  value?: AboutSectionItem[];
  onChange: (value: AboutSectionItem[]) => void;
} & EditorHelp) => {
  const text = adminSharedText[getAdminLang()];
  const items = normalizeAboutItems(value);
  const update = (index: number, patch: Partial<AboutSectionItem>) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const isIntro = sectionKey === "intro";
  const isStats = sectionKey === "stats";
  const isMilestone = sectionKey === "milestones";
  const isCards = sectionKey === "core_values" || sectionKey === "team";
  const addItem = isIntro
    ? { title: "" }
    : isStats
      ? { value: "", label: "", icon: "" }
      : isMilestone
        ? { year: "", title: "", desc: "" }
        : { title: "", desc: "", icon: "" };

  if (!isIntro && !isStats && !isMilestone && !isCards) {
    return (
      <div className="space-y-2">
        <EditorLabel label={label} helpText={helpText} />
        <p className="text-sm text-muted-foreground">{text.noListNeeded}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <EditorLabel label={label} helpText={helpText} />
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${label}-${index}`} className="rounded-lg border border-border bg-background p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium">{formatAdminSharedText(text.itemLabel, { index: index + 1 })}</span>
              <RowActions
                index={index}
                length={items.length}
                onMove={(direction) => onChange(moveItem(items, index, direction))}
                onRemove={() => remove(index)}
              />
            </div>
            {isIntro ? (
              <Textarea value={item.title || ""} onChange={(event) => update(index, { title: event.target.value })} placeholder={text.paragraphPlaceholder} rows={4} />
            ) : isStats ? (
              <div className="grid gap-3 md:grid-cols-3">
                <Input value={item.value || ""} onChange={(event) => update(index, { value: event.target.value })} placeholder={text.statValuePlaceholder} />
                <Input value={item.label || ""} onChange={(event) => update(index, { label: event.target.value })} placeholder={text.labelPlaceholder} />
                <Input value={item.icon || ""} onChange={(event) => update(index, { icon: event.target.value })} placeholder={text.iconPlaceholder} />
              </div>
            ) : isMilestone ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={item.year || ""} onChange={(event) => update(index, { year: event.target.value })} placeholder={text.yearPlaceholder} />
                <Input value={item.title || ""} onChange={(event) => update(index, { title: event.target.value })} placeholder={text.titlePlaceholder} />
                <Textarea className="md:col-span-2" value={item.desc || ""} onChange={(event) => update(index, { desc: event.target.value })} placeholder={text.descriptionPlaceholder} rows={3} />
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={item.title || ""} onChange={(event) => update(index, { title: event.target.value })} placeholder={text.titlePlaceholder} />
                <Input value={item.icon || ""} onChange={(event) => update(index, { icon: event.target.value })} placeholder={text.iconPaintbrushPlaceholder} />
                <Textarea className="md:col-span-2" value={item.desc || ""} onChange={(event) => update(index, { desc: event.target.value })} placeholder={text.descriptionPlaceholder} rows={3} />
              </div>
            )}
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, addItem])}>
        <Plus className="mr-2 h-4 w-4" />{text.addItem}</Button>
    </div>
  );
};

export const HomeSectionItemsEditor = ({
  label,
  value,
  onChange,
  variant,
  helpText,
}: {
  label: string;
  value?: HomeSectionItem[];
  onChange: (value: HomeSectionItem[]) => void;
  variant: "stats" | "why";
} & EditorHelp) => {
  const text = adminSharedText[getAdminLang()];
  const items = normalizeHomeItems(value);
  const update = (index: number, patch: Partial<HomeSectionItem>) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const addItem =
    variant === "stats"
      ? { value: "", label_zh: "", label_en: "", desc_zh: "", desc_en: "", icon: "star" }
      : { title_zh: "", title_en: "", desc_zh: "", desc_en: "", icon: "paintbrush" };

  return (
    <div className="space-y-3">
      <EditorLabel label={label} helpText={helpText} />
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${label}-${index}`} className="rounded-lg border border-border bg-background p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium">{formatAdminSharedText(text.itemLabel, { index: index + 1 })}</span>
              <RowActions
                index={index}
                length={items.length}
                onMove={(direction) => onChange(moveItem(items, index, direction))}
                onRemove={() => remove(index)}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {variant === "stats" ? (
                <>
                  <Input value={item.value || ""} onChange={(event) => update(index, { value: event.target.value })} placeholder={text.statValuePlaceholder} />
                  <Input value={item.icon || ""} onChange={(event) => update(index, { icon: event.target.value })} placeholder={text.iconPlaceholder} />
                  <Input value={item.label_zh || ""} onChange={(event) => update(index, { label_zh: event.target.value })} placeholder={text.zhLabelPlaceholder} />
                  <Input value={item.label_en || ""} onChange={(event) => update(index, { label_en: event.target.value })} placeholder={text.enLabelPlaceholder} />
                </>
              ) : (
                <>
                  <Input value={item.title_zh || ""} onChange={(event) => update(index, { title_zh: event.target.value })} placeholder={text.zhTitlePlaceholder} />
                  <Input value={item.title_en || ""} onChange={(event) => update(index, { title_en: event.target.value })} placeholder={text.enTitlePlaceholder} />
                  <Input value={item.icon || ""} onChange={(event) => update(index, { icon: event.target.value })} placeholder={text.iconPaintbrushPlaceholder} />
                </>
              )}
              <Textarea value={item.desc_zh || ""} onChange={(event) => update(index, { desc_zh: event.target.value })} placeholder={text.zhDescPlaceholder} rows={3} />
              <Textarea value={item.desc_en || ""} onChange={(event) => update(index, { desc_en: event.target.value })} placeholder={text.enDescPlaceholder} rows={3} />
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, addItem])}>
        <Plus className="mr-2 h-4 w-4" />{text.addItem}</Button>
    </div>
  );
};

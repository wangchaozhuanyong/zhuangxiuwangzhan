import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminFieldLabel } from "@/components/admin/AdminHelpTip";
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

const baseCardFields: SimpleSectionField[] = [
  { key: "title", label: "标题", type: "text", help: "卡片或列表项的标题。" },
  { key: "description", label: "说明", type: "textarea", rows: 3, help: "卡片或列表项的说明文字。" },
  { key: "image_url", label: "图片", type: "image", help: "可选。用于卡片图片或图库图片。" },
  { key: "url", label: "跳转链接", type: "url", help: "可选。点击后跳转到哪个页面。" },
];

const SECTION_SCHEMAS: Record<string, SectionSchema> = {
  hero: {
    label: "Hero 首屏",
    description: "适合页面最上方的大标题、说明、按钮和主图。",
    fields: [
      { key: "eyebrow", label: "小标题", type: "text", help: "显示在主标题上方的短文案，例如行业或服务标签。" },
      { key: "title", label: "主标题", type: "textarea", rows: 2, help: "页面最重要的一句话。" },
      { key: "subtitle", label: "副标题", type: "textarea", rows: 2, help: "主标题下面的补充说明。" },
      { key: "description", label: "详细说明", type: "textarea", rows: 4, help: "更完整的介绍文字，可留空。" },
      { key: "primary_label", label: "主按钮文字", type: "text", help: "例如“获取报价”或“联系我们”。" },
      { key: "primary_url", label: "主按钮链接", type: "url", help: "例如 /quote 或 /contact。" },
      { key: "secondary_label", label: "副按钮文字", type: "text", help: "第二个按钮文字，可留空。" },
      { key: "secondary_url", label: "副按钮链接", type: "url", help: "第二个按钮跳转地址，可留空。" },
      { key: "image_url", label: "首屏图片", type: "image", help: "页面首屏主图。" },
      { key: "alt", label: "图片说明", type: "text", help: "给搜索引擎和无障碍阅读使用。" },
    ],
  },
  rich_text: {
    label: "富文本内容",
    description: "适合公司介绍、服务说明、长段落正文。",
    fields: [
      { key: "title", label: "标题", type: "text", help: "正文模块标题。" },
      { key: "summary", label: "摘要", type: "textarea", rows: 3, help: "正文前的简短总结，可留空。" },
      { key: "content", label: "正文", type: "textarea", rows: 8, help: "主要正文内容。" },
      { key: "image_url", label: "配图", type: "image", help: "正文旁边或上方的配图，可留空。" },
      { key: "alt", label: "图片说明", type: "text", help: "图片的文字说明。" },
    ],
  },
  cta: {
    label: "行动引导 CTA",
    description: "适合页面底部的联系、报价、预约等转化区。",
    fields: [
      { key: "title", label: "标题", type: "text", help: "行动引导的主标题。" },
      { key: "description", label: "说明", type: "textarea", rows: 3, help: "告诉客户为什么要点击按钮。" },
      { key: "primary_label", label: "主按钮文字", type: "text", help: "例如“马上咨询”。" },
      { key: "primary_url", label: "主按钮链接", type: "url", help: "例如 /quote。" },
      { key: "secondary_label", label: "副按钮文字", type: "text", help: "可选。" },
      { key: "secondary_url", label: "副按钮链接", type: "url", help: "可选。" },
      { key: "image_url", label: "背景或配图", type: "image", help: "可选。用于增强视觉效果。" },
    ],
  },
  faq: {
    label: "常见问题",
    description: "适合维护问答列表。",
    fields: [
      {
        key: "items",
        label: "问题列表",
        type: "items",
        help: "每条填写一个问题和答案。",
        addLabel: "添加问题",
        itemLabel: "问题",
        itemFields: [
          { key: "question", label: "问题", type: "textarea", rows: 2, help: "客户常问的问题。" },
          { key: "answer", label: "答案", type: "textarea", rows: 4, help: "对应的回答。" },
        ],
      },
    ],
  },
  service_grid: {
    label: "服务卡片",
    description: "适合展示多个服务项目。",
    fields: [{ key: "items", label: "服务列表", type: "items", help: "每条是一张服务卡片。", addLabel: "添加服务", itemLabel: "服务", itemFields: baseCardFields }],
  },
  project_grid: {
    label: "案例卡片",
    description: "适合展示案例、作品或客户项目。",
    fields: [{ key: "items", label: "案例列表", type: "items", help: "每条是一张案例卡片。", addLabel: "添加案例", itemLabel: "案例", itemFields: baseCardFields }],
  },
  gallery: {
    label: "图片图库",
    description: "适合展示多张图片。",
    fields: [{ key: "items", label: "图片列表", type: "items", help: "每条是一张图库图片。", addLabel: "添加图片", itemLabel: "图片", itemFields: baseCardFields }],
  },
  team: {
    label: "团队成员",
    description: "适合展示团队、专家或负责人。",
    fields: [{ key: "items", label: "成员列表", type: "items", help: "每条是一个团队成员。", addLabel: "添加成员", itemLabel: "成员", itemFields: baseCardFields }],
  },
  testimonials: {
    label: "客户评价",
    description: "适合展示客户评价。",
    fields: [
      {
        key: "items",
        label: "评价列表",
        type: "items",
        help: "每条是一条客户评价。",
        addLabel: "添加评价",
        itemLabel: "评价",
        itemFields: [
          { key: "name", label: "客户名称", type: "text", help: "显示的客户名或公司名。" },
          { key: "role", label: "客户身份", type: "text", help: "例如 Homeowner、Founder，可留空。" },
          { key: "quote", label: "评价内容", type: "textarea", rows: 4, help: "客户评价正文。" },
          { key: "image_url", label: "头像或图片", type: "image", help: "可选。" },
        ],
      },
    ],
  },
};

const normalizeSectionType = (value: string) => value.trim().toLowerCase().replace(/-/g, "_");

const getSectionSchema = (type: string): SectionSchema =>
  SECTION_SCHEMAS[normalizeSectionType(type)] || {
    label: type || "自定义模块",
    description: "这个模块类型还没有专用表单，可以先用高级 JSON 编辑。",
    fields: [
      { key: "title", label: "标题", type: "text", help: "通用标题字段。" },
      { key: "description", label: "说明", type: "textarea", rows: 4, help: "通用说明字段。" },
      { key: "image_url", label: "图片", type: "image", help: "通用图片字段。" },
    ],
  };

const parseObjectFromText = (text: string) => {
  try {
    const parsed = text.trim() ? JSON.parse(text) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, any> : {};
  } catch {
    return {};
  }
};

const updateJsonText = (text: string, patcher: (value: Record<string, any>) => Record<string, any>) => {
  const next = patcher(parseObjectFromText(text));
  return JSON.stringify(next, null, 2);
};

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
    const items = Array.isArray(content[field.key]) ? [...content[field.key]] : [];
    items[index] = { ...(items[index] || {}), ...patch };
    updateField(field.key, items);
  };
  const moveItem = (field: ItemsSectionField, index: number, direction: -1 | 1) => {
    const items = Array.isArray(content[field.key]) ? [...content[field.key]] : [];
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const [item] = items.splice(index, 1);
    items.splice(nextIndex, 0, item);
    updateField(field.key, items);
  };
  const removeItem = (field: ItemsSectionField, index: number) => {
    const items = Array.isArray(content[field.key]) ? [...content[field.key]] : [];
    updateField(field.key, items.filter((_, itemIndex) => itemIndex !== index));
  };
  const addItem = (field: ItemsSectionField) => {
    const items = Array.isArray(content[field.key]) ? [...content[field.key]] : [];
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
        <h3 className="text-sm font-semibold">{languageLabel}可视化编辑 · {schema.label}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{schema.description}</p>
      </div>

      <div className="space-y-4">
        {schema.fields.map((field) => {
          if (field.type === "items") {
            const items = Array.isArray(content[field.key]) ? content[field.key] : [];
            return (
              <div key={field.key} className="space-y-3">
                <AdminFieldLabel label={field.label} help={field.help} />
                {items.map((item: Record<string, any>, index: number) => (
                  <div key={`${field.key}-${index}`} className="rounded-lg border border-border bg-background p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">{field.itemLabel} {index + 1}</span>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="icon" onClick={() => moveItem(field, index, -1)} disabled={index === 0} aria-label="上移">
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="icon" onClick={() => moveItem(field, index, 1)} disabled={index === items.length - 1} aria-label="下移">
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="icon" onClick={() => removeItem(field, index)} aria-label="删除">
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
        <summary className="cursor-pointer text-sm font-semibold">高级 JSON 编辑</summary>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">表单会自动同步到 JSON。只有需要特殊字段时才需要直接改这里。</p>
        <Textarea rows={8} value={text} onChange={(event) => { onDirty(); onChange(event.target.value); }} className="mt-3 font-mono text-xs" />
      </details>
    </div>
  );
};


import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import AdminImageUpload from "./AdminImageUpload";
import type { Language } from "@/i18n/routes";

const isZhBrowser = () => typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh");

interface AdminProjectImagesProps {
  projectId?: string;
}

const emptyImage = {
  image_url: "",
  image_type: "gallery",
  alt_zh: "",
  alt_en: "",
  sort_order: 0,
};

const copy = {
  en: {
    saveFirst: "Save the project before managing gallery and before/after images.",
    title: "Project Images",
    description: "Manage gallery, cover, before, and after images with bilingual alt text.",
    imageUrl: "Image URL",
    imageType: "Image type",
    altZh: "Chinese alt",
    altEn: "English alt",
    sortOrder: "Sort order",
    addImage: "Add Image",
    preview: "Preview",
    type: "Type",
    alt: "Alt",
    sort: "Sort",
    delete: "Delete",
    saveProjectFirst: "Save the project and upload/select an image first.",
    added: "Image added.",
    cover: "cover",
    gallery: "gallery",
    before: "before",
    after: "after",
  },
  zh: {
    saveFirst: "请先保存项目，再管理图库和前后对比图片。",
    title: "项目图片",
    description: "管理图库、封面、前图和后图，并填写中英双语 alt 文本。",
    imageUrl: "图片 URL",
    imageType: "图片类型",
    altZh: "中文 alt",
    altEn: "英文 alt",
    sortOrder: "排序",
    addImage: "添加图片",
    preview: "预览",
    type: "类型",
    alt: "说明",
    sort: "排序",
    delete: "删除",
    saveProjectFirst: "请先保存项目并上传/选择图片。",
    added: "图片已添加。",
    cover: "封面",
    gallery: "图库",
    before: "前图",
    after: "后图",
  },
};

const imageTypeLabels: Record<string, Record<Language, string>> = {
  cover: { en: "cover", zh: "封面" },
  gallery: { en: "gallery", zh: "图库" },
  before: { en: "before", zh: "前图" },
  after: { en: "after", zh: "后图" },
};

const formatImageType = (value: string, language: Language) =>
  imageTypeLabels[value]?.[language] || value;

const AdminProjectImages = ({ projectId }: AdminProjectImagesProps) => {
  const lang = isZhBrowser() ? "zh" : "en";
  const t = copy[lang];
  const [images, setImages] = useState<any[]>([]);
  const [draft, setDraft] = useState<any>(emptyImage);
  const [status, setStatus] = useState("");

  const loadImages = useCallback(async () => {
    if (!projectId || !supabase) return;
    const { data } = await supabase.from("project_images").select("*").eq("project_id", projectId).order("sort_order");
    setImages(data || []);
  }, [projectId]);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  const addImage = async () => {
    if (!projectId || !draft.image_url) {
      setStatus(t.saveProjectFirst);
      return;
    }

    const { error } = await supabase!.from("project_images").insert({
      ...draft,
      project_id: projectId,
      sort_order: Number(draft.sort_order || 0),
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setDraft(emptyImage);
    setStatus(t.added);
    await loadImages();
  };

  const updateImage = async (image: any, patch: Record<string, any>) => {
    const next = { ...image, ...patch };
    setImages((items) => items.map((item) => (item.id === image.id ? next : item)));
    const { error } = await supabase!.from("project_images").update(patch).eq("id", image.id);
    if (error) setStatus(error.message);
  };

  const deleteImage = async (id: string) => {
    const { error } = await supabase!.from("project_images").delete().eq("id", id);
    if (error) {
      setStatus(error.message);
      return;
    }
    setImages((items) => items.filter((item) => item.id !== id));
  };

  if (!projectId) {
    return (
      <div className="rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
        {t.saveFirst}
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="font-display text-lg font-bold">{t.title}</h3>
        <p className="text-sm text-muted-foreground">{t.description}</p>
      </div>
      {status && <div className="mb-4 rounded-lg bg-muted p-3 text-sm">{status}</div>}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <AdminImageUpload folder={`projects/${projectId}`} value={draft.image_url} onUploaded={(url) => setDraft({ ...draft, image_url: url })} />
        <div className="space-y-3">
          <Input placeholder={t.imageUrl} value={draft.image_url} onChange={(event) => setDraft({ ...draft, image_url: event.target.value })} />
          <Select value={draft.image_type} onValueChange={(value) => setDraft({ ...draft, image_type: value })}>
            <SelectTrigger><SelectValue placeholder={t.imageType} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">{t.cover}</SelectItem>
              <SelectItem value="gallery">{t.gallery}</SelectItem>
              <SelectItem value="before">{t.before}</SelectItem>
              <SelectItem value="after">{t.after}</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder={t.altZh} value={draft.alt_zh} onChange={(event) => setDraft({ ...draft, alt_zh: event.target.value })} />
          <Input placeholder={t.altEn} value={draft.alt_en} onChange={(event) => setDraft({ ...draft, alt_en: event.target.value })} />
          <Input type="number" placeholder={t.sortOrder} value={draft.sort_order} onChange={(event) => setDraft({ ...draft, sort_order: event.target.value })} />
          <Button type="button" onClick={addImage}>{t.addImage}</Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.preview}</TableHead>
            <TableHead>{t.type}</TableHead>
            <TableHead>{t.alt}</TableHead>
            <TableHead>{t.sort}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {images.map((image) => (
            <TableRow key={image.id}>
              <TableCell><img src={image.image_url} alt={image.alt_en || image.alt_zh || "Project image"} className="h-16 w-24 rounded object-cover" /></TableCell>
              <TableCell>{formatImageType(image.image_type, lang as Language)}</TableCell>
              <TableCell className="max-w-xs text-xs text-muted-foreground">{image.alt_zh}<br />{image.alt_en}</TableCell>
              <TableCell>
                <Input className="w-20" type="number" value={image.sort_order || 0} onChange={(event) => updateImage(image, { sort_order: Number(event.target.value || 0) })} />
              </TableCell>
              <TableCell className="text-right">
                <Button type="button" variant="destructive" size="sm" onClick={() => deleteImage(image.id)}>{t.delete}</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminProjectImages;

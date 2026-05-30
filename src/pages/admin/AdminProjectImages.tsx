import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateAfterAdminContentSave } from "@/lib/adminInvalidate";
import { useAdminProjectImages } from "@/lib/adminQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import AdminImageUpload from "./AdminImageUpload";
import SmartImage from "@/components/SmartImage";
import type { Language } from "@/i18n/routes";
import { getAdminLang } from "@/lib/adminLocale";

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
    action: "Actions",
    delete: "Delete",
    setCover: "Set as cover",
    saveProjectFirst: "Save the project and upload/select an image first.",
    added: "Image added.",
    coverSet: "Set as cover. The public project list will use this image first.",
    cover: "cover",
    gallery: "gallery",
    before: "before",
    after: "after",
    coverRuleTitle: "Cover image rule, aligned with the public site:",
    coverRulePrimary: "Public lists and detail thumbnails use the image whose image_type is cover first.",
    coverRuleFallback: "If there is no cover, the first gallery image is used, then projects.image_url, then the default image.",
  },
  zh: {
    saveFirst: "请先保存项目，再管理图库和前后对比图片。",
    title: "项目图片",
    description: "管理图库、封面、施工前和施工后图片，并填写中英文图片说明。",
    imageUrl: "图片地址",
    imageType: "图片类型",
    altZh: "中文图片说明",
    altEn: "英文图片说明",
    sortOrder: "排序",
    addImage: "添加图片",
    preview: "预览",
    type: "类型",
    alt: "图片说明",
    sort: "排序",
    action: "操作",
    delete: "删除",
    setCover: "设为封面",
    saveProjectFirst: "请先保存项目，并上传或填写图片地址。",
    added: "图片已添加。",
    coverSet: "已设为封面，前台案例列表会优先显示这张图。",
    cover: "封面",
    gallery: "图库",
    before: "施工前",
    after: "施工后",
    coverRuleTitle: "封面图规则，已和前台统一：",
    coverRulePrimary: "前台列表和详情缩略图，会优先使用类型为“封面”的图片。",
    coverRuleFallback: "如果没有封面图，会依次使用第一张图库图片、备用封面图、默认图片。",
  },
};

const imageTypeLabels: Record<string, Record<Language, string>> = {
  cover: { en: "cover", zh: "封面" },
  gallery: { en: "gallery", zh: "图库" },
  before: { en: "before", zh: "施工前" },
  after: { en: "after", zh: "施工后" },
};

const formatImageType = (value: string, language: Language) =>
  imageTypeLabels[value]?.[language] || value;

const AdminProjectImages = ({ projectId }: AdminProjectImagesProps) => {
  const queryClient = useQueryClient();
  const lang = getAdminLang();
  const t = copy[lang];
  const { data: images = [], refetch } = useAdminProjectImages(projectId);
  const [draft, setDraft] = useState<any>(emptyImage);
  const [status, setStatus] = useState("");

  const refreshProjectCaches = useCallback(() => {
    void invalidateAfterAdminContentSave(queryClient);
    void queryClient.invalidateQueries({ queryKey: ["admin", "project_images", projectId] });
  }, [queryClient, projectId]);

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
    refreshProjectCaches();
    await refetch();
  };

  const updateImage = async (image: any, patch: Record<string, any>) => {
    const { error } = await supabase!.from("project_images").update(patch).eq("id", image.id);
    if (error) setStatus(error.message);
    else {
      refreshProjectCaches();
      await refetch();
    }
  };

  const setAsCover = async (image: any) => {
    if (!projectId) return;
    setStatus("");
    const { error: resetError } = await supabase!
      .from("project_images")
      .update({ image_type: "gallery" })
      .eq("project_id", projectId)
      .eq("image_type", "cover");
    if (resetError) {
      setStatus(resetError.message);
      return;
    }
    await updateImage(image, { image_type: "cover", sort_order: 0 });
    refreshProjectCaches();
    setStatus(t.coverSet);
  };

  const deleteImage = async (id: string) => {
    const { error } = await supabase!.from("project_images").delete().eq("id", id);
    if (error) {
      setStatus(error.message);
      return;
    }
    refreshProjectCaches();
    await refetch();
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
      <div className="mb-4 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">{t.coverRuleTitle}</p>
        <ul className="list-disc space-y-0.5 pl-5">
          <li>{t.coverRulePrimary}</li>
          <li>{t.coverRuleFallback}</li>
        </ul>
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
            <TableHead>{t.action}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {images.map((image) => (
            <TableRow key={image.id}>
              <TableCell><SmartImage src={image.image_url} alt={image.alt_en || image.alt_zh || "项目图片"} width={96} height={64} className="h-16 w-24 rounded object-cover" /></TableCell>
              <TableCell>{formatImageType(image.image_type, lang as Language)}</TableCell>
              <TableCell className="max-w-xs text-xs text-muted-foreground">{image.alt_zh}<br />{image.alt_en}</TableCell>
              <TableCell>
                <Input className="w-20" type="number" value={image.sort_order || 0} onChange={(event) => updateImage(image, { sort_order: Number(event.target.value || 0) })} />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void setAsCover(image)} disabled={image.image_type === "cover"}>
                    {t.setCover}
                  </Button>
                </div>
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

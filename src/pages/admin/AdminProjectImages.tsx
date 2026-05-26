import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import AdminImageUpload from "./AdminImageUpload";

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

const AdminProjectImages = ({ projectId }: AdminProjectImagesProps) => {
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
      setStatus("Save the project and upload/select an image first.");
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
    setStatus("Image added.");
    await loadImages();
  };

  const updateImage = async (image: any, patch: Record<string, any>) => {
    const next = { ...image, ...patch };
    setImages((items) => items.map((item) => item.id === image.id ? next : item));
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
        Save this project before managing gallery and before/after images.
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="font-display text-lg font-bold">Project Images</h3>
        <p className="text-sm text-muted-foreground">Manage gallery, cover, before, and after images with bilingual alt text.</p>
      </div>
      {status && <div className="mb-4 rounded-lg bg-muted p-3 text-sm">{status}</div>}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <AdminImageUpload folder={`projects/${projectId}`} value={draft.image_url} onUploaded={(url) => setDraft({ ...draft, image_url: url })} />
        <div className="space-y-3">
          <Input placeholder="Image URL" value={draft.image_url} onChange={(event) => setDraft({ ...draft, image_url: event.target.value })} />
          <Select value={draft.image_type} onValueChange={(value) => setDraft({ ...draft, image_type: value })}>
            <SelectTrigger><SelectValue placeholder="Image type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">cover</SelectItem>
              <SelectItem value="gallery">gallery</SelectItem>
              <SelectItem value="before">before</SelectItem>
              <SelectItem value="after">after</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Chinese alt" value={draft.alt_zh} onChange={(event) => setDraft({ ...draft, alt_zh: event.target.value })} />
          <Input placeholder="English alt" value={draft.alt_en} onChange={(event) => setDraft({ ...draft, alt_en: event.target.value })} />
          <Input type="number" placeholder="Sort order" value={draft.sort_order} onChange={(event) => setDraft({ ...draft, sort_order: event.target.value })} />
          <Button type="button" onClick={addImage}>Add Image</Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Preview</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Alt</TableHead>
            <TableHead>Sort</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {images.map((image) => (
            <TableRow key={image.id}>
              <TableCell><img src={image.image_url} alt={image.alt_en || image.alt_zh || "Project image"} className="h-16 w-24 rounded object-cover" /></TableCell>
              <TableCell>{image.image_type}</TableCell>
              <TableCell className="max-w-xs text-xs text-muted-foreground">{image.alt_zh}<br />{image.alt_en}</TableCell>
              <TableCell>
                <Input className="w-20" type="number" value={image.sort_order || 0} onChange={(event) => updateImage(image, { sort_order: Number(event.target.value || 0) })} />
              </TableCell>
              <TableCell className="text-right">
                <Button type="button" variant="destructive" size="sm" onClick={() => deleteImage(image.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminProjectImages;

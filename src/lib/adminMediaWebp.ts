import { downloadAdminMediaWebp, uploadAdminMediaObject } from "@/backend/modules/media/service/mediaService";

export type AdminWebpEncoder = (canvas: HTMLCanvasElement, quality: number) => Promise<Blob>;

export const isWebpBlob = async (blob: Blob): Promise<boolean> => {
  if (blob.type !== "image/webp" || blob.size < 12) return false;
  const header = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  const marker = (offset: number) => String.fromCharCode(...header.slice(offset, offset + 4));
  return marker(0) === "RIFF" && marker(8) === "WEBP"
    && new DataView(header.buffer).getUint32(4, true) === blob.size - 8;
};

/** Shared browser encoder with the existing private Storage conversion fallback. */
export const createAdminMediaWebpEncoder = ({ folderPath, stamp, name, errorMessage }: {
  folderPath: string; stamp: string | number; name: string; errorMessage: string;
}): AdminWebpEncoder => {
  let canvasUnsupported = false;
  let conversionPath: string | undefined;
  const canvasBlob = (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> =>
    new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error(errorMessage)), type, quality));
  return async (canvas, quality) => {
    try {
      if (!canvasUnsupported) {
        const encoded = await canvasBlob(canvas, "image/webp", quality);
        if (await isWebpBlob(encoded)) return encoded;
        canvasUnsupported = true;
      }
      if (!conversionPath) {
        const png = await canvasBlob(canvas, "image/png");
        if (png.type !== "image/png" || png.size > 20 * 1024 * 1024) throw new Error(errorMessage);
        const candidate = `${folderPath}/processing/${stamp}-${name}.png`;
        await uploadAdminMediaObject("site-media-originals", candidate, new File([png], "conversion-source.png", { type: "image/png" }), {
          upsert: false, contentType: "image/png",
        });
        conversionPath = candidate;
      }
      const transformed = await downloadAdminMediaWebp("site-media-originals", conversionPath, {
        width: canvas.width, height: canvas.height, quality: Math.round(quality * 100),
      });
      if (!await isWebpBlob(transformed)) throw new Error(errorMessage);
      return transformed;
    } catch {
      // Signed URLs and private provider details must never reach the UI.
      throw new Error(errorMessage);
    }
  };
};

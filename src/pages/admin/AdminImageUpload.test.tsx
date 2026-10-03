import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminImageUpload from "@/pages/admin/AdminImageUpload";
import { setAdminLang } from "@/lib/adminLocale";
import type { AdminUploadedMedia } from "@/lib/adminMedia";

const { upload, download } = vi.hoisted(() => ({ upload: vi.fn(), download: vi.fn() }));
vi.mock("@/backend/modules/media/service/mediaService", () => ({
  hasMediaStorageClient: () => true,
  uploadAdminMediaObject: upload,
  tryUploadAdminMediaObject: () => Promise.resolve(true),
  downloadAdminMediaWebp: download,
  getMediaStoragePublicUrl: () => "https://example.test/display.webp",
}));
vi.mock("@/lib/adminMediaQueries", () => ({ useCreateAdminMediaAsset: () => ({ mutateAsync: vi.fn() }) }));
vi.mock("@/components/SmartImage", () => ({ default: () => null }));

const webp = (type = "image/webp") => {
  const bytes = new Uint8Array(24);
  bytes.set([82, 73, 70, 70], 0);
  new DataView(bytes.buffer).setUint32(4, bytes.length - 8, true);
  bytes.set([87, 69, 66, 80], 8);
  return new Blob([bytes], { type });
};
const originalArrayBuffer = Object.getOwnPropertyDescriptor(Blob.prototype, "arrayBuffer");

describe("admin image uploads across browser encoders", () => {
  let container: HTMLDivElement;
  let root: Root;
  let onUploaded: ReturnType<typeof vi.fn<(url: string, upload?: AdminUploadedMedia) => void>>;
  let encode: ReturnType<typeof vi.fn<HTMLCanvasElement["toBlob"]>>;

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    setAdminLang("en");
    upload.mockReset().mockResolvedValue(true);
    download.mockReset().mockResolvedValue(webp());
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 1200, height: 800, close: vi.fn() }));
  });

  afterEach(async () => {
    if (root) await act(async () => root.unmount());
    container?.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (originalArrayBuffer) Object.defineProperty(Blob.prototype, "arrayBuffer", originalArrayBuffer);
    else Reflect.deleteProperty(Blob.prototype, "arrayBuffer");
    setAdminLang("zh");
  });

  const render = async () => {
    // jsdom's Blob predates arrayBuffer; read actual bytes through FileReader.
    Object.defineProperty(Blob.prototype, "arrayBuffer", { configurable: true, value: function (this: Blob) {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(this);
      });
    } });
    encode = vi.fn((callback: BlobCallback) => callback(webp()));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(encode);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    onUploaded = vi.fn();
    await act(async () => root.render(<AdminImageUpload folder="qa" assetUsageType="blog" onUploaded={onUploaded} />));
  };

  const settle = async () => vi.waitFor(async () => {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 5)); });
    expect(container.querySelector("button")).not.toBeDisabled();
  });

  const choose = async (file: File) => {
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
    await settle();
  };

  it("reuses already compliant WebP bytes without relying on the canvas encoder", async () => {
    await render();
    const file = new File([webp()], "ready.webp", { type: "image/webp" });
    await choose(file);
    expect(onUploaded).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ converted: false, resized: false, sizeBytes: file.size }));
    expect(upload).toHaveBeenCalledWith("site-images", expect.stringContaining("ready.webp"), file, expect.objectContaining({ contentType: "image/webp" }));
    expect(encode).not.toHaveBeenCalled();
    expect(download).not.toHaveBeenCalled();
  });

  it("converts Safari's PNG fallback privately before uploading verified WebP", async () => {
    await render();
    encode.mockImplementation((callback: BlobCallback) => callback(new Blob(["png pixels"], { type: "image/png" })));
    await choose(new File(["jpeg"], "source.jpg", { type: "image/jpeg" }));
    expect(upload).toHaveBeenNthCalledWith(1, "site-media-originals", expect.stringContaining("/processing/"), expect.objectContaining({ type: "image/png" }), expect.objectContaining({ contentType: "image/png" }));
    expect(download).toHaveBeenCalledWith("site-media-originals", expect.stringContaining("/processing/"), { width: 1200, height: 800, quality: 82 });
    expect(upload).toHaveBeenNthCalledWith(2, "site-images", expect.any(String), expect.objectContaining({ type: "image/webp" }), expect.objectContaining({ contentType: "image/webp" }));
    expect(onUploaded).toHaveBeenCalledOnce();
  });

  it("rejects mislabeled output, leaves the public image untouched, and retries the selected source", async () => {
    await render();
    encode.mockImplementation((callback: BlobCallback) => callback(new Blob(["png pixels"], { type: "image/png" })));
    download.mockResolvedValueOnce(new Blob(["not webp"], { type: "image/webp" }));
    await choose(new File(["png"], "source.png", { type: "image/png" }));
    expect(onUploaded).not.toHaveBeenCalled();
    expect(upload.mock.calls.every(([bucket]) => bucket === "site-media-originals")).toBe(true);
    expect(container.textContent).toContain("could not convert");
    const button = container.querySelector<HTMLButtonElement>("button")!;
    expect(button.textContent).toBe("Retry upload");
    await act(async () => button.click());
    await settle();
    expect(onUploaded).toHaveBeenCalledOnce();
    expect(container.textContent).not.toContain("could not convert");
  });

  it("rejects a false WebP label before decoding or uploading", async () => {
    await render();
    await choose(new File(["png"], "fake.webp", { type: "image/webp" }));
    expect(container.textContent).toContain("not a valid WebP");
    expect(upload).not.toHaveBeenCalled();
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it("opens the file picker from the upload button and disables it during upload", async () => {
    await render();
    const picker = vi.spyOn(container.querySelector<HTMLInputElement>("input")!, "click");
    await act(async () => container.querySelector<HTMLButtonElement>("button")!.click());
    expect(picker).toHaveBeenCalledOnce();
    let finish: (value: boolean) => void = () => {};
    upload.mockImplementationOnce(() => new Promise<boolean>((resolve) => { finish = resolve; }));
    const input = container.querySelector<HTMLInputElement>("input")!;
    Object.defineProperty(input, "files", { configurable: true, value: [new File([webp()], "ready.webp", { type: "image/webp" })] });
    await act(async () => {
      input.dispatchEvent(new Event("change", { bubbles: true }));
      await vi.waitFor(() => expect(upload).toHaveBeenCalledOnce());
    });
    expect(input).toBeDisabled();
    expect(container.querySelector("button")).toBeDisabled();
    await act(async () => { finish(true); });
    expect(container.querySelector("button")).not.toBeDisabled();
  });
});

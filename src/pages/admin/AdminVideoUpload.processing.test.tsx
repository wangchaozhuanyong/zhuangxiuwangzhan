import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminVideoUpload from "./AdminVideoUpload";

const { upload, uploadPair, download } = vi.hoisted(() => ({ upload: vi.fn(), uploadPair: vi.fn(), download: vi.fn() }));
vi.mock("@/hooks/useUnsavedChangesWarning", () => ({ useUnsavedChangesWarning: () => {} }));
vi.mock("@/backend/modules/media/service/mediaService", () => ({
  hasMediaStorageClient: () => true,
  getMediaStoragePublicUrl: (bucket: string, path: string) => `/${bucket}/${path}`,
  uploadAdminMediaObject: upload,
  downloadAdminMediaWebp: download,
  uploadAdminVideoObjects: uploadPair,
  AdminVideoUploadStorageError: class extends Error {},
}));

const originalArrayBuffer = Object.getOwnPropertyDescriptor(Blob.prototype, "arrayBuffer");
const webp = () => {
  const bytes = new Uint8Array(24); bytes.set([82, 73, 70, 70], 0);
  new DataView(bytes.buffer).setUint32(4, bytes.length - 8, true); bytes.set([87, 69, 66, 80], 8);
  return new Blob([bytes], { type: "image/webp" });
};
describe("video poster frame readiness and browser encoding", () => {
  afterEach(() => {
    vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); upload.mockReset(); uploadPair.mockReset(); download.mockReset();
    if (originalArrayBuffer) Object.defineProperty(Blob.prototype, "arrayBuffer", originalArrayBuffer);
    else Reflect.deleteProperty(Blob.prototype, "arrayBuffer");
  });

  it.each(["webp", "png"])("waits for decoded short-video frames and verifies %s browser output", async (encoder) => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.defineProperty(Blob.prototype, "arrayBuffer", { configurable: true, value: function (this: Blob) {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error); reader.readAsArrayBuffer(this);
      });
    } });
    download.mockResolvedValue(webp());
    const createElement: typeof document.createElement = document.createElement.bind(document);
    const video = createElement("video");
    Object.defineProperties(video, { duration: { value: 0.5 }, videoWidth: { value: 320 }, videoHeight: { value: 180 } });
    vi.spyOn(video, "load").mockImplementation(() => {});
    const draw = vi.fn();
    const canvas = createElement("canvas");
    vi.spyOn(canvas, "getContext").mockReturnValue({ drawImage: draw } as unknown as CanvasRenderingContext2D);
    vi.spyOn(canvas, "toBlob").mockImplementation(callback => callback(encoder === "webp" ? webp() : new Blob(["png"], { type: "image/png" })));
    vi.spyOn(document, "createElement").mockImplementation(((tag: string, options?: ElementCreationOptions) => tag === "video" ? video : tag === "canvas" ? canvas : createElement(tag, options)) as typeof document.createElement);
    vi.stubGlobal("URL", class extends URL {
      static createObjectURL = vi.fn(() => "blob:synthetic-video");
      static revokeObjectURL = vi.fn();
    });
    const container = createElement("div"); document.body.append(container); const root = createRoot(container);
    const onUploaded = vi.fn();
    try {
      await act(async () => root.render(<AdminVideoUpload onUploaded={onUploaded} />));
      const picker = container.querySelector<HTMLInputElement>('input[type="file"]')!;
      Object.defineProperty(picker, "files", { value: [new File(["synthetic"], "short.mp4", { type: "video/mp4" })] });
      await act(async () => { picker.dispatchEvent(new Event("change", { bubbles: true })); video.dispatchEvent(new Event("loadedmetadata")); });
      expect(draw).not.toHaveBeenCalled();
      expect(uploadPair).not.toHaveBeenCalled();
      await act(async () => video.dispatchEvent(new Event("loadeddata")));
      expect(video.currentTime).toBe(0.05);
      expect(draw).not.toHaveBeenCalled();
      await act(async () => video.dispatchEvent(new Event("seeked")));
      await vi.waitFor(async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 5)); }); expect(onUploaded).toHaveBeenCalledOnce(); });
      expect(draw).toHaveBeenCalledOnce();
      expect(uploadPair).toHaveBeenCalledOnce();
      expect(onUploaded).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ durationSeconds: 0.5, width: 320, height: 180 }));
      expect(uploadPair).toHaveBeenCalledWith(expect.objectContaining({ poster: expect.objectContaining({ type: "image/webp", size: 24 }) }));
      if (encoder === "png") {
        expect(upload).toHaveBeenCalledWith("site-media-originals", expect.stringContaining("/processing/"), expect.objectContaining({ type: "image/png" }), expect.any(Object));
        expect(download).toHaveBeenCalledWith("site-media-originals", expect.stringContaining("/processing/"), { width: 320, height: 180, quality: 82 });
      } else expect(download).not.toHaveBeenCalled();
    } finally { await act(async () => root.unmount()); container.remove(); }
  });

  it("unlocks a stalled decoder after a bounded wait without uploading or claiming success", async () => {
    vi.useFakeTimers(); vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const createElement: typeof document.createElement = document.createElement.bind(document);
    const video = createElement("video"); const unload = vi.spyOn(video, "load").mockImplementation(() => {});
    vi.spyOn(document, "createElement").mockImplementation(((tag: string, options?: ElementCreationOptions) => tag === "video" ? video : createElement(tag, options)) as typeof document.createElement);
    const revoke = vi.fn(); vi.stubGlobal("URL", class extends URL { static createObjectURL = () => "blob:stalled-video"; static revokeObjectURL = revoke; });
    const container = createElement("div"); document.body.append(container); const root = createRoot(container), onUploaded = vi.fn();
    try {
      await act(async () => root.render(<AdminVideoUpload onUploaded={onUploaded} />));
      const picker = container.querySelector<HTMLInputElement>('input[type="file"]')!;
      Object.defineProperty(picker, "files", { value: [new File(["synthetic"], "stalled.mp4", { type: "video/mp4" })] });
      await act(async () => picker.dispatchEvent(new Event("change", { bubbles: true })));
      expect(picker).toBeDisabled();
      await act(async () => vi.advanceTimersByTimeAsync(30_000));
      expect(picker).not.toBeDisabled(); expect(container.textContent).toMatch(/处理超时|processing timed out/);
      expect(onUploaded).not.toHaveBeenCalled(); expect(uploadPair).not.toHaveBeenCalled();
      expect(revoke).toHaveBeenCalledWith("blob:stalled-video"); expect(unload).toHaveBeenCalledOnce();
    } finally { await act(async () => root.unmount()); container.remove(); }
  });
});

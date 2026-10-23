import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminVideoUploadStorageError, uploadAdminVideoObjects } from "./mediaService";

const { upload, exists, remove } = vi.hoisted(() => ({ upload: vi.fn(), exists: vi.fn(), remove: vi.fn() }));
vi.mock("../repository/mediaRepository", () => ({
  uploadMediaStorageObject: upload, mediaStorageObjectExists: exists, removeMediaStorageObject: remove,
}));
const input = {
  posterPath: "videos/posters/unique-attempt.webp", videoPath: "videos/unique-attempt.mp4",
  poster: new File(["poster"], "poster.webp", { type: "image/webp" }),
  video: new File(["video"], "video.mp4", { type: "video/mp4" }),
};

describe("video upload storage completion", () => {
  beforeEach(() => { upload.mockReset().mockResolvedValue(true); exists.mockReset(); remove.mockReset().mockResolvedValue(undefined); });
  it("keeps successful video and poster without a recovery read or delete", async () => {
    await uploadAdminVideoObjects(input);
    expect(upload.mock.calls.map(call => call.slice(0, 2))).toEqual([["site-images", input.posterPath], ["site-videos", input.videoPath]]);
    expect(exists).not.toHaveBeenCalled(); expect(remove).not.toHaveBeenCalled();
  });
  it("removes only this attempt's confirmed poster when video storage is confirmed absent", async () => {
    upload.mockResolvedValueOnce(true).mockRejectedValueOnce(new Error("Transport failed")); exists.mockResolvedValue(false);
    await expect(uploadAdminVideoObjects(input)).rejects.toMatchObject({ reason: "failed" });
    expect(exists).toHaveBeenCalledExactlyOnceWith("site-videos", input.videoPath);
    expect(remove).toHaveBeenCalledExactlyOnceWith("site-images", input.posterPath);
  });
  it("recovers a lost video response by checking its unique stored path", async () => {
    upload.mockResolvedValueOnce(true).mockRejectedValueOnce(new Error("Response lost")); exists.mockResolvedValue(true);
    await expect(uploadAdminVideoObjects(input)).resolves.toBeUndefined(); expect(remove).not.toHaveBeenCalled(); expect(upload).toHaveBeenCalledTimes(2);
  });
  it("recovers a lost poster response before uploading the video", async () => {
    upload.mockRejectedValueOnce(new Error("Response lost")).mockResolvedValueOnce(true); exists.mockResolvedValue(true);
    await uploadAdminVideoObjects(input); expect(exists).toHaveBeenCalledExactlyOnceWith("site-images", input.posterPath); expect(upload).toHaveBeenCalledTimes(2); expect(remove).not.toHaveBeenCalled();
  });
  it("does not delete or claim success when storage readback is unavailable", async () => {
    upload.mockResolvedValueOnce(true).mockRejectedValueOnce(new Error("Response lost")); exists.mockRejectedValue(new Error("Offline"));
    await expect(uploadAdminVideoObjects(input)).rejects.toMatchObject({ reason: "unconfirmed" }); expect(remove).not.toHaveBeenCalled();
  });
  it("reports failed compensation instead of hiding an unused poster", async () => {
    upload.mockResolvedValueOnce(true).mockRejectedValueOnce(new Error("Upload failed")); exists.mockResolvedValue(false); remove.mockRejectedValue(new Error("Cleanup failed"));
    await expect(uploadAdminVideoObjects(input)).rejects.toMatchObject({ reason: "cleanup_failed" });
  });
  it("does not attempt video upload or delete if the poster never reached storage", async () => {
    upload.mockRejectedValue(new Error("Upload failed")); exists.mockResolvedValue(false);
    await expect(uploadAdminVideoObjects(input)).rejects.toBeInstanceOf(AdminVideoUploadStorageError); expect(upload).toHaveBeenCalledTimes(1); expect(remove).not.toHaveBeenCalled();
  });
});

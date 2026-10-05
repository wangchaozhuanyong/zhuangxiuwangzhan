import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PUBLIC_LOADING_PROGRESS, startPublicLoadingProgress } from "./publicLoadingProgress";

beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
const value = (track: HTMLElement) => Number(track.style.getPropertyValue("--loading-progress"));

describe("shared public loading progress", () => {
  it("moves forward, stays below completion, and finishes only when readiness requests it", async () => {
    const track = document.createElement("i");
    const progress = startPublicLoadingProgress(track);
    let previous = value(track);
    for (let i = 0; i < 80; i++) {
      vi.advanceTimersByTime(250);
      expect(value(track)).toBeGreaterThanOrEqual(previous);
      expect(value(track)).toBeLessThan(1);
      previous = value(track);
    }
    const finished = vi.fn();
    const completion = progress.complete().then(finished);
    expect(value(track)).toBe(1);
    await vi.advanceTimersByTimeAsync(PUBLIC_LOADING_PROGRESS.finish - 1);
    expect(finished).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await completion;
    expect(finished).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("pauses for recovery, resumes without resetting and cancels completion cleanly", async () => {
    const track = document.createElement("i");
    const progress = startPublicLoadingProgress(track);
    vi.advanceTimersByTime(1000);
    const paused = value(track);
    progress.pause();
    vi.advanceTimersByTime(5000);
    expect(value(track)).toBe(paused);
    progress.resume();
    vi.advanceTimersByTime(250);
    expect(value(track)).toBeGreaterThan(paused);
    const completion = progress.complete();
    progress.cancel();
    await completion;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps reduced-motion waiting feedback static and completes immediately", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    const track = document.createElement("i");
    const progress = startPublicLoadingProgress(track);
    const initial = value(track);
    vi.advanceTimersByTime(5000);
    expect(value(track)).toBe(initial);
    await progress.complete();
    expect(value(track)).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});

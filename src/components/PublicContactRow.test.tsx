import { act, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublicContactRow from "./PublicContactRow";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./ui/dialog";

const row = { icon: <svg />, title: "电话", value: "+60 11-2885 3888", action: "拨打电话" };
let container: HTMLDivElement;
let root: Root;
beforeEach(() => { container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

describe("shared contact interaction", () => {
  it("preserves the link destination, ref and one click handler on the whole row", async () => {
    const onClick = vi.fn((event) => event.preventDefault());
    const ref = createRef<HTMLDivElement>();
    await act(async () => root.render(<PublicContactRow {...row} asChild ref={ref}><a href="tel:+601128853888" onClick={onClick} /></PublicContactRow>));
    const link = container.querySelector("a");
    expect(link).toHaveAttribute("href", "tel:+601128853888");
    expect(link).toHaveAccessibleName("电话 +60 11-2885 3888 拨打电话");
    expect(ref.current).toBe(link);
    expect(link?.querySelector("button, a")).toBeNull();
    await act(async () => container.querySelector(".public-contact-row__value")?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("passes dialog trigger props to the actual address button", async () => {
    await act(async () => root.render(<Dialog><DialogTrigger asChild><PublicContactRow {...row} title="地址" value="办公室地址" action="前往导航" asChild><button type="button" /></PublicContactRow></DialogTrigger><DialogContent><DialogTitle>选择导航地图</DialogTitle><DialogDescription>选择地图</DialogDescription></DialogContent></Dialog>));
    const trigger = container.querySelector("button");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    await act(async () => container.querySelector(".public-contact-row__value")?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(document.querySelector('[role="dialog"]')).toHaveAccessibleName("选择导航地图");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps opening hours informational without an extra interactive target", async () => {
    await act(async () => root.render(<PublicContactRow icon={<svg />} title="营业时间" value="请提前联系安排" />));
    expect(container).toHaveTextContent("请提前联系安排");
    expect(container.querySelector("a, button")).toBeNull();
  });
});

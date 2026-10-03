import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useAdminFormState } from "./useAdminFormState";
type Form = { id: string; title: string; sections: { a: string; b: string } };
const first: Form = { id: "one", title: "remote", sections: { a: "A", b: "B" } };
let root: Root, node: HTMLDivElement, form: ReturnType<typeof useAdminFormState<Form>>;
function Probe({ remote, id = "one" }: { remote?: Form; id?: string }) { form = useAdminFormState(remote, { initial: first, resetKey: id }); return null; }
beforeEach(() => { node = document.createElement("div"); document.body.append(node); root = createRoot(node); });
afterEach(async () => { await act(async () => root.unmount()); node.remove(); });
describe("editor snapshots", () => {
  it("keeps dirty fields on a focus refresh and restores pristine state when edits are reverted", async () => {
    await act(async () => root.render(<Probe remote={first} />));
    await act(async () => form.setForm({ ...first, title: "editing" }));
    await act(async () => root.render(<Probe remote={{ ...first, title: "another operator" }} />));
    expect(form.state.title).toBe("editing"); expect(form.dirty).toBe(true);
    await act(async () => form.setForm(first)); expect(form.dirty).toBe(false);
  });
  it("merges a save response without clearing newer input", async () => {
    await act(async () => root.render(<Probe remote={first} />));
    const submitted = { ...first, title: "submitted" };
    await act(async () => form.setForm(submitted));
    await act(async () => form.setForm({ ...submitted, title: "newer" }));
    await act(async () => form.applyRemote({ ...submitted, id: "saved-id" }, submitted));
    expect(form.state).toMatchObject({ id: "saved-id", title: "newer" }); expect(form.dirty).toBe(true);
  });
  it("saving one section cannot acknowledge unsaved siblings", async () => {
    await act(async () => root.render(<Probe remote={first} />));
    const submitted = { ...first, sections: { a: "saved A", b: "unsaved B" } };
    await act(async () => form.setForm(submitted));
    await act(async () => form.applyPatchRemote({ sections: { a: "saved A" } }, submitted));
    expect(form.state.sections).toEqual(submitted.sections); expect(form.dirty).toBe(true);
    await act(async () => form.setForm({ ...form.state, sections: { a: "saved A", b: "B" } })); expect(form.dirty).toBe(false);
  });
  it("clears another record immediately on an id change before its remote read completes", async () => {
    await act(async () => root.render(<Probe remote={first} />));
    await act(async () => root.render(<Probe id="two" remote={{ ...first, id: "two", title: "second" }} />));
    expect(form.state.id).toBe("two"); expect(form.dirty).toBe(false);
  });
});

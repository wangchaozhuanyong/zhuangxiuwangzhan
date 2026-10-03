import { navigateAfterSave } from "@/lib/navigationProtection";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import NavigationProtectionProvider from "./NavigationProtectionProvider";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
function Editor() { useUnsavedChangesWarning(true); const { pathname } = useLocation(); return <input aria-label="Fixture title" defaultValue={pathname} />; }
let node: HTMLDivElement, root: Root, router: ReturnType<typeof createMemoryRouter>;
beforeEach(async () => {
  node=document.createElement("div");document.body.append(node);root=createRoot(node);
  router=createMemoryRouter([{path:'*',element:<NavigationProtectionProvider><Editor /></NavigationProtectionProvider>}],{initialEntries:['/en/services','/en/contact'],initialIndex:1});
  await act(async()=>root.render(<RouterProvider router={router}/>));
});
afterEach(async()=>{await act(async()=>root.unmount());router.dispose();node.remove();});
const click = async (text: string) => act(async()=> { (Array.from(document.querySelectorAll('button')).find(button=>button.textContent===text) as HTMLButtonElement).click(); });
describe('unified navigation protection',()=>{
  it('adopts a new saved URL without a discard prompt, while later edits remain protected',async()=>{
    expect(navigateAfterSave(()=>true,()=>{void router.navigate('/en/quote');})).toBe(false);
    expect(router.state.location.pathname).toBe('/en/contact');
    await act(async()=>{navigateAfterSave(()=>false,()=>{void router.navigate('/en/quote');});});
    expect(document.querySelector('[role="dialog"]')).toBeNull();expect(router.state.location.pathname).toBe('/en/quote');
  });
  it('blocks browser back and keeps the editor when the user stays',async()=>{
    await act(async()=>{void router.navigate(-1);});expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    await click('Keep editing');expect(router.state.location.pathname).toBe('/en/contact');
  });
  it('allows language and hash changes without remounting the current editor',async()=>{
    const input=node.querySelector('input');input!.value='unsaved';
    await act(async()=>{await router.navigate('/zh/contact#form');});
    expect(document.querySelector('[role="dialog"]')).toBeNull();expect(node.querySelector('input')).toBe(input);expect(input!.value).toBe('unsaved');
  });
  it('proceeds only after confirming a different business page',async()=>{
    await act(async()=>{void router.navigate('/en/quote');});await click('Discard changes and leave');expect(router.state.location.pathname).toBe('/en/quote');
  });
});

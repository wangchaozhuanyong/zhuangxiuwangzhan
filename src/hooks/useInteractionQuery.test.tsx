import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider, notifyManager } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInteractionQuery } from "./useInteractionQuery";
const seed = vi.hoisted(() => ({ value: { siteSettings: { company_name: "HTML snapshot" } } }));
vi.mock("@/lib/publicPreload", () => ({ readPreloadedPublicData: () => seed.value }));
let node: HTMLDivElement, root: Root, client: QueryClient, query: ReturnType<typeof useSettingsQuery>;
const read=vi.fn<() => Promise<{company_name:string}>>();
function useSettingsQuery(){return useInteractionQuery({queryKey:['site-settings'],queryFn:read,staleTime:60000});}
function Probe(){query=useSettingsQuery();return <p>{query.data?.company_name}</p>;}
beforeEach(()=>{notifyManager.setScheduler(callback=>callback());node=document.createElement('div');document.body.append(node);root=createRoot(node);client=new QueryClient({defaultOptions:{queries:{retry:false}}});read.mockReset();});
afterEach(async()=>{await act(async()=>root.unmount());client.clear();node.remove();notifyManager.setScheduler(callback=>setTimeout(callback,0));});
const render=()=>act(async()=>root.render(<QueryClientProvider client={client}><Probe/></QueryClientProvider>));
describe('HTML initialization and refresh lifecycle',()=>{
 it('hydrates once, then invalidation reads the live source instead of HTML',async()=>{
  read.mockResolvedValue({company_name:'Fresh source'});await render();expect(node.textContent).toBe('HTML snapshot');expect(read).not.toHaveBeenCalled();
  await act(async()=>{await client.invalidateQueries({queryKey:['site-settings']});});expect(node.textContent).toBe('Fresh source');expect(read).toHaveBeenCalledOnce();
 });
 it('keeps last successful content and a retryable refresh error',async()=>{
  await render();read.mockRejectedValue(new Error('Synthetic offline'));
  await act(async()=>{await query.refetch();});expect(node.textContent).toBe('HTML snapshot');expect(query.isInitialError).toBe(false);expect(query.refreshError).not.toBeNull();
  read.mockResolvedValue({company_name:'Recovered'});await act(async()=>{await query.refetch();await new Promise(resolve=>setTimeout(resolve,0));});expect(node.textContent).toBe('Recovered');
 });
 it('does not reseed a removed cache with the old document',async()=>{
  await render();await act(async()=>root.render(<QueryClientProvider client={client}><p>Unmount</p></QueryClientProvider>));client.removeQueries({queryKey:['site-settings']});
  read.mockResolvedValue({company_name:'After GC'});await render();await act(async()=>{await query.refetch();await new Promise(resolve=>setTimeout(resolve,0));});expect(node.textContent).toBe('After GC');expect(read).toHaveBeenCalled();
 });
});

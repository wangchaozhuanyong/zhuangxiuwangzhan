const protections = new Set<symbol>();
const listeners = new Set<() => void>();
let documentNavigationApproved = false;
let savedNavigationApproved = false;
const notify = () => listeners.forEach((listener) => listener());

export const hasProtectedChanges = () => protections.size > 0;
export const shouldBlockProtectedNavigation = () => hasProtectedChanges() && !savedNavigationApproved;
/** A new record may adopt its saved URL only if no later edit or other form is pending. */
export function navigateAfterSave(hasLaterEdits: () => boolean, action: () => void) {
  if (hasLaterEdits() || protections.size > 1) return false;
  savedNavigationApproved = true;
  try { action(); return true; }
  finally { savedNavigationApproved = false; }
}
export const subscribeNavigationProtection = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export const registerNavigationProtection = () => {
  const owner = Symbol();
  protections.add(owner);
  documentNavigationApproved = false;
  notify();
  return () => { protections.delete(owner); notify(); };
};

export const NAVIGATION_CONFIRM_EVENT = "flashcast-navigation-confirm";
export type NavigationConfirmRequest = { resolve: (approved: boolean) => void };

export const confirmProtectedNavigation = (): Promise<boolean> => {
  if (!hasProtectedChanges()) return Promise.resolve(true);
  return new Promise((resolve) => window.dispatchEvent(new CustomEvent<NavigationConfirmRequest>(NAVIGATION_CONFIRM_EVENT, { detail: { resolve } })));
};

export async function navigateDocumentSafely(action: () => void | Promise<void>) {
  if (!await confirmProtectedNavigation()) return false;
  documentNavigationApproved = true;
  try { await action(); return true; }
  catch (error) { documentNavigationApproved = false; throw error; }
}

export const approveDocumentNavigation = () => { documentNavigationApproved = true; };
export const reloadDocumentSafely = () => navigateDocumentSafely(() => window.location.reload());
export const shouldWarnBeforeUnload = () => hasProtectedChanges() && !documentNavigationApproved;

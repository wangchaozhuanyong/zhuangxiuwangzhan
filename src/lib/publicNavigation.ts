/** The public frame owns the visual exit; links retain React Router's history,
 * state and modifier-key behavior. Without a mounted frame, navigation is immediate. */
export type PublicNavigation = { destination: string; commit: () => void };
export const PUBLIC_NAVIGATION_EVENT = "public-route-leave";

export function requestPublicNavigation(destination: string, commit: () => void) {
  const event = new CustomEvent<PublicNavigation>(PUBLIC_NAVIGATION_EVENT, {
    cancelable: true, detail: { destination, commit },
  });
  if (window.dispatchEvent(event)) commit();
}

type Localizer = <T>(value: T, field?: string) => T;
let localize: Localizer | undefined;

export const registerMalayContent = (translate: Localizer) => { localize = translate; };

/** The language route waits for this resource before rendering Malay content. */
export const loadMalayContent = () => import("./malayContent");

export function localizeMalayContent<T>(value: T, field = ""): T {
  if (!localize) throw new Error("Malay content resource is not ready.");
  return localize(value, field);
}

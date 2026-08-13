import { useLayoutEffect, useRef, type ComponentPropsWithoutRef } from "react";
import { usePublicChrome } from "@/contexts/PublicChromeContext";

type ImmersiveHeroProps = ComponentPropsWithoutRef<"section"> & {
  enabled?: boolean;
  standardPageHero?: boolean;
};

const ImmersiveHero = ({ enabled = true, standardPageHero = true, ...props }: ImmersiveHeroProps) => {
  const { registerImmersiveHero } = usePublicChrome();
  const registrationId = useRef(Symbol("immersive-hero"));

  useLayoutEffect(() => {
    if (!enabled) return;
    return registerImmersiveHero(registrationId.current);
  }, [enabled, registerImmersiveHero]);

  return (
    <section
      {...props}
      data-immersive-hero={enabled ? "true" : "false"}
      data-forest-page-hero={standardPageHero ? (enabled ? "true" : "text-only") : undefined}
    />
  );
};

export default ImmersiveHero;

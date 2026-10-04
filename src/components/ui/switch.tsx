import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { switchText } from "@/i18n/switchText";
import type { Language } from "@/i18n/routes";

type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
  language?: Language;
};

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, language, ...props }, ref) => {
  const { language: pageLanguage } = useLanguage();
  const text = switchText[language ?? pageLanguage];

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer group/switch relative inline-flex h-11 w-[104px] shrink-0 cursor-pointer items-center rounded-full border-2 p-1 transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=unchecked]:border-border data-[state=unchecked]:bg-muted data-[state=unchecked]:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none",
        className,
      )}
      {...props}
      ref={ref}
    >
      <span aria-hidden="true" className="pointer-events-none absolute left-1 top-1/2 hidden w-14 -translate-y-1/2 whitespace-nowrap text-center text-sm font-semibold leading-none group-data-[state=checked]/switch:block">
        {text.on}
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute right-1 top-1/2 w-14 -translate-y-1/2 whitespace-nowrap text-center text-sm font-semibold leading-none group-data-[state=checked]/switch:hidden">
        {text.off}
      </span>
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-8 w-8 rounded-full bg-background shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-[60px] data-[state=unchecked]:translate-x-0 motion-reduce:transition-none",
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };

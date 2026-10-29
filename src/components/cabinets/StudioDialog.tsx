import { useRef, type ComponentProps } from 'react';
import { DialogContent } from '@/components/ui/dialog';
import { useLanguage } from '@/i18n/LanguageContext';
import text from '@/i18n/cabinetStudioText.json';

export default function StudioDialog({ returnFocus, onCloseAutoFocus, ...props }: ComponentProps<typeof DialogContent> & { returnFocus?: () => HTMLElement | null }) {
  const origin = useRef<HTMLElement | null>(null);
  const { language } = useLanguage();
  return <DialogContent {...props} closeLabel={text[language].close} onOpenAutoFocus={() => { origin.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; }} onCloseAutoFocus={event => { event.preventDefault(); const preferred = returnFocus?.() ?? origin.current; const target = preferred?.isConnected ? preferred : document.querySelector<HTMLElement>('#studio-step-heading, .studio-collection-entry, .studio-back'); target?.focus({ preventScroll: true }); onCloseAutoFocus?.(event); }} />;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_GOOGLE_ADS_ID?: string;
  readonly VITE_GOOGLE_ADS_QUOTE_CONVERSION_LABEL?: string;
  readonly VITE_GOOGLE_ADS_CONTACT_CONVERSION_LABEL?: string;
  readonly VITE_GA4_PAGES_REPORT_URL?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface Window {
  turnstile?: {
    render: (
      container: HTMLElement,
      options: {
        sitekey: string;
        size: "invisible";
        action: string;
        callback: (token: string) => void;
        "error-callback": () => void;
        "expired-callback": () => void;
      },
    ) => string;
    execute: (widgetId: string) => void;
    remove: (widgetId: string) => void;
  };
}

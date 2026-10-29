import type { Language } from "./routes";
import type { InquiryChannel } from "@/lib/inquirySource";

const openingText = {
  zh: {
    google: "你好，我在谷歌看到您的公司，需要咨询装修方面的事情。",
    chatgpt: "你好，我在ChatGPT看到您的公司，需要咨询装修方面的事情。",
    generic: "你好，需要咨询装修方面的事情。",
  },
  en: {
    google: "Hi, I found your company on Google and would like to ask about renovation.",
    chatgpt: "Hi, I found your company on ChatGPT and would like to ask about renovation.",
    generic: "Hi, I'd like to ask about renovation.",
  },
  ms: {
    google: "Hai, saya menemui syarikat anda di Google dan ingin bertanya tentang pengubahsuaian.",
    chatgpt: "Hai, saya menemui syarikat anda di ChatGPT dan ingin bertanya tentang pengubahsuaian.",
    generic: "Hai, saya ingin bertanya tentang pengubahsuaian.",
  },
} satisfies Record<Language, { google: string; chatgpt: string; generic: string }>;

export function whatsappOpeningText(language: Language, channel: InquiryChannel) {
  const source = channel === "google_paid" || channel === "google_organic" ? "google"
    : channel === "chatgpt_paid" || channel === "chatgpt_referral" ? "chatgpt" : "generic";
  return openingText[language][source];
}

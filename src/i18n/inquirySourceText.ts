import type { Language } from "./routes";
import type { InquiryChannel, InquirySources } from "@/lib/inquirySource";

export const inquirySourceText: Record<Language, { reference: string; first: string; last: string; channels: Record<InquiryChannel, string> }> = {
  zh: { reference: "来源（浏览器参考）", first: "首次", last: "最近", channels: { google_paid: "Google广告", chatgpt_paid: "ChatGPT广告", google_organic: "Google自然搜索", chatgpt_referral: "ChatGPT自然推荐", other_referral: "其他推荐", unknown: "不确定" } },
  en: { reference: "Source (browser reference)", first: "First", last: "Latest", channels: { google_paid: "Google ad", chatgpt_paid: "ChatGPT ad", google_organic: "Google organic search", chatgpt_referral: "ChatGPT referral", other_referral: "Other referral", unknown: "Unknown" } },
  ms: { reference: "Sumber (rujukan pelayar)", first: "Pertama", last: "Terkini", channels: { google_paid: "Iklan Google", chatgpt_paid: "Iklan ChatGPT", google_organic: "Carian organik Google", chatgpt_referral: "Rujukan ChatGPT", other_referral: "Rujukan lain", unknown: "Tidak pasti" } },
};
export function formatInquirySources(sources: InquirySources, language: Language) {
  const t = inquirySourceText[language];
  const channels = sources.first === sources.last ? t.channels[sources.last]
    : `${t.first}: ${t.channels[sources.first]}; ${t.last}: ${t.channels[sources.last]}`;
  return `${t.reference}: ${channels}`;
}

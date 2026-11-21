import type { Language } from "../i18n/languageDetection";

export const ANZHE_SHOWROOM_HOST = "locks.flashcast.com.my";
export const ANZHE_SHOWROOM_ORIGIN = `https://${ANZHE_SHOWROOM_HOST}`;

export function anzheShowroomModelUrl(language: Language, slug: string) {
  return `${ANZHE_SHOWROOM_ORIGIN}/${language}/lock/${encodeURIComponent(slug)}/`;
}

export type ShowroomSourcePage = { pathname: string; search: string; hash: string };

export function getAnzheShowroomEntry(language: Language, source: ShowroomSourcePage) {
  const path = /^\/(?:zh|en|ms)(?:\/|$)/.test(source.pathname) ? source.pathname : `/${language}`;
  // The catalogue page number and ordinary section anchors are public navigation state.
  // Tracking parameters, private form values and authentication fragments stay on the main site.
  const page = new URLSearchParams(source.search).get("page");
  const query = page && /^[1-9]\d{0,4}$/.test(page) ? `?page=${page}` : "";
  const hash = /^#[a-z][a-z0-9_-]{0,100}$/i.test(source.hash) ? source.hash : "";
  const entry = new URL(`/${language}/`, ANZHE_SHOWROOM_ORIGIN);
  entry.hash = new URLSearchParams({ "fc-return": path + query + hash }).toString();
  return entry.href;
}

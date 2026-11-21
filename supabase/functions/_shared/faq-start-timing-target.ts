import type { ManagedTarget } from "./managed-targets.ts";

export const FAQ_START_TIMING_APPROVAL_ID = "owner-approved-faq-start-timing-copy-20261121";
export const FAQ_START_TIMING_TARGET_ID = "faq-start-timing-20261121-v2";

const id = "9a7e3271-9c11-44ce-8efe-838dc4bdc16d";
const retainedProjectionFields = [
  "created_at", "id", "page_key", "sort_order", "status", "version",
] as const;
const changedFields = [
  "answer_en", "answer_ms", "answer_zh", "question_en", "question_ms", "question_zh",
] as const;

// One existing general FAQ. Registration alone grants no production write authority.
export const FAQ_START_TIMING_TARGET = {
  id,
  slug: `faq-${id}`,
  contentType: "faq",
  table: "faqs",
  taskId: FAQ_START_TIMING_TARGET_ID,
  actionId: "publish-faq-130-three-language-copy-v2",
  candidateVersion: FAQ_START_TIMING_TARGET_ID,
  scope: `flashcast.com.my:faqs/${id}:answer_en,answer_ms,answer_zh,question_en,question_ms,question_zh`,
  changedFields,
  baselineProjectionFields: [...changedFields, ...retainedProjectionFields, "updated_at"],
  retainedProjectionFields,
  expectedUpdatedAt: "2026-11-21T01:31:48.375934+00:00",
  versionField: "updated_at",
  baselineFieldsSha256: "bc0bfd5953301324a887e34ecd12d80601c7082cf322b64738de8a47d89235ef",
  retainedFieldsSha256: "a6734e18e9726bdf353ea434b9ada536ec64ce53ca29f63240ad0a57a15bad01",
  desiredFieldsSha256: "43f239817e0deb03c33a01bd4eeb83b5467081d91eca390af7fabf830d4149b5",
  rollbackFieldsSha256: "a2c0eae18e08855d37f992c68a21fec873eb175f5e846474ca85257bd3efffc7",
  rollbackAllowed: false,
} as const satisfies ManagedTarget;

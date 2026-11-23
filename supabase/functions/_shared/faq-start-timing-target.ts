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

export const FAQ_START_TIMING_15_DAY_APPROVAL_ID = "owner-approved-faq-15-day-start-20261122";
export const FAQ_START_TIMING_15_DAY_TARGET_ID = "faq-start-timing-20261122-v3";

const answerFields = ["answer_en", "answer_ms", "answer_zh"] as const;
const retainedQuestionFields = [...retainedProjectionFields, "question_en", "question_ms", "question_zh"] as const;

export const FAQ_START_TIMING_15_DAY_TARGET = {
  ...FAQ_START_TIMING_TARGET,
  taskId: FAQ_START_TIMING_15_DAY_TARGET_ID,
  actionId: "publish-faq-130-15-day-three-language-answers-v3",
  candidateVersion: FAQ_START_TIMING_15_DAY_TARGET_ID,
  scope: `flashcast.com.my:faqs/${id}:${answerFields.join(",")}`,
  changedFields: answerFields,
  baselineProjectionFields: [...answerFields, ...retainedQuestionFields, "updated_at"],
  retainedProjectionFields: retainedQuestionFields,
  expectedUpdatedAt: "2026-11-21T10:43:34.833034+00:00",
  baselineFieldsSha256: "3f797adccca33295423ce56b1f02917311f276258bc5487c87fe9a3ee45f35f9",
  retainedFieldsSha256: "9bd8ed6187a19a13c0d0c295bd9d3362a435d32c10e343808d37b2f71527f180",
  desiredFieldsSha256: "14192d94df2422b704d66c1590d61d219f8619941a5e9d1b350958bf37f22362",
  rollbackFieldsSha256: "a3e1a66c4b82a8be0f2d4c4b83634e6e3cec9845e79e038e46a44f7ae17eecd7",
} as const satisfies ManagedTarget;

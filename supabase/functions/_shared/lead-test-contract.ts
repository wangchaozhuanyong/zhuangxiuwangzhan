// Bounded owner-approved test pair. This module has no browser, Deno or database dependencies.
export const LEAD_TESTS = {
  fc_paid_20261008_T01: {
    type: "quote",
    id: "75dfb1b6-a273-4f07-8d16-a4f07b202601",
    sourcePath: "/__internal_test__/fc-paid-20261008/T01",
  },
  fc_paid_20261008_T02: {
    type: "contact",
    id: "75dfb1b6-a273-4f07-8d16-a4f07b202602",
    sourcePath: "/__internal_test__/fc-paid-20261008/T02",
  },
} as const;

export const SUBMISSION_UUID_PATTERN = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
export const STORED_ACCEPTANCE_PATTERN = `^/__internal_test__/acceptance/en/(quote|contact)/${SUBMISSION_UUID_PATTERN}$`;
const storedAcceptance = new RegExp(STORED_ACCEPTANCE_PATTERN);

export const FORMAL_LEAD_SOURCE_FILTER =
  `source_path.is.null,and(source_path.not.in.(${Object.values(LEAD_TESTS).map((test) => test.sourcePath).join(",")}),source_path.not.match."${STORED_ACCEPTANCE_PATTERN}")`;

export const acceptanceSourcePath = (formType: "contact" | "quote", id: string) =>
  `/__internal_test__/acceptance/en/${formType}/${id}`;

export const isEnglishAcceptancePage = (sourcePath: string, formType: "contact" | "quote") => {
  if (!sourcePath.startsWith("/") || sourcePath.startsWith("//")) return false;
  try {
    const url = new URL(sourcePath, "https://flashcast.invalid");
    return new RegExp(`^/en/${formType}/?$`).test(url.pathname);
  } catch { return false; }
};

export const isStoredLeadTest = (sourcePath: string | null | undefined) =>
  Boolean(sourcePath && storedAcceptance.test(sourcePath)) || Object.values(LEAD_TESTS).some((test) => test.sourcePath === sourcePath);

// Client suppression alone grants no TEST permission. Only the server can assign stored markers.
export const isLeadTestPage = (sourcePath: string) => {
  try {
    const url = new URL(sourcePath, "https://flashcast.invalid");
    return url.searchParams.has("fc_test") || url.pathname.startsWith("/__internal_test__/");
  } catch {
    return false;
  }
};

export function readLeadTest(sourcePath: string, formType: "contact" | "quote") {
  let url: URL;
  try {
    url = new URL(sourcePath || "/", "https://flashcast.invalid");
  } catch {
    return { valid: !/fc_test|__internal_test__/.test(sourcePath), test: null };
  }
  if (url.pathname.startsWith("/__internal_test__/")) {
    return { valid: false as const, test: null };
  }
  const markers = url.searchParams.getAll("fc_test");
  if (!markers.length) return { valid: true as const, test: null };
  const test = LEAD_TESTS[markers[0] as keyof typeof LEAD_TESTS];
  if (!sourcePath.startsWith("/") || sourcePath.startsWith("//") || markers.length !== 1 || !test || test.type !== formType || !new RegExp(`^/(zh|en)/${formType}/?$`).test(url.pathname)) {
    return { valid: false as const, test: null };
  }
  return { valid: true as const, test };
}

export type ContactBody = {
  type: "contact";
  name: string;
  phone: string;
  email?: string;
  projectType?: string;
  location?: string;
  message: string;
  sourcePath?: string;
  website?: string;
  startedAt?: number;
  elapsedMs?: number;
  turnstileToken?: string;
  attribution?: LeadAttributionBody;
};

export type QuoteBody = {
  type: "quote";
  name: string;
  phone: string;
  email?: string;
  projectType: string;
  location: string;
  propertySize?: string;
  budget?: string;
  details?: string;
  sourcePath?: string;
  website?: string;
  startedAt?: number;
  elapsedMs?: number;
  turnstileToken?: string;
  attribution?: LeadAttributionBody;
};

export type LeadTouchBody = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  landingPage?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
};

export type LeadAttributionBody = {
  firstTouch?: LeadTouchBody;
  lastTouch?: LeadTouchBody;
  landingPage?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
};

export type CleanLeadAttribution = {
  firstTouchSource: string;
  firstTouchMedium: string;
  firstTouchCampaign: string;
  firstTouchTerm: string;
  firstTouchContent: string;
  lastTouchSource: string;
  lastTouchMedium: string;
  lastTouchCampaign: string;
  lastTouchTerm: string;
  lastTouchContent: string;
  landingPage: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
};

export type SubmitBody = ContactBody | QuoteBody;

type EdgeQueryResult = {
  data?: unknown;
  error?: unknown;
  count?: number | null;
};

type EdgeQuery = PromiseLike<EdgeQueryResult> & {
  select: (...args: unknown[]) => EdgeQuery;
  insert: (...args: unknown[]) => EdgeQuery;
  eq: (...args: unknown[]) => EdgeQuery;
  gte: (...args: unknown[]) => EdgeQuery;
};

export type SubmitLeadClient = {
  from: (table: string) => EdgeQuery;
  functions: {
    invoke: (
      name: string,
      options: {
        body: Record<string, unknown>;
        headers?: Record<string, string>;
      },
    ) => Promise<{ error?: unknown }>;
  };
};

export type SubmitLeadResult = {
  status?: number;
  body: {
    ok?: true;
    id?: string;
    error?: string;
  };
};

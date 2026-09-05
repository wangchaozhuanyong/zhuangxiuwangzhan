import { handleWebsiteVisit } from "../src/backend/modules/system/controller/websiteVisitController";
import type { WebsiteVisitEnvironment } from "../src/backend/modules/system/service/websiteVisitService";

export const onRequest = (context: {
  request: Request;
  env: WebsiteVisitEnvironment;
}) => handleWebsiteVisit(context.request, context.env);

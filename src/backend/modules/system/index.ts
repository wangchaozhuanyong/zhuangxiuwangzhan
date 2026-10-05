/** Public contract for persistence; browser cache and display belong to src/lib adapters. */
export {
  AdminMutationError,
  persistAdminRecord,
  persistAdminRecordRemoval,
  type AdminMutationResult,
  type PersistAdminRecordOptions,
  type PersistAdminRecordRemovalOptions,
} from "./service/adminMutationService";
export { requestPublicContentInvalidation } from "./repository/adminMutationRepository";
export type { AdminMutationDbRecord, PublicContentInvalidationResult } from "./repository/adminMutationRepository";

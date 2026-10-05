// Compatibility only: new home/company reads belong to their owning modules.
export { loadHomeSectionRecord as fetchHomeSectionRecord, hasAdminEditorDatabaseClient } from "@/backend/modules/home";
export {
  loadAboutSectionRecord as fetchAboutSectionRecord,
  loadHomeEditorAuxiliaryRows as fetchHomeEditorAuxiliaryRows,
  loadAboutEditorCtaBlock as fetchAboutEditorCtaBlock,
} from "@/backend/modules/company";

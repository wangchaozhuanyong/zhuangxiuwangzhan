/** Keep the document's static module graph discoverable before entry execution.
 * Lazy route imports retain the WebKit workaround: only their CSS is preloaded.
 */
export const resolvePublicModulePreloadDependencies = (_filename, dependencies, { hostType }) =>
  hostType === "js"
    ? dependencies.filter((dependency) => dependency.endsWith(".css"))
    : dependencies;

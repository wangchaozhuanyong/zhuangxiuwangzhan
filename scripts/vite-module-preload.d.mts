import type { BuildOptions } from 'vite';
type PreloadOptions = Exclude<BuildOptions['modulePreload'], boolean | undefined>;
export declare const resolvePublicModulePreloadDependencies: NonNullable<PreloadOptions['resolveDependencies']>;

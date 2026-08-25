interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly VITE_SHOW_PROTOTYPE_CONTROLS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

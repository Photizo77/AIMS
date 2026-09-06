/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the AIMS backend API, e.g. https://aims-backend-five.vercel.app
   * Empty / unset = demo/local mode (persona logins, no server calls).
   */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

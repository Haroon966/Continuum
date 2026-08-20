import type { ContinuumApi } from "../electron/preload";

declare global {
  interface Window {
    continuum: ContinuumApi;
  }
}

export {};

import type { EmberwoldDebug } from "./App";

declare global {
  interface Window {
    __EMBERWOLD__?: EmberwoldDebug;
  }
}

export {};

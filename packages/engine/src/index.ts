import { createRng, type RngState } from "@emberwold/shared";

/** Pure, deterministic rules engine. S1 scaffold: the reducer lands in S3. */
export const PACKAGE_NAME = "@emberwold/engine";

/** Placeholder proving the engine can consume shared protocol primitives. */
export function createEngineRng(seed: number): RngState {
  return createRng(seed);
}

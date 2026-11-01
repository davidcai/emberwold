/**
 * Shared protocol primitives for Emberwold: branded IDs, the seeded RNG state (Mulberry32 with
 * per-stream counters) and canonical state hashing (sorted-key JSON + sync SHA-256).
 * Every game action result is JSON-serializable state plus a hash, which is what makes replay,
 * undo, save/resume and deterministic tests fall out of the same property.
 */
export * from "./canonical";
export * from "./ids";
export * from "./rng";
export * from "./sha256";

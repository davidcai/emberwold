/**
 * Canonical JSON (RFC 8785-style: sorted keys, no whitespace, integers only) plus the state
 * hash built on it. Same state -> same bytes -> same hash, in Node, browser and tests.
 */
import { sha256Hex } from "./sha256";

export type JsonValue =
  null | boolean | number | string | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export function canonicalJson(value: unknown): string {
  if (value === null) {
    return "null";
  }
  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "number": {
      if (!Number.isFinite(value) || !Number.isInteger(value)) {
        throw new Error(`canonicalJson: only finite integers are allowed, got ${value}`);
      }
      return String(value);
    }
    case "string":
      return JSON.stringify(value);
    case "object": {
      if (Array.isArray(value)) {
        return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
      }
      const record = value as Record<string, unknown>;
      const keys = Object.keys(record).sort();
      const parts = keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`);
      return `{${parts.join(",")}}`;
    }
    default:
      throw new Error(`canonicalJson: unsupported value type "${typeof value}"`);
  }
}

export function hashState(state: unknown): string {
  return sha256Hex(canonicalJson(state));
}

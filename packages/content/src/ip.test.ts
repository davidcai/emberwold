import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ip.forbidden_terms: the single forbidden-term list lives beside the content pack and is
 * checked against code/UI sources. game-data values are exempt until the T1 re-theme
 * (docs/design/15-retheme-bible.md §9/§10); only literals we author in code are scanned.
 */
const ROOT = new URL("../../..", import.meta.url).pathname;
const SCAN_DIRS = ["packages/client/src", "packages/engine/src"];
const SCAN_EXTENSIONS = [".ts", ".tsx", ".css", ".html"];

const TERMS: string[] = JSON.parse(
  readFileSync(new URL("./forbidden-terms.json", import.meta.url), "utf8"),
) as string[];

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      yield* walk(path);
    } else if (SCAN_EXTENSIONS.some((extension) => path.endsWith(extension))) {
      yield path;
    }
  }
}

describe("ip.forbidden_terms", () => {
  it("has a non-empty list of forbidden terms", () => {
    expect(TERMS.length).toBeGreaterThan(0);
  });

  it("code/UI sources contain no forbidden term", () => {
    const hits: string[] = [];
    const normalizedTerms = TERMS.map((term) => term.toLowerCase().replace(/\s+/g, " "));
    for (const dir of SCAN_DIRS) {
      for (const file of walk(join(ROOT, dir))) {
        const normalized = readFileSync(file, "utf8").toLowerCase().replace(/\s+/g, " ");
        for (const term of normalizedTerms) {
          if (normalized.includes(term)) {
            hits.push(`${relative(ROOT, file)}: "${term}"`);
          }
        }
      }
    }
    expect(hits).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";

import { TOOL_NAME } from "./index";

describe("@emberwold/content-compiler", () => {
  it("identifies itself", () => {
    expect(TOOL_NAME).toBe("@emberwold/content-compiler");
  });
});

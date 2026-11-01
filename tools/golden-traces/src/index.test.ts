import { describe, expect, it } from "vitest";

import { TOOL_NAME } from "./index";

describe("@emberwold/golden-traces", () => {
  it("identifies itself", () => {
    expect(TOOL_NAME).toBe("@emberwold/golden-traces");
  });
});

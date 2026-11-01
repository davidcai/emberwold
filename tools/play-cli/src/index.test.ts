import { describe, expect, it } from "vitest";

import { TOOL_NAME } from "./index";

describe("@emberwold/play-cli", () => {
  it("identifies itself", () => {
    expect(TOOL_NAME).toBe("@emberwold/play-cli");
  });
});

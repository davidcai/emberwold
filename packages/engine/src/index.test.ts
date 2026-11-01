import { describe, expect, it } from "vitest";

import { PACKAGE_NAME, describeEngine } from "./index";

describe("@emberwold/engine", () => {
  it("identifies itself and its shared dependency", () => {
    expect(PACKAGE_NAME).toBe("@emberwold/engine");
    expect(describeEngine()).toContain("@emberwold/shared");
  });
});

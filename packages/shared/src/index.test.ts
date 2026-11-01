import { describe, expect, it } from "vitest";

import { PACKAGE_NAME } from "./index";

describe("@emberwold/shared", () => {
  it("identifies itself", () => {
    expect(PACKAGE_NAME).toBe("@emberwold/shared");
  });
});

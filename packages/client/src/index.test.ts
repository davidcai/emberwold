import { describe, expect, it } from "vitest";

import { PACKAGE_NAME } from "./index";

describe("@emberwold/client", () => {
  it("identifies itself", () => {
    expect(PACKAGE_NAME).toBe("@emberwold/client");
  });
});

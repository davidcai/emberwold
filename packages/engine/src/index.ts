import { PACKAGE_NAME as SHARED_PACKAGE_NAME } from "@emberwold/shared";

/** Pure, deterministic rules engine. S1 scaffold: the reducer lands in S3. */
export const PACKAGE_NAME = "@emberwold/engine";

export function describeEngine(): string {
  return `${PACKAGE_NAME} (depends on ${SHARED_PACKAGE_NAME})`;
}

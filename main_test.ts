import { assertEquals, assertInstanceOf } from "@std/assert";
import { isolatedTestCase } from "./main.ts";

if (!Deno.env.get("DENO_ISOLATED_TEST_CASE_CTX")) {
  isolatedTestCase("should fail if test is not run in isolated context", () => {
    assertEquals(1, 1);
  }, {
    assertFailure: true,
  });
}

isolatedTestCase("basic pass", () => {
  assertEquals(1, 1);
});

isolatedTestCase("baisc fail", () => {
  assertEquals(2, 1);
}, { assertFailure: true });

isolatedTestCase("assert error", () => {
  assertEquals(2, 1);
}, {
  assertFailure: (error) => {
    assertInstanceOf(error, Error);
    assertEquals(error.name, "AssertionError");
  },
});

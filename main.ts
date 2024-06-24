import { assertRejects } from "@std/assert";
import {
  IsolatedTestContext,
  IsolatedTestContextWithConnection,
} from "./src/IsolatedTestContext.ts";
import { runTestCase } from "./src/runTestCase.ts";
import { spawnIsolatedTestEnvironment } from "./src/spawnIsolatedTestEnvironment.ts";

export type Options = {
  assertFailure: boolean | ((error: unknown) => void | Promise<void>);
};

const ctx = IsolatedTestContextWithConnection.fromEnv();
let wasTestRun = false;
addEventListener("unload", () => {
  if (wasTestRun) {
    return;
  }
  console.error("ERROR: NO TOP-LEVEL TEST DETECTED");
  Deno.exitCode = 1;
});

/**
 * Runs the test case in its own Deno process.
 *
 * @example
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { isolatedTestCase } from "@bcheidemann/deno-isolated-test-case";
 *
 * isolatedTestCase("40 + 2 = 42", () => {
 *   assertEquals(40 + 2, 42);
 * });
 * ```
 *
 * @param name The test name
 * @param fn The test function
 * @param options (optional) Options to configure the test runner
 */
export function isolatedTestCase(
  name: string,
  fn: (t: IsolatedTestContext) => void | Promise<void>,
  options?: Options,
): void {
  if (ctx) {
    if (ctx.name !== name) {
      return;
    }
    wasTestRun = true;
    runTestCase(ctx, fn);
    return;
  }

  Deno.test({
    name,
    permissions: {
      run: ["deno"],
      net: true,
    },
    fn: async (t) => {
      if (options?.assertFailure) {
        const error = await assertRejects(() =>
          spawnIsolatedTestEnvironment(t)
        );
        if (typeof options.assertFailure === "function") {
          await Promise.resolve(options.assertFailure(error));
        }
      } else {
        await spawnIsolatedTestEnvironment(t);
      }
    },
  });
}

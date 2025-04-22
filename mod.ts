import { assertRejects } from "@std/assert";
import {
  type IsolatedTestContext,
  IsolatedTestContextWithConnection,
} from "./src/IsolatedTestContext.ts";
import { runTestCase } from "./src/runTestCase.ts";
import { spawnIsolatedTestEnvironment } from "./src/spawnIsolatedTestEnvironment.ts";

/**
 * Options for running the test case.
 */
export interface Options extends Omit<Deno.TestDefinition, "fn" | "name"> {
  /**
   * If truthy, the test is expected to fail. A function can be passed to assert against the error.
   */
  assertFailure?: boolean | ((error: unknown) => void | Promise<void>);
  /**
   * Flags to pass to `deno run`.
   */
  denoFlags?: string[];
}

const ctx = IsolatedTestContextWithConnection.fromEnv();
let wasTestRun = false;
addEventListener("unload", () => {
  if (!ctx || wasTestRun) {
    return;
  }
  console.error("ERROR: No test case was run");
  Deno.exit(1);
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

    if (wasTestRun) {
      console.error(
        `ERROR: Detected multiple tests with the same name: ${name}`,
      );
      Deno.exit(1);
    }

    wasTestRun = true;
    runTestCase(ctx, fn);
    return;
  }

  Deno.test({
    permissions: {
      run: ["deno"],
      net: true,
    },
    ...options,
    name,
    fn: async (t) => {
      if (options?.assertFailure) {
        const error = await assertRejects(() =>
          spawnIsolatedTestEnvironment(t, options.denoFlags ?? [])
        );
        if (typeof options.assertFailure === "function") {
          await Promise.resolve(options.assertFailure(error));
        }
      } else {
        await spawnIsolatedTestEnvironment(t, options?.denoFlags ?? []);
      }
    },
  });
}

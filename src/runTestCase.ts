import SuperJSON from "superjson";
import {
  IsolatedTestContext,
  IsolatedTestContextWithConnection,
} from "./IsolatedTestContext.ts";

export async function runTestCase(
  t: IsolatedTestContextWithConnection,
  fn: (t: IsolatedTestContext) => void | Promise<void>,
) {
  let error: unknown;
  try {
    await Promise.resolve(fn(t));
  } catch (err) {
    error = err;
  }
  const result = await fetch(`http://127.0.0.1:${t.port}`, {
    method: "POST",
    body: SuperJSON.stringify(
      error
        ? {
          isError: true,
          error,
          stack: error instanceof Error ? error.stack : undefined,
        }
        : {
          isError: false,
        },
    ),
  });
  if (!result.ok) {
    Deno.exitCode = 1;
  }
}

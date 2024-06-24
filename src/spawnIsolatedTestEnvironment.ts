import { assert } from "@std/assert";
import { getAvailablePort } from "@std/net";
import { IsolatedTestContextWithConnection } from "./IsolatedTestContext.ts";
import SuperJSON from "superjson";

/**
 * @internal
 */
export async function spawnIsolatedTestEnvironment(
  t: Deno.TestContext,
  denoFlags: string[],
) {
  // deno-lint-ignore no-explicit-any
  let result: any;
  const port = getAvailablePort();
  const server = Deno.serve(
    { port, onListen: () => {} },
    async (req) => {
      result = SuperJSON.parse(await req.text());
      return new Response();
    },
  );
  const cmd = new Deno.Command("deno", {
    args: [
      "run",
      ...denoFlags,
      "--allow-all",
      t.origin,
      ...Deno.args,
    ],
    env: {
      DENO_ISOLATED_TEST_CASE_CTX: IsolatedTestContextWithConnection
        .serializeFromDenoTestContext(t, port),
    },
    stdout: "inherit",
    stdin: "inherit",
    stderr: "inherit",
  });
  const status = await cmd.spawn().status;
  await server.shutdown();

  assert(
    status.success,
    "spawned process should not exit with a non-zero status code",
  );
  assert(result);

  if (result.isError) {
    if (result.stack) {
      result.error.message += "\n" + result.stack;
    }

    throw result.error;
  }
}

import { assert } from "@std/assert";
import { getAvailablePort } from "@std/net";
import { IsolatedTestContextWithConnection } from "./IsolatedTestContext.ts";
import SuperJSON from "superjson";
import type { Options } from "@bcheidemann/deno-isolated-test-case";
import { WindowsRequiredEnvs } from "./windows.ts";

/**
 * @internal
 */
export async function spawnIsolatedTestEnvironment(
  t: Deno.TestContext,
  options: Options | undefined,
) {
  // deno-lint-ignore no-explicit-any
  let result: any;
  const port = getAvailablePort();
  const server = Deno.serve({ port, onListen: () => {} }, async (req) => {
    result = SuperJSON.parse(await req.text());
    return new Response();
  });
  // Windows requires access to SYSTEMROOT and WINDIR, otherwise TCP connections
  // in the child process will fail with error 10106.
  const windowsSystemEnv = Deno.build.os === "windows"
    ? Object.fromEntries(
      WindowsRequiredEnvs.flatMap((key) => {
        const val = Deno.env.get(key);
        return val !== undefined ? [[key, val]] : [];
      }),
    )
    : {};

  const cmd = new Deno.Command(Deno.execPath(), {
    ...options?.denoCommand,
    args: [
      "run",
      ...(options?.denoFlags ?? []),
      "--allow-all",
      t.origin,
      ...Deno.args,
    ],
    clearEnv: options?.denoCommand?.clearEnv ?? true,
    env: {
      ...windowsSystemEnv,
      ...options?.denoCommand?.env,
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

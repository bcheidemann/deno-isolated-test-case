/**
 * Similar to Deno.TestContext, but for tests running in their own isolated Deno instance.
 * 
 * @implements {Deno.TestContext}
 */
export class IsolatedTestContext implements Deno.TestContext {
  protected constructor(
    /** The current test name. */
    public name: string,
    /** The string URL of the current test. */
    public origin: string,
  ) {}

  /**
   * @deprecated This method is not implemented and will error at runtime.
   */
  step(definition: Deno.TestStepDefinition): Promise<boolean>;
  step(
    name: string,
    fn: (t: Deno.TestContext) => void | Promise<void>,
  ): Promise<boolean>;
  step(fn: (t: Deno.TestContext) => void | Promise<void>): Promise<boolean>;
  step(_name: unknown, _fn?: unknown): Promise<boolean> {
    throw new Error("Test steps are not supported for isolated test cases.");
  }
}

/**
 * @internal
 */
export class IsolatedTestContextWithConnection extends IsolatedTestContext {
  private constructor(
    name: string,
    origin: string,
    public port: number,
  ) {
    super(name, origin);
  }

  /**
   * @internal
   */
  static serializeFromDenoTestContext(
    t: Deno.TestContext,
    port: number,
  ): string {
    return JSON.stringify({ name: t.name, origin: t.origin, port });
  }

  /**
   * @internal
   */
  static fromEnv(): IsolatedTestContextWithConnection | undefined {
    const ctxEnvVar = Deno.env.get("DENO_ISOLATED_TEST_CASE_CTX");

    if (!ctxEnvVar) {
      return;
    }

    const ctx = JSON.parse(ctxEnvVar);

    return new this(ctx.name, ctx.origin, ctx.port);
  }
}

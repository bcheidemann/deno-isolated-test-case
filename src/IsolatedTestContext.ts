export class IsolatedTestContext implements Deno.TestContext {
  protected constructor(
    public name: string,
    public origin: string,
  ) {}

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

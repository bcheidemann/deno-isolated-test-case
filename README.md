# Deno Isolated Test Case

[![JSR](https://jsr.io/badges/@bcheidemann/deno-isolated-test-case)](https://jsr.io/@bcheidemann/deno-isolated-test-case)
[![JSR Score](https://jsr.io/badges/@bcheidemann/deno-isolated-test-case/score)](https://jsr.io/@bcheidemann/deno-isolated-test-case)
![publish workflow](https://github.com/bcheidemann/deno-isolated-test-case/actions/workflows/publish.yml/badge.svg)

## Overview

Deno Isolated Test Case lets you run test cases in an isolated Deno process.

## Motivation

Sometimes you need to ensure that other running tests are not interfering with
the execution of your code, or visa versa. For instance, maybe your code
pollutes the global scope, or maybe you need to make assertions about memory
usage. Whatever your reason, Deno Isolated Test Case lets you run your test case
in a separate process, while still being able to use standard assertions like
`assertEquals`.

## Usage

In your test file, you can add an isolated test case at the top level as
follows:

```ts
import { isolatedTestCase } from "@bcheidemann/deno-isolated-test-case";

isolatedTestCase("test name", () => {
  // Your test case
});
```

## Limitations

### Top Level Only

Test cases must be at the top level and run unconditionally. They can not be
nested in `describe` blocks or as steps of other `Deno.test` cases.

### Snapshot Assertions

Since your test runs in an isolated Deno process, it will not be aware of other
snapshots in your test file. If you assert snapshots across multiple tests, only
the last tests snapshots will be captured. The solution is to manually override
the snapshot file name to be unique per test.

### Error Stack Traces

Deno for whatever reason doesn't allow us to override the `Error.stack`
property. In order to ensure useful stack traces in our tests, we manually
append the stack trace to the error message. This ensures stack traces are
reported properly in tests, but it means that the message includes the stack
trace.

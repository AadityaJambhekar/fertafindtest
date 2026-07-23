import assert from "node:assert/strict";
import test from "node:test";
import { renderInvisibleRecaptcha, type RecaptchaApi } from "./recaptcha.ts";

function baseOpts(overrides: Partial<Parameters<typeof renderInvisibleRecaptcha>[1]> = {}) {
  return {
    containerId: "google-recaptcha-x",
    siteKey: "test-key",
    onToken: () => {},
    onError: () => {},
    ...overrides,
  };
}

// The regression this guards: a throw from grecaptcha.render used to escape the calling
// React effect and tear down the whole Analyze wizard (resetting it to the Location step).
test("never throws when grecaptcha.render throws — reports via onError and returns null", () => {
  const api: RecaptchaApi = {
    render: () => {
      throw new TypeError("grecaptcha.render is not a function");
    },
    execute: () => {},
    reset: () => {},
  };
  let errored: string | null = null;
  const result = renderInvisibleRecaptcha(api, baseOpts({ onError: (m) => (errored = m) }));
  assert.equal(result, null);
  assert.ok(errored, "onError must be called when render throws");
});

test("returns null (no throw) when the grecaptcha API is missing", () => {
  assert.equal(renderInvisibleRecaptcha(undefined, baseOpts()), null);
  assert.equal(renderInvisibleRecaptcha(null, baseOpts()), null);
});

test("returns null (no throw) when render is not yet a function (the load race)", () => {
  const api = { render: undefined, execute: () => {}, reset: () => {} } as unknown as RecaptchaApi;
  assert.equal(renderInvisibleRecaptcha(api, baseOpts()), null);
});

test("renders an invisible widget and returns its id when the API is ready", () => {
  let opts: Record<string, unknown> | null = null;
  const api: RecaptchaApi = {
    render: (_container, o) => {
      opts = o;
      return 7;
    },
    execute: () => {},
    reset: () => {},
  };
  const result = renderInvisibleRecaptcha(api, baseOpts());
  assert.equal(result, 7);
  assert.equal(opts!.size, "invisible");
  assert.equal(opts!.sitekey, "test-key");
});

test("wires the verification callback through to onToken", () => {
  let captured: string | null = null;
  const api: RecaptchaApi = {
    render: (_container, o) => {
      (o.callback as (t: string) => void)("TOKEN-123");
      return 1;
    },
    execute: () => {},
    reset: () => {},
  };
  renderInvisibleRecaptcha(api, baseOpts({ onToken: (t) => (captured = t) }));
  assert.equal(captured, "TOKEN-123");
});

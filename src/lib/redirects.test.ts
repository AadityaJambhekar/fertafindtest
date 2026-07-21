import assert from "node:assert/strict";
import test from "node:test";
import { computeRedirect } from "./redirects.ts";

test("redirects the apex (non-www) host to www with a 301", () => {
  const r = computeRedirect({
    host: "fertafind.com",
    pathname: "/about",
    search: "",
  });
  assert.deepEqual(r, {
    location: "https://www.fertafind.com/about",
    status: 301,
  });
});

test("does not redirect requests already on the www host", () => {
  assert.equal(
    computeRedirect({
      host: "www.fertafind.com",
      pathname: "/about",
      search: "",
    }),
    null,
  );
});

test("preserves the query string when canonicalising the host", () => {
  const r = computeRedirect({
    host: "fertafind.com",
    pathname: "/analyze",
    search: "?utm_source=chatgpt.com",
  });
  assert.equal(
    r?.location,
    "https://www.fertafind.com/analyze?utm_source=chatgpt.com",
  );
});

test("redirects the apex homepage to the www homepage with a trailing slash", () => {
  const r = computeRedirect({
    host: "fertafind.com",
    pathname: "/",
    search: "",
  });
  assert.equal(r?.location, "https://www.fertafind.com/");
});

test("ignores the port when detecting the apex host", () => {
  const r = computeRedirect({
    host: "fertafind.com:443",
    pathname: "/terms",
    search: "",
  });
  assert.equal(r?.location, "https://www.fertafind.com/terms");
});

test("permanently redirects /partners to /suppliers on the www host", () => {
  const r = computeRedirect({
    host: "www.fertafind.com",
    pathname: "/partners",
    search: "",
  });
  assert.deepEqual(r, {
    location: "https://www.fertafind.com/suppliers",
    status: 301,
  });
});

test("redirects /partners with a trailing slash to /suppliers", () => {
  const r = computeRedirect({
    host: "www.fertafind.com",
    pathname: "/partners/",
    search: "",
  });
  assert.equal(r?.location, "https://www.fertafind.com/suppliers");
});

test("combines apex-to-www and /partners-to-/suppliers into one hop", () => {
  const r = computeRedirect({
    host: "fertafind.com",
    pathname: "/partners",
    search: "?a=1",
  });
  assert.equal(r?.location, "https://www.fertafind.com/suppliers?a=1");
});

test("never redirects the resolved /suppliers target on www (no loop)", () => {
  assert.equal(
    computeRedirect({
      host: "www.fertafind.com",
      pathname: "/suppliers",
      search: "",
    }),
    null,
  );
});

test("leaves preview and local hosts untouched to avoid breaking non-production", () => {
  assert.equal(
    computeRedirect({ host: "localhost:3000", pathname: "/about", search: "" }),
    null,
  );
  assert.equal(
    computeRedirect({
      host: "fertafind-abc123.vercel.app",
      pathname: "/about",
      search: "",
    }),
    null,
  );
});

test("returns null when the host header is missing", () => {
  assert.equal(
    computeRedirect({ host: undefined, pathname: "/about", search: "" }),
    null,
  );
});

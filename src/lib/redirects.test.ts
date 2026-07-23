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
  assert.equal(r?.location, "https://www.fertafind.com/analyze?utm_source=chatgpt.com");
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

test("permanently redirects /partners to the partner-filtered supplier network in one hop", () => {
  const r = computeRedirect({
    host: "www.fertafind.com",
    pathname: "/partners",
    search: "",
  });
  assert.deepEqual(r, {
    location: "https://www.fertafind.com/suppliers?relationship=partner",
    status: 301,
  });
});

test("redirects /partners with a trailing slash to the partner-filtered supplier network", () => {
  const r = computeRedirect({
    host: "www.fertafind.com",
    pathname: "/partners/",
    search: "",
  });
  assert.equal(r?.location, "https://www.fertafind.com/suppliers?relationship=partner");
});

test("sends apex /partners to the www partner-filtered supplier network in a single hop", () => {
  const r = computeRedirect({
    host: "fertafind.com",
    pathname: "/partners",
    search: "?a=1",
  });
  assert.equal(r?.location, "https://www.fertafind.com/suppliers?relationship=partner");
});

test("the /partners destination is terminal (single hop, no second redirect)", () => {
  // The target is /suppliers?relationship=partner on the www host; a request to
  // /suppliers never redirects (its state is a route concern, not canonicalisation),
  // so the /partners redirect is a single terminal hop.
  assert.equal(
    computeRedirect({
      host: "www.fertafind.com",
      pathname: "/suppliers",
      search: "?relationship=partner",
    }),
    null,
  );
});

test("does not touch /suppliers (its redirect is owned by the route, not canonicalisation)", () => {
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
  assert.equal(computeRedirect({ host: "localhost:3000", pathname: "/about", search: "" }), null);
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
  assert.equal(computeRedirect({ host: undefined, pathname: "/about", search: "" }), null);
});

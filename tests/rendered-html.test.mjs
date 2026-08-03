import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the early-learning experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>小满的小世界/);
  assert.match(html, /今天的小小冒险/);
  assert.match(html, /彩虹搬家/);
  assert.match(html, /谁在叫呀/);
  assert.match(html, /长成小树/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("includes production deployment assets", async () => {
  const [dockerfile, compose, layout] = await Promise.all([
    readFile(new URL("Dockerfile", root), "utf8"),
    readFile(new URL("compose.yaml", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
  ]);

  assert.match(dockerfile, /USER appuser/);
  assert.match(dockerfile, /dist\/standalone/);
  assert.match(compose, /healthcheck:/);
  assert.match(compose, /no-new-privileges:true/);
  assert.match(layout, /NEXT_PUBLIC_SITE_URL/);

  await access(new URL("public/og.png", root));
  await access(new URL("public/favicon.png", root));
});

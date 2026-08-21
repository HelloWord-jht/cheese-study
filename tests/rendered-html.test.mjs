import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

async function request(pathname, init) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, init),
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
  assert.match(html, /今天的探险任务/);
  assert.match(html, /今天玩这些/);
  assert.match(html, /探险宝箱/);
  assert.match(html, /家长中心/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("exposes a dedicated container health endpoint", async () => {
  const response = await render("/api/health");
  assert.equal(response.status, 200);
  const health = await response.json();
  assert.equal(health.status, "ok");
  assert.equal(health.service, "cheese-study");
  assert.match(health.time, /^\d{4}-\d{2}-\d{2}T/);
});

test("includes production deployment assets", async () => {
  const [dockerfile, compose, layout, envExample, serverDeploy, nginxHttp, nginxHttps, serviceWorker, dailyPlanRoute] = await Promise.all([
    readFile(new URL("Dockerfile", root), "utf8"),
    readFile(new URL("compose.yaml", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL(".env.example", root), "utf8"),
    readFile(new URL("scripts/server-deploy.sh", root), "utf8"),
    readFile(new URL("deploy/nginx/cheese-study.http.conf.template", root), "utf8"),
    readFile(new URL("deploy/nginx/cheese-study.https.conf.template", root), "utf8"),
    readFile(new URL("public/sw.js", root), "utf8"),
    readFile(new URL("app/api/daily-plan/route.ts", root), "utf8"),
  ]);

  assert.match(dockerfile, /USER appuser/);
  assert.match(dockerfile, /dist\/standalone/);
  assert.match(compose, /healthcheck:/);
  assert.match(compose, /no-new-privileges:true/);
  assert.match(compose, /\/api\/health/);
  assert.match(compose, /BIND_ADDRESS:-127\.0\.0\.1/);
  assert.match(layout, /NEXT_PUBLIC_SITE_URL/);
  assert.match(layout, /manifest\.webmanifest/);
  assert.match(envExample, /DEEPSEEK_API_KEY/);
  assert.match(serverDeploy, /nginx -t/);
  assert.match(serverDeploy, /systemctl reload nginx/);
  assert.match(nginxHttp, /proxy_pass http:\/\/127\.0\.0\.1:__APP_PORT__/);
  assert.match(nginxHttps, /Strict-Transport-Security/);
  assert.match(nginxHttp, /add_header Content-Type audio\/mpeg always/);
  assert.match(nginxHttps, /add_header Content-Type audio\/mpeg always/);
  assert.match(serviceWorker, /"audio"/);
  assert.match(dailyPlanRoute, /selectionReason/);
  assert.match(dailyPlanRoute, /offlineMissionId/);
  assert.match(dailyPlanRoute, /thinking: \{ type: "disabled" \}/);

  for (const script of ["scripts/deploy.sh", "scripts/server-deploy.sh"]) {
    const syntax = spawnSync("sh", ["-n", fileURLToPath(new URL(script, root))], { encoding: "utf8" });
    assert.equal(syntax.status, 0, `${script}: ${syntax.stderr}`);
  }
  const generatorSyntax = spawnSync(process.execPath, ["--check", fileURLToPath(new URL("scripts/generate-speech-assets.mjs", root))], { encoding: "utf8" });
  assert.equal(generatorSyntax.status, 0, generatorSyntax.stderr);

  await access(new URL("public/og.png", root));
  await access(new URL("public/favicon.png", root));
  await access(new URL("public/pwa-192.png", root));
  await access(new URL("public/pwa-512.png", root));
  await access(new URL("public/sw.js", root));
});

test("ships 45 curated activities and all milestone-one interactions", async () => {
  const [baseSource, milestoneSource] = await Promise.all([
    readFile(new URL("lib/learning.ts", root), "utf8"),
    readFile(new URL("lib/learning-content-m1.ts", root), "utf8"),
  ]);

  assert.equal((baseSource.match(/^    id: /gm) ?? []).length, 18);
  assert.equal((milestoneSource.match(/^    id: /gm) ?? []).length, 27);
  for (const domain of ["chinese", "math", "english"]) {
    assert.equal((milestoneSource.match(new RegExp(`^    domain: "${domain}"`, "gm")) ?? []).length, 9);
  }
  for (const interaction of ["tap_count", "drag_match", "drag_sort", "place_in_scene", "sequence_3", "pattern_extend", "story_choice"]) {
    assert.match(milestoneSource, new RegExp(`kind: "${interaction}"`));
  }

  const activityIds = [baseSource, milestoneSource]
    .flatMap((source) => [...source.matchAll(/^    id: "([a-z0-9-]+)",$/gm)].map((match) => match[1]));
  assert.equal(activityIds.length, 45);
  await Promise.all(activityIds.map((id) => access(new URL(`public/audio/instructions/${id}.mp3`, root))));
});

test("daily plans keep one activity per subject and vary interaction templates", async () => {
  const response = await request("/api/daily-plan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      date: "2026-08-21",
      interests: ["dinosaurs", "vehicles", "construction"],
      recentResults: [],
      clientId: `test-${process.pid}-${Date.now()}`,
    }),
  });
  assert.equal(response.status, 200);
  const { plan } = await response.json();
  assert.equal(plan.activities.length, 3);
  assert.deepEqual(new Set(plan.activities.map((activity) => activity.domain)), new Set(["chinese", "math", "english"]));

  const normalize = (kind) => ["listen_choose", "count_choose", "look_choose", "pattern_choose"].includes(kind) ? "tap_choose" : kind;
  assert.equal(new Set(plan.activities.map((activity) => normalize(activity.kind))).size, 3);
});

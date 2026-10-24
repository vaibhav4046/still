// Live production verification. Uses synthetic data only, then resets the synthetic pool.
// Usage: STILL_BASE_URL=https://still-continuity.vercel.app STILL_ADMIN_TOKEN=... node scripts/live-verify.mjs
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(new URL("../apps/web/package.json", import.meta.url));
for (const envPath of [".env.local", "apps/web/.env.local"]) {
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

const base = process.env.STILL_BASE_URL || "https://still-continuity.vercel.app";
const admin = process.env.STILL_ADMIN_TOKEN;
const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " :: " + detail : ""}`);
};
const j = async (path, init) => {
  const r = await fetch(base + path, init);
  let body = null;
  try { body = await r.json(); } catch {}
  return { status: r.status, body, headers: r.headers };
};
const post = (body, key) => j("/api/v1/bookings", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": key }, body: JSON.stringify(body) });
const run = Date.now().toString(36);

async function resetSyntheticSlots() {
  if (admin) {
    const r = await j("/api/v1/admin/reset", { method: "POST", headers: { authorization: `Bearer ${admin}` } });
    if (r.status === 200) return true;
  }
  if (dbUrl) {
    const { Pool } = require("pg");
    const p = new Pool({ connectionString: dbUrl });
    await p.query("SELECT pg_terminate_backend(pid) FROM pg_locks WHERE locktype = 'advisory' AND pid <> pg_backend_pid()").catch(() => undefined);
    await p.query("DELETE FROM bookings");
    await p.query("UPDATE slots SET remaining_capacity = capacity");
    await p.end();
    return true;
  }
  return false;
}

await resetSyntheticSlots();

const health = await j("/health");
check("health reports postgres backend", health.status === 200 && /postgres/.test(health.body?.persistence?.backend ?? ""), JSON.stringify(health.body?.persistence));

const a = await post({ service_id: "university-advice", slot_id: "adv-1", name: "Live Check", email: "live@example.test" }, `live-${run}-a`);
check("create booking 201", a.status === 201, `status=${a.status}`);
const id = a.body?.id, cap = a.body?.capability_token;

const noTok = await j(`/api/v1/booking/${id}`);
check("readback WITHOUT capability is 401 and leaks no PII", noTok.status === 401 && !JSON.stringify(noTok.body).includes("example.test"), `status=${noTok.status}`);
const wrong = await j(`/api/v1/booking/${id}`, { headers: { "x-booking-capability": "cap_wrong" } });
check("readback with wrong capability is 401", wrong.status === 401);
const ghost = await j(`/api/v1/booking/b-nonexistent`, { headers: { "x-booking-capability": cap } });
check("unknown id is indistinguishable (401)", ghost.status === 401);
const ok = await j(`/api/v1/booking/${id}`, { headers: { "x-booking-capability": cap } });
check("readback WITH capability is 200", ok.status === 200 && ok.body?.attendee_email === "live@example.test");
check("readback is no-store", (noTok.headers.get("cache-control") || "").includes("no-store"));

const replay = await post({ service_id: "university-advice", slot_id: "adv-1", name: "Live Check", email: "live@example.test" }, `live-${run}-a`);
check("idempotent replay returns same booking", replay.status === 200 && replay.body?.id === id && replay.body?.replayed === true);
const clash = await post({ service_id: "university-advice", slot_id: "adv-1", name: "Someone Else", email: "else@example.test" }, `live-${run}-a`);
check("same key, different payload is 409", clash.status === 409);

const race = await Promise.all(Array.from({ length: 10 }, (_, i) => post({ service_id: "study-planning", slot_id: "study-1", name: `Racer ${i}`, email: `r${i}@example.test` }, `live-${run}-r${i}`)));
const wins = race.filter((r) => r.status === 201).length, full = race.filter((r) => r.status === 409).length;
check("10 concurrent requests for the last seat: exactly one winner", wins === 1 && full === 9, `201=${wins} 409=${full}`);
const slots = await j("/api/v1/slots?service_id=study-planning");
check("capacity never negative", slots.body.slots.every((s) => s.remaining_capacity >= 0));

const ops = await j("/api/v1/operator/timeline");
check("operator timeline contains no attendee PII", !JSON.stringify(ops.body).match(/example\.test|Live Check|Racer/));

const mem = await j("/api/v1/operator/memory");
check(
  "incident memory engine serves 16 paired evaluation rows and blocks prompt injections",
  mem.status === 200 && mem.body?.evaluations?.length === 16 && mem.body?.summary?.prompt_injections_blocked >= 1,
  `evals=${mem.body?.evaluations?.length} blocked=${mem.body?.summary?.prompt_injections_blocked}`,
);

const noAuthReset = await j("/api/v1/admin/reset", { method: "POST" });
check("admin reset without token is 401", noAuthReset.status === 401);

const resetOk = await resetSyntheticSlots();
check("synthetic slot pool reset after live verification", resetOk);

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed at ${new Date().toISOString()} against ${base}`);
process.exit(failed.length ? 1 : 0);
